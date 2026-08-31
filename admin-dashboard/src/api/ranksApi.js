import API from "./api";

// Get all 10-tier rank milestones
export const getAllRanks = async () => {
  const response = await API.get("/admin/ranks");
  return response.data;
};

// Create a new rank
export const createRank = async (rankData) => {
  const response = await API.post("/admin/ranks", rankData);
  return response.data;
};

// Update rank milestone
export const updateRank = async (id, rankData) => {
  const response = await API.put(`/admin/ranks/${id}`, rankData);
  return response.data;
};

// Delete rank
export const deleteRank = async (id) => {
  const response = await API.delete(`/admin/ranks/${id}`);
  return response.data;
};

// Get global achievers leaderboard
export const getAchieversLeaderboard = async () => {
  const response = await API.get("/admin/ranks/leaderboard");
  return response.data;
};
