import React, { useState, useEffect } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiNodeTree, RiPercentLine,
  RiCoinsLine, RiShieldCheckLine, RiCalculatorLine, RiArrowRightLine,
  RiMoneyDollarCircleLine, RiWallet3Line, RiAlertLine, RiPauseCircleLine
} from 'react-icons/ri';
import { getReferralCommissions, getReferralOverview, getReferralNetwork } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Badge from '../components/ui/Badge';

// Initial Referral Commissions Tiers
const defaultTiers = [
  { level: 'L1', levelNumber: 1, name: 'Direct Referrals (Level 1)', investCommission: '5%', earningsCommission: '5%' },
  { level: 'L2', levelNumber: 2, name: 'Sub-Referrals (Level 2)', investCommission: '4%', earningsCommission: '4%' },
  { level: 'L3', levelNumber: 3, name: 'Network Tier (Level 3)', investCommission: '3%', earningsCommission: '3%' },
  { level: 'L4', levelNumber: 4, name: 'Network Tier (Level 4)', investCommission: '2%', earningsCommission: '2%' },
  { level: 'L5', levelNumber: 5, name: 'Global Depth (Level 5)', investCommission: '1%', earningsCommission: '1%' },
];

export default function ReferralPlans() {
  const [commissions, setCommissions] = useState(defaultTiers);
  const [overviewData, setOverviewData] = useState(null);
  const [networkList, setNetworkList] = useState([]);
  const [calcDeposit, setCalcDeposit] = useState('10000');
  const [calcDailyYield, setCalcDailyYield] = useState('100');
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
        subtitle={`Earn multi-tier passive commissions across ${commissions.length} levels from active downline deposits & daily streaming ROI profit`}
        badge={`${commissions.length}-Tier Active System`}
      />

      {/* ──────────────── 4 ROLLING ODOMETER KPI CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ──────────────── 1. LEVEL ROI PER DAY INCOME SPREADSHEET TABLE ──────────────── */}
      <div className="card overflow-hidden shadow-xs border border-gold-300">
        {/* Bright Yellow Header Banner matching spreadsheet */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-3 flex items-center justify-between text-slate-950 font-poppins">
          <div className="flex items-center gap-2">
            <RiCoinsLine size={20} className="text-slate-950" />
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
              Level ROI Per day Income
            </h3>
          </div>
          <span className="text-xs font-black bg-slate-950 text-gold-300 px-3 py-1 rounded-full uppercase tracking-wider">
            {commissions.length} Active Levels
          </span>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-poppins">
            <thead>
              <tr className="bg-amber-100/70 border-b border-amber-200 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-20">Levels</th>
                <th className="py-3 px-4 text-center w-28">Deposit in $</th>
                <th className="py-3 px-4 text-center w-28">Profit in $</th>
                <th className="py-3 px-4 text-center w-36 text-amber-950">ROI per Day in $</th>
                <th className="py-3 px-4">Eligible Conditions</th>
                <th className="py-3 px-4 text-right pr-6 w-36">My Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/70 font-medium text-slate-800">
              {commissions.map((tier) => {
                const levelNum = tier.levelNumber || parseInt(String(tier.level).replace('L', ''), 10) || 1;
                const depAmt = Number(tier.depositAmount || 0);
                const profitAmt = Number(tier.profitAmount || 0);
                const roiDay = Number(tier.roiPerDay || 0.08);
                const conditions = tier.eligibleConditions || (tier.directClientsMin || tier.groupVolumeMin ? `Group Volume Min.${Number(tier.groupVolumeMin).toLocaleString()}$, ${tier.directClientsMin} Direct Clients` : 'No Condition');

                const userDirects = Number(overviewData?.directReferralsCount || networkList.filter(u => u.level === 1).length || 0);
                const userVolume = Number(overviewData?.totalTeamVolume || networkList.reduce((sum, u) => sum + Number(u.invested || 0), 0) || 0);
                const minVol = Number(tier.groupVolumeMin || 0);
                const minDir = Number(tier.directClientsMin || 0);

                const isEligible = (minVol === 0 && minDir === 0) || (userVolume >= minVol && userDirects >= minDir);

                return (
                  <tr key={tier._id || tier.level} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono text-sm bg-amber-50/30">
                      {levelNum}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {depAmt > 0 ? depAmt.toLocaleString() : (depAmt === 0 ? '0' : '')}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {profitAmt > 0 ? profitAmt.toLocaleString() : '0'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-extrabold text-amber-900 text-sm">
                      {roiDay}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-700">
                      <span className={`inline-block px-2.5 py-1 rounded-lg ${
                        conditions.toLowerCase().includes('no condition')
                          ? 'bg-slate-100 text-slate-600 border border-slate-200'
                          : 'bg-amber-100/60 text-amber-900 border border-amber-200/80'
                      }`}>
                        {conditions}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right pr-6">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-2xs">
                          <RiShieldCheckLine size={13} className="font-black" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
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

      {/* ──────────────── DUAL-STREAM REFERRAL CARDS ──────────────── */}
      {(depositEnabled || roiShareEnabled) && (
        <div className={`grid grid-cols-1 ${depositEnabled && roiShareEnabled ? 'md:grid-cols-2' : ''} gap-6`}>
          {/* 1. Direct Investment Deposit Commission Box */}
          {depositEnabled && (
            <div className="card p-5 space-y-4 border border-emerald-200/80 shadow-sm">
              <div className="flex items-center justify-between gap-3">
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
          )}

          {/* 2. Earnings / ROI Commission Box */}
          {roiShareEnabled && (
            <div className="card p-5 space-y-4 border border-amber-200/80 shadow-sm">
              <div className="flex items-center justify-between gap-3">
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

                <Badge variant="warning" size="sm">
                  Active
                </Badge>
              </div>

              <div className="space-y-2.5">
                {commissions.map((tier) => {
                  const stats = getDynamicTierStats(tier);
                  return (
                    <div
                      key={tier._id || tier.level}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between hover:bg-amber-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center shadow-2xs font-mono">
                          {tier.level}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{tier.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {stats.promoters} Promoters Active
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold font-mono px-3.5 py-1 rounded-xl shadow-2xs text-gold-700 bg-gold-50 border border-gold-300">
                          {tier.earningsCommission}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-poppins">
                <strong>Formula:</strong> ROI Profit Share = Downline Stream Interest ($/sec) × Tier % (e.g. $100 daily yield earned by L1 = $5/day ongoing)
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── LIVE DUAL-STREAM COMMISSION SIMULATOR ──────────────── */}
      {(depositEnabled || roiShareEnabled) && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
              <RiCalculatorLine size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {depositEnabled && roiShareEnabled
                  ? "Live Downline Commission Simulator (Both Streams)"
                  : depositEnabled
                  ? "Live Downline Deposit Commission Simulator"
                  : "Live Downline Daily ROI Profit Share Simulator"}
              </h3>
              <p className="text-xs text-slate-500">
                {depositEnabled && roiShareEnabled
                  ? `Simulate upfront deposit bonuses and recurring daily ROI earnings across all ${commissions.length} tiers.`
                  : depositEnabled
                  ? `Simulate upfront deposit bonuses across all ${commissions.length} tiers.`
                  : `Simulate recurring daily streaming ROI earnings across all ${commissions.length} tiers.`}
              </p>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${depositEnabled && roiShareEnabled ? 'sm:grid-cols-2' : ''} gap-4 pt-2`}>
            {depositEnabled && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Downline Deposit Investment ($)
                </label>
                <input
                  type="number"
                  value={calcDeposit}
                  onChange={e => setCalcDeposit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-base text-slate-900 outline-none focus:border-gold-400"
                />
              </div>
            )}

            {roiShareEnabled && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Downline Daily Profit Yield ($/day)
                </label>
                <input
                  type="number"
                  value={calcDailyYield}
                  onChange={e => setCalcDailyYield(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-base text-slate-900 outline-none focus:border-gold-400"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {commissions.map((t) => {
              const depRate = parseFloat(t.investCommission) / 100;
              const yieldRate = parseFloat(t.earningsCommission) / 100;
              const depBonus = (Number(calcDeposit) || 0) * depRate;
              const yieldBonus = (Number(calcDailyYield) || 0) * yieldRate;

              return (
                <div key={t._id || t.level} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                    {t.level} ({depositEnabled && roiShareEnabled ? `${t.investCommission} / ${t.earningsCommission}` : depositEnabled ? t.investCommission : t.earningsCommission})
                  </span>
                  {depositEnabled && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Deposit Bonus:</span>
                      <span className="text-sm font-extrabold font-mono text-emerald-600">
                        +${depBonus.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {roiShareEnabled && (
                    <div className={depositEnabled ? "pt-1 border-t border-slate-200/60" : ""}>
                      <span className="text-[10px] text-slate-400 block">Daily ROI Share:</span>
                      <span className="text-xs font-extrabold font-mono text-amber-600">
                        +${yieldBonus.toFixed(2)}/day
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
