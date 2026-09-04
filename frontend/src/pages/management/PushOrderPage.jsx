import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Trash2, Package, ShoppingBag, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import leadService from "../../services/leadService";
import leadOrderService from "../../services/leadOrderService";
import api from "../../services/api";
import toast from "react-hot-toast";

export function PushOrderPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loadingLead, setLoadingLead] = useState(true);

  // Multi-product items in current order
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Product Search state
  const [productSearch, setProductSearch] = useState("");
  const [productsList, setProductsList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch Lead Details
  useEffect(() => {
    const fetchLeadInfo = async () => {
      try {
        setLoadingLead(true);
        const res = await leadService.getLeadById(leadId);
        setLead(res.data);
      } catch (err) {
        toast.error("Failed to load lead information");
        navigate("/dashboard/leads");
      } finally {
        setLoadingLead(false);
      }
    };
    if (leadId) fetchLeadInfo();
  }, [leadId]);

  // Handle outside click for product search dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch product search results from API
  const fetchProducts = async (searchTerm = "") => {
    try {
      setLoadingProducts(true);
      const res = await api.get("/public/products/list", {
        params: { search: searchTerm, limit: 20 }
      });
      setProductsList(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Add Product to selectedItems table
  const handleAddProduct = (product) => {
    // Check if product is already added
    const exists = selectedItems.find(item => item.product._id === product._id);
    if (exists) {
      toast.error("Product already added to order list");
      setShowDropdown(false);
      return;
    }

    const actual = product.sellPrice || product.mrp || 0;
    setSelectedItems(prev => [
      ...prev,
      {
        product,
        actualPrice: actual,
        offerPrice: actual,
        quantity: 1
      }
    ]);

    setProductSearch("");
    setShowDropdown(false);
    toast.success(`${product.name} added to order list`);
  };

  // Update offer price or quantity for an item
  const handleItemChange = (index, field, value) => {
    setSelectedItems(prev => {
      const updated = [...prev];
      if (field === "offerPrice") {
        updated[index].offerPrice = parseFloat(value) || 0;
      } else if (field === "quantity") {
        updated[index].quantity = Math.max(1, parseInt(value) || 1);
      }
      return updated;
    });
  };

  // Remove item from order list
  const handleRemoveItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate Subtotals & Grand Totals
  const actualTotal = selectedItems.reduce((sum, item) => sum + (item.actualPrice * item.quantity), 0);
  const grandTotal = selectedItems.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);
  const totalSavings = actualTotal - grandTotal;

  // Submit Order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      return toast.error("Please add at least one product to the order");
    }

    try {
      setSubmitting(true);
      const itemsPayload = selectedItems.map(item => ({
        productId: item.product._id,
        offerPrice: item.offerPrice,
        quantity: item.quantity
      }));

      await leadOrderService.createLeadOrder({
        leadId,
        items: itemsPayload,
        remark
      });

      toast.success("Lead order pushed successfully!");
      navigate("/dashboard/lead-orders");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to push lead order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingLead) {
    return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/leads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Push New Order</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select products, customize offer prices, and push an order for this lead.</p>
        </div>
      </div>

      {/* Lead Info Banner */}
      {lead && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
              {lead.name?.charAt(0)?.toUpperCase() || "L"}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                  {lead.status || "New"}
                </span>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Source: {lead.source || "Direct"}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-600 mt-1">
                <span><strong>Phone:</strong> {lead.phone}</span>
                {lead.email && <span><strong>Email:</strong> {lead.email}</span>}
                {lead.address?.city && <span><strong>City:</strong> {lead.address.city}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Product Search & Items Table (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <label className="block text-sm font-semibold text-slate-900">Add Products to Order</label>
            
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search product by name or ID (e.g. iPhone, PRD-000001)..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && (
                <div className="absolute z-30 mt-1.5 w-full max-h-72 overflow-y-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 border border-slate-200">
                  {loadingProducts ? (
                    <div className="p-4 text-center text-xs text-slate-500">Searching products...</div>
                  ) : productsList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No active products found matching "{productSearch}"</div>
                  ) : (
                    productsList.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() => handleAddProduct(prod)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          {prod.mainImage ? (
                            <img src={prod.mainImage} alt="" className="h-10 w-10 rounded-md object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{prod.name}</p>
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{prod.productId || "PRD"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm">₹{prod.sellPrice || prod.mrp || 0}</span>
                          <p className="text-[10px] text-indigo-600 font-medium">+ Click to Add</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-indigo-600" />
                Order Line Items ({selectedItems.length})
              </h3>
              {selectedItems.length > 0 && (
                <button 
                  onClick={() => setSelectedItems([])} 
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Package className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No products added yet.</p>
                <p className="text-xs text-slate-400">Search and select products above to add them to this order.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase">Actual Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase">Offer Price (₹)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-500 text-xs uppercase">Subtotal</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-500 text-xs uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedItems.map((item, index) => (
                      <tr key={item.product._id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {item.product.mainImage ? (
                              <img src={item.product.mainImage} alt="" className="h-10 w-10 rounded-md object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-900">{item.product.name}</p>
                              <span className="text-xs text-slate-500 font-mono">{item.product.productId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          ₹{item.actualPrice}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.offerPrice}
                            onChange={(e) => handleItemChange(index, "offerPrice", e.target.value)}
                            className="w-28 h-9 text-sm font-semibold text-emerald-700"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            className="w-20 h-9 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-900">
                          ₹{(item.offerPrice * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Actions (Span 1) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total Items:</span>
                <span className="font-semibold text-slate-900">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Actual Value:</span>
                <span className="line-through text-slate-400">₹{actualTotal.toFixed(2)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-semibold bg-emerald-50 p-2 rounded-md border border-emerald-100">
                  <span>Total Discount/Savings:</span>
                  <span>- ₹{totalSavings.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-base">Grand Total:</span>
                <span className="font-extrabold text-indigo-600 text-xl">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Remark / Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Note / Remark for Lead Order
              </label>
              <textarea
                rows="4"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                placeholder="Add special terms, payment terms, or remarks..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 space-y-2">
              <Button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || selectedItems.length === 0}
                className="w-full h-11 text-base font-bold shadow-md"
              >
                {submitting ? "Submitting Order..." : "Submit & Push Order"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/leads")}
                disabled={submitting}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
