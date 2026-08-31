import API from './api';

export const getDashboardKPIs = async () => {
  const response = await API.get('/admin/dashboard/kpis');
  return response.data;
};

export const getDashboardCharts = async () => {
  const response = await API.get('/admin/dashboard/charts');
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await API.get('/admin/dashboard/activities');
  return response.data;
};
