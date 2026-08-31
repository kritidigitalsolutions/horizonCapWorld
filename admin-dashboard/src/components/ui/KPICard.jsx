import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RiArrowUpSFill, RiArrowDownSFill, RiGroupLine, RiFundsLine, RiExchangeDollarLine, RiMoneyDollarCircleLine } from 'react-icons/ri';

const iconMap = {
  users: RiGroupLine,
  investment: RiFundsLine,
  withdrawal: RiExchangeDollarLine,
  revenue: RiMoneyDollarCircleLine,
};

const bgMap = {
  users: 'bg-blue-50 text-blue-500',
  investment: 'bg-emerald-50 text-emerald-500',
  withdrawal: 'bg-orange-50 text-orange-500',
  revenue: 'bg-purple-50 text-purple-500',
};

/* ───────────── Helper: Auto Magnitude Calculator ───────────── */
function getMagnitudeInfo(val, prefix = '') {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  if (!num || isNaN(num)) return null;

  if (num >= 1_000_000_000) {
    const formatted = (num / 1_000_000_000).toFixed(2).replace(/\.00$/, '');
    return {
      compact: `${prefix}${formatted}B`,
      unit: 'Billion',
      label: prefix === '$' ? `${formatted} Billion Dollars` : `${formatted} Billion`,
    };
  }
  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(2).replace(/\.00$/, '');
    return {
      compact: `${prefix}${formatted}M`,
      unit: 'Million',
      label: prefix === '$' ? `${formatted} Million Dollars` : `${formatted} Million`,
    };
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(2).replace(/\.00$/, '').replace(/\.0$/, '');
    return {
      compact: `${prefix}${formatted}K`,
      unit: 'Thousand',
      label: prefix === '$' ? `${formatted} Thousand Dollars` : `${formatted} Thousand`,
    };
  }
  return null;
}

/* ───────────── Single Rolling Digit (Slot Machine / Odometer Strip) ───────────── */
function RollingDigit({ digit, delay = 0, spins = 2 }) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const num = parseInt(digit, 10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Non-numeric characters (comma, dot, space)
  if (isNaN(num)) {
    return (
      <span
        className="inline-flex items-center justify-center font-extrabold text-gray-900 select-none"
        style={{
          width: '0.28em',
          margin: '0 0.5px',
          height: '1.25em',
          lineHeight: '1.25em',
        }}
      >
        {digit}
      </span>
    );
  }

  // Generate spinning strip: e.g. spins = 2 => [0..9, 0..9, 0..num]
  const stripNumbers = [];
  for (let s = 0; s < spins; s++) {
    for (let d = 0; d <= 9; d++) {
      stripNumbers.push(d);
    }
  }
  for (let d = 0; d <= num; d++) {
    stripNumbers.push(d);
  }

  // Target offset: each cell is exactly 1.25em high
  const targetIndex = stripNumbers.length - 1;
  const currentTranslate = hasAnimated ? `-${targetIndex * 1.25}em` : '0em';

  return (
    <span
      className="inline-flex overflow-hidden relative select-none tabular-nums"
      style={{
        height: '1.25em',
        lineHeight: '1.25em',
        verticalAlign: 'middle',
      }}
    >
      <span
        className="flex flex-col items-center"
        style={{
          transform: `translateY(${currentTranslate})`,
          transition: hasAnimated
            ? `transform 1.8s cubic-bezier(0.12, 0.8, 0.25, 1)`
            : 'none',
          willChange: 'transform',
        }}
      >
        {stripNumbers.map((n, idx) => (
          <span
            key={idx}
            className="flex items-center justify-center font-extrabold text-gray-900"
            style={{
              height: '1.25em',
              lineHeight: '1.25em',
              minWidth: '0.58em',
              padding: '0 0.5px',
            }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ───────────── Auto-Fit Text Hook ───────────── */
function useAutoFitText(maxFontSize = 28, minFontSize = 15) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  const calculateFit = useCallback(() => {
    if (!containerRef.current || !textRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    if (containerWidth <= 0) return;

    let size = maxFontSize;
    textRef.current.style.fontSize = `${size}px`;

    // Gradually reduce font size if text overflows container width
    while (textRef.current.scrollWidth > containerWidth && size > minFontSize) {
      size -= 0.5;
      textRef.current.style.fontSize = `${size}px`;
    }

    setFontSize(size);
  }, [maxFontSize, minFontSize]);

  useEffect(() => {
    calculateFit();
    const handleResize = () => calculateFit();
    window.addEventListener('resize', handleResize);

    let observer;
    if (containerRef.current && window.ResizeObserver) {
      observer = new ResizeObserver(() => calculateFit());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [calculateFit]);

  return { containerRef, textRef, fontSize };
}

/* ───────────── KPI Card Component ───────────── */
export default function KPICard({
  title,
  numericValue,
  prefix = '',
  suffix = '',
  change,
  positive,
  icon,
  delay = 0,
}) {
  const Icon = iconMap[icon] || RiMoneyDollarCircleLine;
  const bgClass = bgMap[icon] || 'bg-gold-50 text-gold-500';
  const { containerRef, textRef, fontSize } = useAutoFitText(28, 15);

  // Auto-calculated magnitude info (Thousand, Million, Billion)
  const magnitude = getMagnitudeInfo(numericValue, prefix);

  // Format full number with commas (e.g. 82,450,000 or 12,845)
  const formattedNumber = typeof numericValue === 'number'
    ? numericValue.toLocaleString('en-US')
    : String(numericValue);

  const chars = formattedNumber.split('');

  return (
    <div
      className="card card-gold p-5 sm:p-6 animate-slide-up flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top: Icon + Percentage Change */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${bgClass} shadow-xs`}>
          <Icon size={22} />
        </div>
        <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-semibold px-2.5 py-1 rounded-full ${
          positive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' : 'text-red-700 bg-red-50 border border-red-200/50'
        }`}>
          {positive ? <RiArrowUpSFill size={16} /> : <RiArrowDownSFill size={16} />}
          {change}
        </div>
      </div>

      {/* Middle: Title */}
      <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">{title}</p>

      {/* Main Rolling Value with Auto-Fit */}
      <div ref={containerRef} className="w-full overflow-hidden my-1">
        <div
          ref={textRef}
          className="font-bold text-gray-900 font-display whitespace-nowrap flex items-center tracking-tight"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.25 }}
        >
          {/* Prefix (e.g. $) */}
          {prefix && (
            <span
              className="text-gold-500 font-extrabold mr-0.5 select-none"
              style={{ fontSize: '0.85em' }}
            >
              {prefix}
            </span>
          )}

          {/* Rolling Digits with Commas */}
          <span className="inline-flex items-center font-extrabold text-gray-900 tracking-tight">
            {chars.map((char, index) => (
              <RollingDigit
                key={`${index}-${char}`}
                digit={char}
                delay={delay + 120 + index * 55}
                spins={char === ',' ? 0 : 2}
              />
            ))}
          </span>

          {/* Custom suffix if explicitly provided */}
          {suffix && (
            <span
              className="text-gray-400 font-semibold tracking-wider uppercase ml-1.5 select-none"
              style={{ fontSize: '0.4em' }}
            >
              {suffix}
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Auto-Calculated Magnitude (Million / Billion / Thousand) */}
      {magnitude && (
        <div className="flex items-center gap-2 pt-2.5 mt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 text-[11px] font-bold border border-gold-200/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
            {magnitude.compact}
          </span>
          <span className="text-[11px] text-gray-400 font-medium truncate">
            {magnitude.label}
          </span>
        </div>
      )}
    </div>
  );
}
