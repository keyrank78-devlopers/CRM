import { useState, useEffect } from "react";
import { Calendar, Clock, Search, PhoneCall, ShoppingBag, CheckCircle, AlertTriangle, ArrowRight, User, Eye } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import leadService from "../../services/leadService";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";
import { LeadActivityModal } from "../../components/management/LeadActivityModal";

export function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("today"); // 'today', 'overdue', 'upcoming', 'all'
  const [search, setSearch] = useState("");
  const [activityModalLead, setActivityModalLead] = useState(null);
  const navigate = useNavigate();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await leadService.getFollowUps({ filter: filter === "all" ? undefined : filter });
      setFollowUps(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch follow-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [filter]);

  const filteredData = followUps.filter(item => {
    if (!search) return true;
    const name = item.lead?.name || "";
    const phone = item.lead?.phone || "";
    const note = item.followUpNote || "";
    const searchLower = search.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           phone.includes(searchLower) || 
           note.toLowerCase().includes(searchLower);
  });

  const getUrgencyBadge = (dateStr, status) => {
    if (status === "Completed") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Completed</span>;
    }
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (itemDate < today) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</span>;
    } else if (itemDate >= today && itemDate < tomorrow) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Today</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" /> Upcoming</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-Ups & Call Reminders</h1>
          <p className="text-sm text-slate-500 mt-1">Track scheduled customer follow-up calls and scheduled agendas.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard/leads")}>
          View All Leads
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter("today")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              filter === "today" 
                ? "bg-amber-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            🟡 Today's Follow-ups
          </button>
          <button
            onClick={() => setFilter("overdue")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              filter === "overdue" 
                ? "bg-red-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            🔴 Overdue
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              filter === "upcoming" 
                ? "bg-blue-600 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            🟢 Upcoming
          </button>
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
              filter === "all" 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            All Scheduled
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search lead or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Follow-ups List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agenda / Note</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading follow-ups...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No follow-ups found for this filter.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUrgencyBadge(item.followUpDate, item.followUpStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {new Date(item.followUpDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.followUpTime || "Any Time"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.lead ? (
                        <div className="flex flex-col">
                          <button 
                            onClick={() => navigate(`/dashboard/leads/view/${item.lead._id}`)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-900 hover:underline text-left cursor-pointer"
                          >
                            {item.lead.name}
                          </button>
                          <span className="text-xs text-slate-600 font-medium">{item.lead.phone}</span>
                          {item.lead.address?.city && (
                            <span className="text-[11px] text-slate-400">{item.lead.address.city}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Lead Removed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 max-w-xs truncate" title={item.followUpNote || item.remarks}>
                        {item.followUpNote || item.remarks || "Follow-up call scheduled"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-medium">{item.createdBy?.name || "Executive"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {item.lead && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/leads/view/${item.lead._id}`)}
                              title="View Complete Lead Profile & History"
                            >
                              <Eye className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setActivityModalLead(item.lead)}
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <PhoneCall className="h-3.5 w-3.5 mr-1.5" />
                              Log Call & Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/dashboard/leads/push-order/${item.lead._id}`)}
                              className="h-8 px-2.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                              Push Order
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity / Call Log Modal */}
      <LeadActivityModal
        lead={activityModalLead}
        isOpen={!!activityModalLead}
        onClose={() => setActivityModalLead(null)}
        onActivityAdded={fetchFollowUps}
      />
    </div>
  );
}
