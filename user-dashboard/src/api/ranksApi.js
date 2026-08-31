import api from './api';

export const getRankLadder = async () => {
  const response = await api.get('/user/ranks/ladder');
  return response.data;
};

export const getMyRankStatus = async () => {
  const response = await api.get('/user/ranks/my-rank');
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await api.get('/user/ranks/leaderboard');
  return response.data;
};

