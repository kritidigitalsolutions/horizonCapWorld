import API from "./api";

// Get all plans
export const getAllPlans = async () => {
  const response = await API.get("/admin/plans");
  return response.data;
};

// Get plan by ID
export const getPlanById = async (id) => {
  const response = await API.get(`/admin/plans/${id}`);
  return response.data;
};
export const getPlansById = getPlanById;

// Create new plan
export const createPlan = async (planData) => {
  const response = await API.post("/admin/plans", planData);
  return response.data;
};

// Update plan
export const updatePlan = async (id, planData) => {
  const response = await API.put(`/admin/plans/${id}`, planData);
  return response.data;
};
export const updatePlans = updatePlan;

// Delete plan
export const deletePlan = async (id) => {
  const response = await API.delete(`/admin/plans/${id}`);
  return response.data;
};