import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  RiTeamLine, RiCoinsLine, RiCalculatorLine,
  RiCheckLine, RiNodeTree, RiShieldCheckLine,
  RiGroupLine, RiMoneyDollarCircleLine, RiPercentLine,
  RiFileCopyLine, RiQrCodeLine, RiUserAddLine,
  RiLockLine, RiAlertLine, RiArrowRightLine, RiArrowDownLine
} from 'react-icons/ri';
import { useAuth, getReferralLink } from '../context/AuthContext';
import { getReferralOverview, getReferralCommissions, getReferralNetwork } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import ReferralTreeView from '../components/referrals/ReferralTreeView';

const defaultTiers = [
  { level: 'L0', levelNumber: 0, name: 'Self Investment (Level 0)', depositAmount: 1000, profitAmount: 8, percentage: 0, eligibleConditions: 'NA', groupVolumeMin: 0, directClientsMin: 0, investCommission: '0%', earningsCommission: '0%' },
  { level: 'L1', levelNumber: 1, name: 'Direct Referrals (Level 1)', depositAmount: 0, profitAmount: 0, percentage: 10, eligibleConditions: 'No Condition', groupVolumeMin: 0, directClientsMin: 0, investCommission: '5%', earningsCommission: '10%' },
  { level: 'L2', levelNumber: 2, name: 'Sub-Referrals (Level 2)', depositAmount: 0, profitAmount: 0, percentage: 10, eligibleConditions: 'Group Volume Min. 500$, 2 Direct Clients', groupVolumeMin: 500, directClientsMin: 2, investCommission: '4%', earningsCommission: '10%' },
  { level: 'L3', levelNumber: 3, name: 'Network Tier (Level 3)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 1500$, 3 Direct Clients', groupVolumeMin: 1500, directClientsMin: 3, investCommission: '3%', earningsCommission: '5%' },
  { level: 'L4', levelNumber: 4, name: 'Network Tier (Level 4)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 3000$, 4 Direct Clients', groupVolumeMin: 3000, directClientsMin: 4, investCommission: '2%', earningsCommission: '5%' },
  { level: 'L5', levelNumber: 5, name: 'Global Depth (Level 5)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 4000$, 5 Direct Clients', groupVolumeMin: 4000, directClientsMin: 5, investCommission: '1.5%', earningsCommission: '5%' },
  { level: 'L6', levelNumber: 6, name: 'Expansion Tier (Level 6)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 5,000$, 10 Direct Clients', groupVolumeMin: 5000, directClientsMin: 10, investCommission: '1%', earningsCommission: '5%' },
  { level: 'L7', levelNumber: 7, name: 'Regional Depth (Level 7)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 10,000$, 11 Direct Clients', groupVolumeMin: 10000, directClientsMin: 11, investCommission: '0.8%', earningsCommission: '5%' },
  { level: 'L8', levelNumber: 8, name: 'Executive Tier (Level 8)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 15,000$, 11 Direct Clients', groupVolumeMin: 15000, directClientsMin: 11, investCommission: '0.6%', earningsCommission: '5%' },
  { level: 'L9', levelNumber: 9, name: 'Leadership Tier (Level 9)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min. 20,000$, 11 Direct Clients', groupVolumeMin: 20000, directClientsMin: 11, investCommission: '0.5%', earningsCommission: '5%' },
  { level: 'L10', levelNumber: 10, name: 'Ambassador Tier (Level 10)', depositAmount: 0, profitAmount: 0, percentage: 5, eligibleConditions: 'Group Volume Min.25,000$, 11 Direct Clients', groupVolumeMin: 25000, directClientsMin: 11, investCommission: '0.4%', earningsCommission: '5%' },
];

