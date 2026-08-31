import React, { useState, useEffect } from 'react';
import { userInvestments as fallbackInvestments } from '../data/userMockData';
import { getMyInvestments } from '../api/plansApi';
import {
  RiFundsLine, RiTimeLine, RiCheckLine, RiLeafLine, RiCoinsLine,
  RiFlashlightLine, RiArrowRightLine, RiExchangeDollarLine, RiCalendarLine
} from 'react-icons/ri';
import { UilBolt, UilClock, UilMoneyBill } from '@iconscout/react-unicons';
import KPICard from '../components/ui/KPICard';
import SearchBar from '../components/ui/SearchBar';
import PageHeader from '../components/ui/PageHeader';
import { Link } from 'react-router-dom';

export default function MyInvestments() {
  const [loading, setLoading] = useState(true);
  const [investmentsList, setInvestmentsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchInvestments = async () => {
    try {
      const res = await getMyInvestments();
      if (res?.success && Array.isArray(res.investments)) {
        const formatted = res.investments.map(inv => ({
          _id: inv._id,
          id: inv.customId || inv._id,
          planName: inv.planName || 'Investment Contract',
          planCategory: inv.planCategory || 'Renewable Energy',
          amount: Number(inv.amount || 0),
          roi: Number(inv.roi || 12),
          dailyEarning: Number(inv.dailyEarning || 0),
          perSecondRate: Number(inv.perSecondRate || 0),
          totalEarned: Number(inv.totalEarned || 0),
          durationDays: inv.durationDays || 365,
          daysRemaining: inv.daysRemaining !== undefined ? inv.daysRemaining : 365,
          startDate: inv.startDate ? inv.startDate.split('T')[0] : '2026-08-01',
          endDate: inv.endDate ? inv.endDate.split('T')[0] : '2027-08-01',
          payoutInterval: inv.payoutInterval || 'Per Second (Live)',
          status: inv.status || 'Active',
        }));
        setInvestmentsList(formatted);
      } else {
        setInvestmentsList(fallbackInvestments);
      }
    } catch (err) {
      console.warn('Using fallback investments:', err.message);
      setInvestmentsList(fallbackInvestments);
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
  const totalDailyEarning = activeContracts.reduce((sum, inv) => sum + (inv.dailyEarning || 0), 0);

  const filteredInvestments = investmentsList.filter(inv => {
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchSearch = inv.planName?.toLowerCase().includes(search.toLowerCase()) ||
      String(inv.id).toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="page-enter space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
            className="btn btn-primary text-xs px-4 py-2.5 rounded-xl font-bold shadow-xs flex items-center gap-1.5"
          >
            <RiFundsLine size={16} /> Explore New Plans <RiArrowRightLine size={14} />
          </Link>
        }
      />

      {/* ──────── KPI SUMMARY ROW (EXACT DESIGN.MD KPICARD) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          title="Total Capital Invested"
          numericValue={totalInvested}
          prefix="$"
          icon="investment"
          positive={true}
          change="+14.2%"
          delay={0}
        />
        <KPICard
          title="Total Returns Generated"
          numericValue={totalEarned}
          prefix="$"
          icon="revenue"
          positive={true}
          change="+19.8%"
          delay={60}
        />
        <KPICard
          title="Daily Projected Yield"
          numericValue={Math.round(totalDailyEarning)}
          prefix="$"
          icon="bolt"
          positive={true}
          change="Live /sec"
          delay={120}
        />
        <KPICard
          title="Active Contract Plans"
          numericValue={activeContracts.length}
          icon="users"
          positive={true}
          change="100% On-Time"
          delay={180}
        />
      </div>

      {/* ──────── FILTER & SEARCH BAR (MATCHING SUPER ADMIN) ──────── */}
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
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800 font-display">{inv.planName}</h3>
                      <span className={`badge ${isActive ? 'badge-success' : 'badge-gold'} text-[10px] font-bold`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-poppins">
                      <span className="font-mono text-slate-600 font-semibold">{inv.id}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <RiFlashlightLine size={13} className="text-amber-500" />
                        {inv.roi}% APY Yield
                      </span>
                      <span>·</span>
                      <span className="text-slate-400">
                        Daily: <strong className="text-slate-700 font-mono">${inv.dailyEarning.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Key Figures Matrix */}
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
                      {isActive ? `${inv.daysRemaining} Days` : 'Completed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Contract Dates */}
              <div className="mt-5 pt-3.5 border-t border-gray-100 font-poppins">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <RiCalendarLine size={13} className="text-slate-400" /> Start Date: <strong className="text-slate-700">{inv.startDate}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <UilClock size={13} className="text-slate-400" /> Maturity Date: <strong className="text-slate-700">{inv.endDate}</strong>
                  </span>
                </div>

                <div className="h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 via-gold-400 to-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: isActive
                        ? `${Math.min(100, Math.max(15, Math.round(((365 - inv.daysRemaining) / 365) * 100)))}%`
                        : '100%',
                    }}
                  />
                </div>
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
