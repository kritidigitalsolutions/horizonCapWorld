import API from "./api";

// Get all news broadcasts & media releases
export const getAllArticles = async (params = {}) => {
  const response = await API.get("/admin/news", { params });
  return response.data;
};

// Get single article by ID
export const getArticleById = async (id) => {
  const response = await API.get(`/admin/news/${id}`);
  return response.data;
};

// Create / Publish new article
export const createArticle = async (articleData) => {
  const response = await API.post("/admin/news", articleData);
  return response.data;
};

// Update article
export const updateArticle = async (id, articleData) => {
  const response = await API.put(`/admin/news/${id}`, articleData);
  return response.data;
};

// Delete article
export const deleteArticle = async (id) => {
  const response = await API.delete(`/admin/news/${id}`);
  return response.data;
};