export default function Referrals() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'genealogy';
  const [activeTab, setActiveTab] = useState(initialTab); // 'genealogy', 'tree', 'plans'
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [overviewData, setOverviewData] = useState(null);
  const [networkList, setNetworkList] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [commissions, setCommissions] = useState(defaultTiers);
  const [toggles, setToggles] = useState({
    referralDepositCommissionEnabled: true,
    referralRoiShareEnabled: true,
    referralSystemEnabled: true,
  });

  // Modals / Drawers
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcDeposit, setCalcDeposit] = useState('10000');
  const [calcYield, setCalcYield] = useState('1500');

  const fetchData = async () => {
    try {
      const [overviewRes, commsRes, netRes] = await Promise.allSettled([
        getReferralOverview(),
        getReferralCommissions(),
        getReferralNetwork(),
      ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
        setOverviewData(overviewRes.value.data);
        if (overviewRes.value.data.toggles) {
          setToggles(overviewRes.value.data.toggles);
        }
      }

      if (commsRes.status === 'fulfilled' && commsRes.value?.success) {
        if (Array.isArray(commsRes.value.tiers) && commsRes.value.tiers.length > 0) {
          setCommissions(commsRes.value.tiers);
        }
        if (commsRes.value.toggles) {
          setToggles(commsRes.value.toggles);
        }
      }

      if (netRes.status === 'fulfilled' && netRes.value?.success) {
        if (Array.isArray(netRes.value.network)) {
          setNetworkList(netRes.value.network);
        }
        if (netRes.value.tree) {
          setTreeData(netRes.value.tree);
        }
      } else {
        setNetworkList([]);
        setTreeData(null);
      }
    } catch (err) {
      console.warn('Error fetching referrals data:', err.message);
      setNetworkList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail) {
        setToggles(prev => ({ ...prev, ...e.detail }));
      }
      const saved = localStorage.getItem('horizon_referral_toggles');
      if (saved) {
        try {
          setToggles(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (err) {}
      }
      fetchData();
    };

    window.addEventListener('horizon-referrals-change', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', fetchData);
    return () => {
      window.removeEventListener('horizon-referrals-change', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', fetchData);
    };
  }, []);

  const referralLink = overviewData?.referralLink || user?.referralLink || getReferralLink(user?.customId || user?.id || '');

  const hasDeposited = Boolean(
    overviewData?.hasDeposited !== undefined
      ? overviewData.hasDeposited
      : user?.hasDeposited ||
      Number(user?.totalInvested || 0) > 0 ||
      Number(user?.depositWallet || 0) > 0
  );

  const copyLink = () => {
    if (!hasDeposited) {
      setDepositModalOpen(true);
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenQr = () => {
    if (!hasDeposited) {
      setDepositModalOpen(true);
      return;
    }
    setIsQrModalOpen(true);
  };

  const depositEnabled = toggles.referralDepositCommissionEnabled !== false && toggles.referralSystemEnabled !== false;
  const roiShareEnabled = toggles.referralRoiShareEnabled !== false && toggles.referralSystemEnabled !== false;
  const anyFeatureDisabled = !depositEnabled || !roiShareEnabled;

  const currentNetwork = networkList;

  // Extract distinct levels from commissions or network
  const allLevels = commissions.map(c => c.levelNumber || parseInt(String(c.level).replace('L', ''), 10) || 1).sort((a, b) => a - b);
  const distinctLevels = Array.from(new Set(allLevels.length > 0 ? allLevels : [1, 2, 3, 4, 5]));

  const filteredNetwork = currentNetwork.filter(item => {
    const q = search.trim().toLowerCase();
    const matchTier = tierFilter === 'all' || item.level === Number(tierFilter);
    const matchSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q);
    return matchTier && matchSearch;
  });

  const downlineTierCount = 10;

  return (
    <div className="page-enter space-y-6 pb-8 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Level Network"
        subtitle={depositEnabled ? "Grow your multi-tier downline team and earn direct deposit & daily ROI profit-sharing commissions" : "Grow your multi-tier downline team and earn daily ROI profit-sharing commissions"}
        badge="10-Tier Active Network"
        actions={
          (depositEnabled || roiShareEnabled) ? (
            <button
              type="button"
              onClick={() => setCalculatorOpen(true)}
              className="btn btn-outline-gold text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer bg-white"
            >
              <RiCalculatorLine size={18} className="text-gold-700" />
              <span>Commission Calculator</span>
            </button>
          ) : null
        }
      />

      {/* ──────────────── ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
        <KPICard
          title="Total Referral Commissions Paid"
          numericValue={Math.round(overviewData?.commissions?.totalEarned || 0)}
          prefix="$"
          decimals={0}
          change={overviewData?.commissions?.totalEarned > 0 ? "Instant Payout" : "Ready"}
          positive={overviewData?.commissions?.totalEarned > 0}
          icon="money"
        />
        <KPICard
          title="Direct Active Clients"
          numericValue={networkList.filter(u => u.level === 1 && (u.status === 'Active' || Number(u.invested || 0) > 0)).length}
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
          change="10 Tiers Active"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Total Team Turnover Volume"
          numericValue={Math.round(overviewData?.totalTeamVolume || 0)}
          prefix="$"
          decimals={0}
          change="Group Volume"
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
            onClick={handleOpenQr}
            className={`btn text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs ${hasDeposited ? 'btn-secondary bg-white' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
          >
            {hasDeposited ? <RiQrCodeLine size={15} /> : <RiLockLine size={15} className="text-amber-700" />}
            <span>{hasDeposited ? 'QR Code' : 'QR Locked'}</span>
          </button>
        </div>

        {/* Dynamic Link Input with instant copy or deposit lock */}
        <div className="flex items-center gap-2">
          {hasDeposited ? (
            <>
              <div className="flex-1 px-4 py-3 rounded-xl bg-white border border-gold-200 text-xs sm:text-sm font-mono font-bold text-slate-800 truncate shadow-2xs select-all">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={copyLink}
                className={`btn text-xs px-5 py-3 rounded-xl font-bold transition-all shadow-gold flex items-center gap-1.5 cursor-pointer ${copied ? 'bg-emerald-600 text-white' : 'btn-primary'
                  }`}
              >
                {copied ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex-1 px-4 py-3 rounded-xl bg-amber-50/80 border border-amber-300 text-xs sm:text-sm font-mono font-bold text-amber-900 truncate shadow-2xs flex items-center gap-2 select-none">
                <RiLockLine size={16} className="text-amber-600 flex-shrink-0" />
                <span className="truncate">Referral Link Locked • Mandatory Deposit Required (Min. $10 USD)</span>
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="btn text-xs px-5 py-3 rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950"
                title="Deposit required to unlock referral link"
              >
                <RiLockLine size={16} />
                <span>Deposit Required</span>
              </button>
            </>
          )}
        </div>

        {!hasDeposited && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <RiAlertLine size={18} className="text-amber-600 flex-shrink-0" />
              <span><strong>Mandatory Deposit Required:</strong> You must make a deposit to activate and copy your referral link.</span>
            </div>
            <Link
              to="/deposit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 text-slate-950 font-bold text-xs shadow-2xs self-start sm:self-auto transition-transform active:scale-95"
            >
              <RiArrowDownLine size={14} />
              <span>Deposit Now</span>
              <RiArrowRightLine size={13} />
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span className="font-mono">
            Sponsor ID: <strong className="text-slate-700">{user?.customId || user?.id || '—'}</strong>
          </span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <RiShieldCheckLine size={14} /> Active Downline Referral Structure (10-Levels)
          </span>
        </div>
      </div>

      {/* ──────────────── TAB SWITCHER ──────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('genealogy')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'genealogy'
              ? 'bg-gold-400 text-slate-950 shadow-gold'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <RiNodeTree size={16} />
          <span>Client Network Tree View </span>  
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'tree'
              ? 'bg-gold-400 text-slate-950 shadow-gold'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <RiTeamLine size={16} />
          <span>Active Downline Table ({networkList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'plans'
              ? 'bg-gold-400 text-slate-950 shadow-gold'
              : 'text-slate-500 hover:text-slate-800'
            }`}
        >
          <RiPercentLine size={16} />
          <span>10-Tier Commission Structure</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: INTERACTIVE GENEALOGY TREE VIEW ──────────────── */}
      {activeTab === 'genealogy' && (
        <ReferralTreeView
          tree={treeData}
          onSelectPartner={setSelectedPartner}
          referralLink={referralLink}
        />
      )}

      {/* ──────────────── TAB 2: ACTIVE DOWNLINE PARTNERS DIRECTORY ──────────────── */}
      {activeTab === 'tree' && (
        <div className="space-y-5">

          {/* Dynamic Level Distribution Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {distinctLevels.map(lvl => {
              const count = currentNetwork.filter(r => r.level === lvl).length;
              return (
                <button
                  key={lvl}
                  onClick={() => setTierFilter(tierFilter === String(lvl) ? 'all' : String(lvl))}
                  className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${tierFilter === String(lvl)
                      ? 'card-gold border-gold-400 ring-2 ring-gold-300 shadow-gold'
                      : 'card hover:border-slate-300'
                    }`}
                >
                  <p className="text-2xl font-black font-display text-slate-900 tabular-nums">
                    {count}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 font-poppins">
                    Level {lvl} Partners
                  </p>
                </button>
              );
            })}
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tierFilter === 'all'
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
                    {depositEnabled && <th className="font-medium text-slate-500">Commission Earned</th>}
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
                      {depositEnabled && (
                        <td>
                          {Number(u.totalComm || u.directComm || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-extrabold border border-emerald-300 whitespace-nowrap font-poppins shadow-2xs font-mono">
                              <RiMoneyDollarCircleLine size={14} className="text-emerald-600" />
                              +${Number(u.totalComm || u.directComm || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200 whitespace-nowrap font-poppins shadow-2xs font-mono">
                              <RiMoneyDollarCircleLine size={14} className="text-slate-400" />
                              $0.00
                            </span>
                          )}
                        </td>
                      )}

                      {/* Status: Active only if user has deposited funds */}
                      <td>
                        {(() => {
                          const isDeposited = Boolean(u.hasDeposited) || Number(u.invested || u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0;
                          const isActive = isDeposited && (u.status === 'Active' || !u.status);
                          const statusLabel = u.status === 'Blocked' || u.status === 'Suspended' ? u.status : (isActive ? 'Active' : 'Inactive');
                          return (
                            <Badge variant={isActive ? 'success' : 'danger'} size="sm">
                              {statusLabel}
                            </Badge>
                          );
                        })()}
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
                                : `Start building your team by sharing your official invite link. You'll earn up to 10 tiers of instant investment and profit-sharing bonuses.`}
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

      {/* ──────────────── TAB 2: MULTI-TIER COMMISSION STRUCTURE & PLANS ──────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6 font-poppins">
          {/* ──────── 1. LEVEL ROI PER DAY INCOME TABLE (LUXURY WHITE & GOLD THEME) ──────── */}
          <div className="card p-5 sm:p-6 space-y-5 shadow-card border border-slate-200/80">
            {/* Elegant Top Toolbar with proper margin & padding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 font-poppins">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gold-400/20 text-gold-700 flex items-center justify-center border border-gold-300 shadow-2xs flex-shrink-0">
                  <RiCoinsLine size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      Level ROI Per Day Income
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs">
                      10 Active Levels
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Multi-tier direct and downline daily ROI profit sharing matrix and qualification rules
                  </p>
                </div>
              </div>
            </div>

            {/* Grid Table with proper spacing and full vertical & horizontal gridlines */}
            <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-sm bg-white">
              <div className="bg-yellow-400 text-slate-950 font-extrabold text-center py-2.5 text-sm sm:text-base tracking-wide border-b-2 border-yellow-500">
                Level ROI Per day Income
              </div>
              <table className="w-full text-left border-collapse font-poppins">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-300 text-slate-900 text-xs font-extrabold tracking-wider">
                    <th className="py-3 px-3 text-center border-r border-slate-300 w-16">Levels</th>
                    <th className="py-3 px-3.5 text-center border-r border-slate-300 min-w-[120px]">Deposit in $</th>
                    <th className="py-3 px-3.5 text-center border-r border-slate-300 min-w-[120px]">Profit in $</th>
                    <th className="py-3 px-3.5 text-center border-r border-slate-300 min-w-[100px]">%ge</th>
                    <th className="py-3 px-4 text-left border-r border-slate-300 min-w-[280px]">Eligible Conditions</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">My Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                  {commissions.map((tier, i) => {
                    const levelNum = tier.levelNumber !== undefined ? tier.levelNumber : (parseInt(String(tier.level).replace('L', ''), 10) || 0);
                    const depAmt = Number(tier.depositAmount || 0);
                    const profitAmt = Number(tier.profitAmount || 0);
                    const pct = tier.percentage !== undefined && tier.percentage !== null
                      ? Number(tier.percentage)
                      : (tier.roiPerDay !== undefined && tier.roiPerDay !== null ? Number(tier.roiPerDay) : 0);
                    const conditions = tier.eligibleConditions || (
                      levelNum === 0
                        ? 'NA'
                        : (tier.directClientsMin || tier.groupVolumeMin
                          ? `Group Volume Min. ${Number(tier.groupVolumeMin).toLocaleString()}$, ${tier.directClientsMin} Direct Clients`
                          : 'No Condition')
                    );

                    const userDirects = Number(overviewData?.directReferralsCount || networkList.filter(u => u.level === 1).length || 0);
                    const userVolume = Number(overviewData?.totalTeamVolume || networkList.reduce((sum, u) => sum + Number(u.invested || 0), 0) || 0);
                    const minVol = Number(tier.groupVolumeMin || 0);
                    const minDir = Number(tier.directClientsMin || 0);

                    const isNA = conditions.trim().toUpperCase() === 'NA' || levelNum === 0;
                    const isNoCondition = conditions.toLowerCase().includes('no condition');
                    const isEligible = isNoCondition || (!isNA && userVolume >= minVol && userDirects >= minDir);

                    return (
                      <tr
                        key={tier._id || tier.level || levelNum}
                        className={`hover:bg-amber-50/40 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                          }`}
                      >
                        {/* Level Index */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono text-xs border-r border-slate-300">
                          {levelNum}
                        </td>

                        {/* Deposit in $ */}
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-900 text-xs border-r border-slate-300">
                          {levelNum === 0 ? '1000' : (depAmt > 0 ? depAmt : '')}
                        </td>

                        {/* Profit in $ */}
                        <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-900 text-xs border-r border-slate-300">
                          {levelNum === 0 ? '8' : profitAmt}
                        </td>

                        {/* %ge */}
                        <td className="py-2.5 px-3.5 text-center border-r border-slate-300 font-mono font-bold text-xs text-slate-900">
                          {pct}
                        </td>

                        {/* Eligible Conditions */}
                        <td className="py-2.5 px-4 text-left border-r border-slate-300 font-medium text-slate-800 text-xs">
                          {conditions}
                        </td>

                        {/* My Eligibility */}
                        <td className="py-2.5 px-3 text-center">
                          {isNA ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200">
                              NA
                            </span>
                          ) : isEligible ? (
                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                              <RiCheckLine size={13} className="font-black" /> Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                              {userDirects}/{minDir} Directs
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {commissions.length > 0 && depositEnabled ? (
            <div className="grid grid-cols-1 gap-6">
              {/* Direct Investment Deposit Commission Box */}
              <div className="card p-5 space-y-4 border border-emerald-200/80 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <RiTeamLine size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 font-poppins">
                        Direct Investment Deposit Commission
                      </h4>
                      <p className="text-xs text-slate-400">
                        Commission credited instantly when downline members deposit into investment plans
                      </p>
                    </div>
                  </div>

                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {commissions.map((tier) => (
                    <div
                      key={tier._id || tier.level}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                          {tier.level}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {networkList.filter(u => u.level === Number(String(tier.level).replace('L', ''))).length} Active Team Promoters
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold font-mono px-3.5 py-1 rounded-xl shadow-2xs text-emerald-600 bg-emerald-50 border border-emerald-200">
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
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl">
              Commission plans are currently not available.
            </div>
          )}
        </div>
      )}

      {/* ──────────────── MODAL 1: QR CODE MODAL ──────────────── */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Affiliate QR Code"
        subtitle="Scan to register directly under your sponsor ID"
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

      {/* ──────────────── MODAL: DEPOSIT MANDATORY TO UNLOCK REFERRAL LINK ──────────────── */}
      <Modal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        title="Mandatory Deposit Required"
        subtitle="Active deposit required to unlock and copy your affiliate referral link"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDepositModalOpen(false)}
              className="btn btn-secondary text-xs px-4 py-2.5 rounded-xl font-bold cursor-pointer"
            >
              Close
            </button>
            <Link
              to="/deposit"
              className="btn btn-primary text-xs px-5 py-2.5 rounded-xl font-bold shadow-gold flex items-center gap-1.5 cursor-pointer"
            >
              <RiArrowDownLine size={15} />
              <span>Make a Deposit ($10 Min)</span>
            </Link>
          </div>
        }
      >
        <div className="space-y-4 py-2 font-poppins">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 flex-shrink-0 mt-0.5">
              <RiLockLine size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm text-slate-900">Referral Link is Currently Locked</h4>
              <p className="text-slate-600 leading-relaxed">
                To maintain platform security, prevent spam registrations, and ensure genuine network growth, you must make a mandatory deposit (minimum <strong>$10 USD</strong>) before you can copy or share your referral link.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h5 className="font-bold text-slate-800">What happens after you deposit:</h5>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Your personal referral link is unlocked immediately for one-click copying.</li>
              <li>Your personal QR code is activated for instant mobile sharing.</li>
              <li>You unlock multi-tier affiliate commissions on all your downlines' investments.</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ──────────────── MODAL 2: DOWNLINE PARTNER AUDIT DRAWER ──────────────── */}
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
                    {selectedPartner.email} {selectedPartner.phone ? `• ${selectedPartner.phone}` : ''}
                  </p>
                  <p className="text-[11px] font-mono text-gold-700 font-bold mt-0.5">
                    ID: {selectedPartner.id} {selectedPartner.joined ? `• Joined: ${selectedPartner.joined}` : ''}
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

            {/* Metric Cards */}
            <div className={`grid ${depositEnabled ? 'grid-cols-3' : 'grid-cols-1'} gap-3`}>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Team Turnover
                </span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  ${Number(selectedPartner.teamVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {depositEnabled && (
                <>
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
                      Direct Comm
                    </span>
                    <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                      +${Number(selectedPartner.directComm || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3.5 bg-gold-50 rounded-xl border border-gold-300 text-center">
                    <span className="text-[10px] text-gold-900 uppercase font-bold tracking-wider block">
                      Total Commissions
                    </span>
                    <span className="text-base font-extrabold text-gold-900 font-mono mt-0.5 block">
                      +${Number(selectedPartner.totalComm || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Downline Network Hierarchy (100% Dynamic from MongoDB) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <RiNodeTree className="text-emerald-600" /> Multi-Tier Downline Network Tree (10 Levels)
                </h5>
                <span className="text-[11px] font-bold text-slate-600">
                  Total Downline: <strong>{selectedPartner.totalTeamCount || 0} Members</strong> (${(selectedPartner.teamVolume || 0).toLocaleString()} Volume)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                {commissions.map((tier) => {
                  const lvlData = selectedPartner.levelBreakdown?.find(
                    (lb) => lb.levelNumber === tier.levelNumber || lb.level === tier.level
                  );
                  const memberCount = lvlData?.count ?? 0;
                  const memberVolume = lvlData?.volume ?? 0;

                  return (
                    <div
                      key={tier.level}
                      className={`p-2.5 rounded-xl border shadow-2xs transition-colors ${memberCount > 0
                          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200'
                          : 'bg-white border-slate-200 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-0.5">
                        <span>{tier.level}</span>
                        {depositEnabled && <span className="text-emerald-700 font-mono font-semibold">{tier.investCommission}</span>}
                      </div>
                      <span className={`font-black block text-sm ${memberCount > 0 ? 'text-slate-950 font-mono' : 'text-slate-400'}`}>
                        {memberCount} {memberCount === 1 ? 'User' : 'Users'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ${Number(memberVolume).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Downline Members List Breakdown if any exist */}
              {selectedPartner.levelBreakdown?.some((lb) => lb.count > 0) ? (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <h6 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Downline Members Directory
                  </h6>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedPartner.levelBreakdown.map((lb) => {
                      if (lb.count === 0) return null;
                      return (
                        <div key={lb.level} className="space-y-1">
                          <span className="text-[10px] font-extrabold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            {lb.level} ({lb.count} members • ${Number(lb.volume).toLocaleString()} volume)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                            {lb.members.map((m) => {
                              const isMActive = m.status === 'Active' || Number(m.invested || 0) > 0;
                              return (
                                <div key={m.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-slate-800 leading-tight">{m.name}</p>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                        isMActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}>
                                        {isMActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gold-700 font-mono">{m.id} • {m.email}</p>
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                    ${Number(m.invested || 0).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                  No downline members registered under this partner yet.
                </div>
              )}
            </div>

            {/* Financial Portfolio Summary */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Active Portfolio Investment:</span>
                <span className="font-bold text-emerald-600 font-mono">
                  ${Number(selectedPartner.invested || 0).toLocaleString()}.00
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Referred By (Sponsor):</span>
                <span className="font-bold text-slate-800">{selectedPartner.sponsor || 'Direct Platform'}</span>
              </div>
              {depositEnabled && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Direct Deposit Commission Rate:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {commissions.find(c => c.level === `L${selectedPartner.level}` || c.level === String(selectedPartner.level))?.investCommission || '5%'}
                  </span>
                </div>
              )}
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
        subtitle={
          depositEnabled && roiShareEnabled
            ? "Simulate direct deposit bonuses & multi-tier daily profit share"
            : depositEnabled
              ? "Simulate direct deposit bonuses across all tiers"
              : "Simulate multi-tier daily profit share earnings"
        }
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
          {depositEnabled && (
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
          )}

          {roiShareEnabled && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Simulated Downline Daily Yield ($/day)
              </label>
              <input
                type="number"
                value={calcYield}
                onChange={e => setCalcYield(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-gold-400"
              />
            </div>
          )}

          {/* Breakdown per tier */}
          {depositEnabled && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Instant Deposit Commission Breakdown:
              </h5>
              {commissions.map(c => {
                const rate = parseFloat(c.investCommission) / 100;
                const bonus = (Number(calcDeposit) || 0) * rate;
                return (
                  <div key={c._id || c.level} className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Level {c.level} ({c.investCommission}):</span>
                    <span className="font-mono font-bold text-emerald-600">
                      +${bonus.toFixed(2)} USD
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {roiShareEnabled && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
              <h5 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Daily ROI Profit Share Breakdown:
              </h5>
              {commissions.map(c => {
                const rate = parseFloat(c.earningsCommission) / 100;
                const bonus = (Number(calcYield) || 0) * rate;
                return (
                  <div key={c._id || c.level} className="flex justify-between py-1 border-b border-amber-200/60">
                    <span className="text-slate-600">Level {c.level} ({c.earningsCommission}):</span>
                    <span className="font-mono font-bold text-amber-700">
                      +${bonus.toFixed(2)} / day
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
