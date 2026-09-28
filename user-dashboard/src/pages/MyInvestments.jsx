import { useState, useEffect } from 'react';
import { getMyInvestments } from '../api/plansApi';
import {
  RiFundsLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiArrowRightLine, RiCalendarLine, RiTimeLine,
} from 'react-icons/ri';
import { UilClock } from '@iconscout/react-unicons';
import KPICard from '../components/ui/KPICard';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';
import { Link } from 'react-router-dom';

export default function MyInvestments() {
  const [loading, setLoading] = useState(true);
  const [investmentsList, setInvestmentsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Live 1-second interval to power real-time elapsed timer & settlement countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchInvestments = async () => {
    try {
      const res = await getMyInvestments();
      if (res?.success && Array.isArray(res.investments)) {
        const formatted = res.investments.map(inv => {
          const isInf = Boolean(
            inv.isInfinite ||
            inv.duration === 'Infinite / Lifetime' ||
            inv.duration === 'Lifetime' ||
            inv.duration === '∞ Lifetime' ||
            inv.durationDays === 0 ||
            inv.daysRemaining === 'Lifetime'
          );

          const is3XCap = Boolean(
            inv.isLocked ||
            inv.lockInPeriod === '3X Cap' ||
            inv.lockInPeriod === '333 Days' ||
            inv.lockInPeriod === '365 Days' ||
            inv.lockInPeriod === '3 Months' ||
            inv.planName?.toLowerCase().includes('3x')
          );

          let daysRemaining = 'Lifetime';
          let endStr = 'Lifetime (No Expiry)';

          if (is3XCap) {
            const targetProfit = (inv.amount || 0) * 3;
            const currentProfit = Number(inv.totalProfitEarned || inv.totalEarned || 0);
            const remProfit = Math.max(0, targetProfit - currentProfit);

            if (inv.status === 'Completed' || remProfit <= 0) {
              daysRemaining = 0;
              endStr = inv.endDate
                ? (typeof inv.endDate === 'string' ? inv.endDate.split('T')[0] : new Date(inv.endDate).toISOString().split('T')[0])
                : 'Completed';
            } else if (inv.daysRemaining !== undefined && inv.daysRemaining !== 'Lifetime') {
              daysRemaining = inv.daysRemaining;
              endStr = inv.endDate
                ? (typeof inv.endDate === 'string' ? inv.endDate.split('T')[0] : new Date(inv.endDate).toISOString().split('T')[0])
                : new Date(Date.now() + daysRemaining * 86400000).toISOString().split('T')[0];
            } else {
              daysRemaining = 309;
              endStr = new Date(Date.now() + 309 * 86400000).toISOString().split('T')[0];
            }
          } else if (!isInf) {
            if (inv.daysRemaining !== undefined && inv.daysRemaining !== 'Lifetime') {
              daysRemaining = inv.daysRemaining;
            } else if (inv.endDate) {
              const diffMs = new Date(inv.endDate).getTime() - Date.now();
              daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            } else {
              daysRemaining = 365;
            }
            endStr = inv.endDate
              ? (typeof inv.endDate === 'string' ? inv.endDate.split('T')[0] : new Date(inv.endDate).toISOString().split('T')[0])
              : 'Perpetual';
          }

          const rawStart = inv.startDate || inv.createdAt || new Date();
          const startDateObj = new Date(rawStart);
          const isValidDate = !isNaN(startDateObj.getTime());

          const y = isValidDate ? startDateObj.getFullYear() : 2026;
          const m = isValidDate ? String(startDateObj.getMonth() + 1).padStart(2, '0') : '09';
          const d = isValidDate ? String(startDateObj.getDate()).padStart(2, '0') : '28';
          const dateStr = `${y}-${m}-${d}`;

          const timeStr = isValidDate
            ? startDateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
            : '';

          const fullStartDateTime = timeStr ? `${dateStr} · ${timeStr}` : dateStr;

          return {
            _id: inv._id,
            id: inv.customId || inv._id,
            planName: inv.planName || 'Investment Contract',
            planCategory: inv.planCategory || 'Renewable Energy',
            amount: Number(inv.amount || 0),
            dailyRoi: Number(inv.dailyRoi || ((inv.roi || 7.5) / 30)),
            roi: Number(inv.roi || 7.5),
            dailyEarning: Number(inv.dailyEarning || 0),
            perSecondRate: Number(inv.perSecondRate || 0),
            totalEarned: Number(inv.totalProfitEarned || inv.totalEarned || 0),
            duration: isInf ? '∞ Lifetime' : is3XCap ? '3X Cap (~309 Days)' : (inv.duration || '12 Months'),
            durationDays: isInf ? 0 : is3XCap ? 309 : (inv.durationDays || 365),
            isInfinite: isInf,
            is3XCap,
            daysRemaining,
            rawStartDate: rawStart,
            startDate: dateStr,
            investedTimeStr: timeStr,
            fullStartDateTime,
            endDate: endStr,
            payoutInterval: inv.payoutInterval || 'Per Second (Live)',
            status: inv.status || 'Active',
          };
        });
        setInvestmentsList(formatted);
      } else {
        setInvestmentsList([]);
      }
    } catch (err) {
      console.warn('Error fetching investments:', err.message);
      setInvestmentsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const totalInvested = investmentsList.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalEarned = investmentsList.reduce((sum, inv) => sum + (inv.totalEarned || 0), 0);
  const activeContracts = investmentsList.filter(inv => inv.status === 'Active');
  const completedContracts = investmentsList.filter(inv => inv.status === 'Completed');
  const totalDailyEarning = activeContracts.reduce(
    (sum, inv) => sum + (Number(inv.dailyEarning) || ((inv.amount || 0) * (Number(inv.dailyRoi || 0) / 100)) || 0),
    0
  );

  const filteredInvestments = investmentsList.filter(inv => {
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchSearch = inv.planName?.toLowerCase().includes(search.toLowerCase()) ||
      String(inv.id).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
        <div className="skeleton h-14 w-full rounded-2xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="My Investment Portfolio"
        subtitle="Monitor real-time yield distribution, active contracts, and contract maturity schedules"
        badge="Portfolio Hub"
        actions={
          <Link
            to="/plans"
            className="btn btn-primary text-xs px-4 py-2 rounded-full font-bold shadow-xs flex items-center gap-1.5"
          >
            <RiFundsLine size={16} /> Explore New Plans <RiArrowRightLine size={14} />
          </Link>
        }
      />

      {/* ──────── KPI SUMMARY ROW ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3.5 sm:gap-4 xl:gap-5">
        <KPICard
          title="Total Capital Invested"
          numericValue={totalInvested}
          prefix="$"
          icon="investment"
          positive={true}
          change={totalInvested > 0 ? "Active Capital" : "No Investment"}
          subtitle="Cumulative deposited funds"
          delay={0}
        />
        <KPICard
          title="Total Returns Generated"
          numericValue={totalEarned >= 1 ? totalEarned.toFixed(2) : totalEarned.toFixed(3)}
          prefix="$"
          icon="revenue"
          positive={true}
          change={totalEarned > 0 ? "Accruing" : "Ready"}
          subtitle="Cumulative profit credited"
          delay={60}
        />
        <KPICard
          title="Total Daily Profit / ROI"
          numericValue={totalDailyEarning > 0 ? totalDailyEarning.toFixed(2) : '0.00'}
          prefix="$"
          icon="bolt"
          positive={true}
          change="Per Day"
          subtitle={`${activeContracts.length} Active Plan${activeContracts.length === 1 ? '' : 's'}`}
          delay={120}
        />
        <KPICard
          title="Active Contract Plans"
          numericValue={activeContracts.length}
          icon="users"
          positive={true}
          change={`${activeContracts.length} Active`}
          subtitle="Active earning contracts"
          delay={180}
        />
      </div>

      {/* ──────── FILTER & SEARCH BAR ──────── */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <SearchBar
            placeholder="Search by plan name or contract ID..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 font-poppins">
            {[
              { id: 'all', label: `All (${investmentsList.length})` },
              { id: 'Active', label: `Active (${activeContracts.length})` },
              { id: 'Completed', label: `Completed (${completedContracts.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-gold-400 text-gray-900 shadow-gold font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ──────── CONTRACTS LIST / CARDS ──────── */}
      <div className="space-y-4">
        {filteredInvestments.map((inv, i) => {
          const isActive = inv.status === 'Active';
          const isRenewable = inv.planName?.toLowerCase().includes('solar') || inv.planName?.toLowerCase().includes('hydrogen') || inv.planName?.toLowerCase().includes('wind');
          const isDailyPlan = (inv.payoutInterval || '').toLowerCase().includes('daily');

          // Progress calculation: 3X Cap is based on 300% profit cap; standard plan is based on days
          const progressPercent = inv.isInfinite
            ? 100
            : !isActive
            ? 100
            : inv.is3XCap
            ? Math.min(100, Math.round(((inv.totalEarned || 0) / Math.max(1, (inv.amount || 0) * 3)) * 100))
            : Math.min(100, Math.max(10, Math.round((((inv.durationDays || 365) - Number(inv.daysRemaining || 0)) / (inv.durationDays || 365)) * 100)));

          // Real-time elapsed time calculation since investment was created
          const startMs = new Date(inv.rawStartDate || inv.startDate).getTime();
          const elapsedMs = !isNaN(startMs) ? Math.max(0, currentTime - startMs) : 0;
          const elapsedSecsTotal = Math.floor(elapsedMs / 1000);
          const elDays = Math.floor(elapsedSecsTotal / 86400);
          const elHours = Math.floor((elapsedSecsTotal % 86400) / 3600);
          const elMins = Math.floor((elapsedSecsTotal % 3600) / 60);
          const elSecs = elapsedSecsTotal % 60;

          const elapsedText = elDays > 0
            ? `${elDays}d ${String(elHours).padStart(2, '0')}h ${String(elMins).padStart(2, '0')}m ${String(elSecs).padStart(2, '0')}s`
            : `${String(elHours).padStart(2, '0')}h ${String(elMins).padStart(2, '0')}m ${String(elSecs).padStart(2, '0')}s`;

          // 24-hour Daily Settlement remaining countdown
          const CYCLE_MS = 24 * 60 * 60 * 1000;
          const cycleElapsed = elapsedMs % CYCLE_MS;
          const cycleRemainingMs = CYCLE_MS - cycleElapsed;
          const remHours = String(Math.floor(cycleRemainingMs / 3600000)).padStart(2, '0');
          const remMins = String(Math.floor((cycleRemainingMs % 3600000) / 60000)).padStart(2, '0');
          const remSecs = String(Math.floor((cycleRemainingMs % 60000) / 1000)).padStart(2, '0');
          const remainingText = `${remHours}h ${remMins}m ${remSecs}s`;

          return (
            <div
              key={inv.id}
              className={`p-6 rounded-2xl transition-all animate-slide-up ${
                isActive
                  ? 'card card-gold hover:shadow-card-hover border-gold-300'
                  : 'card bg-slate-50/50 border-slate-200'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Left: Contract Title & Asset Sector */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                    isRenewable ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {isRenewable ? <RiLeafLine size={24} /> : <RiCoinsLine size={24} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-800 font-display">{inv.planName}</h3>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-gold'} text-[10px] font-bold`}>
                        {inv.status}
                      </span>
                      {inv.is3XCap && (
                        <span className="badge badge-gold text-[10px] font-extrabold uppercase">
                          3X Cap Plan
                        </span>
                      )}
                      <span className={`badge text-[10px] font-bold ${
                        isDailyPlan
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isDailyPlan ? '24h Daily Payout' : 'Live Per Second'}
                      </span>
                      {inv.investedTimeStr && (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <RiTimeLine size={11} className="text-slate-500" />
                          Invested at {inv.investedTimeStr}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-poppins">
                      <span className="font-mono text-slate-600 font-semibold">{inv.id}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <RiFlashlightLine size={13} className="text-amber-500" />
                        {inv.dailyRoi.toFixed(3)}% Daily ({inv.roi.toFixed(2)}% / mo)
                      </span>
                      <span>·</span>
                      <span className="text-slate-500">
                        Daily: <strong className="text-slate-700 font-mono">${inv.dailyEarning.toFixed(2)}</strong>
                      </span>
                      {isDailyPlan ? (
                        <>
                          <span>·</span>
                          <span className="text-blue-700 font-semibold">24h Day-Wise Payout</span>
                        </>
                      ) : (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-mono font-semibold">+${(inv.perSecondRate || 0).toFixed(7)}/sec</span>
                          <span>·</span>
                          <span className="text-slate-500 font-mono font-medium">Active: {elapsedText}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Key Figures Matrix */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 bg-white/60 p-4 rounded-xl border border-slate-100 font-poppins">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Invested Capital</p>
                      <p className="text-base font-bold text-slate-900 font-display tabular-nums mt-0.5">
                        ${inv.amount.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Profit Accrued</p>
                      <p className="text-base font-bold text-emerald-600 font-display tabular-nums mt-0.5">
                        +${inv.totalEarned.toLocaleString()}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        {isActive ? 'Days Left' : 'Maturity Status'}
                      </p>
                      <p className={`text-base font-bold font-display tabular-nums mt-0.5 ${
                        isActive ? 'text-gold-700' : 'text-slate-500'
                      }`}>
                        {inv.isInfinite ? (
                          <span className="inline-flex items-center gap-1 text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-300 font-extrabold text-xs">
                            <span>∞</span> Lifetime
                          </span>
                        ) : isActive ? (
                          `${inv.daysRemaining} Days`
                        ) : (
                          'Completed'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ──────── DAILY ROI INVESTED ELAPSED TIMER & 24H PAYOUT COUNTDOWN ──────── */}
              {isDailyPlan && isActive && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/50 to-amber-50/60 border border-blue-200 shadow-2xs font-poppins">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Left: Active Invested Elapsed Time Live Counter */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <RiTimeLine size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
                            Time Elapsed Since Investment
                          </span>
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                          <span className="font-mono text-base sm:text-lg font-black text-blue-950 tracking-tight">
                            {elapsedText}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            (Invested: {inv.investedTimeStr || inv.startDate})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Next 24h Settlement Countdown */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-blue-200/80 sm:pl-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Next 24h Settlement In
                        </span>
                        <span className="font-mono text-base sm:text-lg font-black text-emerald-700">
                          {remainingText}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                        24h Rolling Cycle
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar & Contract Dates */}
              <div className="mt-5 pt-3.5 border-t border-gray-100 font-poppins">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <RiCalendarLine size={14} className="text-slate-400" />
                    <span>Start Date & Time:</span>
                    <strong className="text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {inv.fullStartDateTime}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UilClock size={14} className="text-slate-400" />
                    <span>Maturity Date:</span>
                    <strong className="text-slate-700">{inv.endDate}</strong>
                  </span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 via-gold-400 to-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {inv.is3XCap && isActive && (
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>3X Cap Progress: ${inv.totalEarned.toFixed(2)} / ${(inv.amount * 3).toLocaleString()} USD (300%)</span>
                    <span className="font-semibold text-gold-700">{progressPercent}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredInvestments.length === 0 && (
          <div className="card p-12 text-center font-poppins">
            <p className="text-gray-400">No investment contracts found matching your filters.</p>
            <Link to="/plans" className="btn btn-primary text-xs px-4 py-2 mt-3 inline-flex items-center gap-1.5 font-bold">
              <RiFundsLine size={15} /> Start a New Investment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
