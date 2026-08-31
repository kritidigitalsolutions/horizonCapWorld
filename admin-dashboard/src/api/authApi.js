import API from "./api";

// Admin login
export const loginAdmin = async (credentials) => {
  const response = await API.post("/admin/auth/login", credentials);
  return response.data;
};

// Get admin profile
export const getAdminProfile = async () => {
  const response = await API.get("/admin/auth/profile");
  return response.data;
};

// Update admin profile
export const updateAdminProfile = async (profileData) => {
  const response = await API.put("/admin/auth/profile", profileData);
  return response.data;
};

// Change admin password
export const changeAdminPassword = async (passwordData) => {
  const response = await API.put("/admin/auth/change-password", passwordData);
  return response.data;
};

// Get admin platform settings
export const getAdminSettings = async () => {
  const response = await API.get("/admin/auth/settings");
  return response.data;
};

// Update admin platform settings
export const updateAdminSettings = async (settingsData) => {
  const response = await API.put("/admin/auth/settings", settingsData);
  return response.data;
};
