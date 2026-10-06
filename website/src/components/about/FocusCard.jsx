import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function FocusCard({ 
  id, 
  icon: Icon, 
  title, 
  description, 
  isActive, 
  onClick 
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button 
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-white rounded-xl p-4 transition-all duration-300 group flex items-start gap-3.5 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a200] ${
        isActive 
          ? 'border-2 border-[#c8a200] shadow-[0_8px_24px_rgba(200,162,0,0.12)] ring-1 ring-[#c8a200]/20' 
          : 'border border-[#ededeb] shadow-xs hover:border-[#c8a200]/50 hover:shadow-[0_4px_16px_rgba(200,162,0,0.06)]'
      }`}
      variants={{
        hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 15 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" } }
      }}
    >
      {/* Active Top Keyline */}
      {isActive && (
        <div 
          aria-hidden="true" 
          className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#ffd700] via-[#c8a200] to-[#ffd700]"
        />
      )}

      {/* Compact 40px Icon Box */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fff9e6] to-[#fff0b3] flex items-center justify-center text-[#9a7b00] border border-[#e4d9ad]/60 shrink-0 group-hover:-translate-y-0.5 transition-transform duration-300 shadow-xs mt-0.5">
        <Icon size={20} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h4 className="text-[#1f1f1f] font-display font-semibold text-sm sm:text-[15px] leading-snug group-hover:text-[#9a7b00] transition-colors truncate">
            {title}
          </h4>
          {isActive ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#fff9e6] text-[#9a7b00] border border-[#c8a200]/30">
              <span className="w-1 h-1 rounded-full bg-[#c8a200] animate-pulse" />
              Active
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-medium text-[#9ca3af]">
              {id === 'energy' ? '01' : '02'}
            </span>
          )}
        </div>

        <p className="text-[#6b7280] text-xs leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </motion.button>
  );
}
