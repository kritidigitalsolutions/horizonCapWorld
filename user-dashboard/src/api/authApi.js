import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/user/auth/login', credentials);
  return response.data;
};

export const sendLogin2FAOtp = async (credentials) => {
  const response = await api.post('/user/auth/login-2fa-otp', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/user/auth/register', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/user/auth/me');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.put('/user/profile/password', passwordData);
  return response.data;
};

export const sendOtp = async (data = {}) => {
  const response = await api.post('/user/profile/send-otp', data);
  return response.data;
};

export const verifyOtp = async (otpData) => {
  const response = await api.post('/user/profile/verify-otp', otpData);
  return response.data;
};

export const toggle2FA = async (enabled) => {
  const response = await api.put('/user/profile/2fa', { enabled });
  return response.data;
};

// Forgot password - Send OTP to user email (Public)
export const forgotPasswordSendOtp = async (emailData) => {
  const response = await api.post('/user/auth/forgot-password/send-otp', emailData);
  return response.data;
};

// Forgot password - Verify OTP (Public)
export const forgotPasswordVerifyOtp = async (otpData) => {
  const response = await api.post('/user/auth/forgot-password/verify-otp', otpData);
  return response.data;
};

// Forgot password - Reset Password (Public)
export const forgotPasswordReset = async (resetData) => {
  const response = await api.post('/user/auth/forgot-password/reset', resetData);
  return response.data;
};
