import React, { useState, useEffect } from 'react';
import { getPlans, investInPlan } from '../api/plansApi';
import {
  RiPercentLine, RiTimeLine, RiShieldFlashLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiCalculatorLine, RiArrowRightLine, RiWalletLine,
  RiCheckLine, RiSearchLine, RiAlertLine, RiInformationLine,
} from 'react-icons/ri';
import { UilMoneyBill } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ProfitCalculatorDrawer from '../components/calculator/ProfitCalculatorDrawer';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';

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
  const [investAmount, setInvestAmount] = useState(1000);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [investSubmitting, setInvestSubmitting] = useState(false);
  const [investError, setInvestError] = useState('');

  const categories = ['all', 'Renewable Energy', 'Precious Metal', 'Real Estate', 'Venture Capital'];

  const fetchPlans = async () => {
    try {
      const res = await getPlans();
      if (res?.success && Array.isArray(res.plans)) {
        const formatted = res.plans.map(p => {
          const isInf = !!p.isInfinite || p.duration?.toLowerCase().includes("infinite") || p.duration?.toLowerCase().includes("lifetime");
          return {
            _id: p._id,
            id: p._id || p.customId,
            name: p.name,
            category: p.category || 'Renewable Energy',
            roi: typeof p.roi === 'string' ? p.roi : `${p.roi}%`,
            roiNumeric: parseFloat(p.roi) || 1.5,
            minAmount: `$${(p.minAmount || 100).toLocaleString()}`,
            minAmountNumeric: p.minAmount || 100,
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
    setInvestAmount(plan.minAmountNumeric || 1000);
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
        subtitle="Explore institutional asset contracts backed by real renewable energy and physical bullion vaults"
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

      {/* ──────── PLANS CARD GRID (EXACT SUPER ADMIN DESIGN) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((plan, i) => {
          const isRenewable = plan.category === 'Renewable Energy';
          const isMetal = plan.category === 'Precious Metal';

          return (
            <div
              key={plan.id}
              className="card card-gold p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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

              {/* Monthly ROI Highlight Box */}
              <div className="p-3.5 bg-gradient-to-r from-gold-50/90 to-amber-50/50 rounded-xl border border-gold-200/60 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs text-gold-700 font-bold font-poppins">
                    <RiFlashlightLine size={15} className="text-amber-500 animate-pulse" />
                    Monthly ROI
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 font-display">
                    {plan.roiNumeric}% / Month
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40 font-poppins">
                  <span>Annual APY Rate</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {(plan.roiNumeric * 12).toFixed(1)}% APY
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
              <div className="space-y-2.5 mb-5 text-sm font-poppins">
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
        subtitle={`${selectedPlan?.roiNumeric}% / Month (${(Number(selectedPlan?.roiNumeric || 0) * 12).toFixed(1)}% APY) | Contract: ${selectedPlan?.duration}`}
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
        <div className="space-y-5 font-poppins">
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
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

          {/* Investment Amount Input & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
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
                min={selectedPlan?.minAmountNumeric}
                max={selectedPlan?.maxAmountNumeric}
                className="input !pl-9 font-bold text-lg text-slate-900"
                placeholder={String(selectedPlan?.minAmountNumeric || 1000)}
              />
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {[selectedPlan?.minAmountNumeric, 2500, 5000, 10000, 25000].filter(Boolean).map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestAmount(amt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold font-poppins transition-all cursor-pointer ${
                    Number(investAmount) === amt ? 'bg-gold-400 text-gray-950 font-bold shadow-2xs border border-gold-400' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
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
            const planMonthlyRoi = Number(selectedPlan?.roiNumeric || 1.5);
            const isPlanInfinite =
              !!selectedPlan?.isInfinite ||
              selectedPlan?.duration?.toLowerCase().includes("infinite") ||
              selectedPlan?.duration?.toLowerCase().includes("lifetime");

            const planDurationDays = isPlanInfinite ? 365 : (selectedPlan?.durationDays || 365);

            const calcMonthlyYield = currentInvestCapital * (planMonthlyRoi / 100);
            const calcDailyYield = calcMonthlyYield / 30;
            const calcWeeklyYield = calcDailyYield * 7;
            const calcQuarterlyYield = calcMonthlyYield * 3;
            const calcAnnualYield = calcMonthlyYield * 12;

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
                        {planMonthlyRoi}% / Month &bull; {(planMonthlyRoi * 12).toFixed(1)}% Annual APY
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
                      {(planMonthlyRoi / 30).toFixed(3)}%
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
                      {((planMonthlyRoi / 30) * 7).toFixed(2)}%
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
                      {planMonthlyRoi}% / mo
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
                      {(planMonthlyRoi * 3).toFixed(1)}%
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
                      {(planMonthlyRoi * 12).toFixed(1)}% APY
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
