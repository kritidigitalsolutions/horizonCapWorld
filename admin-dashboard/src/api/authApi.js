import API from "./api";

// Admin login
export const loginAdmin = async (credentials) => {
  const response = await API.post("/admin/auth/login", credentials);
  return response.data;
};

// Get admin profile
export const getAdminProfile = async () => {
  const response = await API.get("/admin/auth/profile");
  return response.data;
};

// Update admin profile
export const updateAdminProfile = async (profileData) => {
  const response = await API.put("/admin/auth/profile", profileData);
  return response.data;
};

// Send OTP to Admin for email or password change (Protected)
export const sendAdminOtp = async (data = {}) => {
  const response = await API.post("/admin/auth/send-otp", data);
  return response.data;
};

// Verify Admin OTP (Protected)
export const verifyAdminOtp = async (otpData) => {
  const response = await API.post("/admin/auth/verify-otp", otpData);
  return response.data;
};

// Change Admin Email (Protected)
export const changeAdminEmail = async (emailData) => {
  const response = await API.put("/admin/auth/change-email", emailData);
  return response.data;
};

// Change admin password (Protected)
export const changeAdminPassword = async (passwordData) => {
  const response = await API.put("/admin/auth/change-password", passwordData);
  return response.data;
};

// Forgot password - Send OTP to Admin Email (Public)
export const forgotPasswordSendOtp = async (emailData) => {
  const response = await API.post("/admin/auth/forgot-password/send-otp", emailData);
  return response.data;
};

// Forgot password - Verify OTP (Public)
export const forgotPasswordVerifyOtp = async (otpData) => {
  const response = await API.post("/admin/auth/forgot-password/verify-otp", otpData);
  return response.data;
};

// Forgot password - Reset Password (Public)
export const forgotPasswordReset = async (resetData) => {
  const response = await API.post("/admin/auth/forgot-password/reset", resetData);
  return response.data;
};

// Get admin platform settings
export const getAdminSettings = async () => {
  const response = await API.get("/admin/auth/settings");
  return response.data;
};

// Update admin platform settings
export const updateAdminSettings = async (settingsData) => {
  const response = await API.put("/admin/auth/settings", settingsData);
  return response.data;
};
