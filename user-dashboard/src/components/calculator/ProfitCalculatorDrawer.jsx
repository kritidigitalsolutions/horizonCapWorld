import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import {
  RiCalculatorLine, RiArrowRightLine, RiInformationLine, RiFundsLine,
  RiSunLine, RiCopperCoinLine, RiCheckLine, RiFlashlightLine, RiSparklingLine,
  RiGiftLine, RiRefreshLine, RiBuilding2Line, RiRocketLine,
} from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';
import { getPlans } from '../../api/plansApi';

export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: 100, noMaxLimit: false, dailyRoi: 0.3, lockInDailyRoi: 0.4, monthlyRoi: 9.0, annualRoi: 108 },
  { minAmount: 101, maxAmount: 500, noMaxLimit: false, dailyRoi: 0.5, lockInDailyRoi: 0.6, monthlyRoi: 15.0, annualRoi: 180 },
  { minAmount: 501, maxAmount: 5000, noMaxLimit: false, dailyRoi: 0.8, lockInDailyRoi: 0.9, monthlyRoi: 24.0, annualRoi: 288 },
  { minAmount: 5001, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, lockInDailyRoi: 1.1, monthlyRoi: 30.0, annualRoi: 360 },
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

export default function ProfitCalculatorDrawer({ isOpen, onClose, onInvest, initialPlanId, plans = [] }) {
  const navigate = useNavigate();
  const [loadedPlans, setLoadedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Dynamically fetch active plans if none passed from parent
  useEffect(() => {
    if (isOpen && (!plans || plans.length === 0)) {
      setLoadingPlans(true);
      getPlans()
        .then((res) => {
          if (res?.success && Array.isArray(res.plans) && res.plans.length > 0) {
            const formatted = res.plans.map((p) => {
              const isInf =
                !!p.isInfinite ||
                p.duration?.toLowerCase().includes('infinite') ||
                p.duration?.toLowerCase().includes('lifetime');
              const roiSlabs =
                Array.isArray(p.roiSlabs) && p.roiSlabs.length > 0
                  ? p.roiSlabs
                  : DEFAULT_ROI_SLABS;
              const loyaltySlabs =
                Array.isArray(p.loyaltyBonusSlabs) && p.loyaltyBonusSlabs.length > 0
                  ? p.loyaltyBonusSlabs
                  : DEFAULT_LOYALTY_SLABS;
              const minDaily = roiSlabs[0]?.dailyRoi || p.dailyRoi || 0.3;
              const maxDaily = roiSlabs[roiSlabs.length - 1]?.lockInDailyRoi || roiSlabs[roiSlabs.length - 1]?.dailyRoi || 1.1;

              return {
                _id: p._id,
                id: p._id,
                name: p.name,
                category: p.category || 'Renewable Energy',
                minAmount: `$${(p.minAmount || 10).toLocaleString()}`,
                minAmountNumeric: Number(p.minAmount) || 10,
                maxAmount: p.noMaxLimit ? 'No Limit' : (p.maxAmount ? `$${p.maxAmount.toLocaleString()}` : 'No Limit'),
                maxAmountNumeric: p.noMaxLimit ? Infinity : (Number(p.maxAmount) || Infinity),
                noMaxLimit: !!p.noMaxLimit,
                duration: isInf ? '∞ Lifetime' : (p.duration || `${p.durationDays || 365} Days`),
                durationDays: isInf ? 0 : (p.durationDays || 365),
                isInfinite: isInf,
                minDaily,
                maxDaily,
                roiSlabs,
                loyaltyBonusEnabled: p.loyaltyBonusEnabled !== false,
                loyaltyBonusTitle: p.loyaltyBonusTitle || 'Reward ( Loyalty Bonus )',
                loyaltyBonusDescription: p.loyaltyBonusDescription || 'Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet',
                loyaltyBonusSlabs: loyaltySlabs,
                autoRenewalBoost: p.autoRenewalBoost || 0.25,
                dailyRoi: minDaily,
                roi: p.roi || 9.0,
                minDepositAmount: p.minDepositAmount ?? 10,
                minWithdrawalAmount: p.minWithdrawalAmount ?? 5,
                hasLockInOption: p.hasLockInOption !== false,
                lockInPeriodDays: p.lockInPeriodDays || 90,
              };
            });
            setLoadedPlans(formatted);
          }
        })
        .catch((err) => {
          console.warn('Error fetching plans for calculator drawer:', err.message);
        })
        .finally(() => {
          setLoadingPlans(false);
        });
    }
  }, [isOpen, plans]);

  const allPlans = useMemo(() => {
    if (plans && plans.length > 0) return plans;
    return loadedPlans;
  }, [plans, loadedPlans]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || '');
  const [amount, setAmount] = useState(100);
  const [lockInPeriod, setLockInPeriod] = useState('none'); // 'none' | '3_months'
  const [autoRenewal, setAutoRenewal] = useState(false);

  // Keep selectedPlanId valid whenever allPlans change
  useEffect(() => {
    if (allPlans.length > 0) {
      if (!selectedPlanId || !allPlans.some((p) => p.id === selectedPlanId || p._id === selectedPlanId)) {
        setSelectedPlanId(initialPlanId || allPlans[0].id || allPlans[0]._id);
      }
    }
  }, [allPlans, initialPlanId, selectedPlanId]);

  // Categories dynamically constructed from active plans
  const categories = useMemo(() => {
    const cats = new Set();
    allPlans.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    const unique = Array.from(cats);
    return [
      { id: 'all', label: 'All Categories', icon: RiFundsLine },
      ...unique.map((cat) => {
        let icon = RiSunLine;
        const low = cat.toLowerCase();
        if (low.includes('metal') || low.includes('gold')) icon = RiCopperCoinLine;
        else if (low.includes('estate') || low.includes('real')) icon = RiBuilding2Line;
        else if (low.includes('venture') || low.includes('tech')) icon = RiRocketLine;
        return { id: cat, label: cat, icon };
      }),
    ];
  }, [allPlans]);

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

  // Real-time calculations based on Amount-Wise Daily ROI Slabs with Lock-In and Auto Renewal boost
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

    const isLockIn = lockInPeriod === '3_months';
    const baseDailyRoi = isLockIn
      ? (Number(activeMatchedSlab?.lockInDailyRoi) || (Number(activeMatchedSlab?.dailyRoi || 0.3) + 0.1))
      : (Number(activeMatchedSlab?.dailyRoi) || 0.3);
    const baseMonthlyRoi = isLockIn
      ? (Number(activeMatchedSlab?.lockInMonthlyRoi) || baseDailyRoi * 30)
      : (Number(activeMatchedSlab?.monthlyRoi) || baseDailyRoi * 30);
    const baseAnnualRoi = isLockIn
      ? (Number(activeMatchedSlab?.lockInAnnualRoi) || baseDailyRoi * 360)
      : (Number(activeMatchedSlab?.annualRoi) || baseDailyRoi * 360);

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
      isLockIn,
    };
  }, [currentPlan, amount, activeMatchedSlab, autoRenewal, lockInPeriod]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yield & Profit Calculator"
      subtitle="Simulate dynamic returns across institutional Amount-Wise Daily ROI Slabs"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-poppins">
            <RiSparklingLine size={15} className="text-gold-600" />
            <span>Real-time profit & ROI simulation preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary text-xs px-6 py-2.5 font-bold cursor-pointer shadow-gold"
          >
            Close Calculator
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
                      {plan.minDaily || 0.3}% – {plan.maxDaily || 1.1}% / d
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

        {/* ──────── 4 AMOUNT-WISE DAILY ROI PERCENTAGE SLABS TABLE ──────── */}
        <div className="rounded-2xl border border-gold-300 overflow-hidden shadow-xs bg-white font-poppins">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-3.5 py-2 flex items-center justify-between text-slate-950">
            <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <RiSparklingLine size={15} className="text-slate-950" />
              ROI Slabs Per Day ({currentPlan?.name})
            </span>
            <span className="text-[10px] font-black bg-slate-950 text-gold-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Active: {calculations.dailyRate}% / day
            </span>
          </div>

          {/* Spreadsheet table style */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-amber-100/70 border-b border-amber-200/80 text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3 text-center">Without Lock In</th>
                  <th className="py-2 px-3 text-center text-amber-900">3 Months Lock In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 font-medium text-slate-700">
                {slabs.map((slab, idx) => {
                  const isMatched = activeMatchedSlab?.minAmount === slab.minAmount;
                  const rangeLabel = slab.noMaxLimit || !slab.maxAmount
                    ? `$${slab.minAmount} +`
                    : `$${slab.minAmount} to $${slab.maxAmount}`;
                  const standardDaily = Number(slab.dailyRoi || 0.3);
                  const lockInDaily = Number(slab.lockInDailyRoi || (standardDaily + 0.1));

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isMatched
                          ? 'bg-amber-200/50 font-bold text-slate-950 ring-1 ring-inset ring-amber-400/60'
                          : 'hover:bg-amber-50/40'
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isMatched && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />}
                          {rangeLabel}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-center font-mono font-bold ${!calculations.isLockIn && isMatched ? 'text-amber-800' : 'text-slate-700'}`}>
                        {standardDaily.toFixed(1)}% / day
                      </td>
                      <td className={`py-2 px-3 text-center font-mono font-extrabold ${calculations.isLockIn && isMatched ? 'text-emerald-700 font-black' : 'text-amber-700'}`}>
                        {lockInDaily.toFixed(1)}% / day
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ──────── LOCK-IN DURATION SELECTOR (Interactive) ──────── */}
        <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600 flex items-center justify-between">
            <span>Simulation Lock-In Option</span>
            <span className="text-[10px] font-bold text-amber-700">+0.10% / Day Extra Yield</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setLockInPeriod('none')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                lockInPeriod === 'none'
                  ? 'bg-white border-gold-400 ring-2 ring-gold-200 font-bold text-slate-900 shadow-xs'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Without Lock In</span>
                {lockInPeriod === 'none' && <RiCheckLine size={14} className="text-emerald-600 font-bold" />}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Flexible Principal Liquidity</p>
            </button>

            <button
              type="button"
              onClick={() => setLockInPeriod('3_months')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                lockInPeriod === '3_months'
                  ? 'bg-gradient-to-r from-amber-50 to-gold-50 border-amber-400 ring-2 ring-amber-200 font-bold text-slate-900 shadow-xs'
                  : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">3 Months Lock In</span>
                {lockInPeriod === '3_months' && <RiCheckLine size={14} className="text-emerald-600 font-bold" />}
              </div>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Boost: +0.10% / day ({calculations.dailyRate}%)</p>
            </button>
          </div>
        </div>

        {/* ──────── AUTO RENEWAL MODE INCENTIVE TOGGLE ──────── */}
        <div className={`p-3 rounded-2xl border transition-all duration-300 font-poppins ${
          autoRenewal
            ? 'bg-gradient-to-r from-amber-500/15 via-gold-500/10 to-emerald-500/15 border-gold-400 ring-2 ring-gold-300/60 shadow-sm'
            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                autoRenewal ? 'bg-gold-500 text-slate-950 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                <RiRefreshLine size={18} className={autoRenewal ? 'animate-spin' : ''} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Auto Renewal Mode
                  </span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    autoRenewal
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gold-100 text-gold-800 border border-gold-300'
                  }`}>
                    +0.25% / Month Boost
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 mt-0.5 leading-relaxed">
                  {autoRenewal ? (
                    <span className="text-emerald-950 font-medium">
                      <strong>Auto Renewal ON:</strong> +0.25% monthly boost added to simulator returns. Total returns compound automatically into capital wallet.
                    </span>
                  ) : (
                    <span>
                      Toggle ON to simulate an additional <strong>+0.25% monthly ROI</strong> across every slab.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Interactive Switch with Visible Text */}
            <button
              type="button"
              onClick={() => setAutoRenewal(!autoRenewal)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs border shrink-0 ${
                autoRenewal
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-200'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              aria-label="Toggle Auto Renewal"
            >
              <div className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                autoRenewal ? 'bg-emerald-800' : 'bg-slate-300'
              }`}>
                <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${
                  autoRenewal ? 'translate-x-3' : 'translate-x-0'
                }`} />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wide">
                {autoRenewal ? 'ON' : 'OFF'}
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
            {[25, 100, 250, 500, 1000, 5000, 10000].map((preset) => (
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
