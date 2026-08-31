import React, { useState, useEffect } from "react";
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
  RiDeleteBinLine, // Delete icon ke liye
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

// Helper to format duration string from DD, MM, YYYY values
function formatDurationString(dd, mm, yyyy) {
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
function parseDurationString(str = "") {
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

  return { dd, mm, yyyy };
}

export default function InvestmentPlans() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Form State for Add/Edit Drawer
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    customCategory: "",
    roi: "",
    durationDD: "",
    durationMM: "",
    durationYYYY: "",
    minAmount: "",
    maxAmount: "",
    noMaxLimit: false,
    payoutInterval: "",
    status: "Active",
    description: "",
  });

  const [testAmount, setTestAmount] = useState("10000");
  const categories = ["all", "Renewable Energy", "Precious Metal"];

  // 1. Fetch All Plans
const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getAllPlans();
      
      // Console me check karein ki data actual me kaisa dikh raha hai
      console.log("API Response:", response);

      // Agar response khud array hai
      if (Array.isArray(response)) {
        setPlans(response);
      } 
      // Agar array 'data' key ke andar hai (jaise: response.data)
      else if (response && Array.isArray(response.data)) {
        setPlans(response.data);
      } 
      // Agar array 'plans' key ke andar hai
      else if (response && Array.isArray(response.plans)) {
        setPlans(response.plans);
      } 
      // Agar kuch samajh na aaye toh empty array set kar do taaki app crash na ho
      else {
        setPlans([]); 
      }
    } catch (error) {
      console.error("loading error in plans:", error);
      setPlans([]); // Error aane par bhi empty array set karein
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans(); // Correctly invoked
  }, []);

  // 2. Open Add Modal
  const openAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      category: "Renewable Energy",
      customCategory: "",
      roi: "18",
      durationDD: "",
      durationMM: "12",
      durationYYYY: "",
      minAmount: "1000",
      maxAmount: "50000",
      noMaxLimit: false,
      payoutInterval: "per_second",
      status: "Active",
      description: "",
    });
    setTestAmount("10000");
    setModalOpen(true);
  };

  // 3. Open Edit Modal with Mapped Data
  const openEdit = (plan) => {
    setEditingPlan(plan);
    const { dd, mm, yyyy } = parseDurationString(plan.duration || "12 Months");

    const isCustomCat = !["Renewable Energy", "Precious Metal"].includes(
      plan.category,
    );

    setFormData({
      name: plan.name,
      category: isCustomCat ? "custom" : plan.category || "Renewable Energy",
      customCategory: isCustomCat ? plan.category : "",
      roi: plan.roi ? plan.roi.toString() : "18",
      durationDD: dd,
      durationMM: mm,
      durationYYYY: yyyy,
      minAmount: plan.minAmount ? plan.minAmount.toString() : "1000",
      maxAmount: plan.maxAmount ? plan.maxAmount.toString() : "50000",
      noMaxLimit: plan.noMaxLimit || !plan.maxAmount,
      payoutInterval:
        plan.payoutInterval === "Daily Payout" ? "daily" : "per_second",
      status: plan.status || "Active",
      description: plan.description || "",
    });
    setTestAmount("10000");
    setModalOpen(true);
  };

  // 4. Handle Save (Create or Update API call)
  const handleSave = async () => {
    const finalCategory =
      formData.category === "custom"
        ? formData.customCategory.trim() || "General Yield"
        : formData.category;

    const roiVal = parseFloat(formData.roi) || 12;
    const minVal = parseFloat(formData.minAmount) || 1000;
    const maxVal = parseFloat(formData.maxAmount) || 50000;

    const finalDuration = formatDurationString(
      formData.durationDD,
      formData.durationMM,
      formData.durationYYYY,
    );

    const totalDays =
      (parseInt(formData.durationYYYY, 10) || 0) * 365 +
        (parseInt(formData.durationMM, 10) || 0) * 30 +
        (parseInt(formData.durationDD, 10) || 0) || 365;

    // Map frontend state to Backend Mongoose Schema
    const payload = {
      name: formData.name || "New Investment Plan",
      category: finalCategory,
      roi: roiVal,
      duration: finalDuration,
      durationDays: totalDays,
      minAmount: minVal,
      maxAmount: formData.noMaxLimit ? null : maxVal,
      noMaxLimit: formData.noMaxLimit,
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

  // 5. Delete Plan API Integration
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

  // Calculate live simulator values
  const parsedTestAmount = parseFloat(testAmount) || 0;
  const roiNum = parseFloat(formData.roi) || 0;

  const totalDays =
    (parseInt(formData.durationYYYY, 10) || 0) * 365 +
      (parseInt(formData.durationMM, 10) || 0) * 30 +
      (parseInt(formData.durationDD, 10) || 0) || 365;

  // Per-Second calculations
  const perSecondYield = (parsedTestAmount * (roiNum / 100)) / (365 * 86400);
  const perHourYield = perSecondYield * 3600;
  const perDayYield = perSecondYield * 86400;
  const perMonthYield = perDayYield * 30;

  // Daily calculations
  const dailyYield = (parsedTestAmount * (roiNum / 100)) / 365;
  const weeklyYield = dailyYield * 7;
  const monthlyYield = dailyYield * 30;
  const totalTermProfit = dailyYield * totalDays;
  const totalMaturityPayout = parsedTestAmount + totalTermProfit;

  if (loading) {
    return <SkeletonLoader type="table" rows={5} cols={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <PageHeader
        title="Investment Plans"
        subtitle="Manage Renewable Energy, Precious Metals & Custom Yield Plans"
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

          return (
            <div
              key={plan._id} // Changed to MongoDB _id
              className="card card-gold p-6 animate-slide-up flex flex-col justify-between hover:shadow-card-hover transition-all duration-300 relative group overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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

              {/* Real-time Streaming ROI Highlight Box */}
              <div className="p-3 bg-gradient-to-r from-gold-50/90 to-amber-50/50 rounded-xl border border-gold-200/60 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs text-gold-700 font-bold">
                    <RiFlashlightLine
                      size={15}
                      className="text-amber-500 animate-pulse"
                    />
                    ROI Rate
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 font-display">
                    {plan.roi}% APY
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gold-200/40">
                  <span>Payout Mode</span>
                  <span className="font-semibold text-gray-800 font-mono">
                    {plan.payoutInterval || "Per Second (Live)"}
                  </span>
                </div>
              </div>

              {/* Key Specs */}
              <div className="space-y-2.5 mb-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <UilMoneyBill size={16} /> Investment Range
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    ${plan.minAmount?.toLocaleString()} —{" "}
                    {plan.noMaxLimit || !plan.maxAmount
                      ? "No Limit"
                      : `$${plan.maxAmount.toLocaleString()}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <RiTimeLine size={16} /> Duration
                  </span>
                  <span className="font-bold text-gray-800 text-xs">
                    {plan.duration}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <RiPercentLine size={16} /> Active Investors
                  </span>
                  <span className="font-semibold text-gold-600 text-xs">
                    {plan.investors} Users
                  </span>
                </div>
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
        subtitle="Configure yield rate, investment range, category & per-second streaming"
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
        <div className="space-y-5">
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

          {/* Category Selection + Custom Option (Pure Icons, NO Emojis) */}
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
                        ? "bg-gold-50 border-gold-400 text-gold-900 shadow-xs"
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

          {/* Min & Max Investment Limits ($) */}
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
                <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
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

          {/* Annual ROI Rate (%) & DD, MM, YYYY Duration Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ROI Rate */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Annual ROI (%) *
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full py-2.5 pl-3.5 pr-1 bg-transparent border-none outline-none font-bold text-gray-800 text-sm"
                  placeholder="18"
                  value={formData.roi}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    setFormData({ ...formData, roi: val });
                  }}
                />
                <span className="pr-3.5 text-gray-400 font-bold text-sm select-none">
                  %
                </span>
              </div>
            </div>

            {/* DD / MM / YYYY Duration Inputs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Duration (DD / MM / YYYY) *
                </label>
                <span className="text-[11px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200/60 shadow-2xs truncate max-w-[150px]">
                  {formatDurationString(
                    formData.durationDD,
                    formData.durationMM,
                    formData.durationYYYY,
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Days (DD) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    className="w-full py-2.5 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
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
                    D
                  </span>
                </div>

                {/* Months (MM) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-full py-2.5 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
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
                    M
                  </span>
                </div>

                {/* Years (YYYY) */}
                <div className="flex items-center rounded-xl border border-gray-200 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-100 bg-white overflow-hidden transition-all shadow-2xs">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    className="w-full py-2.5 pl-2 pr-0.5 bg-transparent border-none outline-none font-bold text-gray-800 text-xs text-center"
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
                    Y
                  </span>
                </div>
              </div>
            </div>
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

          {/* Dynamic Calculator Based On Selected Payout Mode */}
          {formData.payoutInterval === "per_second" ? (
            /* Real-Time Per-Second ROI Simulator */
            <div className="p-4 bg-gradient-to-br from-amber-50/80 via-gold-50/50 to-emerald-50/40 rounded-2xl border border-gold-200/70 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold-400 text-gray-900 flex items-center justify-center shadow-xs">
                    <RiCalculatorLine size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Real-Time Per-Second ROI Simulator
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Live stream yield preview for user wallet
                    </p>
                  </div>
                </div>

                {/* Fully Clearable Test Amount Input */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-gold-200 shadow-2xs">
                  <span className="text-xs font-bold text-gold-600 select-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={testAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setTestAmount(val);
                    }}
                    placeholder="0"
                    className="w-20 text-xs font-bold text-gray-800 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Live Ticker Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gold-200/40">
                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Per Second
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5 truncate">
                    ${perSecondYield.toFixed(6)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Per Hour
                  </p>
                  <p className="text-xs font-extrabold text-gray-800 font-mono mt-0.5">
                    ${perHourYield.toFixed(3)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Per Day
                  </p>
                  <p className="text-xs font-extrabold text-gray-800 font-mono mt-0.5">
                    ${perDayYield.toFixed(2)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Per Month
                  </p>
                  <p className="text-xs font-extrabold text-gold-600 font-mono mt-0.5">
                    ${perMonthYield.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Formula Breakdown */}
              <div className="p-3 bg-white/90 rounded-xl border border-gold-100 text-[11px] text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <RiInformationLine className="text-gold-500" size={15} />
                  Per-Second Yield Math Formula:
                </p>
                <p className="leading-relaxed">
                  Total annual yield is split across{" "}
                  <strong>31,536,000 seconds</strong> (365d &times; 86,400s).
                  Formula:{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-[10px]">
                    (${parsedTestAmount} &times; {formData.roi}%) &divide;
                    31,536,000 = ${perSecondYield.toFixed(6)}/sec
                  </code>
                  .
                </p>
              </div>
            </div>
          ) : (
            /* Daily Payout ROI Calculator */
            <div className="p-4 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-gold-50/40 rounded-2xl border border-blue-200/70 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-xs">
                    <RiCalendarEventLine size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Daily Settlement ROI Calculator
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Scheduled 24-hour return & total maturity payout
                    </p>
                  </div>
                </div>

                {/* Fully Clearable Test Amount Input */}
                <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-2xs">
                  <span className="text-xs font-bold text-blue-600 select-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={testAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setTestAmount(val);
                    }}
                    placeholder="0"
                    className="w-20 text-xs font-bold text-gray-800 outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Daily Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/40">
                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Daily Return (24h)
                  </p>
                  <p className="text-xs font-extrabold text-blue-600 font-mono mt-0.5">
                    ${dailyYield.toFixed(2)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Weekly (7 Days)
                  </p>
                  <p className="text-xs font-extrabold text-gray-800 font-mono mt-0.5">
                    ${weeklyYield.toFixed(2)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Monthly (30 Days)
                  </p>
                  <p className="text-xs font-extrabold text-gray-800 font-mono mt-0.5">
                    ${monthlyYield.toFixed(2)}
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl text-center border border-gray-100 shadow-2xs">
                  <p className="text-[10px] text-gray-400 font-medium">
                    Total Term Profit
                  </p>
                  <p className="text-xs font-extrabold text-emerald-600 font-mono mt-0.5">
                    +${totalTermProfit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Total Settlement Summary Box */}
              <div className="p-3 bg-white/90 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-800">
                    Total Return on Maturity ({totalDays} Days):
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Principal (${parsedTestAmount.toLocaleString()}) + Total
                    Profit (+${totalTermProfit.toFixed(2)})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    ${totalMaturityPayout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
