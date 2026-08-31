import React, { useState, useEffect } from 'react';
import {
  RiTeamLine, RiFlashlightLine, RiNodeTree, RiPercentLine,
  RiCoinsLine, RiShieldCheckLine, RiCalculatorLine, RiArrowRightLine,
  RiMoneyDollarCircleLine, RiWallet3Line
} from 'react-icons/ri';
import { getReferralCommissions } from '../api/referralsApi';
import PageHeader from '../components/ui/PageHeader';
import KPICard from '../components/ui/KPICard';
import Badge from '../components/ui/Badge';

// Initial Referral Commissions matching Super Admin
const initialCommissions = [
  { level: 'L1', name: 'Direct Referrals (Level 1)', investCommission: '5%', earningsCommission: '5%', activePromoters: 3420, totalVolume: '$1,250,000' },
  { level: 'L2', name: 'Sub-Referrals (Level 2)', investCommission: '4%', earningsCommission: '4%', activePromoters: 2180, totalVolume: '$890,000' },
  { level: 'L3', name: 'Network Tier (Level 3)', investCommission: '3%', earningsCommission: '3%', activePromoters: 1420, totalVolume: '$520,000' },
  { level: 'L4', name: 'Network Tier (Level 4)', investCommission: '2%', earningsCommission: '2%', activePromoters: 840, totalVolume: '$310,000' },
  { level: 'L5', name: 'Global Depth (Level 5)', investCommission: '1%', earningsCommission: '1%', activePromoters: 490, totalVolume: '$185,000' },
];

export default function ReferralPlans() {
  const [commissions, setCommissions] = useState(initialCommissions);
  const [calcDeposit, setCalcDeposit] = useState('10000');
  const [calcDailyYield, setCalcDailyYield] = useState('100');

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const res = await getReferralCommissions();
        if (res?.success && Array.isArray(res.tiers) && res.tiers.length > 0) {
          setCommissions(res.tiers);
        }
      } catch (err) {
        console.warn('Using default referral tiers:', err.message);
      }
    };
    fetchTiers();
  }, []);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCommissions(e.detail);
      } else {
        const saved = localStorage.getItem('horizon_referral_commissions');
        if (saved) {
          try {
            setCommissions(JSON.parse(saved));
          } catch (err) {}
        }
      }
    };

    window.addEventListener('horizon-referrals-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-referrals-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

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
          numericValue={428900}
          prefix="$"
          decimals={0}
          change="+19.4%"
          positive={true}
          icon="money"
        />
        <KPICard
          title="Active Network Promoters"
          numericValue={1420}
          prefix=""
          decimals={0}
          change="+12.8%"
          positive={true}
          icon="users"
        />
        <KPICard
          title="Multi-Tier Downlines"
          numericValue={8650}
          prefix=""
          decimals={0}
          change="+24.1%"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Average Affiliate Yield"
          numericValue={14.5}
          prefix=""
          suffix="%"
          decimals={1}
          change="+3.2%"
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
                      {tier.activePromoters} Promoters • Total Volume: {tier.totalVolume}
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
                      {tier.activePromoters} Promoters Active
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
