import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getPlans, investInPlan } from '../api/plansApi';
import {
  RiPercentLine, RiTimeLine, RiShieldFlashLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiCalculatorLine, RiArrowRightLine, RiWalletLine,
  RiCheckLine, RiAlertLine, RiInformationLine, RiStackLine,
  RiArrowDownSLine, RiArrowUpSLine, RiSparklingLine,
  RiRefreshLine,
} from 'react-icons/ri';
import { UilMoneyBill } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import ProfitCalculatorDrawer from '../components/calculator/ProfitCalculatorDrawer';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';

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
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [calcPlan, setCalcPlan] = useState(null);
  const [investDrawerOpen, setInvestDrawerOpen] = useState(false);
  const [calcDrawerOpen, setCalcDrawerOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState(10);
  const [lockInPeriod, setLockInPeriod] = useState('None'); // 'None' (Without Lock In Period) | '3X Cap'
  const [selectedSlabPeriod, setSelectedSlabPeriod] = useState(0); // 0 (Base), 30 (30 Days), 60 (60 Days)
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
                  : 0.8;
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
          const maxDaily = slabs[slabs.length - 1]?.dailyRoi || 0.3;
          const minLockInDaily = slabs[0]?.lockInDailyRoi || 0.8;
          const maxLockInDaily = slabs[slabs.length - 1]?.lockInDailyRoi || 0.8;

          return {
            _id: p._id,
            id: p._id || p.customId,
            name: p.name,
            category: p.category || 'Renewable Energy',
            roiType: p.roiType || 'slab',
            roiSlabs: slabs,
            roiSlabsTable: Array.isArray(p.roiSlabsTable) && p.roiSlabsTable.length > 0 ? p.roiSlabsTable : ROI_SLABS_TABLE,
            dailyRoi: p.dailyRoi || minDaily,
            minDaily,
            maxDaily,
            minLockInDaily,
            maxLockInDaily,
            minDepositAmount: p.minDepositAmount || 10,
            minWithdrawalAmount: p.minWithdrawalAmount || 5,
            singleIdMaxWithdrawal: p.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed",
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
        if (location.state?.lockInPeriod) {
          setLockInPeriod(location.state.lockInPeriod);
        }
        setInvestDrawerOpen(true);
        // Clean up location state so modal does not re-pop on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [plansList, location.state]);

  const handleOpenInvest = (plan) => {
    setSelectedPlan(plan);
    setInvestAmount(plan.minAmountNumeric || 10);
    setLockInPeriod('None');
    setSelectedSlabPeriod(0);
    setInvestError('');
    setInvestDrawerOpen(true);
  };

  const handleOpenCalculator = (plan) => {
    setCalcPlan(plan);
    setCalcDrawerOpen(true);
  };

  const handleConfirmInvestment = async () => {
    if (!selectedPlan) return;

    const numAmount = Number(investAmount);
    if (!investAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.warning('Please enter a valid investment amount greater than $0.', 'Invalid Amount');
      return;
    }

    const minRequired = selectedPlan.minAmountNumeric || selectedPlan.minDepositAmount || 10;
    if (numAmount < minRequired) {
      const msg = `Minimum investment for ${selectedPlan.name} is $${minRequired.toLocaleString()}.`;
      setInvestError(msg);
      toast.warning(msg, 'Minimum Amount Required');
      return;
    }

    setInvestError('');
    
    // Check wallet balance
    if ((user?.depositWallet || 0) < numAmount) {
      const msg = `Insufficient Deposit Wallet balance ($${(user?.depositWallet || 0).toLocaleString()} USD). Please deposit funds first.`;
      setInvestError(msg);
      toast.error(msg, 'Insufficient Balance');
      return;
    }

    setInvestSubmitting(true);
    try {
      const res = await investInPlan(selectedPlan._id || selectedPlan.id, numAmount, false, lockInPeriod);
      if (res?.success) {
        setInvestSuccess(true);
        toast.success(
          `Investment of $${numAmount.toLocaleString()} in ${selectedPlan.name} confirmed successfully! Contract activated.`,
          'Investment Confirmed',
          { duration: 6000 }
        );

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
        const errText = res?.message || 'Failed to execute investment.';
        setInvestError(errText);
        toast.error(errText, 'Investment Failed');
        setInvestSubmitting(false);
      }
    } catch (err) {
      const errText = err.response?.data?.message || err.message || 'Investment failed.';
      setInvestError(errText);
      toast.error(errText, 'Investment Error');
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
    <div className="page-enter space-y-6 pb-20">
      {/* ──────── PAGE HEADER & TOP ACTION ──────── */}
      <PageHeader
        title="Investment Plans"
        subtitle="Explore institutional asset contracts with dynamic Amount-Wise Daily ROI percentage slabs"
        badge="Asset Engine"
        actions={
          <button
            onClick={() => { setCalcPlan(null); setCalcDrawerOpen(true); }}
            className="btn btn-outline-gold text-xs px-4 py-2 rounded-full font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
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
              className="card card-gold p-4 sm:p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                {/* Top: Category Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs border ${
                      isRenewable ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      isMetal ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {isRenewable ? <RiLeafLine size={22} /> :
                       isMetal ? <RiCoinsLine size={22} /> : <RiShieldFlashLine size={22} />}
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
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
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1 text-xs text-gold-700 font-bold font-poppins">
                      <RiFlashlightLine size={15} className="text-amber-500 animate-pulse" />
                      ROI Slabs Per Day
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-display">
                      {plan.minDaily}% – {plan.maxDaily}% / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1.5 border-t border-gold-200/40 font-poppins">
                    <span>Without Lock In Period</span>
                    <span className="font-extrabold text-emerald-700 font-mono">
                      {plan.minDaily}% / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 font-poppins">
                    <span>3X Cap</span>
                    <span className="font-extrabold text-amber-700 font-mono">
                      {plan.minLockInDaily || 0.8}% / day
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-gray-500 pt-1 border-t border-gold-200/40 font-poppins">
                    <span>Deposit &bull; Withdrawal Min</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      Min Dep: ${plan.minDepositAmount || 10} &bull; Min WD: ${plan.minWithdrawalAmount || 5}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10.5px] text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-full font-bold mt-2 border border-amber-300/70 shadow-2xs">
                    <span>Single ID Limit</span>
                    <span className="font-extrabold text-amber-950 font-mono text-[10px]">
                      {plan.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}
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
                      {plan.minAmount} to any amount
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <RiPercentLine size={16} /> Active Investors
                    </span>
                    <span className="font-semibold text-gold-600 text-xs">{plan.investors} Users</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenCalculator(plan)}
                  className="btn btn-secondary text-xs py-2 px-3 flex-1 font-bold rounded-full shadow-xs cursor-pointer"
                >
                  <RiCalculatorLine size={14} /> Calculate
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenInvest(plan)}
                  className="btn btn-primary text-xs py-2 px-3 flex-1 font-bold rounded-full shadow-xs cursor-pointer"
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
        subtitle="Amount-Wise Daily ROI Slabs"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setInvestDrawerOpen(false)} className="btn btn-secondary text-xs px-4 py-2 rounded-full cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleConfirmInvestment}
              disabled={investSuccess || investSubmitting}
              className="btn btn-primary text-xs px-6 py-2 rounded-full font-bold cursor-pointer disabled:opacity-50"
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
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-2xs shrink-0">
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

          {/* ──────── ROI & CONTRACT MODE SWITCH TAB ──────── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                ROI & Contract Mode *
              </label>
              <span className="text-[11px] font-bold text-gray-500">
                {lockInPeriod === 'None' ? 'Standard 0.30% - 0.40% / Day' : 'Boosted 0.80% - 1.00% / Day (3X Cap)'}
              </span>
            </div>

            {/* Segmented Switch Tab Bar */}
            <div className="p-1 bg-slate-100/90 rounded-2xl border border-slate-200 grid grid-cols-2 gap-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setLockInPeriod('None')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  lockInPeriod === 'None'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-1 ring-emerald-500'
                    : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm">🔓</span>
                <div className="text-left flex flex-col">
                  <span className="leading-tight">Without Lock In Period</span>
                  <span className={`text-[9.5px] font-semibold ${lockInPeriod === 'None' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                    0.3% - 0.4% / Day
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLockInPeriod('3X Cap')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                  lockInPeriod === '3X Cap'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                    : 'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm">🔒</span>
                <div className="text-left flex flex-col">
                  <span className="leading-tight">3X Cap</span>
                  <span className={`text-[9.5px] font-semibold ${lockInPeriod === '3X Cap' ? 'text-amber-950' : 'text-amber-700'}`}>
                    0.8% - 1.0% / Day • 3X Cap
                  </span>
                </div>
              </button>
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
                {lockInPeriod === '3X Cap' ? 'Mode: 3X Cap' : 'Mode: Without Lock-In'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-yellow-50 border-b border-yellow-200/80 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                    <th className="py-2.5 px-3 border-r border-yellow-200/60">Amount</th>
                    <th className="py-2.5 px-3 text-center border-r border-yellow-200/60">Period (Days)</th>
                    {lockInPeriod === 'None' ? (
                      <th className="py-2.5 px-3 text-center text-emerald-800">Without Lock In Period (Daily ROI)</th>
                    ) : (
                      <th className="py-2.5 px-3 text-center text-amber-900">3X Cap (Daily ROI)</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100/60 font-medium text-slate-700">
                  {ROI_SLABS_TABLE.map((row, idx) => {
                    const isLocked = lockInPeriod === '3X Cap';
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
                        {lockInPeriod === 'None' ? (
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
                  {lockInPeriod === '3X Cap' ? (
                    <>If no withdrawal is made for <strong>30 days</strong>, daily ROI increases to <strong>0.90%</strong>. If no withdrawal is made for <strong>60 days</strong>, daily ROI increases to <strong>1.00%</strong> (3X profit cap).</>
                  ) : (
                    <>If no withdrawal is made for <strong>30 days</strong>, daily ROI increases to <strong>0.35%</strong>. If no withdrawal is made for <strong>60 days</strong>, daily ROI increases to <strong>0.40%</strong>.</>
                  )}
                </span>
              </div>
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

            {/* Quick Chips matching minimum $10 and popular amounts */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {[10, 50, 100, 500, 1000].map(amt => (
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
            const lockInDailyRoi = Number(activeMatchedSlab?.lockInDailyRoi) || 0.8;
            const isLocked = lockInPeriod === '3X Cap';
            let baseDailyRoi = isLocked ? lockInDailyRoi : standardDailyRoi;
            if (selectedSlabPeriod === 60) {
              baseDailyRoi = isLocked ? 1.0 : 0.4;
            } else if (selectedSlabPeriod === 30) {
              baseDailyRoi = isLocked ? 0.9 : 0.35;
            }
            const activeDailyRoi = baseDailyRoi;
            const activeMonthlyRoi = Number((baseDailyRoi * 30).toFixed(2));
            const activeAnnualRoi = Number((baseDailyRoi * 360).toFixed(2));

            const isPlanInfinite =
              !!selectedPlan?.isInfinite ||
              selectedPlan?.duration?.toLowerCase().includes("infinite") ||
              selectedPlan?.duration?.toLowerCase().includes("lifetime");

            const planDurationDays = isPlanInfinite ? 365 : (selectedPlan?.durationDays || 365);

            const calcDailyYield = currentInvestCapital * (activeDailyRoi / 100);
            const calcWeeklyYield = calcDailyYield * 7;
            const calcMonthlyYield = calcDailyYield * 30;
            const calc60DaysYield = calcDailyYield * 60;
            const calc60DaysRoi = Number((activeDailyRoi * 60).toFixed(2));
            const calcAnnualYield = calcDailyYield * 360;

            // Progressive holding calculations for Day 30 vs 31 and Day 60 vs 61
            const baseDailyPercent = isLocked ? 0.80 : 0.30;
            const tier1DailyPercent = isLocked ? 0.90 : 0.35;
            const tier2DailyPercent = isLocked ? 1.00 : 0.40;

            const profitDay30 = currentInvestCapital * (baseDailyPercent / 100) * 30;
            const roiDay30 = Number((baseDailyPercent * 30).toFixed(2));

            const profitDay31 = profitDay30 + currentInvestCapital * (tier1DailyPercent / 100);
            const roiDay31 = Number((roiDay30 + tier1DailyPercent).toFixed(2));

            const profitDay60 = profitDay30 + (currentInvestCapital * (tier1DailyPercent / 100) * 30);
            const roiDay60 = Number((roiDay30 + (tier1DailyPercent * 30)).toFixed(2));

            const profitDay61 = profitDay60 + currentInvestCapital * (tier2DailyPercent / 100);
            const roiDay61 = Number((roiDay60 + tier2DailyPercent).toFixed(2));

            const profitDay90 = profitDay60 + (currentInvestCapital * (tier2DailyPercent / 100) * 30);
            const roiDay90 = Number((roiDay60 + (tier2DailyPercent * 30)).toFixed(2));

            const profitAnnualWithoutLock = profitDay60 + (currentInvestCapital * (tier2DailyPercent / 100) * 300);
            const roiAnnualWithoutLock = Number((roiDay60 + (tier2DailyPercent * 300)).toFixed(2));

            const calcTotalProfit = calcDailyYield * planDurationDays;
            const calcTotalMaturity = currentInvestCapital + calcTotalProfit;

            return (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50/90 via-amber-50/50 to-emerald-50/40 border border-gold-300/80 space-y-3.5 shadow-xs animate-fade-in font-poppins">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-gold-200/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gold-400 text-gray-950 flex items-center justify-center shadow-2xs font-bold shrink-0">
                      <RiCalculatorLine size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                        <span>ROI & Yield Return Breakdown ({isLocked ? '3X Cap' : 'Without Lock In Period'})</span>
                        {selectedSlabPeriod > 0 && (
                          <span className="text-[9.5px] font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                            {selectedSlabPeriod} Days Slab ({activeDailyRoi}% / d)
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {isLocked ? (
                          <>Slab Rate: {activeDailyRoi}% Daily &bull; {activeMonthlyRoi}% Monthly &bull; 300% Profit Cap</>
                        ) : (
                          <>Slab Rate: {activeDailyRoi}% Daily &bull; {activeMonthlyRoi}% Monthly &bull; {activeAnnualRoi}% Annual APY</>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-300 shadow-2xs shrink-0">
                    {isLocked ? '3X Cap Boost Mode' : (selectedPlan?.payoutInterval || "Per Second (Live)")}
                  </span>
                </div>

                {/* 3x2 Periodic Cards Grid (Daily, Weekly, Monthly 30/31d, 60/61d, Quarterly, Annually/3X) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
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
                          +${calcDailyYield.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-700 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {baseDailyPercent}% / day
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
                          +${calcWeeklyYield.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-slate-700 font-mono bg-blue-50/70 px-2 py-0.5 rounded border border-blue-200">
                          {(baseDailyPercent * 7).toFixed(2)}% (7d)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">7 consecutive days @ {baseDailyPercent}%/d</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-1.5 truncate">
                      Weekly accumulated earnings
                    </p>
                  </div>

                  {/* 3. Monthly (331d Boost) */}
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
                        Monthly (30d •31d)
                      </span>
                      <span className="text-[9.5px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                        +{tier1DailyPercent}%/d ⚡
                      </span>
                    </div>
                    <div className="my-1.5 space-y-1.5">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-600 block leading-tight">Day 30 (Withdraw)</span>
                          <span className="text-[9px] text-slate-400 font-mono">{roiDay30}% @ {baseDailyPercent}%/d</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">+${profitDay30.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-100/70 border border-emerald-300/80 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-emerald-900 block leading-tight">Day 31 (Hold Bonus)</span>
                          <span className="text-[9px] text-emerald-700 font-mono font-semibold">{roiDay31}% • {tier1DailyPercent}%/d ⚡</span>
                        </div>
                        <span className="font-mono font-black text-emerald-700 text-xs">+${profitDay31.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-emerald-800 font-medium leading-tight border-t border-emerald-100 pt-1.5">
                      Hold past 30 days: rate upgrades to <strong>{tier1DailyPercent}%/d</strong> (+${(profitDay31 - profitDay30).toFixed(2)})
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
                        +{tier2DailyPercent}%/d 🚀
                      </span>
                    </div>
                    <div className="my-1.5 space-y-1.5">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-600 block leading-tight">Day 60 (Withdraw)</span>
                          <span className="text-[9px] text-slate-400 font-mono">{roiDay60}% @ {tier1DailyPercent}%/d</span>
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">+${profitDay60.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-100/70 border border-amber-300/80 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-amber-950 block leading-tight">Day 61 (Max Boost)</span>
                          <span className="text-[9px] text-amber-800 font-mono font-semibold">{roiDay61}% • {tier2DailyPercent}%/d 🚀</span>
                        </div>
                        <span className="font-mono font-black text-amber-800 text-xs">+${profitDay61.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-amber-900 font-medium leading-tight border-t border-amber-100 pt-1.5">
                      Hold past 60 days: max rate unlocks at <strong>{tier2DailyPercent}%/d</strong> (+${(profitDay61 - profitDay60).toFixed(2)})
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
                          +${profitDay90.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-purple-900 font-mono bg-purple-100/60 px-2 py-0.5 rounded border border-purple-200">
                          {roiDay90}% (90d)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        30d @ {baseDailyPercent}% + 30d @ {tier1DailyPercent}% + 30d @ {tier2DailyPercent}%
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
                        {isLocked ? '3X Cap Limit' : 'Annual Yield'}
                      </span>
                      <span className="text-[9.5px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap shadow-2xs">
                        {isLocked ? '300% Cap' : `${roiAnnualWithoutLock}% APY`}
                      </span>
                    </div>
                    <div className="my-2.5 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
                          +${isLocked ? (currentInvestCapital * 3).toFixed(2) : profitAnnualWithoutLock.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-amber-950 font-mono bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
                          {isLocked ? '300% Profit' : `${roiAnnualWithoutLock}% APY`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {isLocked
                          ? `Total Contract Return: $${(currentInvestCapital * 4).toFixed(2)}`
                          : `Running at ${tier2DailyPercent}%/day max tier`
                        }
                      </p>
                    </div>
                    <p className="text-[10px] text-amber-900 font-medium border-t border-gold-200 pt-1.5 truncate">
                      {isLocked ? 'Contract completes upon reaching 300% profit' : 'Continuous real-time streaming annual yield'}
                    </p>
                  </div>
                </div>

                {/* Total Maturity & Projected Summary */}
                <div className="p-3 bg-white/95 rounded-xl border border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <RiInformationLine className="text-gold-500" size={15} />
                      {isLocked ? '3X Cap Contract Maturity:' : 'Continuous Real-time Yield Stream:'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isLocked ? (
                        <>Principal (${currentInvestCapital.toLocaleString()}) + 300% Max Profit (+${(currentInvestCapital * 3).toFixed(2)})</>
                      ) : (
                        <>Principal (${currentInvestCapital.toLocaleString()}) + 1-Year Projected Return (+${calcAnnualYield.toFixed(2)})</>
                      )}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      {isLocked ? 'Total 3X Maturity Value' : '1-Year Projected Maturity Value'}
                    </p>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      ${isLocked ? (currentInvestCapital + (currentInvestCapital * 3)).toFixed(2) : (currentInvestCapital + calcAnnualYield).toFixed(2)}
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
                    Live returns stream automatically into your wallet every second.
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
      />
    </div>
  );
}
