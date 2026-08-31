import API from "./api";

// Get all transactions with optional filters & pagination
export const getTransactions = async (params = {}) => {
  const response = await API.get("/admin/transactions", { params });
  return response.data;
};

// Get transaction by ID
export const getTransactionById = async (id) => {
  const response = await API.get(`/admin/transactions/${id}`);
  return response.data;
};

// Approve transaction
export const approveTransaction = async (id, data = {}) => {
  const response = await API.put(`/admin/transactions/${id}/approve`, data);
  return response.data;
};

// Reject transaction
export const rejectTransaction = async (id, data = {}) => {
  const response = await API.put(`/admin/transactions/${id}/reject`, data);
  return response.data;
};

// Delete transaction
export const deleteTransaction = async (id) => {
  const response = await API.delete(`/admin/transactions/${id}`);
  return response.data;
};

// Clear all transactions
export const clearAllTransactions = async () => {
  const response = await API.delete("/admin/transactions/clear/all");
  return response.data;
};
