import API from "./api";

export const getReferralOverview = async (forceRefresh = false) => {
  const response = await API.get(`/user/referrals/overview${forceRefresh ? "?refresh=true" : ""}`);
  return response.data;
};

export const getReferralCommissions = async (forceRefresh = false) => {
  const response = await API.get(`/user/referrals/commissions${forceRefresh ? "?refresh=true" : ""}`);
  return response.data;
};

export const getReferralNetwork = async (forceRefresh = false) => {
  const response = await API.get(`/user/referrals/network${forceRefresh ? "?refresh=true" : ""}`);
  return response.data;
};
