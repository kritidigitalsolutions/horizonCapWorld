import React from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-800">{payload[0].value.toLocaleString()} users</p>
      </div>
    );
  }
  return null;
};

export default function BarChartComponent({ data, dataKey = 'users', color = '#FFD700' }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBar data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32} radius={[6, 6, 0, 0]}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 215, 0, 0.05)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} />
      </RechartsBar>
    </ResponsiveContainer>
  );
}
