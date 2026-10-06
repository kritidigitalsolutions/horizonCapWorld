import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RiCompass3Line, RiShieldCheckLine, RiFileTextLine, RiCheckboxCircleLine } from 'react-icons/ri';

export default function MissionStrip() {
  const reduceMotion = useReducedMotion();

  const trustPoints = [
    { icon: RiShieldCheckLine, label: "Direct Structure" },
    { icon: RiFileTextLine, label: "Defined Terms" },
    { icon: RiCheckboxCircleLine, label: "Disciplined Process" }
  ];

  return (
    <motion.div 
      className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#fffdf5] via-white to-[#fffcf0] border border-[#e5d89f]/60 shadow-[0_4px_20px_rgba(200,162,0,0.05)] relative overflow-hidden group"
      variants={{
        hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 20 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.6, ease: "easeOut" } }
      }}
    >
      {/* Left Gold Keyline Accent */}
      <div 
        aria-hidden="true" 
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#ffd700] via-[#c8a200] to-[#9a7b00]" 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pl-2 sm:pl-3">
        {/* Main Content */}
        <div className="flex items-start gap-4 sm:gap-4.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#fff9e6] to-[#fff0b3] flex items-center justify-center text-[#9a7b00] border border-[#e4d9ad]/70 shrink-0 shadow-xs mt-0.5">
            <RiCompass3Line size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7b00]">
                Institutional Clarity
              </span>
            </div>
            <h4 className="text-[#1f1f1f] font-display font-semibold text-base sm:text-lg mb-1 leading-snug">
              Built Around Clarity
            </h4>
            <p className="text-[#6b7280] text-xs sm:text-[13px] leading-relaxed max-w-xl">
              We focus on presenting investment opportunities, applicable terms and platform information through a clear and modern investor experience.
            </p>
          </div>
        </div>

        {/* Institutional Trust Badges */}
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-[#f0f0f0] md:pl-5">
          {trustPoints.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-[#1f1f1f] font-medium">
              <Icon className="text-[#9a7b00] text-sm shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
