import React from 'react';

export default function Badge({ variant = 'default', children, className = '', size = 'sm' }) {
  const baseClasses = "inline-flex items-center gap-1 font-semibold rounded-full uppercase tracking-wider select-none font-poppins transition-colors leading-none";

  const sizeClasses = {
    xs: "text-[9px] px-2 py-0.5",
    sm: "text-[10px] sm:text-[11px] px-2.5 py-1",
    md: "text-xs px-3 py-1.5",
  };

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs',
    danger: 'bg-red-50 text-red-700 border border-red-200/90 shadow-2xs',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/90 shadow-2xs',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/90 shadow-2xs',
    gold: 'bg-gold-50 text-gold-800 border border-gold-300/90 shadow-2xs',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs',
    default: 'bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size] || sizeClasses.sm} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
