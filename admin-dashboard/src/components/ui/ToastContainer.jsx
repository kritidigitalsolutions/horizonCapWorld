import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiAlertFill,
  RiInformationFill,
  RiCloseLine,
} from 'react-icons/ri';

const toastStyles = {
  success: {
    border: 'border-emerald-500/50 ring-1 ring-emerald-400/30',
    bg: 'bg-white shadow-2xl shadow-emerald-950/25',
    iconColor: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: RiCheckboxCircleFill,
  },
  error: {
    border: 'border-rose-500/50 ring-1 ring-rose-400/30',
    bg: 'bg-white shadow-2xl shadow-rose-950/25',
    iconColor: 'text-rose-600',
    barColor: 'bg-rose-500',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-700',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    Icon: RiCloseCircleFill,
  },
  warning: {
    border: 'border-amber-500/50 ring-1 ring-amber-400/30',
    bg: 'bg-white shadow-2xl shadow-amber-950/25',
    iconColor: 'text-amber-600',
    barColor: 'bg-amber-500',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    Icon: RiAlertFill,
  },
  info: {
    border: 'border-blue-500/50 ring-1 ring-blue-400/30',
    bg: 'bg-white shadow-2xl shadow-blue-950/25',
    iconColor: 'text-blue-600',
    barColor: 'bg-blue-500',
    titleColor: 'text-slate-900',
    textColor: 'text-slate-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    Icon: RiInformationFill,
  },
};

export default function ToastContainer({ toasts, onRemove }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !toasts || toasts.length === 0) return null;

  const content = (
    <div
      className="fixed top-5 right-5 z-[1000000] pointer-events-none flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] sm:w-96 font-poppins"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const style = toastStyles[item.type] || toastStyles.info;
        const IconComponent = style.Icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${style.border} ${style.bg} p-4 transition-all duration-300 transform flex items-start gap-3.5`}
            style={{
              animation: 'adminToastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Type Icon */}
            <div className={`mt-0.5 flex-shrink-0 text-xl ${style.iconColor}`}>
              <IconComponent size={22} />
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider font-display ${style.titleColor}`}>
                  {item.title}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${style.badge}`}>
                  {item.type.toUpperCase()}
                </span>
              </div>
              <p className={`mt-1 text-xs leading-relaxed font-medium ${style.textColor} break-words`}>
                {item.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <RiCloseLine size={18} />
            </button>

            {/* Countdown Progress Bar */}
            {item.duration > 0 && (
              <div
                className={`absolute bottom-0 left-0 h-1 ${style.barColor} opacity-70`}
                style={{
                  width: '100%',
                  animation: `adminToastProgress ${item.duration}ms linear forwards`,
                }}
              />
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes adminToastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes adminToastProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
