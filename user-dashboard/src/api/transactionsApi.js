import API from "./api";

export const getTransactions = async (params) => {
  const response = await API.get("/user/transactions", { params });
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await API.get(`/user/transactions/${id}`);
  return response.data;
};
