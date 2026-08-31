import api from './api';

export const createWithdrawal = async (withdrawalData) => {
  const response = await api.post('/user/withdrawals', withdrawalData);
  return response.data;
};

