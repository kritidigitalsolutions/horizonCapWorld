import api from './api';

export const getSupportChannels = async () => {
  const response = await api.get('/user/support/channels');
  return response.data;
};

export const createSupportTicket = async (ticketData) => {
  const response = await api.post('/user/support/tickets', ticketData);
  return response.data;
};

export const getMyTickets = async () => {
  const response = await api.get('/user/support/tickets');
  return response.data;
};

export const getTicketById = async (id) => {
  const response = await api.get(`/user/support/tickets/${id}`);
  return response.data;
};

export const replyToTicket = async (id, replyData) => {
  const response = await api.post(`/user/support/tickets/${id}/reply`, replyData);
  return response.data;
};

