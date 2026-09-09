import API from "./api";

export const createWithdrawal = async (withdrawData) => {
  const response = await API.post("/user/withdrawals", withdrawData);
  return response.data;
};
