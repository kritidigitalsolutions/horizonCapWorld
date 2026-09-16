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

// Initial Referral Commissions Tiers (11-Level ROI Matrix)
const defaultTiers = [
  { level: 'L1', levelNumber: 1, name: 'Direct Referrals (Level 1)', depositAmount: 1000, profitAmount: 8, roiPerDay: 0, eligibleConditions: 'NR', groupVolumeMin: 0, directClientsMin: 0, investCommission: '5%', earningsCommission: '0%' },
  { level: 'L2', levelNumber: 2, name: 'Sub-Referrals (Level 2)', depositAmount: 0, profitAmount: 0, roiPerDay: 1.6, eligibleConditions: 'No Condition', groupVolumeMin: 0, directClientsMin: 0, investCommission: '4%', earningsCommission: '20%' },
  { level: 'L3', levelNumber: 3, name: 'Network Tier (Level 3)', depositAmount: 0, profitAmount: 0, roiPerDay: 1.2, eligibleConditions: 'Group Volume Min. 1000$, 2 Direct Clients', groupVolumeMin: 1000, directClientsMin: 2, investCommission: '3%', earningsCommission: '15%' },
  { level: 'L4', levelNumber: 4, name: 'Network Tier (Level 4)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.8, eligibleConditions: 'Group Volume Min. 2000$, 3 Direct Clients', groupVolumeMin: 2000, directClientsMin: 3, investCommission: '2%', earningsCommission: '10%' },
  { level: 'L5', levelNumber: 5, name: 'Global Depth (Level 5)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.64, eligibleConditions: 'Group Volume Min. 3000$, 4 Direct Clients', groupVolumeMin: 3000, directClientsMin: 4, investCommission: '1.5%', earningsCommission: '8%' },
  { level: 'L6', levelNumber: 6, name: 'Expansion Tier (Level 6)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.48, eligibleConditions: 'Group Volume Min. 4000$, 5 Direct Clients', groupVolumeMin: 4000, directClientsMin: 5, investCommission: '1%', earningsCommission: '6%' },
  { level: 'L7', levelNumber: 7, name: 'Regional Depth (Level 7)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.4, eligibleConditions: 'Group Volume Min. 5,000$, 10 Direct Clients', groupVolumeMin: 5000, directClientsMin: 10, investCommission: '0.8%', earningsCommission: '5%' },
  { level: 'L8', levelNumber: 8, name: 'Executive Tier (Level 8)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.24, eligibleConditions: 'Group Volume Min. 10,000$, 11 Direct Clients', groupVolumeMin: 10000, directClientsMin: 11, investCommission: '0.6%', earningsCommission: '3%' },
  { level: 'L9', levelNumber: 9, name: 'Leadership Tier (Level 9)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: 'Group Volume Min. 15,000$, 11 Direct Clients', groupVolumeMin: 15000, directClientsMin: 11, investCommission: '0.5%', earningsCommission: '1%' },
  { level: 'L10', levelNumber: 10, name: 'Ambassador Tier (Level 10)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: 'Group Volume Min. 20,000$, 11 Direct Clients', groupVolumeMin: 20000, directClientsMin: 11, investCommission: '0.4%', earningsCommission: '1%' },
  { level: 'L11', levelNumber: 11, name: 'Crown Ambassador (Level 11)', depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: 'Group Volume Min.25,000$, 11 Direct Clients', groupVolumeMin: 25000, directClientsMin: 11, investCommission: '0.3%', earningsCommission: '1%' },
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
    const levelNum = tier.levelNumber || parseInt(String(tier.level).replace('L', ''), 10) || 1;
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${depositEnabled ? '2xl:grid-cols-4' : '2xl:grid-cols-3'} gap-3.5 sm:gap-4 xl:gap-5`}>
        {depositEnabled && (
          <KPICard
            title="Total Referral Commissions Paid"
            numericValue={totalCommissions}
            prefix="$"
            decimals={0}
            change={totalCommissions > 0 ? "Instant Payout" : "Ready"}
            positive={true}
            icon="money"
          />
        )}
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
                  Level ROI Per Day Income
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs">
                  {commissions.length} Active Levels
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Multi-tier direct and downline daily ROI profit sharing matrix and qualification rules
              </p>
            </div>
          </div>
        </div>

        {/* Grid Table with proper spacing and full vertical & horizontal gridlines */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
          <table className="w-full text-left border-collapse font-poppins">
            <thead>
              <tr className="bg-gradient-to-r from-amber-50/90 via-gold-50/70 to-amber-50/50 border-b-2 border-gold-300 text-slate-900 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 text-center border-r border-slate-200/90 w-16">Levels</th>
                <th className="py-3 px-3.5 text-center border-r border-slate-200/90 min-w-[130px]">Deposit in $</th>
                <th className="py-3 px-3.5 text-center border-r border-slate-200/90 min-w-[130px]">Profit in $</th>
                <th className="py-3 px-3.5 text-center border-r border-slate-200/90 min-w-[150px]">ROI per Day in $</th>
                <th className="py-3 px-3.5 text-left border-r border-slate-200/90 min-w-[240px]">Eligibility</th>
                <th className="py-3 px-3 text-center min-w-[130px]">My Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {commissions.map((tier, i) => {
                const levelNum = tier.levelNumber || parseInt(String(tier.level).replace('L', ''), 10) || 1;
                const depAmt = Number(tier.depositAmount || 0);
                const profitAmt = Number(tier.profitAmount || 0);
                const roiDay = tier.roiPerDay !== undefined && tier.roiPerDay !== null ? Number(tier.roiPerDay) : 0;
                const conditions = tier.eligibleConditions || (tier.directClientsMin || tier.groupVolumeMin ? `Group Volume Min. ${Number(tier.groupVolumeMin).toLocaleString()}$, ${tier.directClientsMin} Direct Clients` : (levelNum === 1 ? 'NR' : 'No Condition'));

                const userDirects = Number(overviewData?.directReferralsCount || networkList.filter(u => u.level === 1).length || 0);
                const userVolume = Number(overviewData?.totalTeamVolume || networkList.reduce((sum, u) => sum + Number(u.invested || 0), 0) || 0);
                const minVol = Number(tier.groupVolumeMin || 0);
                const minDir = Number(tier.directClientsMin || 0);

                const isNR = conditions.trim().toUpperCase() === 'NR';
                const isEligible = !isNR && ((minVol === 0 && minDir === 0) || (userVolume >= minVol && userDirects >= minDir));

                return (
                  <tr
                    key={tier._id || tier.level}
                    className={`hover:bg-amber-50/40 transition-colors ${
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    }`}
                  >
                    {/* Level Index */}
                    <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono text-xs border-r border-slate-200 bg-gold-50/30">
                      <span className="w-7 h-7 rounded-lg bg-gold-100/90 text-gold-950 font-bold border border-gold-300 inline-flex items-center justify-center shadow-2xs">
                        {levelNum}
                      </span>
                    </td>

                    {/* Deposit in $ */}
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800 text-xs border-r border-slate-200">
                      {depAmt > 0 ? `$${depAmt.toLocaleString()}` : '—'}
                    </td>

                    {/* Profit in $ */}
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-800 text-xs border-r border-slate-200">
                      ${profitAmt.toLocaleString()}
                    </td>

                    {/* ROI per Day in $ */}
                    <td className="py-3 px-3.5 text-center border-r border-slate-200 bg-emerald-50/20">
                      {roiDay > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs">
                          +${roiDay}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono font-bold text-xs">
                          0
                        </span>
                      )}
                    </td>

                    {/* Eligibility */}
                    <td className="py-3 px-3.5 text-left border-r border-slate-200">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] leading-snug font-semibold ${
                        isNR
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 font-mono'
                          : conditions.toLowerCase().includes('no condition')
                            ? 'bg-slate-100 text-slate-600 border border-slate-200 font-mono'
                            : 'bg-amber-50 text-amber-950 border border-amber-200'
                      }`}>
                        {conditions}
                      </span>
                    </td>

                    {/* My Eligibility */}
                    <td className="py-3 px-3 text-center">
                      {isNR ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-xs border border-slate-200">
                          NR
                        </span>
                      ) : isEligible ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                          <RiCheckLine size={13} className="font-black" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
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
      {depositEnabled && (
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
              {commissions.map((tier) => {
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
      )}

      
    </div>
  );
}
