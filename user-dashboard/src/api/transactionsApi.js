import api from './api';

export const getTransactions = async (params = {}) => {
  const response = await api.get('/user/transactions', { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/user/transactions/${id}`);
  return response.data;
};

