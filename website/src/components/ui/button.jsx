import * as React from "react";
import { cn } from "./card.jsx";

export const Button = React.forwardRef(
  ({ className = "", variant = "primary", size = "md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a200] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary: "bg-gradient-to-r from-[#ffd700] to-[#c8a200] text-[#1f1f1f] font-semibold shadow-[0_4px_16px_rgba(200,162,0,0.18)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(200,162,0,0.28)] rounded-[10px]",
      secondary: "bg-white text-[#1f1f1f] border border-[#e5e7eb] hover:bg-[#fff9e6] hover:border-[#c8a200] rounded-[10px]",
      outline: "border border-[#c8a200]/40 text-[#9a7b00] hover:bg-[#fff9e6] rounded-[10px]",
      ghost: "text-[#1f1f1f] hover:bg-[#fff9e6] hover:text-[#9a7b00] rounded-[10px]"
    };

    const sizes = {
      sm: "h-9 px-3.5 text-xs gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2.5"
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
