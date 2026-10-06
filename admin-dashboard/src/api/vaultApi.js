import API from "./api";

// Fetch Smart Contract Vault On-Chain Balances, Protocol Data, & Transaction History
export const getVaultOverview = async () => {
  try {
    const response = await API.get("/admin/vault/overview");
    return response.data;
  } catch (error) {
    console.error("Error fetching vault overview:", error);
    throw error;
  }
};

// Execute On-Chain Sweep / Transfer of USDT from Vault to Admin Real Wallet
export const executeAdminSweep = async (payload) => {
  try {
    const response = await API.post("/admin/vault/sweep", payload);
    return response.data;
  } catch (error) {
    console.error("Error executing vault sweep:", error);
    throw error;
  }
};
