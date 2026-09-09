import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { RiCalculatorLine, RiArrowRightLine, RiInformationLine, RiFundsLine, RiSunLine, RiCopperCoinLine, RiCheckLine, RiFlashlightLine } from 'react-icons/ri';
import { UilBolt } from '@iconscout/react-unicons';

const categories = [
  { id: 'all', label: 'All Categories', icon: RiFundsLine },
  { id: 'Renewable Energy', label: 'Renewable Energy', icon: RiSunLine },
  { id: 'Precious Metal', label: 'Precious Metals', icon: RiCopperCoinLine },
];

export default function ProfitCalculatorDrawer({ isOpen, onClose, onInvest, initialPlanId, plans = [] }) {
  const allPlans = plans && plans.length > 0 ? plans : [];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || allPlans[0]?.id || allPlans[0]?._id || '');
  const [amount, setAmount] = useState(1000);

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

  // Real-time calculations based on Monthly ROI %
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

    const monthlyRoi = parseFloat(currentPlan.roiNumeric || currentPlan.roi || 1.5);
    const isInfinite =
      !!currentPlan.isInfinite ||
      currentPlan.duration?.toLowerCase().includes('infinite') ||
      currentPlan.duration?.toLowerCase().includes('lifetime');

    const durationDays = isInfinite ? 365 : (currentPlan.durationDays || 365);

    const monthlyYield = numAmount * (monthlyRoi / 100);
    const dailyYield = monthlyYield / 30;
    const weeklyYield = dailyYield * 7;
    const quarterlyYield = monthlyYield * 3;
    const annualYield = monthlyYield * 12;

    const totalProfit = dailyYield * durationDays;
    const finalReturns = numAmount + totalProfit;

    return {
      dailyRate: (monthlyRoi / 30).toFixed(3),
      weeklyRate: ((monthlyRoi / 30) * 7).toFixed(2),
      monthlyRate: monthlyRoi.toFixed(2),
      quarterlyRate: (monthlyRoi * 3).toFixed(1),
      annualRate: (monthlyRoi * 12).toFixed(1),
      daily: dailyYield.toFixed(2),
      weekly: weeklyYield.toFixed(2),
      monthly: monthlyYield.toFixed(2),
      quarterly: quarterlyYield.toFixed(2),
      annually: annualYield.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      finalReturns: finalReturns.toFixed(2),
      isInfinite,
      monthlyRoi,
    };
  }, [currentPlan, amount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yield & Profit Calculator"
      subtitle="Simulate returns across Renewable Energy, Precious Metals & Custom portfolios."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <button onClick={onClose} className="btn btn-secondary text-xs px-4 py-2.5">
            Close
          </button>
          <button
            onClick={() => {
              const numAmt = Number(amount) || currentPlan?.minAmountNumeric || 100;
              if (onInvest) onInvest(currentPlan, numAmt);
              onClose();
            }}
            className="btn btn-primary text-xs px-5 py-2.5 font-bold cursor-pointer"
          >
            Invest {amount ? `$${Number(amount).toLocaleString()}` : ''} in {currentPlan?.name} <RiArrowRightLine size={14} />
          </button>
        </div>
      }
    >
      <div className="space-y-5 font-poppins">
        {/* ──────── CATEGORY TABS ──────── */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 block">
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
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 block">
            Select Contract Plan ({filteredPlans.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-44 overflow-y-auto pr-1">
            {filteredPlans.map((plan) => {
              const isSelected = currentPlan?.id === plan.id || currentPlan?._id === plan._id;
              return (
                <button
                  key={plan.id || plan._id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id || plan._id);
                    if (amount !== '' && (Number(amount) < (plan.minAmountNumeric || 100))) {
                      setAmount(plan.minAmountNumeric || 100);
                    }
                  }}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'card-gold border-gold-400 ring-2 ring-gold-300/60 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{plan.name}</span>
                    <span className="badge badge-gold text-[9px] font-bold">{plan.roiNumeric || plan.roi}% / mo</span>
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

        {/* ──────── INVESTMENT AMOUNT INPUT & PRESET CHIPS ──────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
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
              min={currentPlan?.minAmountNumeric || 100}
              className="input !pl-9 font-bold text-lg text-slate-900"
              placeholder={String(currentPlan?.minAmountNumeric || 1000)}
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 flex-wrap">
            {[currentPlan?.minAmountNumeric, 1000, 2500, 5000, 10000, 25000, 50000].filter(Boolean).map((preset) => (
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
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50/90 via-amber-50/50 to-emerald-50/40 border border-gold-300/80 space-y-3.5 shadow-xs">
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
            <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Daily (24h)</p>
              <p className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 truncate">+${calculations.daily}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.dailyRate}%</p>
            </div>

            <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Weekly (7d)</p>
              <p className="text-xs font-extrabold text-blue-600 font-mono mt-0.5 truncate">+${calculations.weekly}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.weeklyRate}%</p>
            </div>

            <div className="p-2.5 bg-white rounded-xl text-center border border-gold-300 shadow-2xs ring-1 ring-gold-200 bg-gradient-to-b from-white to-gold-50/40">
              <p className="text-[10px] text-gold-700 font-bold uppercase tracking-wider">Monthly (30d)</p>
              <p className="text-xs font-extrabold text-gold-700 font-mono mt-0.5 truncate">+${calculations.monthly}</p>
              <p className="text-[10px] text-gold-800 font-bold mt-0.5 font-mono">{calculations.monthlyRate}% / mo</p>
            </div>

            <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Quarterly (90d)</p>
              <p className="text-xs font-extrabold text-purple-600 font-mono mt-0.5 truncate">+${calculations.quarterly}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">{calculations.quarterlyRate}%</p>
            </div>

            <div className="p-2.5 bg-white rounded-xl text-center border border-gold-200 shadow-2xs col-span-2 sm:col-span-1">
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

        {/* Live Streaming Info Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <RiFlashlightLine size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p>
            Real-time returns are credited directly to your Earning Wallet every second. {calculations.isInfinite ? "Contract operates on a continuous lifetime duration." : "100% principal unlocks upon completion of the contract term."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
