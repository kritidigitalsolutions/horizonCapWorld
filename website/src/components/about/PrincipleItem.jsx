import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function PrincipleItem({ number, label, description }) {
  const reduceMotion = useReducedMotion();

  const descriptions = {
    "01": "Structured capital allocation aligned with real-world infrastructure.",
    "02": "Modern investor interface engineered for clear terms and participation.",
    "03": "Strategic exposure concentrated in renewable energy and physical bullion."
  };

  const descText = description || descriptions[number] || "Disciplined institutional approach to long-term value.";

  return (
    <motion.div 
      className="p-4 sm:p-5 rounded-xl bg-white border border-[#ededeb] shadow-xs hover:border-[#c8a200]/60 hover:shadow-[0_8px_20px_rgba(200,162,0,0.07)] transition-all duration-300 group flex flex-col justify-between"
      variants={{
        hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 },
        visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.5, ease: "easeOut" } }
      }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-display font-bold text-xs tracking-wider text-[#9a7b00] bg-[#fff9e6] border border-[#c8a200]/30 px-2.5 py-0.5 rounded-md tabular-nums">
            {number}
          </span>
          <div 
            aria-hidden="true" 
            className="w-8 h-[1px] bg-[#f0f0f0] group-hover:bg-[#c8a200]/50 transition-colors" 
          />
        </div>

        <h5 className="font-display font-semibold text-sm sm:text-[15px] text-[#1f1f1f] mb-1.5 leading-snug group-hover:text-[#9a7b00] transition-colors">
          {label}
        </h5>

        <p className="text-[#6b7280] text-xs leading-relaxed">
          {descText}
        </p>
      </div>

      <div 
        aria-hidden="true" 
        className="w-full h-[2px] bg-transparent group-hover:bg-gradient-to-r group-hover:from-[#ffd700] group-hover:to-[#c8a200] mt-3 rounded-full transition-all duration-300" 
      />
    </motion.div>
  );
}
