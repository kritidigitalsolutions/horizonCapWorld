import API from "./api";

export const getRankLadder = async () => {
  const response = await API.get("/user/ranks/ladder");
  return response.data;
};

export const getMyRankStatus = async () => {
  const response = await API.get("/user/ranks/my-rank");
  return response.data;
};

export const getLeaderboard = async () => {
  const response = await API.get("/user/ranks/leaderboard");
  return response.data;
};
