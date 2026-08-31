import API from "./api";

// Get all users with filters & pagination
export const getAllUsers = async (params = {}) => {
  const response = await API.get("/admin/users", { params });
  return response.data;
};

// Get single user by ID
export const getUserById = async (id) => {
  const response = await API.get(`/admin/users/${id}`);
  return response.data;
};

// Update user status (Active / Banned / Suspended)
export const updateUserStatus = async (id, status) => {
  const response = await API.put(`/admin/users/${id}/status`, { status });
  return response.data;
};

// Adjust user wallet balance (credit / debit)
export const adjustUserWallet = async (id, adjustmentData) => {
  const response = await API.put(`/admin/users/${id}/adjust-wallet`, adjustmentData);
  return response.data;
};

// Delete user
export const deleteUser = async (id) => {
  const response = await API.delete(`/admin/users/${id}`);
  return response.data;
};
