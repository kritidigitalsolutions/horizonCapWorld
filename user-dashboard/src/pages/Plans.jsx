import React, { useState, useEffect, useMemo } from 'react';
import { getPlans, investInPlan } from '../api/plansApi';
import {
  RiPercentLine, RiTimeLine, RiShieldFlashLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiCalculatorLine, RiArrowRightLine, RiWalletLine,
  RiCheckLine, RiSearchLine, RiAlertLine, RiInformationLine, RiStackLine,
  RiArrowDownSLine, RiArrowUpSLine, RiSparklingLine,
} from 'react-icons/ri';
import { UilMoneyBill } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ProfitCalculatorDrawer from '../components/calculator/ProfitCalculatorDrawer';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';

export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: 49, noMaxLimit: false, dailyRoi: 0.25, monthlyRoi: 7.5, annualRoi: 90 },
  { minAmount: 50, maxAmount: 99, noMaxLimit: false, dailyRoi: 0.35, monthlyRoi: 10.5, annualRoi: 126 },
  { minAmount: 100, maxAmount: 499, noMaxLimit: false, dailyRoi: 0.55, monthlyRoi: 16.5, annualRoi: 198 },
  { minAmount: 500, maxAmount: 1500, noMaxLimit: false, dailyRoi: 0.75, monthlyRoi: 22.5, annualRoi: 270 },
  { minAmount: 1500, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, monthlyRoi: 30.0, annualRoi: 360 },
];

// Helper to find matching slab for an amount
export function matchRoiSlab(amount, slabs = []) {
  const num = Number(amount) || 0;
  const list = slabs && slabs.length > 0 ? slabs : DEFAULT_ROI_SLABS;
  const found = list.find((s) => {
    const min = Number(s.minAmount) || 0;
    const max = s.noMaxLimit || !s.maxAmount ? Infinity : Number(s.maxAmount);
    return num >= min && num <= max;
  });
  if (found) return found;
  const sorted = [...list].sort(
    (a, b) => (Number(b.minAmount) || 0) - (Number(a.minAmount) || 0)
  );
  if (sorted.length > 0 && num >= (Number(sorted[0].minAmount) || 0)) {
    return sorted[0];
  }
  return list[0];
}

