import api from './api';

// Get paginated notifications for current user with category/read filters
export const getUserNotifications = async (params = {}) => {
  const response = await api.get('/user/notifications', { params });
  return response.data;
};

// Get quick unread count for topbar badge
export const getUnreadCount = async () => {
  const response = await api.get('/user/notifications/unread-count');
  return response.data;
};

// Mark single notification as read
export const markAsRead = async (id) => {
  const response = await api.put(`/user/notifications/${id}/read`);
  return response.data;
};

// Mark all user notifications as read
export const markAllAsRead = async () => {
  const response = await api.put('/user/notifications/mark-all-read');
  return response.data;
};

// Delete single notification
export const deleteNotification = async (id) => {
  const response = await api.delete(`/user/notifications/${id}`);
  return response.data;
};

// Clear all notifications
export const clearAllNotifications = async () => {
  const response = await api.delete('/user/notifications/clear-all');
  return response.data;
};
