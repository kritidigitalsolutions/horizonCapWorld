import React from 'react';

export default function TabsBar({ tabs, activeTab, onChange }) {
  return (
    <div className="tabs-bar">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key ? 'bg-gold-100 text-gold-600' : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
