import api from "./api";

const BASE_URL = "/admin/lead-orders";

const leadOrderService = {
  // Get lead orders with filters and pagination
  getLeadOrders: async (params = {}) => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  // Get a single lead order by ID
  getLeadOrderById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // Create a new lead order (Push order)
  createLeadOrder: async (orderData) => {
    const response = await api.post(BASE_URL, orderData);
    return response.data;
  },

  // Update a lead order
  updateLeadOrder: async (id, orderData) => {
    const response = await api.put(`${BASE_URL}/${id}`, orderData);
    return response.data;
  },

  // Delete a lead order
  deleteLeadOrder: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  },
};

export default leadOrderService;
