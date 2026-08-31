import api from './api';

export const getPlans = async () => {
  const response = await api.get('/user/plans');
  return response.data;
};

export const getPlanById = async (id) => {
  const response = await api.get(`/user/plans/${id}`);
  return response.data;
};

export const investInPlan = async (planId, amount) => {
  const response = await api.post('/user/investments', { planId, amount });
  return response.data;
};

export const getMyInvestments = async () => {
  const response = await api.get('/user/investments');
  return response.data;
};

export const getInvestmentById = async (id) => {
  const response = await api.get(`/user/investments/${id}`);
  return response.data;
};

