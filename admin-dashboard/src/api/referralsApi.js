import API from "./api";

// Get referral tiers & commissions settings
export const getReferralSettings = async () => {
  const response = await API.get("/admin/referrals/settings");
  return response.data;
};

// Update referral tier setting by ID
export const updateReferralSetting = async (id, tierData) => {
  const response = await API.put(`/admin/referrals/settings/${id}`, tierData);
  return response.data;
};

// Get downline promoters network tree
export const getPromotersNetwork = async (params = {}) => {
  const response = await API.get("/admin/referrals/promoters", { params });
  return response.data;
};
