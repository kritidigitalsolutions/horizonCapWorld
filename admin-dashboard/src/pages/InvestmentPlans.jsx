import React, { useState, useEffect, useMemo } from "react";
import {
  RiAddLine,
  RiEditLine,
  RiEyeLine,
  RiPercentLine,
  RiTimeLine,
  RiShieldFlashLine,
  RiLeafLine,
  RiCoinsLine,
  RiFlashlightLine,
  RiInformationLine,
  RiCalculatorLine,
  RiCalendarEventLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiFundsLine,
  RiSparklingLine,
  RiStackLine,
  RiRefreshLine,
  RiArrowRightLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "react-icons/ri";
import { UilMoneyBill } from "@iconscout/react-unicons";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import SearchBar from "../components/ui/SearchBar";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import PageHeader from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";

import {
  getAllPlans,
  createPlan,
  updatePlans,
  deletePlan,
} from "../api/plansApi";

// Default standard Amount-Wise Daily ROI Percentage Slabs requested by client
export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: "", noMaxLimit: true, dailyRoi: 0.3, lockInDailyRoi: 0.8, monthlyRoi: 9.0, lockInMonthlyRoi: 24.0, annualRoi: 108.0, lockInAnnualRoi: 288.0 },
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

// Default Reward (Loyalty Bonus) Slabs based on Capital not withdrawn
export const DEFAULT_LOYALTY_SLABS = [
  { days: 30, bonusPercentage: 0.50, label: "30 Days" },
  { days: 90, bonusPercentage: 1.00, label: "90 Days" },
  { days: 180, bonusPercentage: 3.00, label: "180 Days" },
  { days: 365, bonusPercentage: 5.00, label: "365 Days" },
  { days: 730, bonusPercentage: 10.00, label: "730 Days" },
];

// Helper to format duration string from DD, MM, YYYY values or infinite
function formatDurationString(dd, mm, yyyy, isInfinite = false) {
  if (isInfinite) {
    return "Infinite / Lifetime";
  }

  const parts = [];
  const y = parseInt(yyyy, 10);
  const m = parseInt(mm, 10);
  const d = parseInt(dd, 10);

  if (y > 0) parts.push(`${y} ${y === 1 ? "Year" : "Years"}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? "Month" : "Months"}`);
  if (d > 0) parts.push(`${d} ${d === 1 ? "Day" : "Days"}`);

  return parts.length > 0 ? parts.join(" ") : "12 Months";
}

// Helper to parse duration string into DD, MM, YYYY
function parseDurationString(str = "", isInf = false) {
  if (
    isInf ||
    str.toLowerCase().includes("infinite") ||
    str.toLowerCase().includes("lifetime")
  ) {
    return { dd: "", mm: "", yyyy: "", isInfinite: true };
  }

  let dd = "";
  let mm = "";
  let yyyy = "";

  const yearMatch = str.match(/(\d+)\s*Year/i);
  const monthMatch = str.match(/(\d+)\s*Month/i);
  const dayMatch = str.match(/(\d+)\s*Day/i);

  if (yearMatch) yyyy = yearMatch[1];
  if (monthMatch) mm = monthMatch[1];
  if (dayMatch) dd = dayMatch[1];

  if (!yyyy && !mm && !dd) {
    mm = "12";
  }

  return { dd, mm, yyyy, isInfinite: false };
}

// Helper to match active slab for dynamic calculation
export function getMatchingSlab(amount, slabs = []) {
  const num = Number(amount) || 0;
  if (!slabs || slabs.length === 0) return null;
  const found = slabs.find((s) => {
    const min = Number(s.minAmount) || 0;
    const max = s.noMaxLimit || !s.maxAmount ? Infinity : Number(s.maxAmount);
    return num >= min && num <= max;
  });
  if (found) return found;
  const sorted = [...slabs].sort(
    (a, b) => (Number(b.minAmount) || 0) - (Number(a.minAmount) || 0)
  );
  if (sorted.length > 0 && num >= (Number(sorted[0].minAmount) || 0)) {
    return sorted[0];
  }
  return slabs[0];
}

