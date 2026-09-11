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

import {
  getAllPlans,
  createPlan,
  updatePlans,
  deletePlan,
} from "../api/plansApi";

// Default standard Amount-Wise Daily ROI Percentage Slabs requested by client
export const DEFAULT_ROI_SLABS = [
  { minAmount: 10, maxAmount: 49, noMaxLimit: false, dailyRoi: 0.25, monthlyRoi: 7.5, annualRoi: 90 },
  { minAmount: 50, maxAmount: 99, noMaxLimit: false, dailyRoi: 0.35, monthlyRoi: 10.5, annualRoi: 126 },
  { minAmount: 100, maxAmount: 499, noMaxLimit: false, dailyRoi: 0.55, monthlyRoi: 16.5, annualRoi: 198 },
  { minAmount: 500, maxAmount: 1500, noMaxLimit: false, dailyRoi: 0.75, monthlyRoi: 22.5, annualRoi: 270 },
  { minAmount: 1500, maxAmount: "", noMaxLimit: true, dailyRoi: 1.0, monthlyRoi: 30.0, annualRoi: 360 },
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
    roi: "7.5", // Monthly ROI (%)
    dailyRoi: "0.25", // Daily ROI (%)
    roiSlabs: DEFAULT_ROI_SLABS,
    loyaltyBonusEnabled: true,
    loyaltyBonusTitle: "Reward ( Loyalty Bonus )",
    loyaltyBonusDescription: "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
    loyaltyBonusSlabs: DEFAULT_LOYALTY_SLABS,
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
      roi: "7.5",
      dailyRoi: "0.25",
      roiSlabs: DEFAULT_ROI_SLABS.map((s) => ({ ...s })),
      loyaltyBonusEnabled: true,
      loyaltyBonusTitle: "Reward ( Loyalty Bonus )",
      loyaltyBonusDescription: "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
      loyaltyBonusSlabs: DEFAULT_LOYALTY_SLABS.map((s) => ({ ...s })),
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
        ? plan.roiSlabs.map((s) => ({
            minAmount: s.minAmount,
            maxAmount: s.maxAmount || "",
            noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
            dailyRoi: s.dailyRoi || Number(((s.monthlyRoi || plan.roi || 7.5) / 30).toFixed(3)),
            monthlyRoi: s.monthlyRoi || Number(((s.dailyRoi || 0.25) * 30).toFixed(2)),
            annualRoi: s.annualRoi || Number(((s.dailyRoi || 0.25) * 360).toFixed(2)),
          }))
        : DEFAULT_ROI_SLABS.map((s) => ({ ...s }));

    const loyaltySlabs =
      Array.isArray(plan.loyaltyBonusSlabs) && plan.loyaltyBonusSlabs.length > 0
        ? plan.loyaltyBonusSlabs.map((s) => ({
            days: s.days,
            bonusPercentage: s.bonusPercentage,
            label: s.label || `${s.days} Days`,
          }))
        : DEFAULT_LOYALTY_SLABS.map((s) => ({ ...s }));

    setFormData({
      name: plan.name || "",
      category: isCustomCat ? "custom" : plan.category || "Renewable Energy",
      customCategory: isCustomCat ? plan.category : "",
      roiType: plan.roiType || (plan.roiSlabs?.length > 0 ? "slab" : "fixed"),
      roi: plan.roi !== undefined ? plan.roi.toString() : "7.5",
      dailyRoi:
        plan.dailyRoi !== undefined
          ? plan.dailyRoi.toString()
          : plan.roi !== undefined
          ? (Number(plan.roi) / 30).toFixed(3)
          : "0.25",
      roiSlabs: slabs,
      loyaltyBonusEnabled: plan.loyaltyBonusEnabled !== false,
      loyaltyBonusTitle: plan.loyaltyBonusTitle || "Reward ( Loyalty Bonus )",
      loyaltyBonusDescription: plan.loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
      loyaltyBonusSlabs: loyaltySlabs,
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

  // 4. Handle Slabs Changes with Dynamic Calculations
  const handleSlabChange = (index, field, value) => {
    const updated = [...formData.roiSlabs];
    const item = { ...updated[index] };

    if (field === "dailyRoi") {
      item.dailyRoi = value;
      const numDaily = parseFloat(value) || 0;
      item.monthlyRoi = parseFloat((numDaily * 30).toFixed(2));
      item.annualRoi = parseFloat((numDaily * 360).toFixed(2));
    } else if (field === "monthlyRoi") {
      item.monthlyRoi = value;
      const numMonthly = parseFloat(value) || 0;
      item.dailyRoi = parseFloat((numMonthly / 30).toFixed(3));
      item.annualRoi = parseFloat((numMonthly * 12).toFixed(2));
    } else if (field === "annualRoi") {
      item.annualRoi = value;
      const numAnnual = parseFloat(value) || 0;
      item.monthlyRoi = parseFloat((numAnnual / 12).toFixed(2));
      item.dailyRoi = parseFloat((numAnnual / 360).toFixed(3));
    } else if (field === "minAmount") {
      item.minAmount = value.replace(/[^0-9]/g, "");
    } else if (field === "maxAmount") {
      item.maxAmount = value.replace(/[^0-9]/g, "");
    } else if (field === "noMaxLimit") {
      item.noMaxLimit = value;
      if (value) item.maxAmount = "";
    }

    updated[index] = item;
    setFormData({ ...formData, roiSlabs: updated });
  };

  const handleAddSlab = () => {
    const slabs = formData.roiSlabs.map((s) => ({ ...s }));
    const lastIndex = slabs.length - 1;
    const last = slabs[lastIndex];

    let newMin = 1500;
    if (last) {
      const lastMin = Number(last.minAmount) || 0;
      let prevMax = Number(last.maxAmount);
      if (!prevMax || prevMax <= lastMin || last.noMaxLimit) {
        prevMax = lastMin + 999;
        last.maxAmount = String(prevMax);
      }
      last.noMaxLimit = false;
      newMin = prevMax + 1;
    }

    const prevDaily = last ? Number(last.dailyRoi) || 1.0 : 1.0;
    const newDaily = parseFloat((prevDaily + 0.25).toFixed(2));

    const newSlab = {
      minAmount: String(newMin),
      maxAmount: "",
      noMaxLimit: true,
      dailyRoi: String(newDaily),
      monthlyRoi: parseFloat((newDaily * 30).toFixed(2)),
      annualRoi: parseFloat((newDaily * 360).toFixed(2)),
    };

    setFormData({
      ...formData,
      roiSlabs: [...slabs, newSlab],
    });
  };

  const handleRemoveSlab = (index) => {
    if (formData.roiSlabs.length <= 1) return;
    const updated = formData.roiSlabs.filter((_, i) => i !== index);
    const lastIdx = updated.length - 1;
    if (lastIdx >= 0 && !updated.some((s) => s.noMaxLimit)) {
      updated[lastIdx].noMaxLimit = true;
      updated[lastIdx].maxAmount = "";
    }
    setFormData({ ...formData, roiSlabs: updated });
  };

  const handleResetSlabs = () => {
    setFormData({
      ...formData,
      roiSlabs: DEFAULT_ROI_SLABS.map((s) => ({ ...s })),
    });
  };

  const handleLoyaltySlabChange = (index, field, value) => {
    const updated = [...formData.loyaltyBonusSlabs];
    const item = { ...updated[index] };
    if (field === "bonusPercentage") {
      item.bonusPercentage = value;
    } else if (field === "days") {
      item.days = Number(value.replace(/[^0-9]/g, "")) || 0;
    }
    updated[index] = item;
    setFormData({ ...formData, loyaltyBonusSlabs: updated });
  };

  const handleResetLoyaltySlabs = () => {
    setFormData({
      ...formData,
      loyaltyBonusSlabs: DEFAULT_LOYALTY_SLABS.map((s) => ({ ...s })),
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
          return {
            minAmount: Number(s.minAmount) || 0,
            maxAmount: s.noMaxLimit ? null : Number(s.maxAmount) || null,
            noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
            dailyRoi: d,
            monthlyRoi: Number((d * 30).toFixed(2)),
            annualRoi: Number((d * 360).toFixed(2)),
          };
        })
      : [];

    const processedLoyaltySlabs = formData.loyaltyBonusSlabs.map((s) => ({
      days: Number(s.days) || 30,
      bonusPercentage: parseFloat(s.bonusPercentage) || 0.5,
      label: s.label || `${s.days} Days`,
    }));

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
      : parseFloat(formData.roi) || 7.5;

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
      loyaltyBonusEnabled: formData.loyaltyBonusEnabled,
      loyaltyBonusTitle: formData.loyaltyBonusTitle,
      loyaltyBonusDescription: formData.loyaltyBonusDescription,
      loyaltyBonusSlabs: processedLoyaltySlabs,
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
      } else {
        await createPlan(payload);
      }
      setModalOpen(false);
      fetchPlans(); // Refresh lists from backend
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("Failed to save plan. Please try again.");
    }
  };

  // 6. Delete Plan API Integration
  const handleDeletePlan = async (id) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await deletePlan(id);
        fetchPlans();
      } catch (error) {
        console.error("Error deleting plan:", error);
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
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
              className="card card-gold p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                {/* Top: Category Icon & Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs ${
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
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1 text-xs text-gold-700 font-bold">
                      <RiFlashlightLine
                        size={15}
                        className="text-amber-500 animate-pulse"
                      />
                      {hasSlabs ? "Daily ROI Slabs" : "Daily / Monthly ROI"}
                    </span>
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-display">
                        {hasSlabs
                          ? `${minSlabDaily}% – ${maxSlabDaily}% Daily`
                          : `${((plan.dailyRoi || plan.roi / 30) || 0.25).toFixed(2)}% Daily`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40">
                    <span>Monthly / Annual Range</span>
                    <span className="font-bold text-gray-800 font-mono">
                      {hasSlabs
                        ? `${minSlabMonthly}% – ${maxSlabMonthly}% / mo`
                        : `${plan.roi}% / mo (${(Number(plan.roi || 0) * 12).toFixed(1)}% APY)`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Payout Mode</span>
                    <span className="font-semibold text-gray-800 font-mono">
                      {plan.payoutInterval || "Per Second (Live)"}
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
                      ${plan.minAmount?.toLocaleString() || "10"} —{" "}
                      {plan.noMaxLimit || !plan.maxAmount
                        ? "Unlimited"
                        : `$${plan.maxAmount.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                      <RiTimeLine size={16} /> Duration
                    </span>
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                      {isPlanInfinite ? (
                        <span className="inline-flex items-center gap-1 text-gold-700 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 font-extrabold">
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
                      className="w-full py-1.5 px-2.5 rounded-lg bg-gold-100/50 hover:bg-gold-100 text-gold-900 border border-gold-300/70 text-[11px] font-bold flex items-center justify-between transition-all"
                    >
                      <span className="flex items-center gap-1.5">
                        <RiStackLine size={14} className="text-gold-600" />
                        <span>View 5 Amount-Wise ROI Slabs</span>
                      </span>
                      {isExpanded ? (
                        <RiArrowUpSLine size={16} />
                      ) : (
                        <RiArrowDownSLine size={16} />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-gold-200 space-y-1.5 animate-fade-in text-[11px]">
                        <div className="grid grid-cols-3 font-bold text-gray-500 uppercase text-[9.5px] pb-1 border-b border-gray-200">
                          <span>Amount Slab</span>
                          <span className="text-center">Daily ROI</span>
                          <span className="text-right">Monthly (Annual)</span>
                        </div>
                        {slabsList.map((slab, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-3 items-center py-1 border-b border-gray-100 last:border-none"
                          >
                            <span className="font-semibold text-gray-800">
                              ${slab.minAmount} —{" "}
                              {slab.noMaxLimit || !slab.maxAmount
                                ? "$1500++"
                                : `$${slab.maxAmount}`}
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
                )}

                {/* Reward (Loyalty Bonus) Information Box */}
                {plan.loyaltyBonusEnabled !== false && (
                  <div className="p-2.5 bg-gradient-to-r from-amber-50/90 via-gold-50/50 to-white rounded-xl border border-amber-200/80 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-amber-900 flex items-center gap-1">
                        <RiSparklingLine size={13} className="text-amber-600" />
                        Reward (Loyalty Bonus)
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">Capital Benefit</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      One time benefit directly given to the wallet (if not withdrawn):
                    </p>
                    <div className="grid grid-cols-5 gap-1 text-center">
                      {(plan.loyaltyBonusSlabs && plan.loyaltyBonusSlabs.length > 0 ? plan.loyaltyBonusSlabs : DEFAULT_LOYALTY_SLABS).map((s, idx) => (
                        <div key={idx} className="p-1 bg-white rounded-lg border border-amber-200/80 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-bold block">{s.days}d</span>
                          <span className="text-[10.5px] font-extrabold text-amber-700 block font-mono">+{s.bonusPercentage}%</span>
                        </div>
                      ))}
                    </div>
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

          {/* ROI Structure Mode Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              ROI Calculation Model *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, roiType: "slab" })}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                  formData.roiType === "slab"
                    ? "bg-gold-500 border-gold-500 text-gray-950 font-extrabold shadow-xs"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <RiFundsLine size={16} />
                <span>Amount-Wise Daily ROI Slabs (Active)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, roiType: "fixed" })}
                className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
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

          {/* ──────── AMOUNT-WISE DAILY ROI SLABS CONFIGURATOR ──────── */}
          {formData.roiType === "slab" ? (
            <div className="p-4 bg-gradient-to-br from-amber-50/70 via-gold-50/50 to-white rounded-2xl border border-gold-300/80 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gold-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gold-400 text-gray-950 flex items-center justify-center font-bold">
                    <RiSparklingLine size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Amount-Wise Daily ROI Slabs
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Calculations: Daily ROI auto-computes Monthly & Annually APY
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetSlabs}
                  className="px-2.5 py-1 rounded-lg bg-white border border-gold-300 text-gold-900 hover:bg-gold-50 text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <RiRefreshLine size={13} /> Reset Standard Slabs
                </button>
              </div>

              {/* Slabs Table Header */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10.5px] font-extrabold text-gray-500 uppercase px-1">
                  <span className="col-span-3">Min Amount ($)</span>
                  <span className="col-span-3">Max Amount ($)</span>
                  <span className="col-span-2">Daily ROI (%)</span>
                  <span className="col-span-2">Monthly (30d)</span>
                  <span className="col-span-1 text-center">Annual</span>
                  <span className="col-span-1 text-right">Del</span>
                </div>

                {/* Slabs List */}
                {formData.roiSlabs.map((slab, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-gold-200/80 shadow-2xs hover:border-gold-400 transition-all text-xs"
                  >
                    {/* Min Amount */}
                    <div className="col-span-3 flex items-center rounded-lg border border-gray-200 bg-gray-50/50 px-2 py-1.5 focus-within:border-gold-400 focus-within:bg-white">
                      <span className="text-gray-400 font-bold text-xs mr-1">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={slab.minAmount}
                        onChange={(e) =>
                          handleSlabChange(idx, "minAmount", e.target.value)
                        }
                        className="w-full bg-transparent outline-none font-bold text-gray-800 text-xs"
                        placeholder="10"
                      />
                    </div>

                    {/* Max Amount + Unlimited checkbox */}
                    <div className="col-span-3 flex items-center gap-1">
                      {slab.noMaxLimit ? (
                        <div className="w-full flex items-center justify-between py-1 px-2 rounded-lg bg-gold-100/80 border border-gold-300 text-gold-900 font-extrabold text-xs">
                          <span className="truncate">{slab.minAmount || 0}$ ++ (No Limit)</span>
                          <button
                            type="button"
                            title="Set fixed max limit"
                            onClick={() => {
                              handleSlabChange(idx, "noMaxLimit", false);
                              handleSlabChange(idx, "maxAmount", String((Number(slab.minAmount) || 0) + 999));
                            }}
                            className="text-[10px] text-gold-800 hover:text-gold-950 underline ml-1 cursor-pointer font-bold shrink-0"
                          >
                            Set Limit
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-2 py-1.5 focus-within:border-gold-400 focus-within:bg-white">
                          <div className="flex items-center flex-1 min-w-0">
                            <span className="text-gray-400 font-bold text-xs mr-1">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={slab.maxAmount}
                              onChange={(e) =>
                                handleSlabChange(idx, "maxAmount", e.target.value)
                              }
                              className="w-full bg-transparent outline-none font-bold text-gray-800 text-xs"
                              placeholder="49"
                            />
                          </div>
                          {idx === formData.roiSlabs.length - 1 && (
                            <button
                              type="button"
                              title="Make this slab unlimited"
                              onClick={() => handleSlabChange(idx, "noMaxLimit", true)}
                              className="text-[10px] text-gold-700 hover:text-gold-950 font-bold ml-1 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              ∞ No Limit
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Daily ROI (%) */}
                    <div className="col-span-2 flex items-center rounded-lg border border-emerald-300 bg-emerald-50/60 px-2 py-1.5 focus-within:border-emerald-500 focus-within:bg-white">
                      <input
                        type="text"
                        value={slab.dailyRoi}
                        onChange={(e) =>
                          handleSlabChange(idx, "dailyRoi", e.target.value)
                        }
                        className="w-full bg-transparent outline-none font-extrabold text-emerald-700 text-xs"
                        placeholder="0.25"
                      />
                      <span className="text-emerald-600 font-bold text-[10px]">%</span>
                    </div>

                    {/* Monthly ROI (%) [Auto computed or editable] */}
                    <div className="col-span-2 flex items-center rounded-lg border border-gold-200 bg-gold-50/40 px-2 py-1.5 focus-within:border-gold-400 focus-within:bg-white">
                      <input
                        type="text"
                        value={slab.monthlyRoi}
                        onChange={(e) =>
                          handleSlabChange(idx, "monthlyRoi", e.target.value)
                        }
                        className="w-full bg-transparent outline-none font-bold text-gold-900 text-xs"
                        placeholder="7.50"
                      />
                      <span className="text-gold-700 font-bold text-[10px]">%</span>
                    </div>

                    {/* Annual ROI (%) */}
                    <div className="col-span-1 text-center font-bold text-gray-700 font-mono text-[11px]">
                      {slab.annualRoi}%
                    </div>

                    {/* Delete button */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveSlab(idx)}
                        disabled={formData.roiSlabs.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <RiDeleteBinLine size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Slab Action */}
              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={handleAddSlab}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gold-400 text-gold-900 hover:bg-gold-50 text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <RiAddLine size={15} /> Add Custom Slab
                </button>

                <span className="text-[11px] text-gray-500 font-medium">
                  {formData.roiSlabs.length} Active Slabs Defined
                </span>
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

          {/* ──────── REWARD ( LOYALTY BONUS ) SECTION ──────── */}
          <div className="p-4 bg-gradient-to-br from-amber-50/70 via-gold-50/50 to-white rounded-2xl border border-gold-300/80 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gold-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-2xs">
                  <RiSparklingLine size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Reward ( Loyalty Bonus )
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Based on Capital not Withdrawn from the Account &bull; One time benefit directly given to the wallet
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.loyaltyBonusEnabled}
                  onChange={(e) => setFormData({ ...formData, loyaltyBonusEnabled: e.target.checked })}
                  className="rounded border-gold-300 text-gold-500 focus:ring-gold-400"
                />
                <span>{formData.loyaltyBonusEnabled ? "Active" : "Disabled"}</span>
              </label>
            </div>

            {formData.loyaltyBonusEnabled && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {formData.loyaltyBonusSlabs.map((slab, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-gold-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                        {slab.days} Days
                      </span>
                      <div className="flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50/60 px-1.5 py-1">
                        <input
                          type="text"
                          value={slab.bonusPercentage}
                          onChange={(e) => handleLoyaltySlabChange(idx, "bonusPercentage", e.target.value)}
                          className="w-10 text-center bg-transparent outline-none font-extrabold text-amber-800 text-xs"
                        />
                        <span className="text-amber-600 font-bold text-[10px]">%</span>
                      </div>
                      <span className="text-[9.5px] text-slate-400 block font-medium">One-Time</span>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 bg-gold-50/60 rounded-xl border border-gold-200/80 text-[11px] text-gold-900 flex items-center justify-between">
                  <span><strong>One-Time Benefit:</strong> Bonus % calculated on invested capital and credited to user wallet.</span>
                  <button
                    type="button"
                    onClick={handleResetLoyaltySlabs}
                    className="text-[10px] text-gold-800 font-bold underline hover:text-gold-950 ml-2 whitespace-nowrap cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>
            )}
          </div>

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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isInfinite: false })}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
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
                className={`p-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
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
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
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
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
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
