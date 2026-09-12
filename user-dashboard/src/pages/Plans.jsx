import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getPlans, investInPlan } from '../api/plansApi';
import {
  RiPercentLine, RiTimeLine, RiShieldFlashLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiCalculatorLine, RiArrowRightLine, RiWalletLine,
  RiCheckLine, RiSearchLine, RiAlertLine, RiInformationLine, RiStackLine,
  RiArrowDownSLine, RiArrowUpSLine, RiSparklingLine, RiGiftLine, RiAwardLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { UilMoneyBill } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import ProfitCalculatorDrawer from '../components/calculator/ProfitCalculatorDrawer';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';

export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: 100, noMaxLimit: false, dailyRoi: 0.3, lockInDailyRoi: 0.4, monthlyRoi: 9.0, lockInMonthlyRoi: 12.0, annualRoi: 108.0, lockInAnnualRoi: 144.0 },
  { minAmount: 101, maxAmount: 500, noMaxLimit: false, dailyRoi: 0.5, lockInDailyRoi: 0.6, monthlyRoi: 15.0, lockInMonthlyRoi: 18.0, annualRoi: 180.0, lockInAnnualRoi: 216.0 },
  { minAmount: 501, maxAmount: 5000, noMaxLimit: false, dailyRoi: 0.8, lockInDailyRoi: 0.9, monthlyRoi: 24.0, lockInMonthlyRoi: 27.0, annualRoi: 288.0, lockInAnnualRoi: 324.0 },
  { minAmount: 5001, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, lockInDailyRoi: 1.1, monthlyRoi: 30.0, lockInMonthlyRoi: 33.0, annualRoi: 360.0, lockInAnnualRoi: 396.0 },
];

