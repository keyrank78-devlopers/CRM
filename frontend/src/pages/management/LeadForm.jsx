import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import leadService from "../../services/leadService";
import toast from "react-hot-toast";

export function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const statuses = [
    'New', 'Cold', 'Warm', 'Hot', 'Interested', 'Not Interested',
    'Follow-up Required', 'Callback', 'No Response', 'Wrong Number',
    'Future Requirement', 'Converted', 'Lost', 'Visit'
  ];

  const sources = ['Website', 'Direct', 'Meta Ads', 'Google Ads'];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    status: "New",
    source: "Direct",
    address: {
      city: "",
      state: "",
      pincode: "",
      locality: "",
      landmark: ""
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // Fetch lead details if in edit mode
  useEffect(() => {
    const fetchInitialData = async () => {
      if (isEditMode) {
        try {
          const res = await leadService.getLeadById(id);
          const lead = res.data;
          
          setFormData({
            name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            whatsappNumber: lead.whatsappNumber || "",
            status: lead.status || "New",
            source: lead.source || "Direct",
            address: {
              city: lead.address?.city || "",
              state: lead.address?.state || "",
              pincode: lead.address?.pincode || "",
              locality: lead.address?.locality || "",
              landmark: lead.address?.landmark || ""
            }
          });
        } catch (error) {
          console.error("Failed to fetch lead data", error);
          toast.error("Failed to load lead details");
        } finally {
          setIsFetching(false);
        }
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["city", "state", "pincode", "locality", "landmark"].includes(name)) {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const payload = { ...formData };

      if (isEditMode) {
        await leadService.updateLead(id, payload);
        toast.success("Lead updated successfully");
      } else {
        await leadService.createLead(payload);
        toast.success("Lead created successfully");
      }
      
      navigate("/dashboard/leads");
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-slate-500">Loading lead details...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/leads")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? "Edit Lead" : "Create New Lead"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode ? "Update lead information and status." : "Fill in the details to add a new lead to the CRM."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Basic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                <Input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 bg-slate-50">
            <h3 className="text-lg font-medium text-slate-900">Status & Source</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a status</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source *</label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {sources.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Address Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Locality / Street</label>
                <Input name="locality" value={formData.address.locality} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Landmark</label>
                <Input name="landmark" value={formData.address.landmark} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <Input name="city" value={formData.address.city} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <Input name="state" value={formData.address.state} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <Input name="pincode" value={formData.address.pincode} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/leads")} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? "Saving..." : (isEditMode ? "Update Lead" : "Create Lead")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
