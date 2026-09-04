import api from "./api";

const BASE_URL = "/admin/leads";

const leadService = {
  // Get all leads with pagination and filters
  getLeads: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  // Get a single lead by ID
  getLeadById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create a new lead
  createLead: async (leadData) => {
    const response = await api.post(BASE_URL, leadData);
    return response.data;
  },

  // Update a lead
  updateLead: async (id, leadData) => {
    const response = await api.put(`${BASE_URL}/${id}`, leadData);
    return response.data;
  },

  // Delete a lead
  deleteLead: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Assign leads (single or bulk)
  assignLeads: async (leadIds, assignedTo) => {
    const response = await api.post(`${BASE_URL}/assign`, { leadIds, assignedTo });
    return response.data;
  },

  // Add call log / activity
  addActivity: async (activityData) => {
    const response = await api.post('/admin/lead-activities', activityData);
    return response.data;
  },

  // Get activities for a specific lead
  getLeadActivities: async (leadId) => {
    const response = await api.get(`/admin/lead-activities/lead/${leadId}`);
    return response.data;
  },

  // Get follow-ups list
  getFollowUps: async (params = {}) => {
    const response = await api.get('/admin/lead-activities/follow-ups', { params });
    return response.data;
  },

  // Update activity / call log
  updateActivity: async (id, activityData) => {
    const response = await api.put(`/admin/lead-activities/${id}`, activityData);
    return response.data;
  },

  // Delete activity / call log
  deleteActivity: async (id) => {
    const response = await api.delete(`/admin/lead-activities/${id}`);
    return response.data;
  },
};

export default leadService;
