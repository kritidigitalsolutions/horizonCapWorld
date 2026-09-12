import API from "./api";

// Get referral tiers & commissions settings + toggles
export const getReferralSettings = async () => {
  const response = await API.get("/admin/referrals/settings");
  return response.data;
};

// Update global referral toggles (deposit commission, ROI share, system toggle)
export const updateReferralToggles = async (toggleData) => {
  const response = await API.put("/admin/referrals/toggles", toggleData);
  return response.data;
};

// Create new referral tier level (Level 6+)
export const createReferralTier = async (tierData) => {
  const response = await API.post("/admin/referrals/tiers", tierData);
  return response.data;
};

// Update referral tier setting by ID
export const updateReferralSetting = async (id, tierData) => {
  const response = await API.put(`/admin/referrals/settings/${id}`, tierData);
  return response.data;
};

// Bulk update all referral tier settings
export const bulkUpdateReferralSettings = async (tiers) => {
  const response = await API.put('/admin/referrals/bulk-settings', { tiers });
  return response.data;
};

// Delete a custom referral tier level
export const deleteReferralTier = async (id) => {
  const response = await API.delete(`/admin/referrals/tiers/${id}`);
  return response.data;
};

// Get downline promoters network tree
export const getPromotersNetwork = async (params = {}) => {
  const response = await API.get("/admin/referrals/promoters", { params });
  return response.data;
};
