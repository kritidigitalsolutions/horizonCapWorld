import api from './api';

export const getNews = async (params = {}) => {
  const response = await api.get('/user/news', { params });
  return response.data;
};

export const getNewsArticle = async (id) => {
  const response = await api.get(`/user/news/${id}`);
  return response.data;
};

