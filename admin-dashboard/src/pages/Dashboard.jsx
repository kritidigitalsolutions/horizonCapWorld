import React, { useState, useEffect } from 'react';
import { RiArrowRightUpLine, RiTimeLine, RiExchangeDollarLine, RiUserAddLine, RiPieChartLine, RiFundsLine, RiCoinsLine, RiShieldCheckLine } from 'react-icons/ri';
import KPICard from '../components/ui/KPICard';
import { SkeletonCard, SkeletonChart } from '../components/ui/SkeletonLoader';
import AreaChartComponent from '../components/charts/AreaChart';
import BarChartComponent from '../components/charts/BarChart';
import DonutChart from '../components/charts/DonutChart';
import PageHeader from '../components/ui/PageHeader';
import { kpiData as fallbackKpiData, chartData as fallbackChartData, recentActivity as fallbackRecentActivity } from '../data/mockData';
import { getDashboardKPIs, getDashboardCharts, getRecentActivities } from '../api/dashboardApi';

const activityIcons = {
  deposit: { icon: RiArrowRightUpLine, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  withdrawal: { icon: RiExchangeDollarLine, color: 'text-orange-500', bg: 'bg-orange-50' },
  user: { icon: RiUserAddLine, color: 'text-blue-500', bg: 'bg-blue-50' },
  roi: { icon: RiFundsLine, color: 'text-purple-500', bg: 'bg-purple-50' },
  plan: { icon: RiPieChartLine, color: 'text-gold-500', bg: 'bg-gold-50' },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(fallbackKpiData);
  const [charts, setCharts] = useState(fallbackChartData);
  const [activities, setActivities] = useState(fallbackRecentActivity);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpiRes, chartRes, actRes] = await Promise.allSettled([
          getDashboardKPIs(),
          getDashboardCharts(),
          getRecentActivities(),
        ]);

        if (kpiRes.status === 'fulfilled' && kpiRes.value?.success && kpiRes.value.kpis) {
          const raw = kpiRes.value.kpis;
          setKpis([
            {
              id: 'total_aum',
              title: 'Total Platform AUM',
              value: `$${(raw.totalAUM || 82450000).toLocaleString()}`,
              numericValue: raw.totalAUM || 82450000,
              prefix: '$',
              change: '+18.4%',
              positive: true,
              icon: 'money',
              delay: 0,
            },
            {
              id: 'active_investors',
              title: 'Active Investors',
              value: (raw.activeInvestors || raw.totalUsers || 1420).toLocaleString(),
              numericValue: raw.activeInvestors || raw.totalUsers || 1420,
              prefix: '',
              change: '+12.6%',
              positive: true,
              icon: 'users',
              delay: 80,
            },
            {
              id: 'yield_distributed',
              title: 'Total Yield Distributed',
              value: `$${(raw.totalYieldDistributed || 14200000).toLocaleString()}`,
              numericValue: raw.totalYieldDistributed || 14200000,
              prefix: '$',
              change: '+24.1%',
              positive: true,
              icon: 'chart',
              delay: 160,
            },
            {
              id: 'platform_reserve',
              title: 'Platform Reserve Liquidity',
              value: `$${(raw.platformReserve || 21000000).toLocaleString()}`,
              numericValue: raw.platformReserve || 21000000,
              prefix: '$',
              change: '+8.3%',
              positive: true,
              icon: 'wallet',
              delay: 240,
            },
          ]);
        }

        if (chartRes.status === 'fulfilled' && chartRes.value?.success && Array.isArray(chartRes.value.charts)) {
          const investmentSeries = chartRes.value.charts.map(c => ({
            month: c.month,
            amount: c.deposits || c.amount || 50000,
          }));
          const userGrowthSeries = chartRes.value.charts.map(c => ({
            month: c.month,
            users: c.newUsers || c.users || 200,
          }));
          setCharts(prev => ({
            ...prev,
            investment: investmentSeries,
            userGrowth: userGrowthSeries,
          }));
        }

        if (actRes.status === 'fulfilled' && actRes.value?.success) {
          const acts = [];
          if (Array.isArray(actRes.value.recentTransactions)) {
            actRes.value.recentTransactions.forEach(t => {
              acts.push({
                id: t._id || t.customId,
                type: (t.type || 'deposit').toLowerCase(),
                action: `${t.type || 'Transaction'} by ${t.userName || 'Investor'}`,
                detail: `$${Number(t.amount || 0).toLocaleString()} via ${t.gateway || 'Vault'} • Status: ${t.status || 'Pending'}`,
                time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              });
            });
          }
          if (Array.isArray(actRes.value.recentUsers)) {
            actRes.value.recentUsers.forEach(u => {
              acts.push({
                id: u._id || u.customId,
                type: 'user',
                action: `New Investor Registered: ${u.name}`,
                detail: `${u.email} • Country: ${u.country || 'Global'}`,
                time: u.createdAt ? new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
              });
            });
          }
          if (acts.length > 0) {
            setActivities(acts.slice(0, 6));
          }
        }
      } catch (err) {
        console.warn('Using fallback admin dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonChart key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Super Admin Intelligence Portal"
        subtitle="Global platform liquidity, active asset AUM, investor metrics & real-time streaming ledger"
        badge="Live Operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.id || i} {...kpi} delay={i * 80} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Investment Trends */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 font-poppins">Investment Trends</h3>
              <p className="text-xs text-slate-400 mt-0.5">Monthly investment inflow trajectory</p>
            </div>
            <span className="badge-gold badge text-xs font-semibold">2026</span>
          </div>
          <AreaChartComponent data={charts.investment} dataKey="amount" color="#C8A200" />
        </div>

        {/* User Growth */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 font-poppins">User Growth</h3>
              <p className="text-xs text-slate-400 mt-0.5">Platform investor registrations</p>
            </div>
            <span className="badge-gold badge text-xs font-semibold">2026</span>
          </div>
          <BarChartComponent data={charts.userGrowth} dataKey="users" color="#10B981" />
        </div>

        {/* Revenue & Asset Breakdown */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800 font-poppins">Portfolio Asset Allocation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Capital distribution by investment sector</p>
            </div>
            <span className="badge-gold badge text-xs font-semibold">AUM Share</span>
          </div>
          <DonutChart data={charts.assetDistribution} />
        </div>

        {/* Recent Activity */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Recent Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest platform events</p>
            </div>
            <button className="text-xs font-medium text-gold-500 hover:text-gold-600 transition-colors">Live Sync</button>
          </div>
          <div className="space-y-4">
            {activities.map(activity => {
              const config = activityIcons[activity.type] || activityIcons.deposit;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 group">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon size={18} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-400 truncate">{activity.detail}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                    <RiTimeLine size={12} />
                    <span>{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
