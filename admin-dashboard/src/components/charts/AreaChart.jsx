import React from 'react';
import { AreaChart as RechartsArea, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-800 font-poppins">${payload[0].value.toLocaleString()}k</p>
      </div>
    );
  }
  return null;
};

export default function AreaChartComponent({ data, dataKey = 'amount', color = '#FFD700' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsArea data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill="url(#goldGradient)" dot={false} activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }} />
      </RechartsArea>
    </ResponsiveContainer>
  );
}
