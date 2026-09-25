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

// Mark all or selected users as seen
export const markUsersSeen = async (userIds = []) => {
  const response = await API.put("/admin/users/mark-seen", { userIds });
  return response.data;
};

// Shift user sponsor internally without notifying client
export const shiftUserSponsor = async (id, newSponsorId) => {
  const response = await API.put(`/admin/users/${id}/shift-sponsor`, { newSponsorId });
  return response.data;
};

// Admin reset client password
export const resetUserPassword = async (id, newPassword) => {
  const response = await API.put(`/admin/users/${id}/reset-password`, { newPassword });
  return response.data;
};

// Admin toggle user 2FA security
export const toggleUser2FAByAdmin = async (id, is2FAEnabled) => {
  const response = await API.put(`/admin/users/${id}/2fa`, { is2FAEnabled });
  return response.data;
};
