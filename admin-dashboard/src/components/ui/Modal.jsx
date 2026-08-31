import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RiCloseLine } from 'react-icons/ri';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when drawer is open + ESC key close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] flex justify-end pointer-events-none">
      {/* Full Viewport Light Smoky Yellow Blur Overlay */}
      <div
        className="modal-overlay pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-Side Slide-Over Drawer attached directly to Viewport */}
      <div
        className={`drawer-container ${sizeClass[size] || sizeClass.md} pointer-events-auto`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-gold-400 to-gold-600"></div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 font-display leading-tight">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gold-50 transition-all text-gray-400 hover:text-gold-600 active:scale-95"
            aria-label="Close drawer"
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-body">
          {children}
        </div>

        {/* Drawer Bottom Footer (Taskbar Safe) */}
        {footer && (
          <div className="drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
