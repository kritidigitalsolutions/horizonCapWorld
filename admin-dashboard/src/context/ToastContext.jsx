import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Global trigger outside of react tree
export const triggerAdminToast = (message, type = 'success', options = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('horizon-admin-toast', {
        detail: { message, type, ...options },
      })
    );
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', options = {}) => {
      const id = options.id || `admin-toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = options.duration !== undefined ? options.duration : 4200;
      const title = options.title || (
        type === 'success' ? 'Updated Successfully' :
        type === 'error' ? 'Action Failed' :
        type === 'warning' ? 'Attention' : 'System Notice'
      );

      const newToast = {
        id,
        message,
        type,
        title,
        duration,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  // Listen for global custom event
  useEffect(() => {
    const handleGlobalToast = (e) => {
      if (e.detail?.message) {
        showToast(e.detail.message, e.detail.type || 'success', e.detail);
      }
    };

    window.addEventListener('horizon-admin-toast', handleGlobalToast);
    return () => window.removeEventListener('horizon-admin-toast', handleGlobalToast);
  }, [showToast]);

  const toast = {
    success: (msg, title, options) => showToast(msg, 'success', { title, ...options }),
    error: (msg, title, options) => showToast(msg, 'error', { title, ...options }),
    warning: (msg, title, options) => showToast(msg, 'warning', { title, ...options }),
    info: (msg, title, options) => showToast(msg, 'info', { title, ...options }),
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};
