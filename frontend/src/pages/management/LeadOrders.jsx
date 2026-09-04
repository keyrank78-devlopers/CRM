import { useState, useEffect, useRef, Fragment } from "react";
import { Search, Trash2, Edit2, ShoppingBag, ArrowLeft, Package, ChevronDown, ChevronUp, X, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import leadOrderService from "../../services/leadOrderService";
import api from "../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function LeadOrders() {
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Expanded row ID for viewing multi-product items details
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Edit order modal state
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("Pending");
  const [editRemark, setEditRemark] = useState("");
  const [editItems, setEditItems] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Edit Product Search Combobox
  const [editProductSearch, setEditProductSearch] = useState("");
  const [editProductResults, setEditProductResults] = useState([]);
  const [loadingEditProducts, setLoadingEditProducts] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState(false);

  const editDropdownRef = useRef(null);

  const statuses = ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await leadOrderService.getLeadOrders({
        search,
        status: statusFilter,
        page,
        limit: 10
      });
      setOrders(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch lead orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, page]);

  // Outside click listener for edit product dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setShowEditDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch products for edit combobox
  const fetchEditProducts = async (searchTerm = "") => {
    try {
      setLoadingEditProducts(true);
      const res = await api.get("/public/products/list", { params: { search: searchTerm, limit: 20 } });
      setEditProductResults(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoadingEditProducts(false);
    }
  };

  useEffect(() => {
    if (editingOrder) {
      const timer = setTimeout(() => {
        fetchEditProducts(editProductSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [editProductSearch, editingOrder]);

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditStatus(order.status || "Pending");
    setEditRemark(order.remark || "");
    
    // Map items for editing
    const items = (order.items || []).map(item => ({
      product: item.product,
      actualPrice: item.actualPrice,
      offerPrice: item.offerPrice,
      quantity: item.quantity
    }));
    setEditItems(items);
    setEditProductSearch("");
    setShowEditDropdown(false);
    fetchEditProducts("");
  };

  const handleAddEditProduct = (product) => {
    const exists = editItems.find(item => item.product._id === product._id);
    if (exists) {
      toast.error("Product already in order list");
      setShowEditDropdown(false);
      return;
    }

    const actual = product.sellPrice || product.mrp || 0;
    setEditItems(prev => [
      ...prev,
      {
        product,
        actualPrice: actual,
        offerPrice: actual,
        quantity: 1
      }
    ]);
    setEditProductSearch("");
    setShowEditDropdown(false);
  };

  const handleEditItemChange = (index, field, value) => {
    setEditItems(prev => {
      const updated = [...prev];
      if (field === "offerPrice") {
        updated[index].offerPrice = parseFloat(value) || 0;
      } else if (field === "quantity") {
        updated[index].quantity = Math.max(1, parseInt(value) || 1);
      }
      return updated;
    });
  };

  const handleRemoveEditItem = (index) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead order?")) return;
    try {
      await leadOrderService.deleteLeadOrder(id);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lead order");
    }
  };

  const handleUpdateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (editItems.length === 0) {
      return toast.error("Order must contain at least one product");
    }

    try {
      setUpdating(true);
      const itemsPayload = editItems.map(item => ({
        productId: item.product._id,
        offerPrice: item.offerPrice,
        quantity: item.quantity
      }));

      await leadOrderService.updateLeadOrder(editingOrder._id, {
        status: editStatus,
        remark: editRemark,
        items: itemsPayload
      });

      toast.success("Lead order updated successfully!");
      setEditingOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Rejected':
      case 'Cancelled':
        return "bg-red-100 text-red-800 border-red-200";
      case 'Pending':
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const editGrandTotal = editItems.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/leads")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Orders</h1>
            <p className="text-sm text-slate-500 mt-1">Multi-product orders pushed by Field Executives for prospects and leads.</p>
          </div>
        </div>
        {hasPermission("CREATE_LEAD_ORDERS") && (
          <Button onClick={() => navigate("/dashboard/leads")}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Push New Order (from Leads)
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by Order ID (e.g. ORD-000001)..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <select 
          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-w-[150px]"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Order Statuses</option>
          {statuses.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Products Summary</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pushed By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">No lead orders found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemsCount = order.items?.length || 0;
                  const isExpanded = expandedOrderId === order._id;

                  return (
                    <Fragment key={order._id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold text-indigo-600">{order.orderId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{order.lead?.name || "N/A"}</span>
                            <span className="text-xs text-slate-500">{order.lead?.phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                              {itemsCount} {itemsCount === 1 ? "Product" : "Products"}
                            </span>
                            <button
                              onClick={() => toggleExpand(order._id)}
                              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium underline"
                            >
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {isExpanded ? "Hide Details" : "View Items"}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-900">₹{order.totalAmount?.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{order.createdBy?.name || "System"}</span>
                            <span className="text-xs text-slate-500">
                              {order.createdBy?.designation?.name || order.createdBy?.role || order.createdBy?.userType || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border", getStatusBadge(order.status))}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {hasPermission("EDIT_LEAD_ORDERS") && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEditModal(order)}
                                title="Edit Full Order (Status, Items, Prices, Quantity, Remarks)"
                              >
                                <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                              </Button>
                            )}
                            {hasPermission("DELETE_LEAD_ORDERS") && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(order._id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Item Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan="7" className="px-6 py-4">
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Itemized Order Breakdown</h4>
                              <div className="divide-y divide-slate-100">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-3">
                                      {item.product?.mainImage ? (
                                        <img src={item.product.mainImage} alt="" className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0" />
                                      ) : (
                                        <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                          <Package className="h-4 w-4" />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-semibold text-slate-900">{item.product?.name || "Deleted Product"}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">{item.product?.productId}</p>
                                      </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                      <div>
                                        <span className="text-slate-400 line-through mr-2">MRP: ₹{item.actualPrice}</span>
                                        <span className="font-semibold text-emerald-700">Offer: ₹{item.offerPrice}</span>
                                      </div>
                                      <span className="bg-slate-100 px-2 py-1 rounded font-medium text-slate-700">Qty: {item.quantity}</span>
                                      <span className="font-bold text-slate-900 min-w-[70px]">₹{item.itemTotal?.toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {order.remark && (
                                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                                  <strong>Note / Remark:</strong> {order.remark}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Order Edit Modal (Status, Products, Prices, Quantities, Remarks) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Order: <span className="text-indigo-600 font-mono">{editingOrder.orderId}</span></h3>
                <p className="text-xs text-slate-500">Lead: <span className="font-semibold text-slate-800">{editingOrder.lead?.name}</span> ({editingOrder.lead?.phone})</p>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOrderSubmit} className="p-6 space-y-6">
              
              {/* Order Status Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Order Status</label>
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Order Grand Total</label>
                  <div className="h-10 px-3 py-2 rounded-md bg-indigo-100/70 border border-indigo-200 text-indigo-800 font-extrabold text-base flex items-center">
                    ₹{editGrandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Add Product Combobox */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">Add More Products to Order</label>
                <div className="relative" ref={editDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search and add product by name or ID..."
                      className="w-full pl-9 pr-8 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={editProductSearch}
                      onChange={(e) => {
                        setEditProductSearch(e.target.value);
                        setShowEditDropdown(true);
                      }}
                      onFocus={() => setShowEditDropdown(true)}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>

                  {showEditDropdown && (
                    <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 border border-slate-200">
                      {loadingEditProducts ? (
                        <div className="p-3 text-center text-xs text-slate-500">Searching products...</div>
                      ) : editProductResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">No products found matching "{editProductSearch}"</div>
                      ) : (
                        editProductResults.map(prod => (
                          <div
                            key={prod._id}
                            onClick={() => handleAddEditProduct(prod)}
                            className="flex items-center justify-between px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              {prod.mainImage ? (
                                <img src={prod.mainImage} alt="" className="h-8 w-8 rounded object-cover border border-slate-200" />
                              ) : (
                                <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                  <Package className="h-4 w-4" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 text-xs">{prod.name}</p>
                                <span className="text-[10px] text-slate-500 font-mono">{prod.productId}</span>
                              </div>
                            </div>
                            <span className="font-bold text-xs text-slate-900">+ Add (₹{prod.sellPrice || prod.mrp || 0})</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Items Table */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800">Order Items ({editItems.length})</label>
                {editItems.length === 0 ? (
                  <p className="text-xs text-red-500 p-3 bg-red-50 rounded border border-red-100">At least one product must remain in the order.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Product</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Offer Price (₹)</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500">Qty</th>
                          <th className="px-3 py-2 text-right font-semibold text-slate-500">Subtotal</th>
                          <th className="px-3 py-2 text-center font-semibold text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {editItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {item.product?.mainImage ? (
                                  <img src={item.product.mainImage} alt="" className="h-8 w-8 rounded object-cover border border-slate-200" />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900 text-xs">{item.product?.name}</p>
                                  <span className="text-[10px] text-slate-500 font-mono">Actual: ₹{item.actualPrice}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.offerPrice}
                                onChange={(e) => handleEditItemChange(index, "offerPrice", e.target.value)}
                                className="w-24 h-8 text-xs font-semibold text-emerald-700"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleEditItemChange(index, "quantity", e.target.value)}
                                className="w-16 h-8 text-xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">
                              ₹{(item.offerPrice * item.quantity).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEditItem(index)}
                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Remark / Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Remark / Note</label>
                <textarea
                  rows="3"
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setEditingOrder(null)} disabled={updating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating || editItems.length === 0}>
                  {updating ? "Saving Changes..." : "Save Order Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
