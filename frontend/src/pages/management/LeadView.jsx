import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, PhoneCall, ShoppingBag, Edit2, User, Phone, Mail, MapPin, 
  Clock, Calendar, CheckCircle2, MessageSquare, Tag, ShieldCheck, Plus, Trash2,
  Package, DollarSign, FileText, ChevronRight, AlertCircle, Eye
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import leadService from "../../services/leadService";
import leadOrderService from "../../services/leadOrderService";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { LeadActivityModal } from "../../components/management/LeadActivityModal";
import { useAuth } from "../../context/AuthContext";

export function LeadView() {
  const { user, hasPermission } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activities"); // "activities" | "orders"
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  const isFullAccess = user?.userType === "ADMIN" || 
                       user?.role === "TEAM_LEAD" || 
                       user?.role === "TEAM_LEADER" || 
                       user?.role === "TL" || 
                       user?.role === "MANAGER" ||
                       user?.designation?.name?.toLowerCase().includes("team lead") ||
                       user?.designation?.name?.toLowerCase().includes("team leader") ||
                       user?.designation?.name?.toLowerCase().includes("tl") ||
                       user?.designation?.name?.toLowerCase().includes("manager");

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this call log?")) return;
    try {
      await leadService.deleteActivity(activityId);
      toast.success("Call log deleted successfully!");
      fetchLeadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete call log");
    }
  };

  const fetchLeadData = async () => {
    try {
      setLoading(true);
      const [leadRes, activityRes, ordersRes] = await Promise.all([
        leadService.getLeadById(id),
        leadService.getLeadActivities(id),
        leadOrderService.getLeadOrders({ leadId: id, limit: 100 })
      ]);
      setLead(leadRes.data);
      setActivities(activityRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load complete lead details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLeadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading lead complete details & history...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-bold text-slate-800">Lead Not Found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/leads")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
        </Button>
      </div>
    );
  }

  const nextFollowUp = activities.find(a => a.followUpDate && new Date(a.followUpDate) >= new Date().setHours(0,0,0,0));
  const totalOrderValue = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Pending':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/leads")} title="Back">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              {lead.name}
              <span className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border",
                lead.status === "Converted" ? "bg-green-100 text-green-800 border-green-200" :
                lead.status === "Lost" ? "bg-red-100 text-red-800 border-red-200" :
                lead.status === "Hot" ? "bg-orange-100 text-orange-800 border-orange-200" :
                lead.status === "Visit" ? "bg-purple-100 text-purple-800 border-purple-200" :
                "bg-blue-100 text-blue-800 border-blue-200"
              )}>
                {lead.status || "New"}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Created on {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {hasPermission("LOG_CALLS") && (
            <Button 
              onClick={() => setIsActivityModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <PhoneCall className="mr-2 h-4 w-4" />
              Log Call & Follow-up
            </Button>
          )}
          {hasPermission("CREATE_LEAD_ORDERS") && (
            <Button 
              variant="outline"
              onClick={() => navigate(`/dashboard/leads/push-order/${lead._id}`)}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Push Order
            </Button>
          )}
          {hasPermission("EDIT_LEADS") && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/dashboard/leads/edit/${lead._id}`)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Lead
            </Button>
          )}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Calls</span>
            <PhoneCall className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{activities.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Follow-up</span>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 truncate">
            {nextFollowUp ? new Date(nextFollowUp.followUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }) : "None"}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Order Value</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">₹{totalOrderValue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Main Grid: Profile Details & Activity/Order Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Profile & Details */}
        <div className="space-y-6">
          {/* Profile Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Contact Information
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="font-semibold">{lead.phone}</span>
                {lead.whatsappNumber && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">WA: {lead.whatsappNumber}</span>
                )}
              </div>

              {lead.email && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{lead.email}</span>
                </div>
              )}

              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{lead.address?.locality || lead.address?.landmark || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {[lead.address?.city, lead.address?.state, lead.address?.pincode].filter(Boolean).join(", ") || "No address details"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-slate-700">
                <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                  Source: {lead.source || "Direct"}
                </span>
              </div>

              {lead.requirement && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">Requirement Note</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {lead.requirement}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lead Assignment & Creator Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Assignment & Creator
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Assigned Sales Executive</span>
                {lead.assignedTo ? (
                  <div className="flex flex-col bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                    <span className="font-bold text-indigo-900">{lead.assignedTo.name}</span>
                    <span className="text-xs text-slate-600">{lead.assignedTo.designation?.name || lead.assignedTo.role || lead.assignedTo.userType}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Created By</span>
                <div className="flex flex-col bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-800">{lead.createdBy?.name || "System"}</span>
                  <span className="text-xs text-slate-500">{lead.createdBy?.designation?.name || lead.createdBy?.role || lead.createdBy?.userType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Follow-Up Summary Card */}
          {nextFollowUp && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-amber-600" /> Next Scheduled Follow-up
              </span>
              <p className="text-sm font-bold text-slate-900">
                {new Date(nextFollowUp.followUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} {nextFollowUp.followUpTime ? `@ ${nextFollowUp.followUpTime}` : ""}
              </p>
              {nextFollowUp.followUpNote && (
                <p className="text-xs text-slate-700 bg-white/70 p-2 rounded border border-amber-200/50">
                  {nextFollowUp.followUpNote}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: History Tabs (Call Logs & Pushed Orders) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab("activities")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors relative",
                activeTab === "activities"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <PhoneCall className="h-4 w-4" />
              Call & Discussion History
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-bold ml-1",
                activeTab === "activities" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"
              )}>
                {activities.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors relative",
                activeTab === "orders"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Pushed Lead Orders
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-bold ml-1",
                activeTab === "orders" ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-700"
              )}>
                {orders.length}
              </span>
            </button>
          </div>

          {/* TAB 1: CALL & DISCUSSION HISTORY */}
          {activeTab === "activities" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    Complete Call Logs & Interaction Record
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological history of executive calls, manual duration, remarks & follow-up dates.</p>
                </div>

                <Button 
                  size="sm" 
                  onClick={() => setIsActivityModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Call Log
                </Button>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">No call logs recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Add Call Log" above to record customer interaction.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => {
                    const canEditOrDelete = isFullAccess || String(act.createdBy?._id || act.createdBy) === String(user?._id);
                    return (
                      <div key={act._id} className="relative group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white text-[10px]">
                          <PhoneCall className="h-3 w-3" />
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 hover:border-indigo-200 transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {act.createdBy?.name || "Executive"}
                              </span>
                              {act.callDuration && (
                                <span className="inline-flex items-center text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">
                                  Duration: {act.callDuration}
                                </span>
                              )}
                              {act.status && (
                                <span className="inline-flex items-center text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-medium">
                                  Status: {act.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-medium">
                                {new Date(act.callDate || act.createdAt).toLocaleString()}
                              </span>

                              {canEditOrDelete && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleDeleteActivity(act._id)}
                                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete Call Log"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {act.remarks}
                          </p>

                          {act.followUpDate && (
                            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 text-xs text-indigo-700 font-semibold bg-indigo-50/60 p-2 rounded-lg">
                              <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span>Follow-up Scheduled: {new Date(act.followUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} {act.followUpTime || ""}</span>
                              {act.followUpNote && <span className="text-slate-600 font-normal">({act.followUpNote})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAST / PUSHED ORDERS HISTORY */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-indigo-600" />
                    Pushed Lead Orders History
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">All official orders generated and pushed for this lead.</p>
                </div>

                <Button 
                  size="sm" 
                  onClick={() => navigate(`/dashboard/leads/push-order/${lead._id}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Push New Order
                </Button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium">No order pushed for this lead yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Push New Order" to create order items with offer price.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord._id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 hover:border-indigo-200 transition-colors">
                      {/* Order Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-indigo-900 tracking-tight">
                            {ord.orderId}
                          </span>
                          <span className={cn(
                            "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                            getOrderStatusBadge(ord.status)
                          )}>
                            {ord.status || "Pending"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-medium">
                            {new Date(ord.createdAt).toLocaleString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-xs text-slate-500">
                            By: <strong className="text-slate-700">{ord.createdBy?.name || "Executive"}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Order Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                              <th className="py-1.5 px-2">Product</th>
                              <th className="py-1.5 px-2 text-right">Actual Price</th>
                              <th className="py-1.5 px-2 text-right">Offer Price</th>
                              <th className="py-1.5 px-2 text-center">Qty</th>
                              <th className="py-1.5 px-2 text-right">Item Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {ord.items?.map((item, idx) => (
                              <tr key={idx} className="text-slate-700">
                                <td className="py-2 px-2 font-medium">
                                  {item.product?.name || "Product Item"}
                                  {item.product?.productId && (
                                    <span className="text-[10px] text-slate-400 block">({item.product.productId})</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-right text-slate-400 line-through">
                                  ₹{item.actualPrice?.toLocaleString('en-IN') || 0}
                                </td>
                                <td className="py-2 px-2 text-right font-semibold text-emerald-700">
                                  ₹{item.offerPrice?.toLocaleString('en-IN') || 0}
                                </td>
                                <td className="py-2 px-2 text-center font-medium">
                                  {item.quantity}
                                </td>
                                <td className="py-2 px-2 text-right font-bold text-slate-900">
                                  ₹{item.itemTotal?.toLocaleString('en-IN') || 0}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Order Footer & Remarks */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 bg-white/60 p-2.5 rounded-lg">
                        <div className="text-xs text-slate-600">
                          {ord.remark ? (
                            <span><strong>Remark:</strong> {ord.remark}</span>
                          ) : (
                            <span className="text-slate-400 italic">No remark added</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Grand Total:</span>
                          <span className="text-base font-bold text-indigo-900">
                            ₹{ord.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Activity Modal */}
      <LeadActivityModal
        lead={lead}
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onActivityAdded={fetchLeadData}
      />
    </div>
  );
}
export default LeadView;
