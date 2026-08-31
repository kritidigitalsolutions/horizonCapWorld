import React from 'react';

export function SkeletonCard() {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton w-10 h-10 rounded-xl"></div>
        <div className="skeleton w-16 h-5 rounded-full"></div>
      </div>
      <div className="skeleton skeleton-title w-24 mb-2"></div>
      <div className="skeleton w-32 h-8 rounded-lg"></div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-6">
      <div className="skeleton skeleton-title mb-4"></div>
      <div className="skeleton skeleton-chart"></div>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton skeleton-text w-full"></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-6 flex items-center justify-between">
        <div className="skeleton w-40 h-6 rounded-lg"></div>
        <div className="skeleton w-24 h-9 rounded-lg"></div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><div className="skeleton w-20 h-4 rounded"></div></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonArticleCard() {
  return (
    <div className="card p-6">
      <div className="skeleton w-full h-40 rounded-xl mb-4"></div>
      <div className="skeleton skeleton-title mb-2"></div>
      <div className="skeleton skeleton-text w-full mb-1"></div>
      <div className="skeleton skeleton-text w-3/4 mb-4"></div>
      <div className="flex gap-2">
        <div className="skeleton w-16 h-6 rounded-full"></div>
        <div className="skeleton w-20 h-6 rounded-full"></div>
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 1, ...props }) {
  const components = {
    card: SkeletonCard,
    chart: SkeletonChart,
    table: SkeletonTable,
    article: SkeletonArticleCard,
  };

  const Component = components[type] || SkeletonCard;

  if (type === 'table') {
    return <Component {...props} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...props} />
      ))}
    </>
  );
}
