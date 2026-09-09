import API from "./api";

export const getDepositGateways = async (params) => {
  const response = await API.get("/user/deposits/gateways", { params });
  return response.data;
};

export const getDepositVideo = async () => {
  const response = await API.get("/user/deposits/tutorial-video");
  return response.data;
};

export const createDeposit = async (depositData) => {
  const response = await API.post("/user/deposits", depositData);
  return response.data;
};
