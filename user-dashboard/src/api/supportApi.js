import API from "./api";

export const getSupportChannels = async () => {
  const response = await API.get("/user/support/channels");
  return response.data;
};

export const createSupportTicket = async (ticketData) => {
  const response = await API.post("/user/support/tickets", ticketData);
  return response.data;
};

export const getMyTickets = async (params) => {
  const response = await API.get("/user/support/tickets", { params });
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await API.get(`/user/support/tickets/${id}`);
  return response.data;
};

export const replyToTicket = async (id, replyData) => {
  const response = await API.post(`/user/support/tickets/${id}/reply`, replyData);
  return response.data;
};
