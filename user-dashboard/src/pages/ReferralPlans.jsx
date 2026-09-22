import { useState, useEffect } from 'react';
import {
  RiTeamLine,
  RiCoinsLine,
  RiCheckLine
} from 'react-icons/ri';
import { getReferralCommissions, getReferralOverview, getReferralNetwork } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Badge from '../components/ui/Badge';

// Initial Referral Commissions Tiers (Level 0-10 Matrix)
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

export default function ReferralPlans() {
  const [commissions, setCommissions] = useState(defaultTiers);
  const [overviewData, setOverviewData] = useState(null);
  const [networkList, setNetworkList] = useState([]);
  const [toggles, setToggles] = useState({
    referralDepositCommissionEnabled: true,
    referralRoiShareEnabled: true,
    referralSystemEnabled: true,
  });

  const fetchData = async () => {
    try {
      const [commsRes, overviewRes, netRes] = await Promise.allSettled([
        getReferralCommissions(),
        getReferralOverview(),
        getReferralNetwork(),
      ]);

      if (commsRes.status === 'fulfilled' && commsRes.value?.success) {
        if (Array.isArray(commsRes.value.tiers) && commsRes.value.tiers.length > 0) {
          setCommissions(commsRes.value.tiers);
        }
        if (commsRes.value.toggles) {
          setToggles(commsRes.value.toggles);
        }
      }
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
        setOverviewData(overviewRes.value.data);
        if (overviewRes.value.data.toggles) {
          setToggles(overviewRes.value.data.toggles);
        }
      }
      if (netRes.status === 'fulfilled' && netRes.value?.success && Array.isArray(netRes.value.network)) {
        setNetworkList(netRes.value.network);
      }
    } catch (err) {
      console.warn('Error loading referral data:', err.message);
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
      fetchData();
    };

    window.addEventListener('horizon-referrals-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-referrals-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const totalCommissions = Number(overviewData?.commissions?.totalEarned || 0);
  const directPromoters = Number(overviewData?.directReferralsCount || networkList.filter(u => u.level === 1).length || 0);
  const totalDownlines = Number(overviewData?.totalTeamCount || networkList.length || 0);
  const avgAffiliateYield = Number((commissions.reduce((sum, c) => sum + (parseFloat(c.investCommission) || 0), 0) || 15.0).toFixed(1));

  const depositEnabled = toggles.referralDepositCommissionEnabled !== false && toggles.referralSystemEnabled !== false;
  const roiShareEnabled = toggles.referralRoiShareEnabled !== false && toggles.referralSystemEnabled !== false;
  const anyFeatureDisabled = !depositEnabled || !roiShareEnabled;

  // Dynamic Level Stats Calculation from live network list
  const getDynamicTierStats = (tier) => {
    const levelNum = tier.levelNumber !== undefined ? tier.levelNumber : (parseInt(String(tier.level).replace('L', ''), 10) || 1);
    if (networkList && networkList.length > 0) {
      const tierMembers = networkList.filter(u => Number(u.level) === levelNum);
      const tierVolume = tierMembers.reduce((sum, u) => sum + Number(u.invested || 0), 0);
      return {
        promoters: tierMembers.length,
        volume: `$${tierVolume.toLocaleString()}`,
      };
    }
    return {
      promoters: tier.activePromoters !== undefined ? Number(tier.activePromoters) : 0,
      volume: tier.totalVolume || '$0',
    };
  };

  return (
    <div className="page-enter space-y-6 pb-8 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Referral Plans & Commissions"
        subtitle={
          depositEnabled
            ? `Earn multi-tier passive commissions across ${commissions.length} levels from active downline deposits`
            : `Earn multi-tier passive commissions across ${commissions.length} levels`
        }
        badge={`${commissions.length}-Tier Active System`}
      />

      {/* ──────────────── ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
        <KPICard
          title="Total Referral Commissions Paid"
          numericValue={totalCommissions}
          prefix="$"
          decimals={0}
          change={totalCommissions > 0 ? "Instant Payout" : "Ready"}
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Network Promoters"
          numericValue={directPromoters}
          prefix=""
          decimals={0}
          change="Level 1 Direct"
          positive={true}
          icon="users"
        />
        <KPICard
          title="Multi-Tier Downlines"
          numericValue={totalDownlines}
          prefix=""
          decimals={0}
          change={`${commissions.length} Tiers Active`}
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Average Affiliate Yield"
          numericValue={avgAffiliateYield}
          prefix=""
          suffix="%"
          decimals={1}
          change="All Tiers Total"
          positive={true}
          icon="wallet"
        />
      </div>

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
                  Level ROI Per day Income
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs">
                  {commissions.length} Levels
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
                    className={`hover:bg-amber-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
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

      {/* ──────────────── DIRECT INVESTMENT DEPOSIT COMMISSION CARD ──────────────── */}
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
                  {depositEnabled
                    ? "Commission credited instantly when downline members deposit into investment plans"
                    : "Direct deposit commissions are currently paused by platform administration"}
                </p>
              </div>
            </div>

            <Badge variant={depositEnabled ? "success" : "neutral"} size="sm">
              {depositEnabled ? "Active" : "Paused"}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {commissions.filter(t => (t.levelNumber !== undefined ? t.levelNumber : (parseInt(String(t.level).replace('L', ''), 10) || 0)) > 0).map((tier) => {
              const stats = getDynamicTierStats(tier);
              return (
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
                        {stats.promoters} Promoters • Total Volume: {stats.volume}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold font-mono px-3.5 py-1 rounded-xl shadow-2xs text-emerald-600 bg-emerald-50 border border-emerald-200">
                      {tier.investCommission}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-poppins">
            <strong>Formula:</strong> Deposit Commission = Downline Deposit Amount × Tier % (e.g. $10,000 Level 1 deposit = $500 direct commission)
          </div>
        </div>
      </div>

      
    </div>
  );
}
