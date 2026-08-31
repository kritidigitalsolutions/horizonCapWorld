import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/user/auth/login', credentials);
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

export const sendOtp = async () => {
  const response = await api.post('/user/profile/send-otp');
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