export default function Plans() {
  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState([]);
  const { user, refreshUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calcPlan, setCalcPlan] = useState(null);
  const [investDrawerOpen, setInvestDrawerOpen] = useState(false);
  const [calcDrawerOpen, setCalcDrawerOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState(100);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [investError, setInvestError] = useState('');
  const [expandedSlabsPlanId, setExpandedSlabsPlanId] = useState(null);

  const categories = ['all', 'Renewable Energy', 'Precious Metal', 'Real Estate', 'Venture Capital'];

  const fetchPlans = async () => {
    try {
      const res = await getPlans();
      if (res?.success && Array.isArray(res.plans)) {
        const formatted = res.plans.map(p => {
          const isInf = !!p.isInfinite || p.duration?.toLowerCase().includes("infinite") || p.duration?.toLowerCase().includes("lifetime");
          const slabs = Array.isArray(p.roiSlabs) && p.roiSlabs.length > 0
            ? p.roiSlabs
            : DEFAULT_ROI_SLABS;

          const minDaily = slabs[0]?.dailyRoi || 0.25;
          const maxDaily = slabs[slabs.length - 1]?.dailyRoi || 1.0;

          return {
            _id: p._id,
            id: p._id || p.customId,
            name: p.name,
            category: p.category || 'Renewable Energy',
            roiType: p.roiType || 'slab',
            roiSlabs: slabs,
            dailyRoi: p.dailyRoi || minDaily,
            minDaily,
            maxDaily,
            roi: typeof p.roi === 'string' ? p.roi : `${p.roi || 7.5}%`,
            roiNumeric: parseFloat(p.roi) || (minDaily * 30),
            minAmount: `$${(p.minAmount || slabs[0]?.minAmount || 10).toLocaleString()}`,
            minAmountNumeric: p.minAmount || slabs[0]?.minAmount || 10,
            maxAmount: p.noMaxLimit ? 'No Limit' : (p.maxAmount ? `$${p.maxAmount.toLocaleString()}` : 'No Limit'),
            maxAmountNumeric: p.maxAmount || 1000000,
            duration: isInf ? "∞ Lifetime" : (p.duration || `${p.durationDays || 365} Days`),
            durationDays: isInf ? 0 : (p.durationDays || 365),
            isInfinite: isInf,
            investors: p.investors || 0,
            status: p.status || 'Active',
            payoutInterval: p.payoutInterval || 'Per Second (Live)',
            description: p.description || '',
          };
        });
        setPlansList(formatted);
      } else {
        setPlansList([]);
      }
    } catch (err) {
      console.warn('Error fetching investment plans:', err.message);
      setPlansList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenInvest = (plan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minAmountNumeric || 100);
    setInvestSuccess(false);
    setInvestError('');
    setInvestDrawerOpen(true);
  };

  const handleOpenCalculator = (plan) => {
    setCalcPlan(plan);
    setCalcDrawerOpen(true);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedPlan || !investAmount || investAmount <= 0) return;
    setInvestError('');
    
    // Check wallet balance
    if ((user?.depositWallet || 0) < Number(investAmount)) {
      setInvestError(`Insufficient Deposit Wallet balance ($${(user?.depositWallet || 0).toLocaleString()} USD). Please deposit funds first.`);
      return;
    }

    setInvestSubmitting(true);
    try {
      const res = await investInPlan(selectedPlan._id || selectedPlan.id, Number(investAmount));
      if (res?.success) {
        setInvestSuccess(true);
        if (refreshUser) await refreshUser();
        await fetchPlans();
        setTimeout(() => {
          setInvestDrawerOpen(false);
          setInvestSuccess(false);
          setInvestSubmitting(false);
        }, 2000);
      } else {
        setInvestError(res?.message || 'Failed to execute investment.');
        setInvestSubmitting(false);
      }
    } catch (err) {
      setInvestError(err.response?.data?.message || err.message || 'Investment failed.');
      setInvestSubmitting(false);
    }
  };

  const filtered = plansList.filter(plan => {
    const matchSearch = plan.name?.toLowerCase().includes(search.toLowerCase()) ||
      plan.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || plan.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Dynamic Slab Matching in Invest Modal
  const activeMatchedSlab = useMemo(() => {
    if (!selectedPlan) return null;
    return matchRoiSlab(investAmount, selectedPlan.roiSlabs);
  }, [selectedPlan, investAmount]);

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* ──────── PAGE HEADER & TOP ACTION ──────── */}
      <PageHeader
        title="Investment Plans"
        subtitle="Explore institutional asset contracts with dynamic Amount-Wise Daily ROI percentage slabs"
        badge="Asset Engine"
        actions={
          <button
            onClick={() => { setCalcPlan(null); setCalcDrawerOpen(true); }}
            className="btn btn-outline-gold text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RiCalculatorLine size={16} /> Open Yield Calculator
          </button>
        }
      />

      {/* Category Filter Pills & Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            placeholder="Search plans by name or category..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 font-poppins">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-gold-400 text-gray-900 shadow-gold font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────── PLANS CARD GRID ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((plan, i) => {
          const isRenewable = plan.category === 'Renewable Energy';
          const isMetal = plan.category === 'Precious Metal';
          const isExpanded = expandedSlabsPlanId === plan.id;
          const slabs = plan.roiSlabs || DEFAULT_ROI_SLABS;

          return (
            <div
              key={plan.id}
              className="card card-gold p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                {/* Top: Category Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${
                      isRenewable ? 'bg-emerald-50 text-emerald-600' :
                      isMetal ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {isRenewable ? <RiLeafLine size={22} /> :
                       isMetal ? <RiCoinsLine size={22} /> : <RiShieldFlashLine size={22} />}
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isRenewable ? 'bg-emerald-100/70 text-emerald-800' :
                        isMetal ? 'bg-amber-100/70 text-amber-800' : 'bg-blue-100/70 text-blue-800'
                      }`}>
                        {plan.category || 'Standard'}
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-success text-[10px] font-bold">
                    {plan.status}
                  </span>
                </div>

                {/* Plan Title */}
                <h3 className="text-lg font-bold text-gray-800 font-display mb-3 line-clamp-1 group-hover:text-gold-600 transition-colors">
                  {plan.name}
                </h3>

                {/* Amount-Wise Daily ROI Highlight Box */}
                <div className="p-3.5 bg-gradient-to-r from-gold-50/90 to-amber-50/50 rounded-xl border border-gold-200/60 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs text-gold-700 font-bold font-poppins">
                      <RiFlashlightLine size={15} className="text-amber-500 animate-pulse" />
                      Daily ROI Slabs
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-display">
                      {plan.minDaily}% – {plan.maxDaily}% Daily
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40 font-poppins">
                    <span>Monthly (Annual APY)</span>
                    <span className="font-bold text-gray-800 font-mono">
                      {(plan.minDaily * 30).toFixed(1)}% – {(plan.maxDaily * 30).toFixed(1)}% / mo ({(plan.minDaily * 360).toFixed(0)}% – {(plan.maxDaily * 360).toFixed(0)}% APY)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 font-poppins">
                    <span>Payout Mode</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {plan.payoutInterval || 'Per Second (Live)'}
                    </span>
                  </div>
                </div>

                {/* Key Specs */}
                <div className="space-y-2.5 mb-4 text-sm font-poppins">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <UilMoneyBill size={16} /> Investment Range
                    </span>
                    <span className="font-bold text-gray-800 text-xs">
                      {plan.minAmount} — {plan.maxAmount || 'No Limit'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <RiTimeLine size={16} /> Duration
                    </span>
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                      {plan.isInfinite ? (
                        <span className="inline-flex items-center gap-1 text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 font-extrabold text-[11px]">
                          <span>∞</span> Lifetime
                        </span>
                      ) : (
                        plan.duration
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <RiPercentLine size={16} /> Active Investors
                    </span>
                    <span className="font-semibold text-gold-600 text-xs">{plan.investors} Users</span>
                  </div>
                </div>

                {/* Amount-Wise Slabs Accordion */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setExpandedSlabsPlanId(isExpanded ? null : plan.id)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-gold-100/60 hover:bg-gold-100 text-gold-950 border border-gold-300/80 text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <RiStackLine size={14} className="text-gold-700" />
                      <span>View 5 Amount-Wise ROI Slabs</span>
                    </span>
                    {isExpanded ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-gold-200 space-y-1.5 animate-fade-in text-[11px] font-poppins">
                      <div className="grid grid-cols-3 font-bold text-gray-500 uppercase text-[9.5px] pb-1 border-b border-gray-200">
                        <span>Amount Slab</span>
                        <span className="text-center">Daily ROI</span>
                        <span className="text-right">Monthly (Annual)</span>
                      </div>
                      {slabs.map((slab, idx) => (
                        <div key={idx} className="grid grid-cols-3 items-center py-1 border-b border-gray-100 last:border-none">
                          <span className="font-semibold text-gray-800">
                            ${slab.minAmount} — {slab.noMaxLimit || !slab.maxAmount ? "1500$ ++" : `$${slab.maxAmount}`}
                          </span>
                          <span className="text-center font-bold text-emerald-600 font-mono">
                            {slab.dailyRoi}% / d
                          </span>
                          <span className="text-right font-semibold text-gray-600 font-mono">
                            {slab.monthlyRoi || (slab.dailyRoi * 30).toFixed(1)}% ({slab.annualRoi || (slab.dailyRoi * 360).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenCalculator(plan)}
                  className="btn btn-secondary text-xs py-2.5 flex-1 font-bold rounded-xl shadow-xs"
                >
                  <RiCalculatorLine size={14} /> Calculate
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInvest(plan)}
                  className="btn btn-primary text-xs py-2.5 flex-1 font-bold rounded-xl shadow-xs"
                >
                  Invest Now <RiArrowRightLine size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400 font-poppins">No investment plans found matching your search.</p>
        </div>
      )}

      {/* ──────────────── INVEST IN PLAN SLIDE-OVER DRAWER ──────────────── */}
      <Modal
        isOpen={investDrawerOpen}
        onClose={() => setInvestDrawerOpen(false)}
        title={`Invest in ${selectedPlan?.name || 'Plan'}`}
        subtitle={`Amount-Wise Daily ROI Slabs &bull; Contract: ${selectedPlan?.duration}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setInvestDrawerOpen(false)} className="btn btn-secondary text-xs px-4 py-2.5">
              Cancel
            </button>
            <button
              onClick={handleConfirmInvestment}
              disabled={investSuccess || investSubmitting}
              className="btn btn-primary text-xs px-6 py-2.5 font-bold cursor-pointer disabled:opacity-50"
            >
              {investSubmitting ? 'Activating Contract...' : investSuccess ? 'Investment Activated!' : `Confirm $${Number(investAmount || 0).toLocaleString()} Investment`}
            </button>
          </div>
        }
      >
        <div className="space-y-4 font-poppins">
          {investSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-poppins flex items-center gap-2">
              <RiCheckLine size={20} /> Contract successfully activated! Real-time streaming ROI has begun.
            </div>
          )}

          {investError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-poppins flex items-center gap-2">
              <RiAlertLine size={20} className="flex-shrink-0" /> {investError}
            </div>
          )}

          {/* Wallet Balance Info */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <RiWalletLine size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400 font-poppins">Deposit Wallet Balance</p>
                <p className="text-base font-bold text-slate-900 font-display">${(user?.depositWallet || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            {(user?.depositWallet || 0) < Number(investAmount) && (
              <span className="badge badge-danger text-[10px]">Low Balance</span>
            )}
          </div>

          {/* ──────── 5 AMOUNT-WISE DAILY ROI PERCENTAGE SLABS TABLE ──────── */}
          <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-gold-50/40 to-white rounded-2xl border border-gold-300 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-gold-950 flex items-center gap-1.5">
                <RiSparklingLine size={16} className="text-gold-600" />
                Amount Wise Daily ROI Slabs
              </span>
              <span className="badge badge-gold text-[10px] font-bold">
                Active Slab: ${activeMatchedSlab?.minAmount} – {activeMatchedSlab?.noMaxLimit ? "1500$ ++" : `$${activeMatchedSlab?.maxAmount}`} ({activeMatchedSlab?.dailyRoi}% / d)
              </span>
            </div>

            {/* Slabs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-xs">
              {(selectedPlan?.roiSlabs || DEFAULT_ROI_SLABS).map((slab, idx) => {
                const isMatched = activeMatchedSlab?.minAmount === slab.minAmount;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isMatched
                        ? 'bg-gold-400 border-gold-500 text-gray-950 shadow-md ring-2 ring-gold-300 scale-102 font-bold'
                        : 'bg-white border-gold-200 text-gray-700 opacity-80'
                    }`}
                  >
                    <p className={`text-[10.5px] font-extrabold ${isMatched ? 'text-gray-950' : 'text-gray-500'}`}>
                      ${slab.minAmount} — {slab.noMaxLimit || !slab.maxAmount ? '1500$ ++' : `$${slab.maxAmount}`}
                    </p>
                    <p className={`text-xs font-black font-mono mt-0.5 ${isMatched ? 'text-gray-950' : 'text-emerald-700'}`}>
                      {slab.dailyRoi}% daily
                    </p>
                    <p className={`text-[9.5px] mt-0.5 ${isMatched ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {slab.monthlyRoi || (slab.dailyRoi * 30).toFixed(1)}% mo &bull; {slab.annualRoi || (slab.dailyRoi * 360).toFixed(0)}% yr
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Investment Amount Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 font-poppins">
                Investment Capital (USD)
              </label>
              <span className="text-xs text-slate-400 font-poppins">
                Range: {selectedPlan?.minAmount} — {selectedPlan?.maxAmount || 'No Limit'}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base pointer-events-none">
                $
              </span>
              <input
                type="number"
                value={investAmount === '' ? '' : investAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setInvestAmount(val === '' ? '' : Number(val));
                }}
                min={selectedPlan?.minAmountNumeric || 10}
                max={selectedPlan?.maxAmountNumeric}
                className="input !pl-9 font-bold text-lg text-slate-900"
                placeholder={String(selectedPlan?.minAmountNumeric || 100)}
              />
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {[25, 75, 250, 750, 2000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold font-poppins transition-all cursor-pointer ${
                    Number(investAmount) === amt
                      ? 'bg-gold-400 text-gray-950 font-bold shadow-2xs border border-gold-400'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ${amt?.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* ──────── ROI & YIELD RETURN CALCULATOR (DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUALLY) ──────── */}
          {(() => {
            const currentInvestCapital = Number(investAmount) || 0;
            const activeDailyRoi = Number(activeMatchedSlab?.dailyRoi) || 0.25;
            const activeMonthlyRoi = Number(activeMatchedSlab?.monthlyRoi) || activeDailyRoi * 30;
            const activeAnnualRoi = Number(activeMatchedSlab?.annualRoi) || activeDailyRoi * 360;

            const isPlanInfinite =
              !!selectedPlan?.isInfinite ||
              selectedPlan?.duration?.toLowerCase().includes("infinite") ||
              selectedPlan?.duration?.toLowerCase().includes("lifetime");

            const planDurationDays = isPlanInfinite ? 365 : (selectedPlan?.durationDays || 365);

            const calcDailyYield = currentInvestCapital * (activeDailyRoi / 100);
            const calcWeeklyYield = calcDailyYield * 7;
            const calcMonthlyYield = calcDailyYield * 30;
            const calcQuarterlyYield = calcMonthlyYield * 3;
            const calcAnnualYield = calcDailyYield * 360;

            const calcTotalProfit = calcDailyYield * planDurationDays;
            const calcTotalMaturity = currentInvestCapital + calcTotalProfit;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50/90 via-amber-50/50 to-emerald-50/40 border border-gold-300/80 space-y-3.5 shadow-xs animate-fade-in font-poppins">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gold-200/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gold-400 text-gray-950 flex items-center justify-center shadow-2xs font-bold">
                      <RiCalculatorLine size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                        ROI & Yield Return Breakdown
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        Slab Rate: {activeDailyRoi}% Daily &bull; {activeMonthlyRoi}% Monthly &bull; {activeAnnualRoi}% Annual APY
                      </p>
                    </div>
                  </div>

                  <span className="badge badge-gold text-[10px] font-bold">
                    {selectedPlan?.payoutInterval || "Per Second (Live)"}
                  </span>
                </div>

                {/* 5-Column Periodic Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {/* 1. Daily */}
                  <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Daily (24h)
                    </p>
                    <p className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 truncate">
                      +${calcDailyYield.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">
                      {activeDailyRoi}%
                    </p>
                  </div>

                  {/* 2. Weekly */}
                  <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Weekly (7d)
                    </p>
                    <p className="text-xs font-extrabold text-blue-600 font-mono mt-0.5 truncate">
                      +${calcWeeklyYield.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">
                      {(activeDailyRoi * 7).toFixed(2)}%
                    </p>
                  </div>

                  {/* 3. Monthly */}
                  <div className="p-2.5 bg-white rounded-xl text-center border border-gold-300 shadow-2xs ring-1 ring-gold-200 bg-gradient-to-b from-white to-gold-50/40">
                    <p className="text-[10px] text-gold-700 font-bold uppercase tracking-wider">
                      Monthly (30d)
                    </p>
                    <p className="text-xs font-extrabold text-gold-700 font-mono mt-0.5 truncate">
                      +${calcMonthlyYield.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gold-800 font-bold mt-0.5 font-mono">
                      {activeMonthlyRoi}% / mo
                    </p>
                  </div>

                  {/* 4. Quarterly */}
                  <div className="p-2.5 bg-white rounded-xl text-center border border-gold-100 shadow-2xs">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Quarterly (90d)
                    </p>
                    <p className="text-xs font-extrabold text-purple-600 font-mono mt-0.5 truncate">
                      +${calcQuarterlyYield.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5 font-mono">
                      {(activeMonthlyRoi * 3).toFixed(1)}%
                    </p>
                  </div>

                  {/* 5. Annually */}
                  <div className="p-2.5 bg-white rounded-xl text-center border border-gold-200 shadow-2xs col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      Annually (12m)
                    </p>
                    <p className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5 truncate">
                      +${calcAnnualYield.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-emerald-800 font-bold mt-0.5 font-mono">
                      {activeAnnualRoi}% APY
                    </p>
                  </div>
                </div>

                {/* Total Maturity & Projected Summary */}
                <div className="p-3 bg-white/95 rounded-xl border border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <RiInformationLine className="text-gold-500" size={15} />
                      {isPlanInfinite
                        ? "Continuous Lifetime Yield Stream:"
                        : `Total Return on Maturity (${selectedPlan?.duration}):`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Principal (${currentInvestCapital.toLocaleString()}) +{" "}
                      {isPlanInfinite
                        ? `1-Year Projected Return (+$${calcAnnualYield.toFixed(2)})`
                        : `Contract Profit (+$${calcTotalProfit.toFixed(2)})`}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      {isPlanInfinite ? "1-Year Maturity Value" : "Total Net Return"}
                    </p>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      ${(isPlanInfinite ? currentInvestCapital + calcAnnualYield : calcTotalMaturity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Live Streaming Info Note */}
                <div className="text-[11px] text-gray-600 bg-white/70 p-2.5 rounded-lg border border-gold-100 flex items-start gap-1.5 leading-relaxed">
                  <RiFlashlightLine size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    {selectedPlan?.payoutInterval === "Daily Payout" ? (
                      <>Settled daily at 00:00 UTC directly into your Earning Wallet.</>
                    ) : (
                      <>Live yields stream directly into your wallet every second (<strong>${(calcDailyYield / 86400).toFixed(6)} / sec</strong>).</>
                    )}{' '}
                    {isPlanInfinite ? "Plan operates on an ongoing lifetime duration." : "100% principal unlocks upon contract maturity."}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>

      {/* ──────────────── PROFIT CALCULATOR SLIDE-OVER DRAWER ──────────────── */}
      <ProfitCalculatorDrawer
        isOpen={calcDrawerOpen}
        onClose={() => setCalcDrawerOpen(false)}
        initialPlanId={calcPlan?.id}
        plans={plansList}
        onInvest={(plan, amt) => {
          setSelectedPlan(plan);
          setInvestAmount(amt);
          setInvestDrawerOpen(true);
        }}
      />
    </div>
  );
}
