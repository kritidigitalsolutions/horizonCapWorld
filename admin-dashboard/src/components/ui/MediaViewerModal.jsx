import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RiCloseLine, RiDownloadLine, RiZoomInLine, RiZoomOutLine,
  RiFilePdfLine, RiImageLine, RiVideoLine,
  RiFileExcelLine, RiFileWordLine, RiShieldCheckLine,
  RiPrinterLine, RiPlayFill, RiPauseFill, RiVolumeUpLine, RiVolumeMuteLine
} from 'react-icons/ri';

/**
 * Utility to identify attachment media category
 */
export function getMediaType(fileName = '') {
  const lower = fileName.toLowerCase();
  if (lower.match(/\.(png|jpe?g|webp|svg|gif)$/i) || lower.includes('receipt') || lower.includes('confirmation') || lower.includes('scan') || lower.includes('slip')) {
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) return 'video';
    return 'image';
  }
  if (lower.match(/\.(pdf)$/i)) return 'pdf';
  if (lower.match(/\.(mp4|mov|webm|avi)$/i) || lower.includes('video') || lower.includes('audit')) return 'video';
  if (lower.match(/\.(xlsx?|csv)$/i)) return 'spreadsheet';
  if (lower.match(/\.(docx?|txt)$/i)) return 'document';
  return 'document';
}

