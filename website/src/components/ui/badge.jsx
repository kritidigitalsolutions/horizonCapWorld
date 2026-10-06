import * as React from "react";
import { cn } from "./card.jsx";

export function Badge({ className = "", variant = "default", ...props }) {
  const variants = {
    default: "bg-[#fff9e6] text-[#9a7b00] border-[#c8a200]/25",
    gold: "bg-gradient-to-r from-[#ffd700] to-[#c8a200] text-[#1f1f1f] font-semibold border-transparent shadow-xs",
    outline: "text-[#6b7280] border-[#e5e7eb] bg-white",
    secondary: "bg-[#f5f5f5] text-[#1f1f1f] border-transparent"
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#c8a200] focus:ring-offset-2",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    />
  );
}
