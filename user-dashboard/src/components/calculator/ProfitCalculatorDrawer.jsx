import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import {
  RiCalculatorLine, RiArrowRightLine, RiInformationLine, RiFundsLine,
  RiSunLine, RiCopperCoinLine, RiCheckLine, RiFlashlightLine, RiSparklingLine,
  RiGiftLine, RiRefreshLine,
} from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';

export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: 49, noMaxLimit: false, dailyRoi: 0.25, monthlyRoi: 7.5, annualRoi: 90 },
  { minAmount: 50, maxAmount: 99, noMaxLimit: false, dailyRoi: 0.35, monthlyRoi: 10.5, annualRoi: 126 },
  { minAmount: 100, maxAmount: 499, noMaxLimit: false, dailyRoi: 0.55, monthlyRoi: 16.5, annualRoi: 198 },
  { minAmount: 500, maxAmount: 1500, noMaxLimit: false, dailyRoi: 0.75, monthlyRoi: 22.5, annualRoi: 270 },
  { minAmount: 1500, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, monthlyRoi: 30.0, annualRoi: 360 },
];

export const DEFAULT_LOYALTY_SLABS = [
  { days: 30, bonusPercentage: 0.50, label: "30 Days" },
  { days: 90, bonusPercentage: 1.00, label: "90 Days" },
  { days: 180, bonusPercentage: 3.00, label: "180 Days" },
  { days: 365, bonusPercentage: 5.00, label: "365 Days" },
  { days: 730, bonusPercentage: 10.00, label: "730 Days" },
];

function matchSlab(amount, slabs = []) {
  const num = Number(amount) || 0;
  const list = slabs && slabs.length > 0 ? slabs : DEFAULT_ROI_SLABS;
  const found = list.find((s) => {
    const min = Number(s.minAmount) || 0;
    const max = s.noMaxLimit || !s.maxAmount ? Infinity : Number(s.maxAmount);
    return num >= min && num <= max;
  });
  if (found) return found;
  const sorted = [...list].sort((a, b) => (Number(b.minAmount) || 0) - (Number(a.minAmount) || 0));
  if (sorted.length > 0 && num >= (Number(sorted[0].minAmount) || 0)) {
    return sorted[0];
  }
  return list[0];
}

const categories = [
  { id: 'all', label: 'All Categories', icon: RiFundsLine },
  { id: 'Renewable Energy', label: 'Renewable Energy', icon: RiSunLine },
  { id: 'Precious Metal', label: 'Precious Metals', icon: RiCopperCoinLine },
];

