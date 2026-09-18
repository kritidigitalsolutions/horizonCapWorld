import API from "./api";

export const createWithdrawal = async (withdrawData) => {
  const response = await API.post("/user/withdrawals", withdrawData);
  return response.data;
};

export const getWithdrawalSettings = async () => {
  try {
    const response = await API.get("/user/withdrawals/settings");
    return response.data;
  } catch (error) {
    console.error("Error fetching withdrawal settings:", error);
    throw error;
  }
};

export const getWithdrawalVideo = async () => {
  try {
    const response = await API.get("/user/withdrawals/tutorial-video");
    return response.data;
  } catch (error) {
    console.error("Error fetching withdrawal video:", error);
    throw error;
  }
};

