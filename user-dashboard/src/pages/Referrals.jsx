import React, { useState, useEffect } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiCoinsLine, RiCalculatorLine,
  RiCheckLine, RiEditLine, RiNodeTree, RiUserLine, RiShieldCheckLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiPercentLine, RiSearchLine,
  RiArrowRightLine, RiInformationLine, RiEyeLine, RiFileCopyLine,
  RiShareLine, RiQrCodeLine, RiUserAddLine, RiTimeLine
} from 'react-icons/ri';
import { useAuth, getReferralLink } from '../context/AuthContext';
import { getReferralOverview, getReferralCommissions, getReferralNetwork } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';

// Initial Referral Commissions matching Super Admin
const defaultCommissions = [
  { level: 'L1', name: 'Direct Referrals (Level 1)', investCommission: '5%', earningsCommission: '5%' },
  { level: 'L2', name: 'Sub-Referrals (Level 2)', investCommission: '4%', earningsCommission: '4%' },
  { level: 'L3', name: 'Network Tier (Level 3)', investCommission: '3%', earningsCommission: '3%' },
  { level: 'L4', name: 'Network Tier (Level 4)', investCommission: '2%', earningsCommission: '2%' },
  { level: 'L5', name: 'Global Depth (Level 5)', investCommission: '1%', earningsCommission: '1%' },
];

