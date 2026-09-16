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

// Global helper to trigger toast via window event if outside react context
export const triggerGlobalToast = (message, type = 'success', options = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('horizon-toast', {
        detail: { message, type, ...options },
      })
    );
  }
};

// Helper to set a flash toast that survives page reload
export const setFlashToast = (message, type = 'success', options = {}) => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        'horizon_flash_toast',
        JSON.stringify({ message, type, ...options })
      );
    } catch (e) {
      console.warn('Failed to save flash toast to sessionStorage:', e);
    }
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', options = {}) => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const duration = options.duration !== undefined ? options.duration : 4500;
      const title = options.title || (
        type === 'success' ? 'Success' :
        type === 'error' ? 'Error' :
        type === 'warning' ? 'Notice' : 'Information'
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

  // Check for any flash toast on initial mount (e.g. after page refresh)
  useEffect(() => {
    try {
      const storedFlash = sessionStorage.getItem('horizon_flash_toast');
      if (storedFlash) {
        sessionStorage.removeItem('horizon_flash_toast');
        const parsed = JSON.parse(storedFlash);
        if (parsed?.message) {
          // Slight delay to allow UI to settle after reload
          setTimeout(() => {
            showToast(parsed.message, parsed.type || 'success', {
              title: parsed.title,
              duration: parsed.duration || 5000,
            });
          }, 300);
        }
      }
    } catch (e) {
      console.warn('Error reading flash toast:', e);
    }
  }, [showToast]);

  // Listen for global custom event 'horizon-toast'
  useEffect(() => {
    const handleGlobalToast = (e) => {
      if (e.detail?.message) {
        showToast(e.detail.message, e.detail.type || 'success', e.detail);
      }
    };

    window.addEventListener('horizon-toast', handleGlobalToast);
    return () => window.removeEventListener('horizon-toast', handleGlobalToast);
  }, [showToast]);

  const toast = {
    success: (msg, title, options) => showToast(msg, 'success', { title, ...options }),
    error: (msg, title, options) => showToast(msg, 'error', { title, ...options }),
    warning: (msg, title, options) => showToast(msg, 'warning', { title, ...options }),
    info: (msg, title, options) => showToast(msg, 'info', { title, ...options }),
    flash: (msg, type = 'success', options) => setFlashToast(msg, type, options),
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};
