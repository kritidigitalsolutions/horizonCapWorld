import api from './api';

export const getDepositGateways = async () => {
  const response = await api.get('/user/deposits/gateways');
  return response.data;
};

export const getDepositVideo = async () => {
  const response = await api.get('/user/deposits/tutorial-video');
  return response.data;
};

export const createDeposit = async (depositData) => {
  const response = await api.post('/user/deposits', depositData);
  return response.data;
};