export default function InvestmentPlans() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [expandedSlabsPlanId, setExpandedSlabsPlanId] = useState(null);

  // Form State for Add/Edit Drawer
  const [formData, setFormData] = useState({
    name: "",
    category: "Renewable Energy",
    customCategory: "",
    roiType: "slab", // "slab" | "fixed"
    roi: "9.0", // Monthly ROI (%)
    dailyRoi: "0.3", // Daily ROI (%)
    roiSlabs: DEFAULT_ROI_SLABS,
    roiSlabsTable: ROI_SLABS_TABLE,
    minDepositAmount: "10",
    minWithdrawalAmount: "5",
    singleIdMaxWithdrawal: "3X + Capital Maximum Withdrawal Allowed",
    hasLockInOption: true,
    lockInPeriodDays: 0,
    isInfinite: false,
    durationDD: "",
    durationMM: "12",
    durationYYYY: "",
    minAmount: "10",
    maxAmount: "",
    noMaxLimit: true,
    payoutInterval: "per_second",
    status: "Active",
    description: "",
  });

  const categories = ["all", "Renewable Energy", "Precious Metal"];

  // 1. Fetch All Plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getAllPlans();

      if (Array.isArray(response)) {
        setPlans(response);
      } else if (response && Array.isArray(response.data)) {
        setPlans(response.data);
      } else if (response && Array.isArray(response.plans)) {
        setPlans(response.plans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("loading error in plans:", error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // 2. Open Add Modal
  const openAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      category: "Renewable Energy",
      customCategory: "",
      roiType: "slab",
      roi: "9.0",
      dailyRoi: "0.3",
      roiSlabs: DEFAULT_ROI_SLABS.map((s) => ({ ...s })),
      roiSlabsTable: ROI_SLABS_TABLE.map((s) => ({ ...s })),
      minDepositAmount: "10",
      minWithdrawalAmount: "5",
      singleIdMaxWithdrawal: "3X + Capital Maximum Withdrawal Allowed",
      hasLockInOption: true,
      lockInPeriodDays: 0,
      isInfinite: false,
      durationDD: "",
      durationMM: "12",
      durationYYYY: "",
      minAmount: "10",
      maxAmount: "",
      noMaxLimit: true,
      payoutInterval: "per_second",
      status: "Active",
      description: "",
    });
    setModalOpen(true);
  };

  // 3. Open Edit Modal with Mapped Data
  const openEdit = (plan) => {
    setEditingPlan(plan);
    const isInf =
      !!plan.isInfinite ||
      plan.duration?.toLowerCase().includes("infinite") ||
      plan.duration?.toLowerCase().includes("lifetime");

    const { dd, mm, yyyy } = parseDurationString(plan.duration || "12 Months", isInf);

    const isCustomCat = !["Renewable Energy", "Precious Metal"].includes(
      plan.category
    );

    const slabs =
      Array.isArray(plan.roiSlabs) && plan.roiSlabs.length > 0
        ? plan.roiSlabs.map((s) => {
            const d = Number(s.dailyRoi) || 0.3;
            const lockInD = s.lockInDailyRoi !== undefined && s.lockInDailyRoi !== null
              ? Number(s.lockInDailyRoi)
              : 0.8;
            return {
              minAmount: s.minAmount,
              maxAmount: s.maxAmount || "",
              noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
              dailyRoi: d,
              lockInDailyRoi: lockInD,
              monthlyRoi: s.monthlyRoi || Number((d * 30).toFixed(2)),
              lockInMonthlyRoi: s.lockInMonthlyRoi || Number((lockInD * 30).toFixed(2)),
              annualRoi: s.annualRoi || Number((d * 360).toFixed(2)),
              lockInAnnualRoi: s.lockInAnnualRoi || Number((lockInD * 360).toFixed(2)),
            };
          })
        : DEFAULT_ROI_SLABS.map((s) => ({ ...s }));

    const slabsTable =
      Array.isArray(plan.roiSlabsTable) && plan.roiSlabsTable.length > 0
        ? plan.roiSlabsTable.map((s) => ({ ...s }))
        : ROI_SLABS_TABLE.map((s) => ({ ...s }));

    setFormData({
      name: plan.name || "",
      category: isCustomCat ? "custom" : plan.category || "Renewable Energy",
      customCategory: isCustomCat ? plan.category : "",
      roiType: plan.roiType || (plan.roiSlabs?.length > 0 ? "slab" : "fixed"),
      roi: plan.roi !== undefined ? plan.roi.toString() : "9.0",
      dailyRoi:
        plan.dailyRoi !== undefined
          ? plan.dailyRoi.toString()
          : plan.roi !== undefined
          ? (Number(plan.roi) / 30).toFixed(3)
          : "0.3",
      roiSlabs: slabs,
      roiSlabsTable: slabsTable,
      minDepositAmount: plan.minDepositAmount ? plan.minDepositAmount.toString() : "10",
      minWithdrawalAmount: plan.minWithdrawalAmount ? plan.minWithdrawalAmount.toString() : "5",
      singleIdMaxWithdrawal: plan.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed",
      hasLockInOption: plan.hasLockInOption !== false,
      lockInPeriodDays: plan.lockInPeriodDays || 0,
      isInfinite: isInf,
      durationDD: isInf ? "" : dd,
      durationMM: isInf ? "" : mm,
      durationYYYY: isInf ? "" : yyyy,
      minAmount: plan.minAmount ? plan.minAmount.toString() : "10",
      maxAmount: plan.maxAmount ? plan.maxAmount.toString() : "",
      noMaxLimit: plan.noMaxLimit || !plan.maxAmount,
      payoutInterval:
        plan.payoutInterval === "Daily Payout" ? "daily" : "per_second",
      status: plan.status || "Active",
      description: plan.description || "",
    });
    setModalOpen(true);
  };

  // 4. Handle ROI Slabs Table Changes (Spreadsheet Standard)
  const handleSlabsTableChange = (index, field, value) => {
    const updated = [...formData.roiSlabsTable];
    const item = { ...updated[index] };
    const num = parseFloat(value);
    item[field] = isNaN(num) ? value : num;
    updated[index] = item;

    // Keep base slab in sync
    const baseRow = updated[0];
    const baseWithout = Number(baseRow?.withoutLockIn) || 0.3;
    const base3X = Number(baseRow?.cap3X) || 0.8;
    const newRoiSlabs = [{
      minAmount: 10,
      maxAmount: "",
      noMaxLimit: true,
      dailyRoi: baseWithout,
      lockInDailyRoi: base3X,
      monthlyRoi: Number((baseWithout * 30).toFixed(2)),
      lockInMonthlyRoi: Number((base3X * 30).toFixed(2)),
      annualRoi: Number((baseWithout * 360).toFixed(2)),
      lockInAnnualRoi: Number((base3X * 360).toFixed(2)),
    }];

    setFormData({
      ...formData,
      roiSlabsTable: updated,
      roiSlabs: newRoiSlabs,
      dailyRoi: String(baseWithout),
      roi: String((baseWithout * 30).toFixed(2)),
    });
  };

  const handleResetSlabsTable = () => {
    setFormData({
      ...formData,
      roiSlabsTable: ROI_SLABS_TABLE.map((s) => ({ ...s })),
      roiSlabs: DEFAULT_ROI_SLABS.map((s) => ({ ...s })),
      dailyRoi: "0.3",
      roi: "9.0",
    });
  };

  // 5. Handle Save (Create or Update API call)
  const handleSave = async () => {
    const finalCategory =
      formData.category === "custom"
        ? formData.customCategory.trim() || "General Yield"
        : formData.category;

    const isSlab = formData.roiType === "slab";
    const processedSlabs = isSlab
      ? formData.roiSlabs.map((s) => {
          const d = Number(s.dailyRoi) || 0;
          const lockInD = s.lockInDailyRoi !== undefined && s.lockInDailyRoi !== null && s.lockInDailyRoi !== ""
            ? Number(s.lockInDailyRoi)
            : Number((d + 0.1).toFixed(3));
          return {
            minAmount: Number(s.minAmount) || 0,
            maxAmount: s.noMaxLimit ? null : (s.maxAmount ? Number(s.maxAmount) : null),
            noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
            dailyRoi: d,
            lockInDailyRoi: lockInD,
            monthlyRoi: Number((d * 30).toFixed(2)),
            lockInMonthlyRoi: Number((lockInD * 30).toFixed(2)),
            annualRoi: Number((d * 360).toFixed(2)),
            lockInAnnualRoi: Number((lockInD * 360).toFixed(2)),
          };
        })
      : [];

    const minVal = isSlab && processedSlabs.length > 0
      ? processedSlabs[0].minAmount
      : parseFloat(formData.minAmount) || 10;

    const maxVal = isSlab && processedSlabs.length > 0
      ? processedSlabs[processedSlabs.length - 1].noMaxLimit
        ? null
        : processedSlabs[processedSlabs.length - 1].maxAmount
      : formData.noMaxLimit
      ? null
      : parseFloat(formData.maxAmount) || 50000;

    const isNoMax = isSlab && processedSlabs.length > 0
      ? processedSlabs[processedSlabs.length - 1].noMaxLimit
      : formData.noMaxLimit;

    const roiVal = isSlab && processedSlabs.length > 0
      ? processedSlabs[0].monthlyRoi
      : parseFloat(formData.roi) || 9.0;

    const dailyRoiVal = isSlab && processedSlabs.length > 0
      ? processedSlabs[0].dailyRoi
      : parseFloat(formData.dailyRoi) || (roiVal / 30);

    const finalDuration = formData.isInfinite
      ? "Infinite / Lifetime"
      : formatDurationString(
          formData.durationDD,
          formData.durationMM,
          formData.durationYYYY,
          false
        );

    const totalDays = formData.isInfinite
      ? 0
      : (parseInt(formData.durationYYYY, 10) || 0) * 365 +
        (parseInt(formData.durationMM, 10) || 0) * 30 +
        (parseInt(formData.durationDD, 10) || 0) || 365;

    // Map frontend state to Backend Mongoose Schema
    const payload = {
      name: formData.name || "New Investment Plan",
      category: finalCategory,
      roiType: formData.roiType,
      roi: roiVal,
      dailyRoi: dailyRoiVal,
      roiSlabs: processedSlabs,
      roiSlabsTable: formData.roiSlabsTable || ROI_SLABS_TABLE,
      minDepositAmount: parseFloat(formData.minDepositAmount) || 10,
      minWithdrawalAmount: parseFloat(formData.minWithdrawalAmount) || 5,
      singleIdMaxWithdrawal: formData.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed",
      singleIdMaxWithdrawalMultiplier: 4,
      hasLockInOption: formData.hasLockInOption,
      lockInPeriodDays: Number(formData.lockInPeriodDays) || 0,
      duration: finalDuration,
      durationDays: totalDays,
      isInfinite: formData.isInfinite,
      minAmount: minVal,
      maxAmount: isNoMax ? null : maxVal,
      noMaxLimit: isNoMax,
      payoutInterval:
        formData.payoutInterval === "per_second"
          ? "Per Second (Live)"
          : "Daily Payout",
      status: formData.status,
      description: formData.description,
    };

    try {
      if (editingPlan) {
        await updatePlans(editingPlan._id, payload);
        toast.success(`Investment plan "${payload.name}" updated successfully!`, "Plan Updated");
      } else {
        await createPlan(payload);
        toast.success(`New investment plan "${payload.name}" launched successfully!`, "Plan Created");
      }
      setModalOpen(false);
      fetchPlans(); // Refresh lists from backend
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan. Please check required fields.", "Save Failed");
    }
  };

  // 6. Delete Plan API Integration
  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(id);
        fetchPlans();
        toast.info("Investment plan removed from platform catalog.", "Plan Deleted");
      } catch (error) {
        console.error("Error deleting plan:", error);
        toast.error("Failed to delete plan.", "Delete Failed");
      }
    }
  };

  // Filtering Logic
  const filtered = plans.filter((plan) => {
    const matchSearch =
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      filterCategory === "all" || plan.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (loading) {
    return <SkeletonLoader type="table" rows={5} cols={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <PageHeader
        title="Investment Plans"
        subtitle="Configure Amount-Wise Daily ROI Slabs, Durations & Live Streaming Engine"
        badge="Asset Engine"
        actions={
          <Button variant="primary" icon={<RiAddLine />} onClick={openAdd}>
            Add New Plan
          </Button>
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
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold capitalize whitespace-nowrap transition-all ${
                  filterCategory === cat
                    ? "bg-gold-400 text-gray-900 shadow-gold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plans Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 sm:gap-5">
        {filtered.map((plan, i) => {
          const isRenewable = plan.category === "Renewable Energy";
          const isMetal = plan.category === "Precious Metal";
          const isPlanInfinite =
            plan.isInfinite ||
            plan.duration?.toLowerCase().includes("infinite") ||
            plan.duration?.toLowerCase().includes("lifetime");

          const hasSlabs =
            plan.roiType === "slab" ||
            (Array.isArray(plan.roiSlabs) && plan.roiSlabs.length > 0);

          const slabsList = hasSlabs
            ? plan.roiSlabs
            : DEFAULT_ROI_SLABS;

          const minSlabDaily = slabsList[0]?.dailyRoi || 0.25;
          const maxSlabDaily = slabsList[slabsList.length - 1]?.dailyRoi || 1.0;
          const minSlabMonthly = (minSlabDaily * 30).toFixed(1);
          const maxSlabMonthly = (maxSlabDaily * 30).toFixed(1);

          const isExpanded = expandedSlabsPlanId === plan._id;

          return (
            <div
              key={plan._id}
              className="card card-gold p-4 sm:p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                {/* Top: Category Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs ${
                        isRenewable
                          ? "bg-emerald-50 text-emerald-600"
                          : isMetal
                          ? "bg-amber-50 text-amber-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {isRenewable ? (
                        <RiLeafLine size={22} />
                      ) : isMetal ? (
                        <RiCoinsLine size={22} />
                      ) : (
                        <RiShieldFlashLine size={22} />
                      )}
                    </div>
                    <div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isRenewable
                            ? "bg-emerald-100/70 text-emerald-800"
                            : isMetal
                            ? "bg-amber-100/70 text-amber-800"
                            : "bg-blue-100/70 text-blue-800"
                        }`}
                      >
                        {plan.category || "Standard"}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={plan.status === "Active" ? "success" : "danger"}
                  >
                    {plan.status}
                  </Badge>
                </div>

                {/* Plan Title */}
                <h3 className="text-lg font-bold text-gray-800 font-display mb-3 line-clamp-1 group-hover:text-gold-600 transition-colors">
                  {plan.name}
                </h3>

                {/* Amount-Wise Daily ROI Highlight Box */}
                <div className="p-3.5 bg-gradient-to-r from-gold-50/90 to-amber-50/50 rounded-xl border border-gold-200/60 mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1 text-xs text-gold-700 font-bold">
                      <RiFlashlightLine
                        size={15}
                        className="text-amber-500 animate-pulse"
                      />
                      ROI Slabs Per Day
                    </span>
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-display">
                        {hasSlabs
                          ? `${minSlabDaily}% – ${maxSlabDaily}% / day`
                          : `${((plan.dailyRoi || plan.roi / 30) || 0.3).toFixed(2)}% / day`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1.5 border-t border-gold-200/40">
                    <span>Without Lock In Period</span>
                    <span className="font-extrabold text-emerald-700 font-mono">
                      {minSlabDaily}% / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                    <span>3X Cap</span>
                    <span className="font-extrabold text-amber-700 font-mono">
                      {slabsList[0]?.lockInDailyRoi !== undefined ? slabsList[0].lockInDailyRoi : 0.8}% / day
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40">
                    <span>Deposit &bull; Withdrawal Min</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      Min Dep: ${plan.minDepositAmount || 10} &bull; Min WD: ${plan.minWithdrawalAmount || 5}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-full font-bold mt-2 border border-amber-300/70 shadow-2xs">
                    <span>Single ID Limit</span>
                    <span className="font-extrabold text-amber-950 font-mono text-[10px]">
                      {plan.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}
                    </span>
                  </div>
                </div>

                {/* Key Specs */}
                <div className="space-y-2.5 mb-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <UilMoneyBill size={16} /> Investment Range
                    </span>
                    <span className="font-bold text-gray-800 text-xs">
                      {plan.noMaxLimit || !plan.maxAmount
                        ? `${plan.minAmount || 10}$ to any amount`
                        : `$${plan.minAmount || 10} to $${plan.maxAmount}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <RiPercentLine size={16} /> Active Investors
                    </span>
                    <span className="font-semibold text-gold-600 text-xs">
                      {plan.investors || 0} Users
                    </span>
                  </div>
                </div>

                {/* Amount-Wise Slabs Accordion / Dropdown */}
                {hasSlabs && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSlabsPlanId(isExpanded ? null : plan._id)
                      }
                      className="w-full py-2 px-3.5 rounded-full bg-yellow-400/90 hover:bg-yellow-400 text-gray-950 border border-yellow-500 text-[11px] font-extrabold flex items-center justify-between transition-all shadow-2xs cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <RiStackLine size={14} className="text-gray-950 shrink-0" />
                        <span className="truncate">ROI Slabs (Without Lock-In vs 3X Cap)</span>
                      </span>
                      {isExpanded ? (
                        <RiArrowUpSLine size={16} className="shrink-0 ml-1" />
                      ) : (
                        <RiArrowDownSLine size={16} className="shrink-0 ml-1" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 overflow-hidden rounded-xl border border-yellow-400 shadow-xs bg-white text-[11px] animate-fade-in">
                        {/* Yellow Banner Header matching Spreadsheet */}
                        <div className="bg-yellow-300 py-1.5 px-3 text-center text-xs font-black text-gray-950 uppercase tracking-wide border-b border-yellow-400">
                          ROI Slabs Per Day
                        </div>
                        <div className="grid grid-cols-4 font-black text-gray-800 bg-yellow-50/80 text-[10px] py-1.5 px-2.5 border-b border-yellow-200 text-center uppercase tracking-wider">
                          <span className="text-left">Amount</span>
                          <span>Period</span>
                          <span className="text-emerald-800">Without Lock In Period</span>
                          <span className="text-amber-900 text-right">3X Cap</span>
                        </div>
                        {(plan.roiSlabsTable && plan.roiSlabsTable.length > 0
                          ? plan.roiSlabsTable
                          : ROI_SLABS_TABLE
                        ).map((row, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-4 items-center py-2 px-2.5 border-b border-gray-100 last:border-none text-[11px] hover:bg-yellow-50/30 transition-colors"
                          >
                            <span className="font-bold text-gray-900 text-left">
                              {row.amount}
                            </span>
                            <span className="text-center font-mono font-bold text-gray-700">
                              {row.period || '—'}
                            </span>
                            <span className="text-center font-black text-emerald-700 font-mono">
                              {row.withoutLockIn}%
                            </span>
                            <span className="text-right font-black text-amber-800 font-mono">
                              {row.cap3X}%
                            </span>
                          </div>
                        ))}
                        <div className="p-2 bg-amber-50/80 border-t border-yellow-200 text-[10px] text-amber-950 flex items-start gap-1.5">
                          <RiInformationLine size={14} className="text-amber-700 shrink-0 mt-0.5" />
                          <div className="leading-tight">
                            <span className="font-bold">Non-Withdrawal Bonus Policy:</span> If no withdrawal is made for 30 days, daily ROI increases to 0.35% (Without Lock-In) / 0.90% (3X Cap). If no withdrawal is made for 60 days, daily ROI increases to 0.40% (Without Lock-In) / 1.00% (3X Cap).
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 border-t border-gray-200 text-[10px] text-gray-600 flex flex-col gap-1 font-medium">
                          <div className="flex justify-between">
                            <span>Min. Deposit: <b>${plan.minDepositAmount || 10}</b></span>
                            <span>Min Withdrawal: <b>${plan.minWithdrawalAmount || 5}</b></span>
                          </div>
                          <div className="text-amber-800 font-bold text-[9.5px] border-t border-gray-200/60 pt-1 flex items-center justify-between">
                            <span>Single ID Limit:</span>
                            <span className="text-amber-950 font-extrabold">{plan.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                  icon={<RiDeleteBinLine />}
                  onClick={() => handleDeletePlan(plan._id)}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  icon={<RiEditLine />}
                  onClick={() => openEdit(plan)}
                >
                  Configure
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-400">
            No investment plans found matching your search.
          </p>
        </div>
      )}

      {/* ──────────────── Add/Edit Plan Right Drawer ──────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingPlan
            ? `Configure Plan: ${editingPlan.name}`
            : "Create New Investment Plan"
        }
        subtitle="Configure amount-wise daily ROI percentage slabs, limits & durations"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingPlan ? "Update Plan" : "Publish Plan"}
            </Button>
          </>
        }
      >
        <div className="space-y-5 font-sans">
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Plan Name *
            </label>
            <input
              className="input font-semibold"
              placeholder="e.g. Solar Eco Farm Yield, Physical Gold Bullion"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Category Selection + Custom Option */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Asset Category *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                {
                  id: "Renewable Energy",
                  label: "Renewable Energy",
                  icon: RiLeafLine,
                  color: "text-emerald-600",
                },
                {
                  id: "Precious Metal",
                  label: "Precious Metal",
                  icon: RiCoinsLine,
                  color: "text-amber-600",
                },
                {
                  id: "custom",
                  label: "Custom",
                  icon: RiAddLine,
                  color: "text-gold-600",
                },
              ].map((cat) => {
                const IconComp = cat.icon;
                const isSelected = formData.category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, category: cat.id })
                    }
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-gold-50 border-gold-400 text-gold-900 shadow-xs ring-1 ring-gold-300"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <IconComp size={16} className={cat.color} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {formData.category === "custom" && (
              <input
                className="input mt-2"
                placeholder="Enter custom category name (e.g. Clean Tech, EV Fleet, AI Compute)"
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData({ ...formData, customCategory: e.target.value })
                }
                autoFocus
              />
            )}
          </div>

          {/* Min Deposit, Min Withdrawal & Single ID Capping Settings */}
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Min. Deposit Amount ($)
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus-within:border-gold-400">
                  <span className="text-gray-400 font-bold text-xs mr-1">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.minDepositAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minDepositAmount: e.target.value.replace(/[^0-9]/g, "") })
                    }
                    className="w-full bg-transparent outline-none font-bold text-gray-800 text-xs"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Min. Withdrawal Amount ($)
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus-within:border-gold-400">
                  <span className="text-gray-400 font-bold text-xs mr-1">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.minWithdrawalAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minWithdrawalAmount: e.target.value.replace(/[^0-9]/g, "") })
                    }
                    className="w-full bg-transparent outline-none font-bold text-gray-800 text-xs"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Single ID Maximum Withdrawal Rule
              </label>
              <div className="flex items-center rounded-lg border border-amber-300 bg-amber-50/70 px-2.5 py-1.5 focus-within:border-amber-500">
                <input
                  type="text"
                  value={formData.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed"}
                  onChange={(e) =>
                    setFormData({ ...formData, singleIdMaxWithdrawal: e.target.value })
                  }
                  className="w-full bg-transparent outline-none font-extrabold text-amber-950 text-xs"
                  placeholder="3X + Capital Maximum Withdrawal Allowed"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Single ID: 3X + Capital Maximum Withdrawal Allowed (Account maximum withdrawal cap is 4X total invested).
              </p>
            </div>
          </div>

          {/* ROI Structure Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              ROI Calculation Model *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, roiType: "slab" })}
                className={`py-2.5 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  formData.roiType === "slab"
                    ? "bg-gold-500 border-gold-500 text-gray-950 font-extrabold shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <RiFundsLine size={16} />
                <span>Amount-Wise Daily ROI Slabs</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, roiType: "fixed" })}
                className={`py-2.5 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  formData.roiType === "fixed"
                    ? "bg-gold-500 border-gold-500 text-gray-950 font-extrabold shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <RiPercentLine size={16} />
                <span>Fixed ROI Percentage</span>
              </button>
            </div>
          </div>

          {/* ──────── ROI SLABS PER DAY CONFIGURATOR (SPREADSHEET STANDARD) ──────── */}
          {formData.roiType === "slab" ? (
            <div className="p-4 bg-gradient-to-br from-amber-50/70 via-gold-50/50 to-white rounded-2xl border border-yellow-400 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-yellow-300">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-yellow-400 text-gray-950 flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <RiSparklingLine size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                      ROI Slabs Per Day (Without Lock-In vs 3X Cap)
                    </h4>
                    <p className="text-[11px] text-gray-600">
                      Configure base daily ROI rates and non-withdrawal holding bonus boosts
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetSlabsTable}
                  className="self-start sm:self-auto px-3 py-1 rounded-full bg-white border border-yellow-400 text-yellow-950 hover:bg-yellow-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <RiRefreshLine size={13} /> Reset Standard Slabs
                </button>
              </div>

              {/* Table Matching Spreadsheet with Yellow Header */}
              <div className="overflow-hidden rounded-xl border border-yellow-400 shadow-2xs bg-white text-xs">
                <div className="bg-yellow-300 py-1.5 px-3 text-center text-xs font-black text-gray-950 uppercase tracking-wide border-b border-yellow-400">
                  ROI Slabs Per Day
                </div>
                <div className="grid grid-cols-12 font-black text-gray-800 bg-yellow-50/80 text-[10px] py-2 px-3 border-b border-yellow-200 uppercase tracking-wider text-center">
                  <span className="col-span-4 text-left">Amount</span>
                  <span className="col-span-2">Period (Days)</span>
                  <span className="col-span-3 text-emerald-800">Without Lock In (%)</span>
                  <span className="col-span-3 text-amber-900 text-right">3X Cap (%)</span>
                </div>

                {(formData.roiSlabsTable || ROI_SLABS_TABLE).map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 items-center py-2.5 px-3 border-b border-gray-100 last:border-none text-xs hover:bg-yellow-50/30 transition-colors gap-2"
                  >
                    <span className="col-span-4 font-bold text-gray-900">
                      {row.amount}
                    </span>
                    <span className="col-span-2 text-center font-mono font-bold text-gray-700">
                      {row.period ? `${row.period} Days` : '—'}
                    </span>
                    <div className="col-span-3 flex items-center justify-center">
                      <div className="flex items-center rounded-lg border border-emerald-300 bg-emerald-50/60 px-2 py-1 w-24">
                        <input
                          type="text"
                          value={row.withoutLockIn}
                          onChange={(e) => handleSlabsTableChange(idx, "withoutLockIn", e.target.value)}
                          className="w-full bg-transparent outline-none font-black text-emerald-700 text-xs text-center font-mono"
                          placeholder="0.3"
                        />
                        <span className="text-emerald-600 font-bold text-[10px]">%</span>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      <div className="flex items-center rounded-lg border border-amber-300 bg-amber-50/60 px-2 py-1 w-24">
                        <input
                          type="text"
                          value={row.cap3X}
                          onChange={(e) => handleSlabsTableChange(idx, "cap3X", e.target.value)}
                          className="w-full bg-transparent outline-none font-black text-amber-800 text-xs text-center font-mono"
                          placeholder="0.8"
                        />
                        <span className="text-amber-600 font-bold text-[10px]">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy Explainer in English */}
              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-yellow-300 text-[11px] text-amber-950 flex items-start gap-2">
                <RiInformationLine size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Non-Withdrawal Bonus Policy:</span> If no withdrawal is made for 30 days, daily ROI increases to 0.35% (Without Lock-In) / 0.90% (3X Cap). If no withdrawal is made for 60 days, daily ROI increases to 0.40% (Without Lock-In) / 1.00% (3X Cap).
                </div>
              </div>
            </div>
          ) : (
            /* Fixed ROI Inputs */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Minimum Investment ($) *
                  </label>
                  <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                    <span className="pl-3.5 pr-1 text-gray-500 font-bold text-sm select-none">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="w-full py-2.5 pr-3 bg-transparent border-none outline-none font-semibold text-gray-800 text-sm"
                      placeholder="1000"
                      value={formData.minAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, minAmount: val });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Maximum Investment ($)
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.noMaxLimit}
                        onChange={(e) =>
                          setFormData({ ...formData, noMaxLimit: e.target.checked })
                        }
                        className="rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                      />
                      No Limit
                    </label>
                  </div>
                  <div
                    className={`flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 overflow-hidden transition-all shadow-2xs ${
                      formData.noMaxLimit ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <span className="pl-3.5 pr-1 text-gray-500 font-bold text-sm select-none">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={formData.noMaxLimit}
                      className={`w-full py-2.5 pr-3 bg-transparent border-none outline-none font-semibold text-gray-800 text-sm ${
                        formData.noMaxLimit
                          ? "text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={formData.noMaxLimit ? "Unlimited" : "50000"}
                      value={formData.noMaxLimit ? "" : formData.maxAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setFormData({ ...formData, maxAmount: val });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Monthly ROI (%) *
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Daily: {((parseFloat(formData.roi) || 7.5) / 30).toFixed(3)}% &bull; Annual: {((parseFloat(formData.roi) || 7.5) * 12).toFixed(1)}% APY
                  </span>
                </div>
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full py-2.5 pl-3.5 pr-1 bg-transparent border-none outline-none font-bold text-gray-800 text-sm"
                    placeholder="7.5"
                    value={formData.roi}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setFormData({ ...formData, roi: val });
                    }}
                  />
                  <span className="pr-3.5 text-gray-400 font-bold text-sm select-none">
                    % / Month
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Duration Selector (Infinite / Lifetime vs DD / MM / YYYY) */}
          <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Plan Duration (DD / MM / YYYY) *
              </label>
              <span className="text-[11px] font-bold text-gold-800 bg-gold-100/80 px-2.5 py-0.5 rounded-md border border-gold-300 shadow-2xs truncate max-w-[200px] flex items-center gap-1">
                <RiTimeLine size={13} />
                {formData.isInfinite
                  ? "∞ Infinite / Lifetime"
                  : formatDurationString(
                      formData.durationDD,
                      formData.durationMM,
                      formData.durationYYYY,
                      false
                    )}
              </span>
            </div>

            {/* Selector Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isInfinite: false })}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  !formData.isInfinite
                    ? "bg-white border-gold-400 text-gold-900 shadow-xs ring-1 ring-gold-300 font-extrabold"
                    : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white"
                }`}
              >
                <RiCalendarEventLine
                  size={15}
                  className={!formData.isInfinite ? "text-gold-600" : "text-gray-400"}
                />
                <span>Fixed Duration</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, isInfinite: true })}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  formData.isInfinite
                    ? "bg-gold-500 border-gold-500 text-gray-950 shadow-xs font-extrabold"
                    : "bg-white/60 border-gray-200 text-gray-600 hover:bg-white"
                }`}
              >
                <span className="text-sm font-extrabold leading-none">∞</span>
                <span>Infinite / Lifetime</span>
              </button>
            </div>

            {/* If Fixed Duration, show DD, MM, YYYY inputs */}
            {!formData.isInfinite ? (
              <div className="grid grid-cols-3 gap-2 animate-fade-in pt-1">
                {/* Days (DD) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    className="w-full py-2 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
                    placeholder="DD"
                    value={formData.durationDD}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationDD: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                  />
                  <span className="pr-2 text-[10px] text-gray-400 font-bold uppercase select-none">
                    Days
                  </span>
                </div>

                {/* Months (MM) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-full py-2 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
                    placeholder="MM"
                    value={formData.durationMM}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMM: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                  />
                  <span className="pr-2 text-[10px] text-gray-400 font-bold uppercase select-none">
                    Months
                  </span>
                </div>

                {/* Years (YYYY) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-full py-2 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
                    placeholder="YYYY"
                    value={formData.durationYYYY}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationYYYY: e.target.value.replace(/[^0-9]/g, ""),
                      })
                    }
                  />
                  <span className="pr-2 text-[10px] text-gray-400 font-bold uppercase select-none">
                    Years
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-gold-100/50 border border-gold-300/70 rounded-xl flex items-center gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-gold-400 text-gray-950 flex items-center justify-center font-extrabold text-base shrink-0 shadow-2xs">
                  ∞
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Lifetime Contract (Infinite Day)
                  </p>
                  <p className="text-[10.5px] text-gray-600 leading-tight">
                    No lock-in or maturity date. Investors earn continuous yields on an ongoing basis.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Yield Payout Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Yield Payout Mode *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  formData.payoutInterval === "per_second"
                    ? "border-gold-400 bg-gold-50/80 shadow-xs ring-1 ring-gold-400"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="payoutInterval"
                  value="per_second"
                  checked={formData.payoutInterval === "per_second"}
                  onChange={() =>
                    setFormData({ ...formData, payoutInterval: "per_second" })
                  }
                  className="text-gold-500 focus:ring-gold-400"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <RiFlashlightLine className="text-amber-500" /> Real-time
                    Per Second
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Live per-second stream
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  formData.payoutInterval === "daily"
                    ? "border-gold-400 bg-gold-50/80 shadow-xs ring-1 ring-gold-400"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="payoutInterval"
                  value="daily"
                  checked={formData.payoutInterval === "daily"}
                  onChange={() =>
                    setFormData({ ...formData, payoutInterval: "daily" })
                  }
                  className="text-gold-500 focus:ring-gold-400"
                />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <RiCalendarEventLine className="text-blue-500" /> Daily
                    Payout
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Settled daily at 00:00 UTC
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Plan Status
            </label>
            <select
              className="input font-semibold"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="Active">Active (Visible to Investors)</option>
              <option value="Inactive">Inactive (Draft / Hidden)</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Plan Description & Highlights
            </label>
            <textarea
              className="input min-h-[90px] resize-none text-sm"
              placeholder="Describe asset backing, solar plant capacity, physical gold vault audits..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
