import api from './api';

export const getReferralOverview = async () => {
  const response = await api.get('/user/referrals/overview');
  return response.data;
};

export const getReferralCommissions = async () => {
  const response = await api.get('/user/referrals/commissions');
  return response.data;
};

export const getReferralNetwork = async () => {
  const response = await api.get('/user/referrals/network');
  return response.data;
};

