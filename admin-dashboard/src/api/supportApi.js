import API from "./api";

// ──────── TICKETS ────────

// Get all support tickets
export const getSupportTickets = async (params = {}) => {
  const response = await API.get("/admin/support/tickets", { params });
  return response.data;
};

// Get single ticket by ID
export const getTicketById = async (id) => {
  const response = await API.get(`/admin/support/tickets/${id}`);
  return response.data;
};

// Reply to support ticket
export const replyTicket = async (id, replyData) => {
  const response = await API.post(`/admin/support/tickets/${id}/reply`, replyData);
  return response.data;
};

// Update ticket status (Open / In Progress / Resolved / Closed)
export const updateTicketStatus = async (id, status) => {
  const response = await API.put(`/admin/support/tickets/${id}/status`, { status });
  return response.data;
};

// Delete support ticket
export const deleteTicket = async (id) => {
  const response = await API.delete(`/admin/support/tickets/${id}`);
  return response.data;
};

// ──────── OFFICIAL CHANNELS ────────

// Get all support channels
export const getChannels = async () => {
  const response = await API.get("/admin/support/channels");
  return response.data;
};

// Create support channel
export const createChannel = async (channelData) => {
  const response = await API.post("/admin/support/channels", channelData);
  return response.data;
};

// Update support channel
export const updateChannel = async (id, channelData) => {
  const response = await API.put(`/admin/support/channels/${id}`, channelData);
  return response.data;
};

// Delete support channel
export const deleteChannel = async (id) => {
  const response = await API.delete(`/admin/support/channels/${id}`);
  return response.data;
};
