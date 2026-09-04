import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ShoppingBag, UserCheck, CheckSquare, Square, PhoneCall, Eye } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import leadService from "../../services/leadService";
import api from "../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LeadActivityModal } from "../../components/management/LeadActivityModal";

export function Leads() {
  const { user, hasPermission } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [activityModalLead, setActivityModalLead] = useState(null);
  const navigate = useNavigate();

  const isFullAccess = user?.userType === "ADMIN" || 
                       user?.role === "TEAM_LEAD" || 
                       user?.role === "TEAM_LEADER" || 
                       user?.role === "TL" || 
                       user?.role === "MANAGER" ||
                       user?.designation?.name?.toLowerCase().includes("team lead") ||
                       user?.designation?.name?.toLowerCase().includes("team leader") ||
                       user?.designation?.name?.toLowerCase().includes("tl") ||
                       user?.designation?.name?.toLowerCase().includes("manager");

  const statuses = [
    'New', 'Cold', 'Warm', 'Hot', 'Interested', 'Not Interested',
    'Follow-up Required', 'Callback', 'No Response', 'Wrong Number',
    'Future Requirement', 'Converted', 'Lost', 'Visit'
  ];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await leadService.getLeads({ search, status: statusFilter, page, limit: 10 });
      setLeads(res.data || []);
      setTotalPages(res.pagination?.pages || 1);
      setSelectedLeadIds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/admin/employees/list", { params: { limit: 100 } });
      setEmployees(res.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch employees list", error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeadIds(leads.map(l => l._id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectLead = (id) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAssignLeads = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error("Please select at least one lead to assign");
      return;
    }
    if (!selectedEmployeeId) {
      toast.error("Please select an employee / salesperson");
      return;
    }

    try {
      setAssigning(true);
      const res = await leadService.assignLeads(selectedLeadIds, selectedEmployeeId);
      toast.success(res.message || "Lead(s) assigned successfully");
      setSelectedLeadIds([]);
      setSelectedEmployeeId("");
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign leads");
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    try {
      await leadService.deleteLead(id);
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete lead");
    }
  };

  const openEditPage = (lead) => {
    navigate(`/dashboard/leads/edit/${lead._id}`);
  };

  const openCreatePage = () => {
    navigate(`/dashboard/leads/create`);
  };

  const openPushOrderPage = (lead) => {
    navigate(`/dashboard/leads/push-order/${lead._id}`);
  };

  const isAllSelected = leads.length > 0 && leads.every(l => selectedLeadIds.includes(l._id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Manage sales leads, sources, and assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission("VIEW_LEAD_ORDERS") && (
            <Button variant="outline" onClick={() => navigate("/dashboard/lead-orders")}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Lead Orders
            </Button>
          )}
          {hasPermission("CREATE_LEADS") && (
            <Button onClick={openCreatePage}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action & Filters Bar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, email or phone..." 
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <select 
            className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-w-[150px] w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Bulk Assignment Bar (Only visible to Team Lead / Admin) */}
        {isFullAccess && selectedLeadIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center bg-indigo-600 text-white font-medium text-xs rounded-full h-6 px-2.5">
                {selectedLeadIds.length} Selected
              </span>
              <span className="text-sm font-medium text-indigo-900">
                Select salesperson to assign lead(s):
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                className="h-9 rounded-md border border-indigo-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[200px]"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                <option value="">-- Select Sales Executive --</option>
                {employees
                  .filter(emp => {
                    const roleStr = String(emp.role || "").toLowerCase();
                    const desigStr = String(emp.designation?.name || "").toLowerCase();

                    const isExcluded = desigStr.includes("hr") || 
                                       desigStr.includes("team leader") || 
                                       desigStr.includes("team lead") || 
                                       roleStr.includes("hr") || 
                                       roleStr.includes("team_lead") ||
                                       roleStr.includes("admin");

                    const isSalesOrField = roleStr.includes("sales") || 
                                           roleStr.includes("field") || 
                                           roleStr.includes("executive") ||
                                           desigStr.includes("sales") || 
                                           desigStr.includes("field") ||
                                           desigStr.includes("executive");

                    return isSalesOrField && !isExcluded;
                  })
                  .map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation?.name || emp.role || emp.userType})
                    </option>
                  ))}
              </select>

              <Button
                size="sm"
                onClick={handleAssignLeads}
                disabled={assigning || !selectedEmployeeId}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <UserCheck className="mr-1.5 h-4 w-4" />
                {assigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {isFullAccess && (
                  <th className="px-4 py-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={isFullAccess ? "9" : "8"} className="px-6 py-8 text-center text-slate-500">Loading leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={isFullAccess ? "9" : "8"} className="px-6 py-8 text-center text-slate-500">No leads found.</td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead._id);
                  return (
                    <tr 
                      key={lead._id} 
                      className={cn(
                        "hover:bg-slate-50 transition-colors",
                        isSelected && "bg-indigo-50/50"
                      )}
                    >
                      {isFullAccess && (
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectLead(lead._id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => navigate(`/dashboard/leads/view/${lead._id}`)}
                          className="text-sm font-semibold text-indigo-600 hover:text-indigo-900 hover:underline text-left cursor-pointer"
                        >
                          {lead.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600">{lead.phone}</span>
                          {lead.email && <span className="text-xs text-slate-500">{lead.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-600">{lead.address?.city || "-"}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {lead.source || "Direct"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-indigo-700">{lead.assignedTo.name}</span>
                            <span className="text-xs text-slate-500">
                              {lead.assignedTo.designation?.name || lead.assignedTo.role || lead.assignedTo.userType || "-"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{lead.createdBy?.name || "System"}</span>
                          <span className="text-xs text-slate-500">
                            {lead.createdBy?.designation?.name || lead.createdBy?.role || lead.createdBy?.userType || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          lead.status === "Converted" ? "bg-green-100 text-green-800" :
                          lead.status === "Lost" ? "bg-red-100 text-red-800" :
                          lead.status === "Hot" ? "bg-orange-100 text-orange-800" :
                          lead.status === "Visit" ? "bg-purple-100 text-purple-800" :
                          "bg-blue-100 text-blue-800"
                        )}>
                          {lead.status || "New"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/dashboard/leads/view/${lead._id}`)}
                            title="View Complete History & Details"
                          >
                            <Eye className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                          </Button>
                          {hasPermission("LOG_CALLS") && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setActivityModalLead(lead)} 
                              className="h-8 px-2.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Log Call & Discussion History"
                            >
                              <PhoneCall className="h-3.5 w-3.5 mr-1" />
                              Call Log
                            </Button>
                          )}
                          {hasPermission("CREATE_LEAD_ORDERS") && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openPushOrderPage(lead)} 
                              className="h-8 px-2.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                              title="Push Order for Lead"
                            >
                              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                              Push Order
                            </Button>
                          )}
                          {hasPermission("EDIT_LEADS") && (
                            <Button variant="ghost" size="icon" onClick={() => openEditPage(lead)} title="Edit">
                              <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                            </Button>
                          )}
                          {hasPermission("DELETE_LEADS") && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(lead._id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
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
                    <span className="sr-only">Previous</span>
                    &lt;
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    <span className="sr-only">Next</span>
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Call Log & Activity Modal */}
      <LeadActivityModal
        lead={activityModalLead}
        isOpen={!!activityModalLead}
        onClose={() => setActivityModalLead(null)}
        onActivityAdded={fetchLeads}
      />
    </div>
  );
}
