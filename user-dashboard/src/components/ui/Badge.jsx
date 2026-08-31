import React from 'react';

export default function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
    info: 'badge-info',
    gold: 'badge-gold',
    default: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`badge ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
