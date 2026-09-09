import API from "./api";

export const getDashboardOverview = async () => {
  const response = await API.get("/user/dashboard/overview");
  return response.data;
};
