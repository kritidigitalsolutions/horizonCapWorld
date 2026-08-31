import React from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalItems <= 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 px-4 py-3.5 bg-white border-t border-slate-100 font-poppins">
      {/* Entry Count Text */}
      <p className="text-xs text-slate-500 font-medium">
        Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
        <span className="font-bold text-slate-800">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> entries (20 per page)
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs"
        >
          <RiArrowLeftSLine size={16} />
          <span>Prev</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400 font-bold">
                  ...
                </span>
              );
            }

            const isCurrent = currentPage === p;
            return (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-gold-400 text-slate-900 shadow-gold ring-1 ring-gold-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 shadow-2xs"
        >
          <span>Next</span>
          <RiArrowRightSLine size={16} />
        </button>
      </div>
    </div>
  );
}
