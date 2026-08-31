import api from './api';

export const getDashboardOverview = async () => {
  const response = await api.get('/user/dashboard/overview');
  return response.data;
};

