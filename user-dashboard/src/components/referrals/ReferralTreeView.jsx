import React, { useState, useMemo } from 'react';
import {
  RiNodeTree, RiUser3Line, RiCoinsLine, RiMoneyDollarCircleLine,
  RiArrowDownSLine, RiArrowRightSLine, RiSearchLine, RiSparklingLine,
  RiAwardLine, RiGroupLine, RiShareLine, RiFileCopyLine, RiCheckLine,
  RiInformationLine, RiEyeLine
} from 'react-icons/ri';

// Color & styling tokens per tier level (L0 to L10)
const TIER_THEMES = {
  0: { badge: 'bg-gradient-to-r from-amber-400 to-gold-500 text-slate-950 border-amber-300', ring: 'ring-gold-400', border: 'border-gold-300' },
  1: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', ring: 'ring-emerald-400', border: 'border-emerald-200' },
  2: { badge: 'bg-blue-100 text-blue-800 border-blue-300', ring: 'ring-blue-400', border: 'border-blue-200' },
  3: { badge: 'bg-purple-100 text-purple-800 border-purple-300', ring: 'ring-purple-400', border: 'border-purple-200' },
  4: { badge: 'bg-indigo-100 text-indigo-800 border-indigo-300', ring: 'ring-indigo-400', border: 'border-indigo-200' },
  5: { badge: 'bg-cyan-100 text-cyan-800 border-cyan-300', ring: 'ring-cyan-400', border: 'border-cyan-200' },
  6: { badge: 'bg-teal-100 text-teal-800 border-teal-300', ring: 'ring-teal-400', border: 'border-teal-200' },
  7: { badge: 'bg-amber-100 text-amber-900 border-amber-300', ring: 'ring-amber-400', border: 'border-amber-200' },
  8: { badge: 'bg-orange-100 text-orange-900 border-orange-300', ring: 'ring-orange-400', border: 'border-orange-200' },
  9: { badge: 'bg-rose-100 text-rose-900 border-rose-300', ring: 'ring-rose-400', border: 'border-rose-200' },
  10: { badge: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300', ring: 'ring-fuchsia-400', border: 'border-fuchsia-200' },
};

function TreeNodeCard({ node, isRoot = false, onSelectPartner, search, tierFilter, expandedIds, toggleExpand }) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const theme = TIER_THEMES[node.level] || TIER_THEMES[1];

  const matchesSearch = search && (
    (node.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (node.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (node.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const matchesTier = tierFilter === 'all' || String(node.level) === String(tierFilter);
  const isHighlighted = matchesSearch || (tierFilter !== 'all' && matchesTier);

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Card */}
      <div
        className={`p-4 sm:p-4.5 rounded-2xl transition-all duration-200 w-[270px] sm:w-[310px] relative z-10 shadow-sm ${
          isRoot
            ? 'bg-gradient-to-br from-gold-50/95 via-white to-amber-50/90 border-2 border-gold-400 shadow-gold'
            : isHighlighted
            ? 'bg-amber-50/95 border-2 border-gold-400 shadow-md ring-2 ring-gold-300'
            : 'bg-white border border-slate-200 hover:border-gold-300 hover:shadow-md'
        }`}
      >
        {/* Top Header: Tier Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs ${theme.badge}`}
          >
            {isRoot ? (
              <>
                <RiAwardLine size={12} /> Level 0 (Self)
              </>
            ) : (
              <>
                Tier L{node.level} • {node.commissionRate || 0}%
              </>
            )}
          </span>

          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (node.status === 'Active' || (isRoot && (Number(node.invested || 0) > 0 || Number(node.depositWallet || 0) > 0)))
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              (node.status === 'Active' || (isRoot && (Number(node.invested || 0) > 0 || Number(node.depositWallet || 0) > 0)))
                ? 'bg-emerald-500'
                : 'bg-red-500'
            }`} />
            {node.status || 'Inactive'}
          </span>
        </div>

        {/* User Identity Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-shrink-0">
            {node.avatar ? (
              <img
                src={node.avatar}
                alt={node.name}
                className={`w-11 h-11 rounded-full object-cover border-2 ${isRoot ? 'border-gold-400' : 'border-slate-200'}`}
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                  isRoot
                    ? 'bg-gradient-to-tr from-amber-400 to-gold-500 text-slate-950 font-black'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {(node.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            {isRoot && (
              <span className="absolute -top-1.5 -right-1 text-xs" title="Root Sponsor">
                👑
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-extrabold text-slate-900 truncate font-poppins">
              {node.name || 'Investor'}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <span className="text-gold-700 font-bold">{node.id}</span>
              {node.rank && <span className="text-[10px] text-slate-400">· {node.rank}</span>}
            </div>
          </div>
        </div>

        {/* Financial Metrics Row */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 pb-1 border-t border-slate-100 text-xs">
          {/* Personal Volume */}
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Personal Volume</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 truncate block">
              ${Number(node.invested || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Commission Earned from this user */}
          <div className={`p-2 rounded-xl border ${
            isRoot
              ? 'bg-gold-50/80 border-gold-200 text-gold-900'
              : Number(node.commissionEarned || 0) > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-100 text-slate-500'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              {isRoot ? 'Total Comm.' : 'Your Comm.'}
            </span>
            <span className={`text-xs sm:text-sm font-bold font-mono truncate block ${
              Number(node.commissionEarned || node.totalEarnedCommission || 0) > 0
                ? 'text-emerald-700 font-extrabold'
                : 'text-slate-600'
            }`}>
              +${Number(isRoot ? node.totalEarnedCommission || 0 : node.commissionEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Node Footer: Sponsor & Action / Expand */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
          <span className="text-slate-400 font-mono truncate max-w-[150px]">
            Sponsor: <strong className="text-slate-700">{node.sponsorId || 'HORIZON-HQ'}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            {onSelectPartner && !isRoot && (
              <button
                type="button"
                onClick={() => onSelectPartner(node)}
                className="text-gold-700 hover:text-gold-900 font-bold p-1 rounded hover:bg-gold-50 cursor-pointer"
                title="Audit Partner Details"
              >
                <RiEyeLine size={15} />
              </button>
            )}

            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer text-[10px] ${
                  isExpanded
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-gold-400 text-slate-950 hover:bg-gold-500 shadow-2xs'
                }`}
              >
                {isExpanded ? <RiArrowDownSLine size={14} /> : <RiArrowRightSLine size={14} />}
                <span>{node.children.length} {node.children.length === 1 ? 'Downline' : 'Downlines'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vertical connector to children */}
      {hasChildren && isExpanded && (
        <div className="w-0.5 h-6 bg-gold-300 my-0 flex-shrink-0" />
      )}

      {/* Children Container with Branch Connectors */}
      {hasChildren && isExpanded && (
        <div className="relative pt-2">
          {/* Horizontal connector bar across sibling nodes if more than 1 child */}
          {node.children.length > 1 && (
            <div
              className="absolute top-2 h-0.5 bg-gold-300"
              style={{
                left: 'calc(155px)',
                right: 'calc(155px)',
              }}
            />
          )}

          <div className="flex items-start gap-4 sm:gap-6 justify-center flex-wrap sm:flex-nowrap">
            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                {/* Vertical stem from horizontal bar down to child */}
                <div className="w-0.5 h-4 bg-gold-300 mb-0 flex-shrink-0" />
                <TreeNodeCard
                  node={child}
                  isRoot={false}
                  onSelectPartner={onSelectPartner}
                  search={search}
                  tierFilter={tierFilter}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferralTreeView({ tree, onSelectPartner, referralLink = '' }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Collect all node IDs for Expand/Collapse All
  const allNodeIds = useMemo(() => {
    const ids = new Set();
    const traverse = (n) => {
      if (!n) return;
      if (Array.isArray(n.children) && n.children.length > 0) {
        ids.add(n.id);
        n.children.forEach(traverse);
      }
    };
    if (tree) traverse(tree);
    return ids;
  }, [tree]);

  // Default: start with all branches expanded so user sees the tree immediately
  const [expandedIds, setExpandedIds] = useState(() => new Set(allNodeIds));

  // Toggle single node
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(allNodeIds));
  const collapseAll = () => setExpandedIds(new Set());

  // Aggregate stats across the whole tree
  const treeStats = useMemo(() => {
    let totalMembers = 0;
    let totalVolume = 0;
    let totalComm = 0;
    let maxLevel = 0;

    const traverse = (n) => {
      if (!n) return;
      if (n.level > 0) {
        totalMembers += 1;
        totalVolume += Number(n.invested || 0);
        totalComm += Number(n.commissionEarned || 0);
        if (n.level > maxLevel) maxLevel = n.level;
      }
      if (Array.isArray(n.children)) {
        n.children.forEach(traverse);
      }
    };

    if (tree) traverse(tree);
    return { totalMembers, totalVolume, totalComm, maxLevel };
  }, [tree]);

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!tree) {
    return (
      <div className="p-8 text-center space-y-3 font-poppins">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const hasNoDownlines = !tree.children || tree.children.length === 0;

  return (
    <div className="space-y-6 font-poppins">
      {/* ──────────────── QUICK SUMMARY METRICS BAR ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Downlines</span>
          <div className="flex items-center gap-2 mt-0.5">
            <RiGroupLine className="text-gold-600" size={18} />
            <span className="text-lg sm:text-2xl font-black font-display text-slate-950 tabular-nums">
              {treeStats.totalMembers}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
            {tree.children?.length || 0} Direct (L1)
          </span>
        </div>

        <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Downline Volume</span>
          <div className="flex items-center gap-2 mt-0.5">
            <RiCoinsLine className="text-amber-600" size={18} />
            <span className="text-lg sm:text-2xl font-black font-display text-slate-950 tabular-nums font-mono">
              ${treeStats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Excludes Self</span>
        </div>

        <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commission Earned</span>
          <div className="flex items-center gap-2 mt-0.5">
            <RiMoneyDollarCircleLine className="text-emerald-600" size={18} />
            <span className="text-lg sm:text-2xl font-black font-display text-emerald-700 tabular-nums font-mono">
              +${treeStats.totalComm.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5 block">Multi-tier verified</span>
        </div>

        <div className="card p-3.5 sm:p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tree Depth</span>
          <div className="flex items-center gap-2 mt-0.5">
            <RiNodeTree className="text-blue-600" size={18} />
            <span className="text-lg sm:text-2xl font-black font-display text-slate-950 tabular-nums">
              {treeStats.maxLevel} <span className="text-xs text-slate-400 font-normal">/ 10 Tiers</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Indexed Level 0-10</span>
        </div>
      </div>

      {/* ──────────────── SEARCH & TREE CONTROLS TOOLBAR ──────────────── */}
      <div className="card p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search node by name, ID or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-gold-400 outline-none font-poppins transition-all"
          />
        </div>

        {/* Filter by Tier & Expand/Collapse All */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Tiers (Level 0 – 10)</option>
            <option value="1">Tier 1 (Direct)</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
            <option value="5">Tier 5</option>
            <option value="6">Tier 6</option>
            <option value="7">Tier 7</option>
            <option value="8">Tier 8</option>
            <option value="9">Tier 9</option>
            <option value="10">Tier 10 (Ambassador)</option>
          </select>

          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          >
            Expand All
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* ──────────────── THE VISUAL HIERARCHICAL TREE CANVAS ──────────────── */}
      <div className="card p-6 sm:p-8 rounded-3xl border border-gold-200/90 bg-gradient-to-b from-slate-50/50 via-white to-gold-50/20 shadow-sm overflow-x-auto min-h-[450px]">
        {hasNoDownlines ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4 max-w-md mx-auto text-center">
            {/* Show Level 0 Root Node */}
            <TreeNodeCard
              node={tree}
              isRoot={true}
              onSelectPartner={onSelectPartner}
              search={search}
              tierFilter={tierFilter}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />

            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs space-y-2 mt-4">
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-slate-900">
                <RiSparklingLine className="text-gold-500" size={18} />
                <span>Your Referral Tree Starts Here!</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                You haven't referred any partners yet. Invite partners using your referral link to build your multi-tier genealogy tree up to <strong>Tier 10</strong> and earn instant deposit & daily profit share commissions.
              </p>
              {referralLink && (
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold shadow-gold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center min-w-max py-4">
            <TreeNodeCard
              node={tree}
              isRoot={true}
              onSelectPartner={onSelectPartner}
              search={search}
              tierFilter={tierFilter}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          </div>
        )}
      </div>
    </div>
  );
}