export default function Referrals() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tree'); // 'tree', 'plans'
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [overviewData, setOverviewData] = useState(null);
  const [networkList, setNetworkList] = useState([]);
  const [commissions, setCommissions] = useState(defaultCommissions);

  // Modals / Drawers
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDeposit, setCalcDeposit] = useState('10000');
  const [calcYield, setCalcYield] = useState('1500');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, commsRes, netRes] = await Promise.allSettled([
          getReferralOverview(),
          getReferralCommissions(),
          getReferralNetwork(),
        ]);

        if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
          setOverviewData(overviewRes.value.data);
        }

        if (commsRes.status === 'fulfilled' && commsRes.value?.success && Array.isArray(commsRes.value.tiers) && commsRes.value.tiers.length > 0) {
          setCommissions(commsRes.value.tiers);
        }

        if (netRes.status === 'fulfilled' && netRes.value?.success && Array.isArray(netRes.value.network)) {
          setNetworkList(netRes.value.network);
        } else {
          setNetworkList([]);
        }
      } catch (err) {
        console.warn('Error fetching referrals data:', err.message);
        setNetworkList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const referralLink = overviewData?.referralLink || user?.referralLink || getReferralLink(user?.customId || user?.id || '');

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentNetwork = networkList;
  const levelCounts = [1, 2, 3, 4, 5].map(l => currentNetwork.filter(r => r.level === l).length);

  const filteredNetwork = currentNetwork.filter(item => {
    const q = search.trim().toLowerCase();
    const matchTier = tierFilter === 'all' || item.level === Number(tierFilter);
    const matchSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q);
    return matchTier && matchSearch;
  });

  return (
    <div className="page-enter space-y-6 pb-8 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="My Referral Network"
        subtitle="Grow your multi-tier downline team and earn direct deposit & daily ROI profit-sharing commissions"
        badge="Affiliate Network"
        actions={
          <button
            type="button"
            onClick={() => setCalculatorOpen(true)}
            className="btn btn-outline-gold text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer bg-white"
          >
            <RiCalculatorLine size={18} className="text-gold-700" />
            <span>Commission Calculator</span>
          </button>
        }
      />

      {/* ──────────────── 4 ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Referral Commissions Paid"
          numericValue={Math.round(overviewData?.commissions?.totalEarned || 0)}
          prefix="$"
          decimals={0}
          change={overviewData?.commissions?.totalEarned > 0 ? "Instant Payout" : "Ready"}
          positive={true}
          icon="money"
        />
        <KPICard
          title="Direct Active Promoters"
          numericValue={overviewData?.directReferralsCount || networkList.filter(u => u.level === 1).length || 0}
          prefix=""
          decimals={0}
          change="Level 1 Direct"
          positive={true}
          icon="users"
        />
        <KPICard
          title="Multi-Tier Downlines"
          numericValue={overviewData?.totalTeamCount || networkList.length || 0}
          prefix=""
          decimals={0}
          change="5 Tiers Active"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Total Team Turnover Volume"
          numericValue={Math.round(overviewData?.totalTeamVolume || 0)}
          prefix="$"
          decimals={0}
          change="Team Volume"
          positive={true}
          icon="wallet"
        />
      </div>

      {/* ──────────────── UNIQUE AFFILIATE INVITE LINK CARD ──────────────── */}
      <div className="card-gold p-6 rounded-2xl shadow-gold border border-gold-300 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-400 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
              <RiUserAddLine size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950 font-poppins">
                Your Official Multi-Tier Affiliate Invite Link
              </h3>
              <p className="text-xs text-slate-600">
                Share this link to automatically place partners in your direct Level 1 downline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer bg-white shadow-2xs"
          >
            <RiQrCodeLine size={15} />
            <span>QR Code</span>
          </button>
        </div>

        {/* Dynamic Link Input with instant copy */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 rounded-xl bg-white border border-gold-200 text-xs sm:text-sm font-mono font-bold text-slate-800 truncate shadow-2xs select-all">
            {referralLink}
          </div>
          <button
            type="button"
            onClick={copyLink}
            className={`btn text-xs px-5 py-3 rounded-xl font-bold transition-all shadow-gold flex items-center gap-1.5 cursor-pointer ${
              copied ? 'bg-emerald-600 text-white' : 'btn-primary'
            }`}
          >
            {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-mono">
            Sponsor ID: <strong className="text-slate-700">{user?.customId || user?.id || '—'}</strong>
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <RiShieldCheckLine size={14} /> Active Downline Referral Structure (5-Levels)
          </span>
        </div>
      </div>

      {/* ──────────────── TAB SWITCHER ──────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tree'
              ? 'bg-gold-400 text-slate-950 shadow-gold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RiNodeTree size={16} />
          <span>Active Downline Partners ({networkList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'plans'
              ? 'bg-gold-400 text-slate-950 shadow-gold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RiPercentLine size={16} />
          <span>5-Tier Commission Structure</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: ACTIVE DOWNLINE PARTNERS DIRECTORY ──────────────── */}
      {activeTab === 'tree' && (
        <div className="space-y-5">
          {/* Level Distribution Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(lvl => (
              <button
                key={lvl}
                onClick={() => setTierFilter(tierFilter === String(lvl) ? 'all' : String(lvl))}
                className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                  tierFilter === String(lvl)
                    ? 'card-gold border-gold-400 ring-2 ring-gold-300 shadow-gold'
                    : 'card hover:border-slate-300'
                }`}
              >
                <p className="text-2xl font-black font-display text-slate-900 tabular-nums">
                  {levelCounts[lvl - 1]}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 font-poppins">
                  Level {lvl} Partners
                </p>
              </button>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <SearchBar
                placeholder="Search partner by name, ID (e.g. USR-001), or email..."
                value={search}
                onChange={setSearch}
                className="flex-1 w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTierFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tierFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Tiers ({networkList.length})
                </button>
              </div>
            </div>
          </div>

          {/* Downlines Table */}
          <div className="card overflow-hidden">
            <div className="table-container">
              <table className="data-table font-poppins">
                <thead>
                  <tr className="text-slate-400 font-medium text-xs tracking-wider">
                    <th className="font-medium text-slate-500">User Details</th>
                    <th className="font-medium text-slate-500">Email</th>
                    <th className="font-medium text-slate-500">Mobile Number</th>
                    <th className="font-medium text-slate-500">Referred By (Sponsor)</th>
                    <th className="font-medium text-slate-500">Tier Level</th>
                    <th className="font-medium text-slate-500">Total Invested</th>
                    <th className="font-medium text-slate-500">Commission Earned</th>
                    <th className="font-medium text-slate-500">Status</th>
                    <th className="text-right pr-6 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNetwork.map((u, i) => (
                    <tr
                      key={u.id || i}
                      className="animate-fade-in hover:bg-slate-50/70 transition-colors"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      {/* Promoter Details */}
                      <td>
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-gold-200/80 text-xs font-poppins">
                            {(u.name || 'P').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate leading-tight font-poppins">
                              {u.name || 'Investor'}
                            </p>
                            <p className="text-[11px] font-medium text-gold-600 font-poppins tracking-tight mt-0.5 font-mono">
                              {u.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-xs font-normal text-slate-500 font-poppins">
                        {u.email || '—'}
                      </td>

                      {/* Mobile Number */}
                      <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                        {u.phone || '—'}
                      </td>

                      {/* Referred By / Sponsor */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/80 text-slate-700 text-xs font-medium border border-gold-200/80 whitespace-nowrap font-poppins">
                          <RiGroupLine size={13} className="text-gold-600" />
                          {u.sponsor || 'Direct'}
                        </span>
                      </td>

                      {/* Tier Level */}
                      <td>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs font-poppins shadow-2xs">
                          Tier L{u.level}
                        </span>
                      </td>

                      {/* Total Invested */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50/90 text-amber-900 text-xs font-semibold border border-amber-300/80 whitespace-nowrap font-poppins font-mono">
                          <RiCoinsLine size={13} className="text-amber-600" />
                          ${Number(u.invested || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Total Commissions Paid */}
                      <td>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-extrabold border border-emerald-300 whitespace-nowrap font-poppins shadow-2xs font-mono">
                          <RiMoneyDollarCircleLine size={14} className="text-emerald-600" />
                          +${Number(u.totalComm || u.directComm || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge variant={u.status === 'Active' ? 'success' : 'danger'} size="sm">
                          {u.status || 'Active'}
                        </Badge>
                      </td>

                      {/* Action Button: Audit Tree */}
                      <td className="text-right pr-6">
                        <button
                          type="button"
                          onClick={() => setSelectedPartner(u)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins cursor-pointer"
                          title="View partner details"
                        >
                          <RiNodeTree size={14} className="text-slate-900" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredNetwork.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-16 px-4">
                        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                          <div className="w-14 h-14 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600 shadow-2xs">
                            <RiGroupLine size={28} />
                          </div>
                          <h4 className="text-base font-bold text-slate-800">
                            {search ? "No Matching Downline Partners" : "No Downline Partners Yet"}
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                            {search
                              ? `No partners found matching "${search}".`
                              : tierFilter !== 'all'
                              ? `No partners currently placed in Tier Level ${tierFilter}.`
                              : "Start building your team by sharing your official invite link. You'll earn up to 5 tiers of instant investment and profit-sharing bonuses."}
                          </p>
                          {!search && (
                            <button
                              type="button"
                              onClick={copyLink}
                              className="btn btn-primary text-xs px-4 py-2 rounded-xl font-bold shadow-gold flex items-center gap-1.5 cursor-pointer mt-2"
                            >
                              {copied ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
                              <span>{copied ? "Invite Link Copied!" : "Copy Your Invite Link"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: 5-TIER COMMISSION STRUCTURE & PLANS (MATCHING SUPER ADMIN) ──────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6 font-poppins">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Direct Investment Deposit Commission Box */}
            <div className="card p-5 space-y-4 border border-emerald-200/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiTeamLine size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-poppins">
                    1. Direct Investment Deposit Commission
                  </h4>
                  <p className="text-xs text-slate-400">
                    Commission credited instantly when downline members deposit into investment plans
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div
                    key={tier.level}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {networkList.filter(u => u.level === Number(tier.level.replace('L', ''))).length} Active Team Promoters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-xl shadow-2xs">
                        {tier.investCommission}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
                <strong>Formula:</strong> Deposit Commission = Downline Deposit Amount × Tier % (e.g. $10,000 Level 1 deposit = $500 direct commission)
              </div>
            </div>

            {/* 2. Earnings / ROI Commission Box */}
            <div className="card p-5 space-y-4 border border-amber-200/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <RiFlashlightLine size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-poppins">
                    2. Daily / Per-Second ROI Profit Share
                  </h4>
                  <p className="text-xs text-slate-400">
                    Continuous commission earned on the streaming interest profit earned by downlines
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {commissions.map((tier) => (
                  <div
                    key={tier.level}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-amber-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                        {tier.level}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {networkList.filter(u => u.level === Number(tier.level.replace('L', ''))).length} Active Team Promoters
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-gold-700 font-mono bg-gold-50 border border-gold-300 px-3.5 py-1 rounded-xl shadow-2xs">
                        {tier.earningsCommission}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Formula:</strong> ROI Profit Share = Downline Stream Interest ($/sec) × Tier % (e.g. $100 daily yield earned by L1 = $5/day ongoing)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── MODAL 1: INVITE QR CODE MODAL ──────────────── */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Your Referral Invite QR Code"
        subtitle="Scan with camera to register directly in your team"
        size="sm"
        footer={
          <button
            type="button"
            onClick={() => setIsQrModalOpen(false)}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 text-center py-2 font-poppins">
          <div className="w-56 h-56 bg-white p-3 border-2 border-gold-300 rounded-3xl mx-auto shadow-gold">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralLink)}`}
              alt="Referral QR Code"
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 font-poppins">{user?.name || 'Investor'}</p>
            <p className="text-[11px] font-mono text-slate-500 break-all select-all mt-1 px-3">
              {referralLink}
            </p>
          </div>
        </div>
      </Modal>

      {/* ──────────────── MODAL 2: DOWNLINE PARTNER AUDIT DRAWER (MATCHING SUPER ADMIN EXACTLY) ──────────────── */}
      <Modal
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        title="Partner Commission & Tree Audit"
        subtitle={selectedPartner ? `${selectedPartner.name} (${selectedPartner.id})` : ''}
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setSelectedPartner(null)}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Done
          </button>
        }
      >
        {selectedPartner && (
          <div className="space-y-5 font-poppins">
            {/* Top Member Card */}
            <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-gold-200">
                  {selectedPartner.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 leading-tight">
                    {selectedPartner.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPartner.email} • {selectedPartner.phone || '+91 98765 00000'}
                  </p>
                  <p className="text-[11px] font-mono text-gold-700 font-bold mt-0.5">
                    ID: {selectedPartner.id} • Joined: {selectedPartner.joined}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Network Placement
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold shadow-2xs mt-0.5">
                  <RiGroupLine size={13} />
                  Tier Level {selectedPartner.level}
                </span>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Team Turnover
                </span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ${(selectedPartner.teamVolume || selectedPartner.invested * 20).toLocaleString()}.00
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
                  Direct Comm. (5%)
                </span>
                <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                  +${(selectedPartner.directComm || selectedPartner.invested * 0.05).toLocaleString()}.00
                </span>
              </div>

              <div className="p-3.5 bg-gold-50 rounded-xl border border-gold-300 text-center">
                <span className="text-[10px] text-gold-900 uppercase font-bold tracking-wider block">
                  Total Commissions
                </span>
                <span className="text-base font-extrabold text-gold-900 font-mono mt-0.5 block">
                  +${(selectedPartner.totalComm || (selectedPartner.invested * 0.05 + 100)).toLocaleString()}.00
                </span>
              </div>
            </div>

            {/* 5-Tier Downline Network Hierarchy */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <RiNodeTree className="text-emerald-600" /> 5-Tier Downline Network Tree
              </h5>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 1</span>
                  <span className="font-bold text-emerald-600 block mt-0.5">
                    {selectedPartner.directRefs || 12} Users
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">5% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 2</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {Math.round((selectedPartner.directRefs || 12) * 1.5)} Users
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">4% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 3</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {Math.round((selectedPartner.directRefs || 12) * 2)} Users
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">3% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 4</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {Math.round((selectedPartner.directRefs || 12) * 1.2)} Users
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">2% Comm.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Tier 5</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {Math.round((selectedPartner.directRefs || 12) * 0.8)} Users
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">1% Comm.</span>
                </div>
              </div>
            </div>

            {/* Financial Portfolio Summary */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Active Portfolio Investment:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  ${selectedPartner.invested.toLocaleString()}.00
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Referred By (Sponsor):</span>
                <span className="font-bold text-slate-800">{selectedPartner.sponsor || 'HORIZON-USR-07'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Direct Deposit Commission Rate:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {commissions.find(c => c.level === `L${selectedPartner.level}` || c.level === String(selectedPartner.level))?.investCommission || '5%'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Auto-Credit Destination:</span>
                <span className="font-bold text-slate-900">Earning Wallet (Instant Withdrawal Available)</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── MODAL 3: COMMISSION CALCULATOR DRAWER ──────────────── */}
      <Modal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        title="Affiliate Commission Calculator"
        subtitle="Simulate direct deposit bonuses & multi-tier daily profit share"
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setCalculatorOpen(false)}
            className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Close Calculator
          </button>
        }
      >
        <div className="space-y-4 font-poppins text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Simulated Downline Investment Deposit ($)
            </label>
            <input
              type="number"
              value={calcDeposit}
              onChange={e => setCalcDeposit(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-gold-400"
            />
          </div>

          {/* Breakdown per tier */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Instant Deposit Commission Breakdown:
            </h5>
            {commissions.map(c => {
              const rate = parseFloat(c.investCommission) / 100;
              const bonus = (Number(calcDeposit) || 0) * rate;
              return (
                <div key={c.level} className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">Level {c.level} ({c.investCommission}):</span>
                  <span className="font-mono font-bold text-emerald-600">+${bonus.toFixed(2)} USD</span>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
