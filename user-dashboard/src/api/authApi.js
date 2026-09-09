import API from "./api";

export const registerUser = async (userData) => {
  const response = await API.post("/user/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post("/user/auth/login", credentials);
  return response.data;
};

export const sendLogin2FAOtp = async (payload) => {
  const response = await API.post("/user/auth/login-2fa-otp", payload);
  return response.data;
};

export const forgotPasswordSendOtp = async (payload) => {
  const response = await API.post("/user/auth/forgot-password/send-otp", payload);
  return response.data;
};

export const forgotPasswordVerifyOtp = async (payload) => {
  const response = await API.post("/user/auth/forgot-password/verify-otp", payload);
  return response.data;
};

export const forgotPasswordReset = async (payload) => {
  const response = await API.post("/user/auth/forgot-password/reset", payload);
  return response.data;
};

export const getMe = async () => {
  const response = await API.get("/user/auth/me");
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/user/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await API.put("/user/profile", profileData);
  return response.data;
};

export const changePassword = async (passwords) => {
  const response = await API.put("/user/profile/password", passwords);
  return response.data;
};

export const sendOtp = async (payload) => {
  const response = await API.post("/user/profile/send-otp", payload);
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await API.post("/user/profile/verify-otp", payload);
  return response.data;
};

export const toggle2FA = async (status) => {
  const response = await API.put("/user/profile/2fa", status);
  return response.data;
};
