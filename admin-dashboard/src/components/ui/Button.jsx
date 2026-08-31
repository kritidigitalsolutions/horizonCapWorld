import React from 'react';

export default function Button({ variant = 'primary', size = 'md', children, className = '', icon, ...props }) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
}
