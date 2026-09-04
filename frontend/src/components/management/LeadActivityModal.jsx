import { useState, useEffect } from "react";
import { X, PhoneCall, Calendar, Clock, MessageSquare, Plus, CheckCircle2, User, Send, Edit2, Trash2, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import leadService from "../../services/leadService";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function LeadActivityModal({ lead, isOpen, onClose, onActivityAdded }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [callDuration, setCallDuration] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState(lead?.status || "New");
  const [isScheduleFollowUp, setIsScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");

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

  useEffect(() => {
    if (lead) {
      setStatus(lead.status || "New");
      fetchActivities();
      resetForm();
    }
  }, [lead]);

  const resetForm = () => {
    setEditingActivityId(null);
    setCallDuration("");
    setRemarks("");
    setStatus(lead?.status || "New");
    setIsScheduleFollowUp(false);
    setFollowUpDate("");
    setFollowUpTime("");
    setFollowUpNote("");
  };

  const fetchActivities = async () => {
    if (!lead?._id) return;
    try {
      setLoadingHistory(true);
      const res = await leadService.getLeadActivities(lead._id);
      setActivities(res.data || []);
    } catch (error) {
      console.error("Failed to load activity history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startEdit = (act) => {
    setEditingActivityId(act._id);
    setCallDuration(act.callDuration || "");
    setRemarks(act.remarks || "");
    setStatus(act.status || lead?.status || "New");
    if (act.followUpDate) {
      setIsScheduleFollowUp(true);
      const formattedDate = new Date(act.followUpDate).toISOString().split('T')[0];
      setFollowUpDate(formattedDate);
      setFollowUpTime(act.followUpTime || "");
      setFollowUpNote(act.followUpNote || "");
    } else {
      setIsScheduleFollowUp(false);
      setFollowUpDate("");
      setFollowUpTime("");
      setFollowUpNote("");
    }
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this call log?")) return;
    try {
      await leadService.deleteActivity(activityId);
      toast.success("Call log deleted successfully!");
      if (editingActivityId === activityId) resetForm();
      fetchActivities();
      if (onActivityAdded) onActivityAdded();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete call log");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Please enter discussion remarks");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        leadId: lead._id,
        callDuration,
        remarks,
        status,
        followUpDate: isScheduleFollowUp && followUpDate ? followUpDate : null,
        followUpTime: isScheduleFollowUp && followUpTime ? followUpTime : "",
        followUpNote: isScheduleFollowUp && followUpNote ? followUpNote : "",
      };

      if (editingActivityId) {
        await leadService.updateActivity(editingActivityId, payload);
        toast.success("Call log updated successfully!");
      } else {
        await leadService.addActivity(payload);
        toast.success("Call log & activity saved successfully!");
      }
      
      resetForm();
      fetchActivities();
      if (onActivityAdded) onActivityAdded();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save call log");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <PhoneCall className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{lead.name}</h2>
              <p className="text-xs text-slate-300">Phone: {lead.phone} | Status: <span className="font-semibold text-indigo-300">{lead.status}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* New / Edit Call Log Form Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {editingActivityId ? (
                  <>
                    <Edit2 className="h-4 w-4 text-amber-600" />
                    Edit Call Log / Discussion
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 text-indigo-600" />
                    Log New Call / Discussion
                  </>
                )}
              </h3>

              {editingActivityId && (
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Cancel Edit
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Call Duration (Manual)
                  </label>
                  <Input
                    placeholder="e.g. 5 mins, 02:30"
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Lead Status
                  </label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discussion Remarks / Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  className="w-full rounded-md border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Summarize customer discussion, requirement, objections or offer discussed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </div>

              {/* Schedule Next Follow-Up Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduleFollowUp}
                    onChange={(e) => setIsScheduleFollowUp(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Schedule Next Follow-Up Call
                  </span>
                </label>

                {isScheduleFollowUp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Follow-Up Date</label>
                      <Input
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        required={isScheduleFollowUp}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Follow-Up Time</label>
                      <Input
                        type="time"
                        value={followUpTime}
                        onChange={(e) => setFollowUpTime(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Follow-Up Agenda / Note</label>
                      <Input
                        placeholder="e.g. Call for discount approval & confirmation"
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {editingActivityId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={submitting} className={cn("text-white", editingActivityId ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700")}>
                  <Send className="mr-1.5 h-4 w-4" />
                  {submitting ? "Saving..." : editingActivityId ? "Update Call Log" : "Save Call Log"}
                </Button>
              </div>
            </form>
          </div>

          {/* Activity Timeline History */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="h-4 w-4 text-indigo-600" />
              Activity & Call History
            </h3>

            {loadingHistory ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading call history...</p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No call logs recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activities.map((act) => {
                  const canEditOrDelete = isFullAccess || String(act.createdBy?._id || act.createdBy) === String(user?._id);
                  return (
                    <div key={act._id} className="relative group">
                      {/* Timeline icon */}
                      <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white text-[10px]">
                        <PhoneCall className="h-3 w-3" />
                      </div>

                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
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
                            <span className="text-xs text-slate-400">
                              {new Date(act.callDate || act.createdAt).toLocaleString()}
                            </span>

                            {canEditOrDelete && (
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => startEdit(act)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                  title="Edit Call Log"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(act._id)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Call Log"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {act.remarks}
                        </p>

                        {act.followUpDate && (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs text-indigo-700 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Follow-up Scheduled: {new Date(act.followUpDate).toLocaleDateString()} {act.followUpTime || ""}</span>
                            {act.followUpNote && <span className="text-slate-500">({act.followUpNote})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
