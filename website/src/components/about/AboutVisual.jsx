import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { RiLineChartLine } from 'react-icons/ri';
import { Card } from '../ui/card.jsx';

const slides = [
  {
    id: "energy",
    src: "/assets/solar-renewable-investment.jpg",
    alt: "Large-scale renewable energy infrastructure representing Horizon Cap Worlds investment focus",
    label: "Renewable Energy"
  },
  {
    id: "metals",
    src: "/assets/gold-vault-investment.jpg",
    alt: "Institutional precious metals infrastructure representing Horizon Cap Worlds investment focus",
    label: "Precious Metals"
  }
];

export default function AboutVisual({ activeSector = 'energy', onSectorChange }) {
  const reduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(
    slides.findIndex(s => s.id === activeSector) >= 0 
      ? slides.findIndex(s => s.id === activeSector) 
      : 0
  );
  const [direction, setDirection] = useState(1);

  // Sync with external activeSector (e.g. when user clicks Focus cards)
  useEffect(() => {
    const targetIndex = slides.findIndex(s => s.id === activeSector);
    if (targetIndex >= 0 && targetIndex !== currentIndex) {
      setDirection(targetIndex > currentIndex ? 1 : -1);
      setCurrentIndex(targetIndex);
    }
  }, [activeSector]);

  // Infinite Auto-Slide: Smoothly advances on its own in an endless loop
  useEffect(() => {
    if (reduceMotion) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => {
        const next = (prev + 1) % slides.length;
        if (onSectorChange) onSectorChange(slides[next].id);
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [reduceMotion, onSectorChange]);

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      const next = (prev + newDirection + slides.length) % slides.length;
      if (onSectorChange) onSectorChange(slides[next].id);
      return next;
    });
  };

  const slideVariants = {
    enter: (dir) => ({
      x: reduceMotion ? 0 : dir > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.02
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 220, damping: 26 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 }
      }
    },
    exit: (dir) => ({
      x: reduceMotion ? 0 : dir < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: "spring", stiffness: 220, damping: 26 },
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 }
      }
    })
  };

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full">
      {/* Decorative Gold Accent Vertical Line on Desktop */}
      <div 
        aria-hidden="true" 
        className="hidden lg:block absolute -left-5 xl:-left-6 top-0 bottom-0 w-[1px] bg-[#f0f0f0]"
      >
        <motion.div 
          className="w-full bg-gradient-to-b from-[#ffd700] via-[#c8a200] to-[#9a7b00]"
          initial={{ height: 0 }}
          whileInView={{ height: '100%' }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Main Image Slider Container (Infinite Auto-Slide + Mouse Swipeable) */}
      <div className="relative w-full select-none cursor-grab active:cursor-grabbing">
        <div className="w-full h-[320px] sm:h-[400px] lg:h-[480px] xl:h-[500px] overflow-hidden rounded-[24px] border border-[#ededeb] shadow-card bg-[#f5f5f5] relative">
          
          {/* Animated Infinite Slides with Mouse Drag / Swipe */}
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentSlide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x;
                if (offset.x < -50 || swipe < -1000) {
                  paginate(1);
                } else if (offset.x > 50 || swipe > 1000) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img 
                src={currentSlide.src} 
                alt={currentSlide.alt}
                draggable={false}
                className="w-full h-full object-cover object-center pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Floating Information Card */}
        <Card className="absolute bottom-3 right-3 lg:bottom-4 lg:-right-4 xl:-right-5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#ededeb] shadow-[0_10px_28px_rgba(0,0,0,0.08)] p-3.5 sm:p-4 flex items-start gap-3 max-w-[260px] sm:max-w-[280px] z-20 pointer-events-auto">
          <div className="w-9 h-9 rounded-full bg-[#fff9e6] flex items-center justify-center text-[#c8a200] shrink-0 border border-[#c8a200]/25 shadow-xs">
            <RiLineChartLine size={18} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-[#1f1f1f] font-semibold text-xs sm:text-[13px] leading-tight mb-1">
              Future-Focused Investment
            </h4>
            <p className="text-[#6b7280] text-[11px] leading-relaxed">
              Opportunities across evolving real-world sectors.
            </p>
            <div 
              aria-hidden="true" 
              className="w-7 h-[2px] bg-gradient-to-r from-[#ffd700] to-[#c8a200] mt-2 rounded-full" 
            />
          </div>
        </Card>

      </div>
    </div>
  );
}
