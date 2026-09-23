import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import {
  RiCalculatorLine, RiArrowRightLine, RiInformationLine, RiFundsLine,
  RiSunLine, RiCopperCoinLine, RiCheckLine, RiFlashlightLine, RiSparklingLine,
  RiRefreshLine, RiBuilding2Line, RiRocketLine,
} from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';
import { getPlans } from '../../api/plansApi';

export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: null, noMaxLimit: true, dailyRoi: 0.3, lockInDailyRoi: 0.8, monthlyRoi: 9.0, lockInMonthlyRoi: 24.0, annualRoi: 108.0, lockInAnnualRoi: 288.0 },
];

export const ROI_SLABS_TABLE = [
  {
    amount: "10$ to Unlimited",
    period: "",
    periodDays: 0,
    withoutLockIn: 0.3,
    cap3X: 0.8,
  },
  {
    amount: "Non Withdrawal Bonus",
    period: "30",
    periodDays: 30,
    withoutLockIn: 0.35,
    cap3X: 0.9,
  },
  {
    amount: "Non Withdrawal Bonus",
    period: "60",
    periodDays: 60,
    withoutLockIn: 0.4,
    cap3X: 1.0,
  },
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
              const maxDaily = roiSlabs[roiSlabs.length - 1]?.lockInDailyRoi || roiSlabs[roiSlabs.length - 1]?.dailyRoi || 0.9;

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
                lockInPeriodDays: p.lockInPeriodDays || 333,
                singleIdMaxWithdrawal: p.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed",
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
  const [lockInPeriod, setLockInPeriod] = useState('none'); // 'none' | '3x_cap'
  const [selectedSlabPeriod, setSelectedSlabPeriod] = useState(0); // 0 (Base), 30 (30 Days), 60 (60 Days)

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

    const isLockIn = lockInPeriod === '3x_cap' || lockInPeriod === '333_days' || lockInPeriod === '3X Cap' || lockInPeriod === 'lock_in';
    
    // Determine dynamic base daily ROI based on Non-Withdrawal Bonus duration
    let baseDailyRoi = 0.3;
    if (isLockIn) {
      if (selectedSlabPeriod === 60) {
        baseDailyRoi = 1.0;
      } else if (selectedSlabPeriod === 30) {
        baseDailyRoi = 0.9;
      } else {
        baseDailyRoi = Number(activeMatchedSlab?.lockInDailyRoi) || 0.8;
      }
    } else {
      if (selectedSlabPeriod === 60) {
        baseDailyRoi = 0.4;
      } else if (selectedSlabPeriod === 30) {
        baseDailyRoi = 0.35;
      } else {
        baseDailyRoi = Number(activeMatchedSlab?.dailyRoi) || 0.3;
      }
    }

    const baseMonthlyRoi = Number((baseDailyRoi * 30).toFixed(2));
    const baseAnnualRoi = Number((baseDailyRoi * 360).toFixed(2));

    const dailyRoi = baseDailyRoi;
    const monthlyRoi = baseMonthlyRoi;
    const annualRoi = baseAnnualRoi;

    const isInfinite =
      !isLockIn && (
        !!currentPlan.isInfinite ||
        currentPlan.duration?.toLowerCase().includes('infinite') ||
        currentPlan.duration?.toLowerCase().includes('lifetime')
      );

    const durationDays = isInfinite ? 365 : (currentPlan.durationDays || 365);

    const dailyYield = numAmount * (dailyRoi / 100);
    const weeklyYield = dailyYield * 7;
    const monthlyYield = dailyYield * 30;
    const sixtyDaysYield = dailyYield * 60;
    const quarterlyYield = monthlyYield * 3;
    const annualYield = dailyYield * 360;

    // Progressive holding calculations for Day 30 vs 31 and Day 60 vs 61
    const baseDailyPercent = isLockIn ? 0.80 : 0.30;
    const tier1DailyPercent = isLockIn ? 0.90 : 0.35;
    const tier2DailyPercent = isLockIn ? 1.00 : 0.40;

    const profitDay30 = numAmount * (baseDailyPercent / 100) * 30;
    const roiDay30 = Number((baseDailyPercent * 30).toFixed(2));

    const profitDay31 = profitDay30 + numAmount * (tier1DailyPercent / 100);
    const roiDay31 = Number((roiDay30 + tier1DailyPercent).toFixed(2));

    const profitDay60 = profitDay30 + (numAmount * (tier1DailyPercent / 100) * 30);
    const roiDay60 = Number((roiDay30 + (tier1DailyPercent * 30)).toFixed(2));

    const profitDay61 = profitDay60 + numAmount * (tier2DailyPercent / 100);
    const roiDay61 = Number((roiDay60 + tier2DailyPercent).toFixed(2));

    const profitDay90 = profitDay60 + (numAmount * (tier2DailyPercent / 100) * 30);
    const roiDay90 = Number((roiDay60 + (tier2DailyPercent * 30)).toFixed(2));

    const profitAnnualWithoutLock = profitDay60 + (numAmount * (tier2DailyPercent / 100) * 300);
    const roiAnnualWithoutLock = Number((roiDay60 + (tier2DailyPercent * 300)).toFixed(2));

    const totalProfit = dailyYield * durationDays;
    const finalReturns = numAmount + totalProfit;

    return {
      dailyRate: dailyRoi.toFixed(3),
      weeklyRate: (dailyRoi * 7).toFixed(2),
      monthlyRate: monthlyRoi.toFixed(2),
      sixtyDaysRate: (dailyRoi * 60).toFixed(1),
      quarterlyRate: (monthlyRoi * 3).toFixed(1),
      annualRate: annualRoi.toFixed(1),
      daily: dailyYield.toFixed(2),
      weekly: weeklyYield.toFixed(2),
      monthly: monthlyYield.toFixed(2),
      sixtyDays: sixtyDaysYield.toFixed(2),
      quarterly: quarterlyYield.toFixed(2),
      annually: annualYield.toFixed(2),
      profitDay30: profitDay30.toFixed(2),
      roiDay30,
      profitDay31: profitDay31.toFixed(2),
      roiDay31,
      profitDay60: profitDay60.toFixed(2),
      roiDay60,
      profitDay61: profitDay61.toFixed(2),
      roiDay61,
      profitDay90: profitDay90.toFixed(2),
      roiDay90,
      profitAnnualWithoutLock: profitAnnualWithoutLock.toFixed(2),
      roiAnnualWithoutLock,
      baseDailyPercent,
      tier1DailyPercent,
      tier2DailyPercent,
      totalProfit: totalProfit.toFixed(2),
      finalReturns: finalReturns.toFixed(2),
      isInfinite,
      dailyRoi,
      monthlyRoi,
      annualRoi,
      isLockIn,
    };
  }, [currentPlan, amount, activeMatchedSlab, lockInPeriod, selectedSlabPeriod]);

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

        {/* ──────── ROI SLABS PER DAY TABLE (SPREADSHEET STANDARD) ──────── */}
        <div className="rounded-2xl border border-gold-300 overflow-hidden shadow-xs bg-white font-poppins">
          <div className="bg-yellow-300 px-3.5 py-2 flex items-center justify-between text-slate-950 border-b border-yellow-400">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <RiSparklingLine size={15} className="text-slate-950" />
              ROI Slabs Per Day
            </span>
            <span className="text-[10px] font-black bg-slate-950 text-gold-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {calculations.isLockIn ? 'Mode: 3X Cap' : 'Mode: Without Lock-In'} &bull; {calculations.dailyRate}% / day
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-yellow-50 border-b border-yellow-200/80 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-yellow-200/60">Amount</th>
                  <th className="py-2.5 px-3 text-center border-r border-yellow-200/60">Period (Days)</th>
                  {!calculations.isLockIn ? (
                    <th className="py-2.5 px-3 text-center text-emerald-800">Without Lock In Period (Daily ROI)</th>
                  ) : (
                    <th className="py-2.5 px-3 text-center text-amber-900">3X Cap (Daily ROI)</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/60 font-medium text-slate-700">
                {ROI_SLABS_TABLE.map((row, idx) => {
                  const isLocked = calculations.isLockIn;
                  const isSelected = selectedSlabPeriod === row.periodDays;

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedSlabPeriod(row.periodDays)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-100/90 font-bold text-slate-950 ring-1 ring-inset ring-yellow-400'
                          : 'hover:bg-amber-50/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-amber-100/60">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />}
                          <span>{row.amount}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 border-r border-amber-100/60">
                        {row.period || '—'}
                      </td>
                      {!calculations.isLockIn ? (
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 bg-emerald-50/50">
                          {row.withoutLockIn}% / day
                        </td>
                      ) : (
                        <td className="py-2.5 px-3 text-center font-mono font-black text-amber-800 bg-amber-50/70">
                          {row.cap3X}% / day
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Explanatory Policy Banner in English */}
          <div className="p-2.5 bg-amber-50/90 border-t border-yellow-200 text-[11px] text-amber-950 flex items-start gap-2">
            <RiInformationLine size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold">Non-Withdrawal Bonus Policy:</span>
              <span className="text-slate-700 ml-1">
                {calculations.isLockIn ? (
                  <>If no withdrawal is made for <strong>30 days</strong>, daily ROI increases to <strong>0.90%</strong>. If no withdrawal is made for <strong>60 days</strong>, daily ROI increases to <strong>1.00%</strong> (3X profit cap).</>
                ) : (
                  <>If no withdrawal is made for <strong>30 days</strong>, daily ROI increases to <strong>0.35%</strong>. If no withdrawal is made for <strong>60 days</strong>, daily ROI increases to <strong>0.40%</strong>.</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ──────── ROI & CONTRACT MODE SWITCH TAB ──────── */}
        <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600">
              ROI & Contract Mode *
            </label>
            <span className="text-[11px] font-bold text-slate-500">
              {lockInPeriod === 'none' ? 'Standard 0.30% - 0.40% / Day' : 'Boosted 0.80% - 1.00% / Day (3X Cap)'}
            </span>
          </div>

          {/* Segmented Switch Tab Bar */}
          <div className="p-1 bg-white rounded-2xl border border-slate-200 grid grid-cols-2 gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setLockInPeriod('none')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                lockInPeriod === 'none'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-500'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm">🔓</span>
              <div className="text-left flex flex-col">
                <span className="leading-tight">Without Lock In Period</span>
                <span className={`text-[9.5px] font-semibold ${lockInPeriod === 'none' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  0.3% - 0.4% / Day
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLockInPeriod('3x_cap')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                lockInPeriod === '3x_cap' || lockInPeriod === '333_days' || lockInPeriod === '3X Cap'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm">🔒</span>
              <div className="text-left flex flex-col">
                <span className="leading-tight">3X Cap</span>
                <span className={`text-[9.5px] font-semibold ${lockInPeriod === '3x_cap' || lockInPeriod === '333_days' || lockInPeriod === '3X Cap' ? 'text-amber-950' : 'text-amber-700'}`}>
                  0.8% - 1.0% / Day • 3X Cap
                </span>
              </div>
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
              <UilBolt size={16} className="text-gold-600" /> Projected ROI & Return Simulator ({calculations.isLockIn ? '3X Cap' : 'Without Lock In Period'})
            </span>
            <span className="badge badge-gold text-[10px] font-bold">
              {calculations.isLockIn ? '300% Profit Cap' : `${calculations.annualRate}% Annual APY`}
            </span>
          </div>

          {/* 3x2 Periodic Cards Grid (Daily, Weekly, Monthly 30/31d, 60/61d, Quarterly, Annually/3X) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Daily (24h) */}
            <div
              onClick={() => setSelectedSlabPeriod(0)}
              className={`p-3.5 bg-white rounded-2xl shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${
                selectedSlabPeriod === 0
                  ? 'border-2 border-gold-400 ring-2 ring-gold-300/60 bg-gradient-to-b from-white to-gold-50/40 shadow-sm'
                  : 'border border-slate-200 hover:border-gold-300'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Daily Yield</span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap border border-slate-200">
                  24 Hours
                </span>
              </div>
              <div className="my-2.5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">
                    +${calculations.daily}
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {calculations.baseDailyPercent}% / day
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Standard 24h base return</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 truncate">
                Real-time live streaming return
              </p>
            </div>

            {/* 2. Weekly (7d) */}
            <div
              onClick={() => setSelectedSlabPeriod(0)}
              className="p-3.5 bg-white rounded-2xl shadow-2xs border border-slate-200 hover:border-gold-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Weekly Return</span>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap border border-blue-200">
                  7 Days
                </span>
              </div>
              <div className="my-2.5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">
                    +${calculations.weekly}
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200">
                    {(calculations.baseDailyPercent * 7).toFixed(2)}% (7d)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">7 consecutive days @ {calculations.baseDailyPercent}%/d</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 truncate">
                Weekly accumulated earnings
              </p>
            </div>

            {/* 3. Monthly (30d • 31d Boost) */}
            <div
              onClick={() => setSelectedSlabPeriod(30)}
              className={`p-3.5 bg-white rounded-2xl shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${
                selectedSlabPeriod === 30
                  ? 'border-2 border-emerald-500 ring-2 ring-emerald-300/80 bg-emerald-50/30 shadow-sm'
                  : 'border border-emerald-200 bg-emerald-50/15 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-emerald-100">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Monthly (31d)
                </span>
                <span className="text-[9.5px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                  +{calculations.tier1DailyPercent}%/d ⚡
                </span>
              </div>
              <div className="my-1.5 space-y-1.5">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block leading-tight">Day 30 (Withdraw)</span>
                    <span className="text-[9px] text-slate-400 font-mono">{calculations.roiDay30}% @ {calculations.baseDailyPercent}%/d</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-xs">+${calculations.profitDay30}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300/80 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-900 block leading-tight">Day 31 (Hold Bonus)</span>
                    <span className="text-[9px] text-emerald-700 font-mono font-semibold">{calculations.roiDay31}% • {calculations.tier1DailyPercent}%/d ⚡</span>
                  </div>
                  <span className="font-mono font-black text-emerald-700 text-xs">+${calculations.profitDay31}</span>
                </div>
              </div>
              <p className="text-[9.5px] text-emerald-800 font-medium leading-tight border-t border-emerald-100 pt-1.5">
                Hold past 30 days: rate upgrades to <strong>{calculations.tier1DailyPercent}%/d</strong> (+${(Number(calculations.profitDay31) - Number(calculations.profitDay30)).toFixed(2)})
              </p>
            </div>

            {/* 4. 60 Days (60d • 61d Max Boost) */}
            <div
              onClick={() => setSelectedSlabPeriod(60)}
              className={`p-3.5 bg-white rounded-2xl shadow-2xs transition-all cursor-pointer flex flex-col justify-between ${
                selectedSlabPeriod === 60
                  ? 'border-2 border-amber-500 ring-2 ring-amber-300/80 bg-amber-50/30 shadow-sm'
                  : 'border border-amber-200 bg-amber-50/15 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-amber-100">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  60 Days (60d • 61d)
                </span>
                <span className="text-[9.5px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                  +{calculations.tier2DailyPercent}%/d 🚀
                </span>
              </div>
              <div className="my-1.5 space-y-1.5">
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 block leading-tight">Day 60 (Withdraw)</span>
                    <span className="text-[9px] text-slate-400 font-mono">{calculations.roiDay60}% @ {calculations.tier1DailyPercent}%/d</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-xs">+${calculations.profitDay60}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-100/70 border border-amber-300/80 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-950 block leading-tight">Day 61 (Max Boost)</span>
                    <span className="text-[9px] text-amber-800 font-mono font-semibold">{calculations.roiDay61}% • {calculations.tier2DailyPercent}%/d 🚀</span>
                  </div>
                  <span className="font-mono font-black text-amber-800 text-xs">+${calculations.profitDay61}</span>
                </div>
              </div>
              <p className="text-[9.5px] text-amber-900 font-medium leading-tight border-t border-amber-100 pt-1.5">
                Hold past 60 days: max rate unlocks at <strong>{calculations.tier2DailyPercent}%/d</strong> (+${(Number(calculations.profitDay61) - Number(calculations.profitDay60)).toFixed(2)})
              </p>
            </div>

            {/* 5. Quarterly (90d) */}
            <div
              onClick={() => setSelectedSlabPeriod(60)}
              className="p-3.5 bg-white rounded-2xl shadow-2xs border border-purple-200 bg-purple-50/15 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">Quarterly Yield</span>
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap border border-purple-200">
                  90 Days
                </span>
              </div>
              <div className="my-2.5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">
                    +${calculations.profitDay90}
                  </span>
                  <span className="text-xs font-bold text-purple-900 font-mono bg-purple-100/60 px-2 py-0.5 rounded border border-purple-200">
                    {calculations.roiDay90}% (90d)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  30d @ {calculations.baseDailyPercent}% + 30d @ {calculations.tier1DailyPercent}% + 30d @ {calculations.tier2DailyPercent}%
                </p>
              </div>
              <p className="text-[10px] text-purple-700 font-medium border-t border-purple-100 pt-1.5 truncate">
                Includes Day 31 & 61 tier upgrades
              </p>
            </div>

            {/* 6. Annually (12m) / 3X Cap */}
            <div
              className="p-3.5 bg-white rounded-2xl shadow-2xs border border-gold-300 bg-gold-50/25 hover:border-gold-400 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-gold-200">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  {calculations.isLockIn ? '3X Cap Limit' : 'Annual Yield'}
                </span>
                <span className="text-[9.5px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                  {calculations.isLockIn ? '300% Cap' : `${calculations.roiAnnualWithoutLock}% APY`}
                </span>
              </div>
              <div className="my-2.5 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
                    +${calculations.isLockIn ? ((Number(amount) || 0) * 3).toFixed(2) : calculations.profitAnnualWithoutLock}
                  </span>
                  <span className="text-xs font-bold text-amber-950 font-mono bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                    {calculations.isLockIn ? '300% Profit' : `${calculations.roiAnnualWithoutLock}% APY`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {calculations.isLockIn
                    ? `Total Contract Return: $${((Number(amount) || 0) * 4).toFixed(2)}`
                    : `Running at ${calculations.tier2DailyPercent}%/day max tier`
                  }
                </p>
              </div>
              <p className="text-[10px] text-amber-900 font-medium border-t border-gold-200 pt-1.5 truncate">
                {calculations.isLockIn ? 'Contract completes upon reaching 300% profit' : 'Continuous real-time streaming annual yield'}
              </p>
            </div>
          </div>

          {/* Total Maturity & Projected Summary */}
          <div className="p-3 bg-white/95 rounded-xl border border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <p className="font-bold text-gray-800 flex items-center gap-1.5">
                <RiInformationLine className="text-gold-500" size={15} />
                {calculations.isLockIn ? '3X Cap Contract Maturity:' : 'Continuous Real-time Yield Stream:'}
              </p>
              <p className="text-[11px] text-gray-500">
                {calculations.isLockIn ? (
                  <>Principal (${(Number(amount) || 0).toLocaleString()}) + 300% Max Profit (+${((Number(amount) || 0) * 3).toFixed(2)})</>
                ) : (
                  <>Principal (${(Number(amount) || 0).toLocaleString()}) + 1-Year Projected Return (+${calculations.annually})</>
                )}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                {calculations.isLockIn ? 'Total 3X Maturity Value' : '1-Year Projected Maturity Value'}
              </p>
              <span className="text-base font-extrabold text-emerald-700 font-mono">
                ${calculations.isLockIn
                  ? ((Number(amount) || 0) + ((Number(amount) || 0) * 3)).toFixed(2)
                  : (calculations.isInfinite ? (Number(amount) || 0) + Number(calculations.annually) : Number(calculations.finalReturns)).toFixed(2)
                }
              </span>
            </div>
          </div>
        </div>

        {/* Live Streaming Info Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <RiFlashlightLine size={14} className="text-amber-600" />
          </div>
          <p>
            Real-time returns stream directly to your Earning Wallet every second ({calculations.daily ? `$${(Number(calculations.daily) / 86400).toFixed(6)} / sec` : '$0.00 / sec'}). Live returns stream automatically into your wallet every second.
          </p>
        </div>
      </div>
    </Modal>
  );
}
