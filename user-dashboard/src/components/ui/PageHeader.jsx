import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 ${className}`}>
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Luxury Gold Vertical Accent Pillar */}
        <div className="w-1.5 h-9 rounded-full bg-gradient-to-b from-gold-400 via-amber-500 to-gold-600 shadow-gold flex-shrink-0 mt-0.5" />

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-700 text-[10px] font-extrabold uppercase tracking-wider border border-gold-200/80 shadow-2xs font-poppins">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 font-poppins mt-1 leading-normal">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Side Action Buttons */}
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