export default function ProfitCalculatorDrawer({ isOpen, onClose, onInvest, initialPlanId, plans = [] }) {
  const allPlans = plans && plans.length > 0 ? plans : [];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || allPlans[0]?.id || allPlans[0]?._id || '');
  const [amount, setAmount] = useState(100);
  const [autoRenewal, setAutoRenewal] = useState(false);

  // Filter plans by selected category tab
  const filteredPlans = useMemo(() => {
    if (selectedCategory === 'all') return allPlans;
    return allPlans.filter(p => p.category === selectedCategory);
  }, [selectedCategory, allPlans]);

  // Keep selectedPlan valid when category changes
  const currentPlan = useMemo(() => {
    const found = filteredPlans.find(p => p.id === selectedPlanId || p._id === selectedPlanId);
    if (found) return found;
    return filteredPlans[0] || allPlans[0] || null;
  }, [filteredPlans, selectedPlanId, allPlans]);

  // Slabs list for current plan
  const slabs = useMemo(() => {
    if (currentPlan?.roiSlabs && Array.isArray(currentPlan.roiSlabs) && currentPlan.roiSlabs.length > 0) {
      return currentPlan.roiSlabs;
    }
    return DEFAULT_ROI_SLABS;
  }, [currentPlan]);

  // Active matched slab for current amount
  const activeMatchedSlab = useMemo(() => {
    return matchSlab(amount, slabs);
  }, [amount, slabs]);

  // Real-time calculations based on Amount-Wise Daily ROI Slabs with Auto Renewal boost
  const calculations = useMemo(() => {
    const numAmount = Number(amount);
    if (!currentPlan || !amount || isNaN(numAmount) || numAmount <= 0) {
      return {
        dailyRate: '0.000',
        weeklyRate: '0.00',
        monthlyRate: '0.00',
        quarterlyRate: '0.00',
        annualRate: '0.00',
        daily: '0.00',
        weekly: '0.00',
        monthly: '0.00',
        quarterly: '0.00',
        annually: '0.00',
        totalProfit: '0.00',
        finalReturns: '0.00',
        isInfinite: false,
      };
    }

    const baseDailyRoi = Number(activeMatchedSlab?.dailyRoi) || 0.25;
    const baseMonthlyRoi = Number(activeMatchedSlab?.monthlyRoi) || baseDailyRoi * 30;
    const baseAnnualRoi = Number(activeMatchedSlab?.annualRoi) || baseDailyRoi * 360;

    const dailyRoi = autoRenewal
      ? Number((baseDailyRoi + (0.25 / 30)).toFixed(5))
      : baseDailyRoi;
    const monthlyRoi = autoRenewal
      ? Number((baseMonthlyRoi + 0.25).toFixed(2))
      : baseMonthlyRoi;
    const annualRoi = autoRenewal
      ? Number((baseAnnualRoi + 3.0).toFixed(1))
      : baseAnnualRoi;

    const isInfinite =
      !!currentPlan.isInfinite ||
      currentPlan.duration?.toLowerCase().includes('infinite') ||
      currentPlan.duration?.toLowerCase().includes('lifetime');

    const durationDays = isInfinite ? 365 : (currentPlan.durationDays || 365);

    const dailyYield = numAmount * (dailyRoi / 100);
    const weeklyYield = dailyYield * 7;
    const monthlyYield = dailyYield * 30;
    const quarterlyYield = monthlyYield * 3;
    const annualYield = dailyYield * 360;

    const totalProfit = dailyYield * durationDays;
    const finalReturns = numAmount + totalProfit;

    return {
      dailyRate: dailyRoi.toFixed(3),
      weeklyRate: (dailyRoi * 7).toFixed(2),
      monthlyRate: monthlyRoi.toFixed(2),
      quarterlyRate: (monthlyRoi * 3).toFixed(1),
      annualRate: annualRoi.toFixed(1),
      daily: dailyYield.toFixed(2),
      weekly: weeklyYield.toFixed(2),
      monthly: monthlyYield.toFixed(2),
      quarterly: quarterlyYield.toFixed(2),
      annually: annualYield.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      finalReturns: finalReturns.toFixed(2),
      isInfinite,
      dailyRoi,
      monthlyRoi,
      annualRoi,
    };
  }, [currentPlan, amount, activeMatchedSlab, autoRenewal]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yield & Profit Calculator"
      subtitle="Simulate dynamic returns across institutional Amount-Wise Daily ROI Slabs"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button onClick={onClose} className="btn btn-secondary text-xs px-4 py-2.5">
            Close
          </button>
          <button
            onClick={() => {
              const numAmt = Number(amount) || currentPlan?.minAmountNumeric || 10;
              if (onInvest) onInvest(currentPlan, numAmt, autoRenewal);
              onClose();
            }}
            className="btn btn-primary text-xs px-5 py-2.5 font-bold cursor-pointer"
          >
            Invest {amount ? `$${Number(amount).toLocaleString()}` : ''} in {currentPlan?.name} <RiArrowRightLine size={14} />
          </button>
        </div>
      }
    >
      <div className="space-y-4 font-poppins">
        {/* ──────── CATEGORY TABS ──────── */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5 block">
            Asset Sector
          </label>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const matching = cat.id === 'all' ? allPlans : allPlans.filter(p => p.category === cat.id);
                    if (matching.length > 0) setSelectedPlanId(matching[0].id || matching[0]._id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-gold-300 ring-1 ring-gold-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-gold-600' : 'text-slate-400'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──────── PLAN SELECT TILES ──────── */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-1.5 block">
            Select Contract Plan ({filteredPlans.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {filteredPlans.map((plan) => {
              const isSelected = currentPlan?.id === plan.id || currentPlan?._id === plan._id;
              return (
                <button
                  key={plan.id || plan._id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id || plan._id);
                    if (amount !== '' && (Number(amount) < (plan.minAmountNumeric || 10))) {
                      setAmount(plan.minAmountNumeric || 10);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'card-gold border-gold-400 ring-2 ring-gold-300/60 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{plan.name}</span>
                    <span className="badge badge-gold text-[9px] font-bold">
                      {plan.minDaily || 0.25}% – {plan.maxDaily || 1.0}% / d
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{plan.duration}</span>
                    <span className="font-semibold text-slate-700">{plan.minAmount} — {plan.maxAmount || 'No Limit'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──────── 5 AMOUNT-WISE DAILY ROI PERCENTAGE SLABS ──────── */}
        <div className="p-3 bg-gradient-to-br from-amber-50/70 via-gold-50/40 to-white rounded-2xl border border-gold-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-gold-950 flex items-center gap-1.5">
              <RiSparklingLine size={16} className="text-gold-600" />
              Amount-Wise Daily ROI Slabs ({currentPlan?.name})
            </span>
            <span className="badge badge-gold text-[10px] font-bold">
              Active: ${activeMatchedSlab?.minAmount} – {activeMatchedSlab?.noMaxLimit ? "1500$ ++" : `$${activeMatchedSlab?.maxAmount}`} ({calculations.dailyRate}% / day)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
            {slabs.map((slab, idx) => {
              const isMatched = activeMatchedSlab?.minAmount === slab.minAmount;
              const slabDaily = autoRenewal ? (Number(slab.dailyRoi) + (0.25 / 30)).toFixed(3) : slab.dailyRoi;
              const slabMonthly = autoRenewal ? (Number(slab.monthlyRoi || slab.dailyRoi * 30) + 0.25).toFixed(2) : (slab.monthlyRoi || (slab.dailyRoi * 30).toFixed(1));
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isMatched
                      ? 'bg-gold-400 border-gold-500 text-gray-950 shadow-sm ring-2 ring-gold-300 font-bold scale-102'
                      : 'bg-white border-gold-200 text-gray-700 opacity-80'
                  }`}
                >
                  <p className={`text-[10px] font-extrabold ${isMatched ? 'text-gray-950' : 'text-gray-500'}`}>
                    ${slab.minAmount} — {slab.noMaxLimit || !slab.maxAmount ? '1500$ ++' : `$${slab.maxAmount}`}
                  </p>
                  <p className={`text-xs font-black font-mono mt-0.5 ${isMatched ? 'text-gray-950' : 'text-emerald-700'}`}>
                    {slabDaily}% daily
                  </p>
                  <p className={`text-[9px] mt-0.5 ${isMatched ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {slabMonthly}% mo {autoRenewal && <span className="text-emerald-800 font-bold">(+0.25%)</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ──────── AUTO RENEWAL MODE INCENTIVE TOGGLE ──────── */}
        <div className={`p-3.5 rounded-2xl border transition-all duration-300 font-poppins ${
          autoRenewal
            ? 'bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-emerald-500/15 border-gold-400 ring-2 ring-gold-300/60 shadow-sm'
            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                autoRenewal ? 'bg-gold-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                <RiRefreshLine size={20} className={autoRenewal ? 'animate-spin' : ''} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Auto Renewal Mode
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    autoRenewal
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gold-100 text-gold-800 border border-gold-300'
                  }`}>
                    +0.25% / Month Boost
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {autoRenewal ? (
                    <span className="text-emerald-950 font-medium">
                      <strong>Auto Renewal ON:</strong> +0.25% monthly boost added to simulator returns. Total returns compound automatically into capital wallet.
                    </span>
                  ) : (
                    <span>
                      Toggle ON to simulate an additional <strong>+0.25% monthly ROI</strong> across every slab (e.g. 16.50% &rarr; 16.75% / month) with compounding growth.
                    </span>
                  )}
                </p>
              </div>
            </div>

              {/* Interactive Switch with Visible Text */}
              <button
                type="button"
                onClick={() => setAutoRenewal(!autoRenewal)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border shrink-0 ${
                  autoRenewal
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-200'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                aria-label="Toggle Auto Renewal"
              >
                <div className={`w-8 h-4.5 rounded-full p-0.5 flex items-center transition-colors ${
                  autoRenewal ? 'bg-emerald-800' : 'bg-slate-300'
                }`}>
                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform ${
                    autoRenewal ? 'translate-x-3.5' : 'translate-x-0'
                  }`} />
                </div>
                <span className="font-extrabold uppercase tracking-wide">
                  {autoRenewal ? 'ON (+0.25%)' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

        {/* ──────── INVESTMENT AMOUNT INPUT & PRESET CHIPS ──────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              Investment Capital (USD)
            </label>
            <span className="text-xs text-slate-400">
              Range: {currentPlan?.minAmount} — {currentPlan?.maxAmount || 'No Limit'}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base pointer-events-none">
              $
            </span>
            <input
              type="number"
              value={amount === '' ? '' : amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === '' ? '' : Number(val));
              }}
              min={currentPlan?.minAmountNumeric || 10}
              className="input !pl-9 font-bold text-lg text-slate-900"
              placeholder={String(currentPlan?.minAmountNumeric || 100)}
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 flex-wrap">
            {[25, 75, 250, 750, 2000, 5000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  Number(amount) === preset
                    ? 'bg-gold-400 text-gray-950 border border-gold-400 font-bold shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                ${preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ──────── 5-CYCLE PERIODIC BREAKDOWN GRID ──────── */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gold-50/90 via-amber-50/50 to-emerald-50/40 border border-gold-300/80 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-gold-200/60">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-gold-900 flex items-center gap-1.5">
              <UilBolt size={16} className="text-gold-600" /> Projected ROI & Return Simulator
            </span>
            <span className="badge badge-gold text-[10px] font-bold">
              {calculations.annualRate}% Annual APY
            </span>
          </div>

          {/* 5-Column Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div className="p-2 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Daily (24h)</p>
              <p className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 truncate">+${calculations.daily}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.dailyRate}%</p>
            </div>

            <div className="p-2 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Weekly (7d)</p>
              <p className="text-xs font-extrabold text-blue-600 font-mono mt-0.5 truncate">+${calculations.weekly}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.weeklyRate}%</p>
            </div>

            <div className="p-2 bg-white rounded-xl text-center border border-gold-300 shadow-2xs ring-1 ring-gold-200 bg-gradient-to-b from-white to-gold-50/40">
              <p className="text-[10px] text-gold-700 font-bold uppercase tracking-wider">Monthly (30d)</p>
              <p className="text-xs font-extrabold text-gold-700 font-mono mt-0.5 truncate">+${calculations.monthly}</p>
              <p className="text-[10px] text-gold-800 font-bold mt-0.5 font-mono">{calculations.monthlyRate}% / mo</p>
            </div>

            <div className="p-2 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Quarterly (90d)</p>
              <p className="text-xs font-extrabold text-purple-600 font-mono mt-0.5 truncate">+${calculations.quarterly}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.quarterlyRate}%</p>
            </div>

            <div className="p-2 bg-white rounded-xl text-center border border-gold-200 shadow-2xs col-span-2 sm:col-span-1">
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Annually (12m)</p>
              <p className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5 truncate">+${calculations.annually}</p>
              <p className="text-[10px] text-emerald-800 font-bold mt-0.5 font-mono">{calculations.annualRate}% APY</p>
            </div>
          </div>

          {/* Total Maturity & Projected Summary */}
          <div className="p-3 bg-white/95 rounded-xl border border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <p className="font-bold text-gray-800 flex items-center gap-1.5">
                <RiInformationLine className="text-gold-500" size={15} />
                {calculations.isInfinite
                  ? "Continuous Lifetime Yield Stream:"
                  : `Total Return on Maturity (${currentPlan?.duration}):`}
              </p>
              <p className="text-[11px] text-gray-500">
                Principal (${(Number(amount) || 0).toLocaleString()}) +{" "}
                {calculations.isInfinite
                  ? `1-Year Projected Return (+$${calculations.annually})`
                  : `Total Profit (+$${calculations.totalProfit})`}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                {calculations.isInfinite ? "1-Year Maturity Value" : "Total Net Return"}
              </p>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                ${(calculations.isInfinite ? (Number(amount) || 0) + Number(calculations.annually) : Number(calculations.finalReturns)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ──────── REWARD ( LOYALTY BONUS ) MILESTONES ──────── */}
        {currentPlan?.loyaltyBonusEnabled !== false && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-gold-50/50 to-orange-50/40 border border-amber-300/80 space-y-2.5 shadow-xs font-poppins">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <RiGiftLine size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    {currentPlan?.loyaltyBonusTitle || "Reward ( Loyalty Bonus )"}
                  </h4>
                  <p className="text-[10.5px] text-gray-500">
                    {currentPlan?.loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet"}
                  </p>
                </div>
              </div>
              <span className="badge badge-gold text-[10px] font-bold">
                Wallet Bonus
              </span>
            </div>

            {/* Slabs Milestone Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {((currentPlan?.loyaltyBonusSlabs && currentPlan.loyaltyBonusSlabs.length > 0)
                ? currentPlan.loyaltyBonusSlabs
                : DEFAULT_LOYALTY_SLABS
              ).map((slab, sIdx) => {
                const bonusVal = (Number(amount) || 0) * (Number(slab.bonusPercentage) / 100);
                return (
                  <div key={sIdx} className="p-2 bg-white rounded-xl text-center border border-amber-200/80 shadow-2xs">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      {slab.label || `${slab.days} Days`}
                    </p>
                    <p className="text-xs font-extrabold text-amber-700 font-mono mt-0.5 truncate">
                      +{slab.bonusPercentage}%
                    </p>
                    <p className="text-[10.5px] text-emerald-700 font-extrabold font-mono mt-0.5">
                      +${bonusVal.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-[10.5px] text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-200/70 flex items-center gap-1.5">
              <RiInformationLine size={14} className="text-amber-600 shrink-0" />
              <span>One-time loyalty bonus credited directly to your wallet for maintaining capital without premature withdrawal.</span>
            </div>
          </div>
        )}

        {/* Live Streaming Info Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <RiFlashlightLine size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            Real-time returns stream directly to your Earning Wallet every second ({calculations.daily ? `$${(Number(calculations.daily) / 86400).toFixed(6)} / sec` : '$0.00 / sec'}). {calculations.isInfinite ? "Contract operates on a continuous lifetime duration." : "100% principal unlocks upon contract maturity."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
