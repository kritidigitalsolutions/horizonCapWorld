import React, { useState, useEffect } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiNodeTree, RiPercentLine,
  RiCoinsLine, RiShieldCheckLine, RiCalculatorLine, RiArrowRightLine,
  RiMoneyDollarCircleLine, RiWallet3Line
} from 'react-icons/ri';
import { getReferralCommissions, getReferralOverview, getReferralNetwork } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Badge from '../components/ui/Badge';

// Initial Referral Commissions Tiers
const defaultTiers = [
  { level: 'L1', name: 'Direct Referrals (Level 1)', investCommission: '5%', earningsCommission: '5%' },
  { level: 'L2', name: 'Sub-Referrals (Level 2)', investCommission: '4%', earningsCommission: '4%' },
  { level: 'L3', name: 'Network Tier (Level 3)', investCommission: '3%', earningsCommission: '3%' },
  { level: 'L4', name: 'Network Tier (Level 4)', investCommission: '2%', earningsCommission: '2%' },
  { level: 'L5', name: 'Global Depth (Level 5)', investCommission: '1%', earningsCommission: '1%' },
];

export default function ReferralPlans() {
  const [commissions, setCommissions] = useState(defaultTiers);
  const [overviewData, setOverviewData] = useState(null);
  const [networkList, setNetworkList] = useState([]);
  const [calcDeposit, setCalcDeposit] = useState('10000');
  const [calcDailyYield, setCalcDailyYield] = useState('100');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [commsRes, overviewRes, netRes] = await Promise.allSettled([
          getReferralCommissions(),
          getReferralOverview(),
          getReferralNetwork(),
        ]);

        if (commsRes.status === 'fulfilled' && commsRes.value?.success && Array.isArray(commsRes.value.tiers) && commsRes.value.tiers.length > 0) {
          setCommissions(commsRes.value.tiers);
        }
        if (overviewRes.status === 'fulfilled' && overviewRes.value?.success) {
          setOverviewData(overviewRes.value.data);
        }
        if (netRes.status === 'fulfilled' && netRes.value?.success && Array.isArray(netRes.value.network)) {
          setNetworkList(netRes.value.network);
        }
      } catch (err) {
        console.warn('Error loading referral data:', err.message);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleSync = () => {
      getReferralCommissions().then(res => {
        if (res?.success && Array.isArray(res.tiers)) setCommissions(res.tiers);
      }).catch(() => {});
      getReferralOverview().then(res => {
        if (res?.success) setOverviewData(res.data);
      }).catch(() => {});
      getReferralNetwork().then(res => {
        if (res?.success && Array.isArray(res.network)) setNetworkList(res.network);
      }).catch(() => {});
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
        subtitle="Earn multi-tier passive commissions across 5 levels from active downline deposits & daily streaming ROI profit"
        badge="5-Tier Growth"
      />

      {/* ──────────────── 4 ROLLING ODOMETER KPI CARDS (DESIGN.MD) ──────────────── */}
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
          change="5 Tiers Active"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Average Affiliate Yield"
          numericValue={avgAffiliateYield}
          prefix=""
          suffix="%"
          decimals={1}
          change="5 Tiers Total"
          positive={true}
          icon="wallet"
        />
      </div>

      {/* ──────────────── EXACT 2 DUAL-STREAM REFERRAL CARDS (MATCHING SUPER ADMIN SCREENSHOT) ──────────────── */}
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
            {commissions.map((tier) => {
              const stats = getDynamicTierStats(tier);
              return (
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
                        {stats.promoters} Promoters • Total Volume: {stats.volume}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-emerald-600 font-mono bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-xl shadow-2xs">
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
            {commissions.map((tier) => {
              const stats = getDynamicTierStats(tier);
              return (
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
                        {stats.promoters} Promoters Active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-gold-700 font-mono bg-gold-50 border border-gold-300 px-3.5 py-1 rounded-xl shadow-2xs">
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
      </div>

      {/* ──────────────── LIVE DUAL-STREAM COMMISSION SIMULATOR ──────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-400 text-slate-900 flex items-center justify-center font-bold shadow-xs">
            <RiCalculatorLine size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Live Downline Commission Simulator (Both Streams)
            </h3>
            <p className="text-xs text-slate-500">
              Simulate upfront deposit bonuses and recurring daily ROI earnings across all 5 tiers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {commissions.map((t) => {
            const depRate = parseFloat(t.investCommission) / 100;
            const yieldRate = parseFloat(t.earningsCommission) / 100;
            const depBonus = (Number(calcDeposit) || 0) * depRate;
            const yieldBonus = (Number(calcDailyYield) || 0) * yieldRate;

            return (
              <div key={t.level} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                  {t.level} ({t.investCommission})
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 block">Deposit Bonus:</span>
                  <span className="text-sm font-extrabold text-emerald-600 font-mono">
                    +${depBonus.toFixed(2)}
                  </span>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block">Daily ROI Share:</span>
                  <span className="text-xs font-extrabold text-amber-600 font-mono">
                    +${yieldBonus.toFixed(2)}/day
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
