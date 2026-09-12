import API from "./api";

export const getPlans = async (params) => {
  const response = await API.get("/user/plans", { params });
  return response.data;
};

export const getPlanById = async (id) => {
  const response = await API.get(`/user/plans/${id}`);
  return response.data;
};

export const investInPlan = async (planId, amount, autoRenewal = false, lockInPeriod = "None") => {
  const payload = typeof planId === "object"
    ? planId
    : { planId, amount, autoRenewal, lockInPeriod };
  const response = await API.post("/user/investments", payload);
  return response.data;
};

export const getMyInvestments = async (params) => {
  const response = await API.get("/user/investments", { params });
  return response.data;
};

export const getInvestmentById = async (id) => {
  const response = await API.get(`/user/investments/${id}`);
  return response.data;
};

export const toggleAutoRenewal = async (id) => {
  const response = await API.put(`/user/investments/${id}/toggle-auto-renewal`);
  return response.data;
};