export const DEFAULT_LOYALTY_SLABS = [
  { days: 30, bonusPercentage: 0.50, label: "30 Days" },
  { days: 90, bonusPercentage: 1.00, label: "90 Days" },
  { days: 180, bonusPercentage: 3.00, label: "180 Days" },
  { days: 365, bonusPercentage: 5.00, label: "365 Days" },
  { days: 730, bonusPercentage: 10.00, label: "730 Days" },
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
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState([]);
  const { user, refreshUser, updateUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calcPlan, setCalcPlan] = useState(null);
  const [investDrawerOpen, setInvestDrawerOpen] = useState(false);
  const [calcDrawerOpen, setCalcDrawerOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState(100);
  const [lockInPeriod, setLockInPeriod] = useState('3 Months'); // '3 Months' | 'None'
  const [autoRenewal, setAutoRenewal] = useState(false);
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
            ? p.roiSlabs.map(s => {
                const d = Number(s.dailyRoi) || 0.3;
                const lockInD = s.lockInDailyRoi !== undefined && s.lockInDailyRoi !== null
                  ? Number(s.lockInDailyRoi)
                  : Number((d + 0.1).toFixed(2));
                return {
                  ...s,
                  dailyRoi: d,
                  lockInDailyRoi: lockInD,
                  monthlyRoi: s.monthlyRoi || Number((d * 30).toFixed(2)),
                  lockInMonthlyRoi: s.lockInMonthlyRoi || Number((lockInD * 30).toFixed(2)),
                  annualRoi: s.annualRoi || Number((d * 360).toFixed(2)),
                  lockInAnnualRoi: s.lockInAnnualRoi || Number((lockInD * 360).toFixed(2)),
                };
              })
            : DEFAULT_ROI_SLABS;

          const loyaltySlabs = Array.isArray(p.loyaltyBonusSlabs) && p.loyaltyBonusSlabs.length > 0
            ? p.loyaltyBonusSlabs
            : DEFAULT_LOYALTY_SLABS;

          const minDaily = slabs[0]?.dailyRoi || 0.3;
          const maxDaily = slabs[slabs.length - 1]?.dailyRoi || 1.0;
          const minLockInDaily = slabs[0]?.lockInDailyRoi || 0.4;
          const maxLockInDaily = slabs[slabs.length - 1]?.lockInDailyRoi || 1.1;

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
            minLockInDaily,
            maxLockInDaily,
            minDepositAmount: p.minDepositAmount || 10,
            minWithdrawalAmount: p.minWithdrawalAmount || 5,
            loyaltyBonusEnabled: p.loyaltyBonusEnabled !== false,
            loyaltyBonusTitle: p.loyaltyBonusTitle || "Reward ( Loyalty Bonus )",
            loyaltyBonusDescription: p.loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
            loyaltyBonusSlabs: loyaltySlabs,
            roi: typeof p.roi === 'string' ? p.roi : `${p.roi || 9.0}%`,
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

  // Auto-open invest modal if navigation came from global calculator
  useEffect(() => {
    if (plansList.length > 0 && location.state?.autoOpenPlanId) {
      const targetPlan = plansList.find(
        (p) => p.id === location.state.autoOpenPlanId || p._id === location.state.autoOpenPlanId
      );
      if (targetPlan) {
        setSelectedPlan(targetPlan);
        setInvestAmount(location.state.amount || targetPlan.minAmountNumeric || 100);
        setLockInPeriod(location.state.lockInPeriod || '3 Months');
        setAutoRenewal(Boolean(location.state.autoRenewal));
        setInvestDrawerOpen(true);
        // Clean up location state so modal does not re-pop on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [plansList, location.state]);

  const handleOpenInvest = (plan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minAmountNumeric || 100);
    setLockInPeriod('3 Months');
    setAutoRenewal(false);
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
      const res = await investInPlan(selectedPlan._id || selectedPlan.id, Number(investAmount), autoRenewal, lockInPeriod);
      if (res?.success) {
        setInvestSuccess(true);
        if (res.user && updateUser) {
          updateUser(res.user);
        }
        window.dispatchEvent(new CustomEvent('horizon-transactions-change'));
        window.dispatchEvent(new CustomEvent('horizon-user-update', { detail: res.user }));
        if (res.investment) {
          window.dispatchEvent(new CustomEvent('horizon-investment-created', { detail: res.investment }));
        }
        window.dispatchEvent(new CustomEvent('storage'));

        // Refresh user overview and plans stats
        if (refreshUser) refreshUser();
        fetchPlans();

        setTimeout(() => {
          setInvestDrawerOpen(false);
          setInvestSuccess(false);
          setInvestSubmitting(false);
        }, 900);
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
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
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
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
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
                <h3 className="text-lg font-bold text-gray-800 font-display mb-1.5 line-clamp-1 group-hover:text-gold-600 transition-colors">
                  {plan.name}
                </h3>

                {/* Plan Description from Admin */}
                {plan.description ? (
                  <p className="text-xs text-slate-600 mb-3.5 line-clamp-2 leading-relaxed font-poppins">
                    {plan.description}
                  </p>
                ) : (
                  <div className="mb-2" />
                )}

                {/* Amount-Wise Daily ROI Highlight Box */}
                <div className="p-3.5 bg-gradient-to-r from-gold-50/90 to-amber-50/50 rounded-xl border border-gold-200/60 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs text-gold-700 font-bold font-poppins">
                      <RiFlashlightLine size={15} className="text-amber-500 animate-pulse" />
                      ROI Slabs Per Day
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-display">
                      {plan.minDaily}% – {plan.maxDaily}% / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40 font-poppins">
                    <span>3 Months Lock-In Boost</span>
                    <span className="font-bold text-amber-700 font-mono">
                      +0.10% / day ({plan.minLockInDaily}% – {plan.maxLockInDaily}% / day)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 font-poppins">
                    <span>Deposit &bull; Withdrawal Min</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      Min Dep: ${plan.minDepositAmount || 10} &bull; Min WD: ${plan.minWithdrawalAmount || 5}
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
                      <RiTimeLine size={16} /> Duration & Lock-In
                    </span>
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                      {plan.isInfinite ? (
                        <span className="inline-flex items-center gap-1 text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 font-extrabold text-[11px]">
                          <span>∞</span> Lifetime
                        </span>
                      ) : (
                        `${plan.duration} (3 Mo Lock-In Option)`
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

                {/* Amount-Wise Slabs Accordion matching Spreadsheet */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setExpandedSlabsPlanId(isExpanded ? null : plan.id)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-yellow-400/90 hover:bg-yellow-400 text-gray-950 border border-yellow-500 text-[11px] font-extrabold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <RiStackLine size={14} className="text-gray-950" />
                      <span>ROI Slabs Per Day (Without vs 3 Mo Lock-In)</span>
                    </span>
                    {isExpanded ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-yellow-400 shadow-xs bg-white text-[11px] font-poppins animate-fade-in">
                      {/* Yellow Banner Header */}
                      <div className="bg-yellow-300 py-1.5 px-3 text-center text-xs font-black text-gray-950 uppercase tracking-wide border-b border-yellow-400">
                        ROI Slabs Per Day
                      </div>
                      <div className="grid grid-cols-3 font-bold text-gray-700 bg-yellow-50/60 text-[10px] py-1.5 px-2.5 border-b border-yellow-200 text-center">
                        <span className="text-left">Amount</span>
                        <span>Without Lock In</span>
                        <span className="text-right">3 Months Lock In</span>
                      </div>
                      {slabs.map((slab, idx) => {
                        const lockInRate = slab.lockInDailyRoi !== undefined && slab.lockInDailyRoi !== null
                          ? slab.lockInDailyRoi
                          : Number((Number(slab.dailyRoi || 0.3) + 0.1).toFixed(2));
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-3 items-center py-1.5 px-2.5 border-b border-gray-100 last:border-none text-[11px] hover:bg-yellow-50/30 transition-colors"
                          >
                            <span className="font-bold text-gray-900 text-left">
                              {slab.noMaxLimit || !slab.maxAmount
                                ? `${slab.minAmount}$ +`
                                : `${slab.minAmount}$ to ${slab.maxAmount}$`}
                            </span>
                            <span className="text-center font-bold text-emerald-700 font-mono">
                              {slab.dailyRoi}%
                            </span>
                            <span className="text-right font-extrabold text-amber-700 font-mono">
                              {lockInRate}%
                            </span>
                          </div>
                        );
                      })}
                      <div className="bg-slate-50 p-2 border-t border-gray-200 text-[10px] text-gray-600 flex justify-between font-medium">
                        <span>Min. Deposit: <b>${plan.minDepositAmount || 10}</b></span>
                        <span>Min Withdrawal: <b>${plan.minWithdrawalAmount || 5}</b></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ──────── REWARD (LOYALTY BONUS) SECTION ──────── */}
                {plan.loyaltyBonusEnabled !== false && (
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-amber-500/10 via-gold-500/5 to-orange-500/10 border border-amber-300/70 shadow-2xs font-poppins">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-xs">
                          <RiGiftLine size={13} />
                        </span>
                        <span className="text-xs font-bold text-amber-950">
                          {plan.loyaltyBonusTitle || "Reward ( Loyalty Bonus )"}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                        Up to {(plan.loyaltyBonusSlabs || DEFAULT_LOYALTY_SLABS)[(plan.loyaltyBonusSlabs || DEFAULT_LOYALTY_SLABS).length - 1]?.bonusPercentage || 10}% Extra
                      </span>
                    </div>

                    <p className="text-[10.5px] text-gray-600 leading-snug mb-2">
                      {plan.loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet"}
                    </p>

                    {/* Slabs Grid */}
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {(plan.loyaltyBonusSlabs || DEFAULT_LOYALTY_SLABS).map((ls, idx) => (
                        <div
                          key={idx}
                          className="bg-white/90 border border-amber-200/80 rounded-lg p-1 shadow-3xs"
                        >
                          <p className="text-[9.5px] text-gray-500 font-medium truncate">
                            {ls.days} Days
                          </p>
                          <p className="text-[11px] font-black text-amber-700 font-mono">
                            +{ls.bonusPercentage}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenCalculator(plan)}
                  className="btn btn-secondary text-xs py-2.5 flex-1 font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <RiCalculatorLine size={14} /> Calculate
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInvest(plan)}
                  className="btn btn-primary text-xs py-2.5 flex-1 font-bold rounded-xl shadow-xs cursor-pointer"
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
            <button onClick={() => setInvestDrawerOpen(false)} className="btn btn-secondary text-xs px-4 py-2.5 cursor-pointer">
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

          {/* Plan Description Highlight in Modal */}
          {selectedPlan?.description && (
            <div className="p-3.5 bg-gradient-to-r from-gold-50/80 via-white to-amber-50/50 rounded-2xl border border-gold-200 shadow-3xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gold-900 mb-1">
                About {selectedPlan.name}
              </p>
              <p className="text-xs text-slate-700 leading-relaxed font-poppins">
                {selectedPlan.description}
              </p>
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

          {/* ──────── LOCK-IN PERIOD SELECTION (Without Lock In vs 3 Months Lock In) ──────── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Lock-In Mode & Daily ROI Boost *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLockInPeriod('None')}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-start gap-1 cursor-pointer ${
                  lockInPeriod === 'None'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-300 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold flex items-center gap-1.5">
                    🔓 Without Lock In Period
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Standard Rate
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  Standard Daily ROI (0.3% – 1.0%/d). Capital flexible as per protocol.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLockInPeriod('3 Months')}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-start gap-1 cursor-pointer ${
                  lockInPeriod === '3 Months'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-300 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold flex items-center gap-1.5">
                    🔒 3 Months Lock In
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                    +0.10% / Day Boost
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 font-normal">
                  Boosted Daily ROI (0.4% – 1.1%/d). Principal locked for 90 days for higher earnings.
                </span>
              </button>
            </div>
          </div>

          {/* ──────── AMOUNT-WISE DAILY ROI PERCENTAGE SLABS TABLE ──────── */}
          <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-gold-50/40 to-white rounded-2xl border border-gold-300 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-gold-950 flex items-center gap-1.5">
                <RiSparklingLine size={16} className="text-gold-600" />
                ROI Slabs & Applied Rate
              </span>
              <span className="badge badge-gold text-[10px] font-bold">
                Active: {activeMatchedSlab?.noMaxLimit || !activeMatchedSlab?.maxAmount ? `${activeMatchedSlab?.minAmount}$ +` : `$${activeMatchedSlab?.minAmount} – $${activeMatchedSlab?.maxAmount}`} &bull; {lockInPeriod === '3 Months' ? `${activeMatchedSlab?.lockInDailyRoi || (Number(activeMatchedSlab?.dailyRoi) + 0.1).toFixed(2)}% (Locked)` : `${activeMatchedSlab?.dailyRoi}% / day`}
              </span>
            </div>

            {/* Slabs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 text-xs">
              {(selectedPlan?.roiSlabs || DEFAULT_ROI_SLABS).map((slab, idx) => {
                const isMatched = activeMatchedSlab?.minAmount === slab.minAmount;
                const effectiveDaily = lockInPeriod === '3 Months'
                  ? (slab.lockInDailyRoi !== undefined ? slab.lockInDailyRoi : Number((slab.dailyRoi + 0.1).toFixed(2)))
                  : slab.dailyRoi;

                const withAutoRenewal = autoRenewal
                  ? Number((effectiveDaily + (0.25 / 30)).toFixed(3))
                  : effectiveDaily;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isMatched
                        ? 'bg-yellow-300 border-yellow-500 text-gray-950 shadow-md ring-2 ring-yellow-400 font-bold'
                        : 'bg-white border-gold-200 text-gray-700 opacity-80'
                    }`}
                  >
                    <p className={`text-[10.5px] font-extrabold ${isMatched ? 'text-gray-950' : 'text-gray-600'}`}>
                      {slab.noMaxLimit || !slab.maxAmount ? `${slab.minAmount}$ +` : `$${slab.minAmount} – $${slab.maxAmount}`}
                    </p>
                    <p className={`text-xs font-black font-mono mt-0.5 ${isMatched ? 'text-gray-950' : 'text-emerald-700'}`}>
                      {withAutoRenewal}% / day
                    </p>
                    <p className={`text-[9.5px] mt-0.5 ${isMatched ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {lockInPeriod === '3 Months' ? '3 Mo Lock-In' : 'Without Lock-In'}
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
                        <strong>Auto Renewal ON:</strong> +0.25% monthly incentive applied across every slab. Returns are automatically added to your capital wallet for compounding benefit.
                      </span>
                    ) : (
                      <span>
                        Toggle ON to receive an additional <strong>+0.25% monthly ROI</strong> on each slab with automatic compounding to capital wallet.
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

            {/* Quick Chips matching the 4 slabs */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {[50, 200, 1000, 5500].map(amt => (
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
            const standardDailyRoi = Number(activeMatchedSlab?.dailyRoi) || 0.3;
            const lockInDailyRoi = Number(activeMatchedSlab?.lockInDailyRoi) || (standardDailyRoi + 0.1);
            const baseDailyRoi = lockInPeriod === '3 Months' ? lockInDailyRoi : standardDailyRoi;
            const baseMonthlyRoi = baseDailyRoi * 30;
            const baseAnnualRoi = baseDailyRoi * 360;

            const activeDailyRoi = autoRenewal
              ? Number((baseDailyRoi + (0.25 / 30)).toFixed(5))
              : baseDailyRoi;
            const activeMonthlyRoi = autoRenewal
              ? Number((baseMonthlyRoi + 0.25).toFixed(2))
              : baseMonthlyRoi;
            const activeAnnualRoi = autoRenewal
              ? Number((baseAnnualRoi + 3.0).toFixed(1))
              : baseAnnualRoi;

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
                        ROI & Yield Return Breakdown ({lockInPeriod === '3 Months' ? '3 Months Lock-In Boost' : 'Without Lock-In'})
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

          {/* ──────── REWARD ( LOYALTY BONUS ) MILESTONE BENEFITS ──────── */}
          {selectedPlan?.loyaltyBonusEnabled !== false && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-gold-50/50 to-orange-50/40 border border-amber-300/80 space-y-2.5 shadow-xs font-poppins">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <RiGiftLine size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      {selectedPlan?.loyaltyBonusTitle || "Reward ( Loyalty Bonus )"}
                    </h4>
                    <p className="text-[10.5px] text-gray-500">
                      {selectedPlan?.loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet"}
                    </p>
                  </div>
                </div>
                <span className="badge badge-gold text-[10px] font-bold">
                  Wallet Bonus
                </span>
              </div>

              {/* Slabs Milestone Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {(selectedPlan?.loyaltyBonusSlabs || DEFAULT_LOYALTY_SLABS).map((slab, sIdx) => {
                  const bonusVal = (Number(investAmount) || 0) * (Number(slab.bonusPercentage) / 100);
                  return (
                    <div key={sIdx} className="p-2.5 bg-white rounded-xl text-center border border-amber-200/80 shadow-2xs">
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
                <span>One-time loyalty bonus credited directly to your wallet for keeping capital invested without premature withdrawal.</span>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ──────────────── PROFIT CALCULATOR SLIDE-OVER DRAWER ──────────────── */}
      <ProfitCalculatorDrawer
        isOpen={calcDrawerOpen}
        onClose={() => setCalcDrawerOpen(false)}
        initialPlanId={calcPlan?.id}
        plans={plansList}
      />
    </div>
  );
}
