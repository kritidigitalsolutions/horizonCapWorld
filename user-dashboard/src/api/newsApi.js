import API from "./api";

export const getNews = async (params) => {
  const response = await API.get("/user/news", { params });
  return response.data;
};

export const getNewsArticle = async (id) => {
  const response = await API.get(`/user/news/${id}`);
  return response.data;
};