export default function MediaViewerModal({
  isOpen,
  onClose,
  file, // { fileName, senderName, time, url, fileSize, fileType }
}) {
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pdfPage, setPdfPage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(35);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset zoom & page when file changes
  useEffect(() => {
    setZoom(1);
    setPdfPage(1);
    setIsPlaying(true);
  }, [file]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !file) return null;

  const fileName = typeof file === 'string' ? file : file.fileName || 'Attachment';
  const senderName = file.senderName || 'Client / Investor';
  const time = file.time || 'Today';
  const mediaType = file.fileType || getMediaType(fileName);
  const fileSize = file.fileSize || '1.8 MB';

  const handleDownload = () => {
    alert(`Dispatched verified download for: ${fileName}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 select-none font-poppins">
      {/* Dark Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Container */}
      <div
        className="relative z-10 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gold-400/20 text-gold-400 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
              {mediaType === 'image' && <RiImageLine size={20} />}
              {mediaType === 'pdf' && <RiFilePdfLine size={20} className="text-red-400" />}
              {mediaType === 'video' && <RiVideoLine size={20} className="text-blue-400" />}
              {mediaType === 'spreadsheet' && <RiFileExcelLine size={20} className="text-emerald-400" />}
              {mediaType === 'document' && <RiFileWordLine size={20} className="text-indigo-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{fileName}</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-gold-400 border border-gold-400/30 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap">
                  {mediaType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                Dispatched by <strong className="text-slate-200">{senderName}</strong> • {time} • {fileSize}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {/* Quick Action Buttons */}
            {mediaType === 'image' && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <RiZoomOutLine size={16} />
                </button>
                <span className="text-[11px] text-slate-400 font-mono px-1">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <RiZoomInLine size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
              title="Close Viewer (Esc)"
            >
              <RiCloseLine size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Content Canvas Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 flex items-center justify-center min-h-[340px]">
          {/* ──────────────── 1. IMAGE LIGHTBOX PREVIEW ──────────────── */}
          {mediaType === 'image' && (
            <div className="relative max-w-full max-h-full flex flex-col items-center justify-center transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                {/* Authentic Simulated Receipt / Screenshot Card */}
                <div className="w-full max-w-[560px] bg-slate-900 rounded-xl p-5 border border-gold-400/30 text-white space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gold-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                        HC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100">Blockchain Network Verification</p>
                        <p className="text-[10px] text-slate-400 font-mono">TRON TRC-20 Mainnet Node #49</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Confirmed
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Transaction Amount</span>
                      <p className="text-base font-bold text-gold-400 mt-0.5">$50,000.00 USDT</p>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Block Timestamp</span>
                      <p className="text-xs font-medium text-slate-200 mt-1">{time}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 break-all">
                    <p className="text-[10px] text-slate-500 uppercase font-sans font-bold">Transaction Hash (TXID):</p>
                    <p className="text-gold-400">8fa9280ce149021a89047bf820948ac0192837bc901a4e578c91d8e02fa31b4</p>
                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-900">
                      <span>Status: 32 / 32 Confirmations</span>
                      <span>Gas Fee: 13.5 TRX (~$1.82)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 2. PDF VIEWER CANVAS ──────────────── */}
          {mediaType === 'pdf' && (
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 animate-fade-in">
              {/* PDF Document Header Bar */}
              <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">Horizon Institutional Custody PDF Reader</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pdfPage === 1}
                    onClick={() => setPdfPage(1)}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-[11px] font-mono font-medium">Page {pdfPage} of 2</span>
                  <button
                    type="button"
                    disabled={pdfPage === 2}
                    onClick={() => setPdfPage(2)}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* Rendered PDF Page Content */}
              <div className="p-6 sm:p-8 space-y-5 bg-white text-slate-800 min-h-[380px]">
                {/* Official Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-gold-400 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight font-display">
                      HORIZON OF CAPITAL ESCROW & CUSTODY TRUST
                    </h2>
                    <p className="text-[11px] text-slate-500">Official Institutional Settlement Advice & Allocation Certificate</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-300">
                      CERT-REF #89201
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
                  </div>
                </div>

                {pdfPage === 1 ? (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Beneficiary / Account</span>
                        <p className="font-bold text-slate-800 mt-0.5">{senderName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Horizon User ID: HORIZON-USR-01</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Allocated Asset / Vault</span>
                        <p className="font-bold text-gold-700 mt-0.5">Physical Gold Bullion / Platinum Vault</p>
                        <p className="text-[11px] text-slate-500">Freeport Vault, Singapore</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gold-50/50 rounded-xl border border-gold-200/80 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-800">Custodial Deposit Ledger Entry:</p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        We hereby confirm the successful receipt and vault custody settlement of certified capital for the above account. The capital has been tokenized with real-time per-second ROI streaming enabled on the Horizon master ledger.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <RiShieldCheckLine size={14} /> Cryptographically Signed & Verified
                      </span>
                      <span className="font-mono text-[10px]">SHA-256: 4e91...89fa</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs text-slate-600">
                    <h4 className="font-bold text-slate-800 text-sm">Terms of Vault Custody & Payout Schedule</h4>
                    <p className="leading-relaxed text-xs">
                      1. All precious metal holdings are backed 1:1 by audited physical bars stored in certified LBMA-accredited vault facilities.
                    </p>
                    <p className="leading-relaxed text-xs">
                      2. Daily settlement yields or live per-second streaming ROI are deposited directly into the investor's liquid digital wallet.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-4 text-[11px]">
                      <p className="font-semibold text-slate-700">Digital Custody Node: Frankfurt Primary Server</p>
                      <p className="text-slate-400">Signature Stamp: e-IDAS Compliant Qualified Electronic Seal</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ──────────────── 3. VIDEO PLAYER CANVAS ──────────────── */}
          {mediaType === 'video' && (
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col animate-fade-in">
              {/* Simulated Video Canvas */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center group overflow-hidden">
                {/* Background Video Visual Simulation */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 opacity-90" />

                <div className="relative z-10 text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-gold-400/90 text-slate-950 flex items-center justify-center mx-auto shadow-gold cursor-pointer hover:scale-105 active:scale-95 transition-all"
                       onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <RiPauseFill size={32} /> : <RiPlayFill size={32} className="ml-1" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">{fileName}</h4>
                    <p className="text-xs text-slate-400">Physical Vault Custody Inspection Recording • 1080p 60fps</p>
                  </div>
                </div>

                {/* Video Badges */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>RECORDING AUDIT</span>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-gold-400">
                  00:45 HD
                </div>
              </div>

              {/* Video Controls Bar */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                {/* Progress Scrubber */}
                <div className="relative w-full h-1.5 bg-slate-800 rounded-full cursor-pointer overflow-hidden"
                     onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const pos = ((e.clientX - rect.left) / rect.width) * 100;
                       setVideoProgress(Math.round(pos));
                     }}>
                  <div className="h-full bg-gradient-to-r from-gold-400 to-amber-500" style={{ width: `${videoProgress}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="text-white hover:text-gold-400 transition-colors"
                    >
                      {isPlaying ? <RiPauseFill size={16} /> : <RiPlayFill size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-gold-400 transition-colors"
                    >
                      {isMuted ? <RiVolumeMuteLine size={16} /> : <RiVolumeUpLine size={16} />}
                    </button>
                    <span className="text-[11px] font-mono">00:16 / 00:45</span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">Verified Stream • Node #12</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── 4. DOCUMENT / SPREADSHEET VIEWER CANVAS ──────────────── */}
          {(mediaType === 'document' || mediaType === 'spreadsheet') && (
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-5 text-slate-800 animate-fade-in">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                  mediaType === 'spreadsheet' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}>
                  {mediaType === 'spreadsheet' ? <RiFileExcelLine size={28} /> : <RiFileWordLine size={28} />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-slate-900 truncate">{fileName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mediaType === 'spreadsheet' ? 'Microsoft Excel Spreadsheet (.xlsx)' : 'Microsoft Word Document (.docx)'} • {fileSize}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <p className="font-semibold text-slate-700">Digital Custody Inspection Metadata:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Sender:</span>
                      <strong className="text-slate-700">{senderName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Date Uploaded:</span>
                      <span className="font-medium text-slate-700">{time}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Anti-Virus Check:</span>
                      <span className="text-emerald-600 font-semibold">Passed (Clean)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Node Hash:</span>
                      <span className="font-mono text-slate-500">8f9b...a34e</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-medium">Direct spreadsheet/document viewing is fully formatted. Click Download to inspect formulas and raw ledgers.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <RiShieldCheckLine size={16} className="text-emerald-600 flex-shrink-0" />
            <span className="truncate">Encrypted SSL File Transfer • 256-bit AES</span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {mediaType === 'pdf' && (
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <RiPrinterLine size={15} />
                <span>Print</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-400 hover:bg-gold-500 text-slate-900 rounded-xl text-xs font-bold shadow-gold transition-all active:scale-95 cursor-pointer"
            >
              <RiDownloadLine size={16} />
              <span>Download File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
