import API from './api';

// Get paginated admin notifications with filters
export const getAdminNotifications = async (params = {}) => {
  const response = await API.get('/admin/notifications', { params });
  return response.data;
};

// Mark single notification as read
export const markAdminNotificationRead = async (id) => {
  const response = await API.put(`/admin/notifications/${id}/read`);
  return response.data;
};

// Mark all admin notifications as read
export const markAllAdminNotificationsRead = async () => {
  const response = await API.put('/admin/notifications/mark-all-read');
  return response.data;
};

// Delete single admin notification
export const deleteAdminNotification = async (id) => {
  const response = await API.delete(`/admin/notifications/${id}`);
  return response.data;
};

// Clear all admin notifications
export const clearAllAdminNotifications = async () => {
  const response = await API.delete('/admin/notifications/clear-all');
  return response.data;
};

// Push Custom Broadcast / Direct Notification
export const sendPushNotification = async (data) => {
  const response = await API.post('/admin/notifications/push', data);
  return response.data;
};
