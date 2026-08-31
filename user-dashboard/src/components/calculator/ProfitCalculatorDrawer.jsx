import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { investmentPlans } from '../../data/userMockData';
import { RiCalculatorLine, RiArrowRightLine, RiInformationLine, RiFundsLine, RiSunLine, RiCopperCoinLine, RiCheckLine } from 'react-icons/ri';
import { UilBolt, UilClock } from '@iconscout/react-unicons';

const categories = [
  { id: 'all', label: 'All Categories', icon: RiFundsLine },
  { id: 'Renewable Energy', label: 'Renewable Energy', icon: RiSunLine },
  { id: 'Precious Metals', label: 'Precious Metals', icon: RiCopperCoinLine },
];

export default function ProfitCalculatorDrawer({ isOpen, onClose, onInvest, initialPlanId, plans = null }) {
  const allPlans = plans && plans.length > 0 ? plans : investmentPlans;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || allPlans[0]?.id || 'PLAN-001');
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
    return filteredPlans[0] || allPlans[0];
  }, [filteredPlans, selectedPlanId, allPlans]);

  // Real-time calculations
  const calculations = useMemo(() => {
    const numAmount = Number(amount);
    if (!currentPlan || !amount || isNaN(numAmount) || numAmount <= 0) {
      return {
        perCycle: '0.000',
        daily: '0.00',
        weekly: '0.00',
        monthly: '0.00',
        totalProfit: '0.00',
        finalReturns: '0.00',
      };
    }

    const roiRate = parseFloat(currentPlan.roiNumeric || currentPlan.roi || 12);
    const durationDays = currentPlan.durationDays || (parseInt(currentPlan.duration, 10) || 365);
    const dailyYield = (numAmount * (roiRate / 100)) / 365;
    const hourlyYield = dailyYield / 24;
    const weeklyYield = dailyYield * 7;
    const monthlyYield = dailyYield * 30;
    const totalProfit = dailyYield * durationDays;
    const finalReturns = numAmount + totalProfit;

    return {
      perCycle: hourlyYield.toFixed(3),
      daily: dailyYield.toFixed(2),
      weekly: weeklyYield.toFixed(2),
      monthly: monthlyYield.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      finalReturns: finalReturns.toFixed(2),
    };
  }, [currentPlan, amount]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Yield & Profit Calculator"
      subtitle="Simulate returns across Renewable Energy and Precious Metals portfolios."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button onClick={onClose} className="btn btn-secondary text-xs px-4 py-2.5">
            Close
          </button>
          <button
            onClick={() => {
              const numAmt = Number(amount) || currentPlan?.minAmount || 100;
              if (onInvest) onInvest(currentPlan, numAmt);
              onClose();
            }}
            className="btn btn-primary text-xs px-5 py-2.5 font-bold"
          >
            Invest {amount ? `$${Number(amount).toLocaleString()}` : ''} in {currentPlan?.name} <RiArrowRightLine size={14} />
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ──────── CATEGORY TABS (RENEWABLE ENERGY & PRECIOUS METALS) ──────── */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 block font-poppins">
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
                    const matching = cat.id === 'all' ? investmentPlans : investmentPlans.filter(p => p.category === cat.id);
                    if (matching.length > 0) setSelectedPlanId(matching[0].id);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold font-poppins transition-all ${
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

        {/* ──────── PLAN SELECT TILES / DROPDOWN ──────── */}
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 mb-2 block font-poppins">
            Select Contract Plan ({filteredPlans.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredPlans.map((plan) => {
              const isSelected = currentPlan?.id === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    if (amount !== '' && (Number(amount) < plan.minAmount || Number(amount) > plan.maxAmount)) {
                      setAmount(plan.minAmount);
                    }
                  }}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'card-gold border-gold-400 ring-2 ring-gold-300/60 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-poppins">{plan.name}</span>
                    <span className="badge badge-gold text-[9px] font-bold">{plan.roi}% / day</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-poppins">
                    <span>{plan.duration} {plan.durationUnit}</span>
                    <span className="font-semibold text-slate-700">${plan.minAmount} — ${plan.maxAmount?.toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──────── INVESTMENT AMOUNT INPUT & PRESET CHIPS ──────── */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 font-poppins">
              Investment Capital (USD)
            </label>
            <span className="text-xs text-slate-400 font-poppins">
              Min: ${currentPlan?.minAmount} — Max: ${currentPlan?.maxAmount?.toLocaleString()}
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
              min={currentPlan?.minAmount}
              max={currentPlan?.maxAmount}
              className="input !pl-9 font-bold text-lg text-slate-900"
              placeholder={String(currentPlan?.minAmount || 1000)}
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
            {[100, 500, 1000, 2500, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold font-poppins transition-all ${
                  Number(amount) === preset
                    ? 'bg-gold-100 text-gold-700 border border-gold-300 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                ${preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ──────── CALCULATED BREAKDOWN GRID (MATCHING SUNZEE1) ──────── */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-gold-50/70 via-white to-gold-100/40 border border-gold-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gold-200/60">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-gold-800 font-poppins flex items-center gap-1.5">
              <UilBolt size={16} className="text-gold-600" /> Projected Yield Breakdown
            </span>
            <span className="badge badge-gold text-[10px] font-bold">
              {currentPlan?.category} · {currentPlan?.roi}% / Day
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 font-poppins">Hourly Yield</p>
              <p className="text-base font-bold text-slate-900 font-display tabular-nums mt-1">${calculations.perCycle}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 font-poppins">Daily Profit</p>
              <p className="text-base font-bold text-emerald-600 font-display tabular-nums mt-1">${calculations.daily}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 font-poppins">Weekly Profit</p>
              <p className="text-base font-bold text-slate-900 font-display tabular-nums mt-1">${calculations.weekly}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center pt-0.5">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-slate-400 font-poppins">Monthly Profit</p>
              <p className="text-base font-bold text-slate-900 font-display tabular-nums mt-1">${calculations.monthly}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-emerald-700 font-poppins">Total Profit</p>
              <p className="text-lg font-black text-emerald-600 font-display tabular-nums mt-0.5">${calculations.totalProfit}</p>
            </div>
            <div className="p-3 rounded-xl bg-gold-100/80 border border-gold-300 shadow-xs">
              <p className="text-[10px] font-bold uppercase text-gold-800 font-poppins">Final Payout</p>
              <p className="text-lg font-black text-gold-700 font-display tabular-nums mt-0.5">${calculations.finalReturns}</p>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-poppins">
          <RiInformationLine size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p>
            Real-time returns are credited to your Earning Wallet every single second. 100% principal returned upon completion of the{' '}
            <strong className="text-slate-900">{currentPlan?.duration} days</strong> contract.
          </p>
        </div>
      </div>
    </Modal>
  );
}
