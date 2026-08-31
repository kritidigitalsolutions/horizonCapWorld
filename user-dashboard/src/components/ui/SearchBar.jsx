import React from 'react';
import { RiSearchLine, RiCloseLine } from 'react-icons/ri';

export default function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChange,
  className = ''
}) {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
        <RiSearchLine size={18} />
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full !pl-10 pr-9 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none text-xs text-slate-700 placeholder-slate-400 font-poppins transition-all shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
          title="Clear search"
        >
          <RiCloseLine size={16} />
        </button>
      )}
    </div>
  );
}
