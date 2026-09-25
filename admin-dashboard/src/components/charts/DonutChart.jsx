import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RiPieChartLine } from 'react-icons/ri';

const DEFAULT_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#C8A200', '#6366F1'];

// Custom Tooltip with matching slice color theme
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const sliceColor = data.color || '#10B981';

    return (
      <div
        className="px-4 py-3 rounded-2xl shadow-2xl border font-poppins text-xs z-50 text-white transition-all transform scale-105"
        style={{
          backgroundColor: sliceColor,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          boxShadow: `0 12px 28px -4px ${sliceColor}88`,
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="font-extrabold text-[13px] tracking-tight">{data.name}</span>
          <span className="bg-black/25 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            Sector
          </span>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-white/20 font-mono">
          <span className="bg-white text-slate-900 px-2 py-0.5 rounded-md font-extrabold text-xs shadow-xs">
            {data.value}%
          </span>
          {data.amount && (
            <span className="font-bold text-white/95 text-xs tracking-wide">
              {data.amount}
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function DonutChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center font-poppins min-h-[220px]">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
          <RiPieChartLine size={24} />
        </div>
        <p className="text-xs font-bold text-slate-700">No Portfolio Allocations Yet</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
          Sector asset breakdown will automatically analyze and appear dynamically once investors activate portfolio plans.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 font-poppins">
      {/* ──────────────── SOLID PIE CHART ──────────────── */}
      <div className="relative w-[190px] h-[190px] flex-shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={86}
              paddingAngle={2}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => {
                const isHovered = activeIndex === index;
                return (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    opacity={activeIndex !== null && !isHovered ? 0.6 : 1}
                    style={{
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center center',
                      transition: 'all 0.2s ease-in-out',
                      outline: 'none',
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ──────────────── RIGHT-SIDE ALLOCATION BREAKDOWN ──────────────── */}
      <div className="flex-1 w-full space-y-2.5 text-xs">
        {chartData.map((entry, index) => {
          const itemColor = entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          const isHovered = activeIndex === index;

          return (
            <div
              key={index}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                isHovered
                  ? 'border-transparent shadow-md scale-[1.02]'
                  : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/60'
              }`}
              style={{
                backgroundColor: isHovered ? `${itemColor}15` : undefined,
                borderColor: isHovered ? itemColor : undefined,
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-2xs"
                  style={{ backgroundColor: itemColor }}
                />
                <span className={`text-xs font-semibold truncate ${isHovered ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                  {entry.name}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 font-poppins">
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">{entry.amount}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md border shadow-2xs font-mono text-white"
                  style={{ backgroundColor: itemColor, borderColor: itemColor }}
                >
                  {entry.value}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
