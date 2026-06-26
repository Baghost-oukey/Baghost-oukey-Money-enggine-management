"use client";

import React, { useState } from "react";
import { Target, CalendarDays, TrendingUp, Sparkles, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, HelpCircle, Landmark, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GoalPlan {
  allocation: {
    needs: number;
    wants: number;
    savings: number;
    explanation: string;
  };
  verdict: string;
  tips: string[];
  roadmap: string[];
  advice: string;
  needsItems?: { name: string; amount: number }[];
  wantsItems?: { name: string; amount: number }[];
  savingsItems?: { name: string; amount: number }[];
}

export interface GoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  isCompleted: boolean;
  createdAt: string;
  plan?: GoalPlan | null;
}

interface GoalProgressCardProps {
  goal: GoalItem;
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  const [expanded, setExpanded] = useState(true);

  const percent = goal.targetAmount > 0 
    ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
    : 0;

  // Calculate months diff
  const currentDate = new Date();
  let monthsDiff = 1;
  let isOverdue = false;
  if (goal.targetDate) {
    const tDate = new Date(goal.targetDate);
    const diffTime = tDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysDiff < 0) {
      isOverdue = true;
      monthsDiff = 1;
    } else {
      monthsDiff = Math.max(1, Math.ceil(daysDiff / 30.44));
    }
  }

  // Calculate daily, weekly, monthly rates based on remaining amount
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthlyRate = Math.round(remainingAmount / monthsDiff);
  const weeklyRate = Math.round(monthlyRate / 4);
  const dailyRate = Math.round(monthlyRate / 30);

  // SVG configurations for circular progress
  const radius = 35;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const plan = goal.plan;
  const totalAlloc = plan ? plan.allocation.needs + plan.allocation.wants + plan.allocation.savings : 1;
  const needsPct = plan ? Math.round((plan.allocation.needs / totalAlloc) * 100) : 0;
  const wantsPct = plan ? Math.round((plan.allocation.wants / totalAlloc) * 100) : 0;
  const savingsPct = plan ? Math.round((plan.allocation.savings / totalAlloc) * 100) : 0;

  const getVerdictColor = (verdict?: string) => {
    switch (verdict) {
      case "Sangat Realistis":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
      case "Menantang":
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
      case "Hampir Mustahil":
        return "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";
      default:
        return "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/[0.04] rounded-full blur-2xl pointer-events-none" />

      {/* Main card body summary */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start justify-between">
        <div className="space-y-3.5 flex-1">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-full border border-violet-500/10">
                Target Finansial
              </span>
              {plan?.verdict && (
                <span className={cn(
                  "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border",
                  getVerdictColor(plan.verdict)
                )}>
                  {plan.verdict}
                </span>
              )}
              {goal.isCompleted && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Selesai
                </span>
              )}
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 mt-2 leading-tight">
              {goal.title}
            </h3>
            
            {goal.targetDate && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 font-bold">
                <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                <span>
                  Batas Waktu: {new Date(goal.targetDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {isOverdue ? (
                  <span className="text-rose-500 ml-1">(Lewat Batas)</span>
                ) : (
                  <span className="text-violet-600 ml-1">({monthsDiff} bulan lagi)</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3">
            <div>
              <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider block leading-none">
                Nominal Target
              </span>
              <span className="text-xs font-black text-zinc-900 block mt-1">
                Rp {goal.targetAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider block leading-none">
                Terkumpul
              </span>
              <span className="text-xs font-black text-emerald-600 block mt-1">
                Rp {goal.currentAmount.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="flex items-center gap-3 w-full sm:w-auto py-2 sm:py-0 justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0">
          <div className="relative flex items-center justify-center shrink-0">
            <svg width={80} height={80} className="transform -rotate-90">
              <circle
                cx={40}
                cy={40}
                r={radius}
                fill="transparent"
                stroke="rgba(109, 40, 217, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={40}
                cy={40}
                r={radius}
                fill="transparent"
                stroke="rgb(109, 40, 217)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-xs font-black text-zinc-900 block leading-none">
                {percent}%
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
          >
            {expanded ? (
              <>
                Tutup Detail
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                Lihat Detail Rencana
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded planning section */}
      {expanded && plan && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 p-5 sm:p-6 space-y-6">
          
          {/* Header alokasi */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-full border border-violet-500/10 w-fit block">
              Rencana Alokasi Hidup 1 Bulan
            </span>
            <h4 className="text-xs font-extrabold text-zinc-900 flex items-center gap-1">
              Rekomendasi Pembagian Uang Bulanan Kamu
            </h4>
            <p className="text-[10px] text-zinc-500 leading-normal font-medium">
              {plan.allocation.explanation}
            </p>
          </div>

          {/* 4 Cards Grid - Matches screenshot style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-zinc-400 font-extrabold uppercase block tracking-wider leading-none">
                  Total Pemasukan
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                  Uang bulanan kamu
                </span>
              </div>
              <div className="mt-3.5">
                <span className="text-xs font-black text-zinc-900 block">
                  Rp {totalAlloc.toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-violet-600 font-extrabold block mt-0.5">
                  100% Keuangan
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-zinc-400 font-extrabold uppercase block tracking-wider leading-none">
                  Kebutuhan Pokok
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                  Pengeluaran wajib hidup
                </span>
              </div>
              <div className="mt-3.5">
                <span className="text-xs font-black text-zinc-900 block">
                  Rp {plan.allocation.needs.toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-violet-600 font-extrabold block mt-0.5">
                  {needsPct}% Pengeluaran Wajib
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-zinc-400 font-extrabold uppercase block tracking-wider leading-none">
                  Gaya Hidup
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                  Kebutuhan tambahan/jajan
                </span>
              </div>
              <div className="mt-3.5">
                <span className="text-xs font-black text-zinc-900 block">
                  Rp {plan.allocation.wants.toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-amber-600 font-extrabold block mt-0.5">
                  {wantsPct}% Pengeluaran Santai
                </span>
              </div>
            </div>

            <div className="p-3 bg-white border rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-zinc-400 font-extrabold uppercase block tracking-wider leading-none">
                  Tabungan Target
                </span>
                <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">
                  Simpanan demi target
                </span>
              </div>
              <div className="mt-3.5">
                <span className="text-xs font-black text-emerald-600 block">
                  Rp {plan.allocation.savings.toLocaleString("id-ID")}
                </span>
                <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">
                  {savingsPct}% Dana Impian
                </span>
              </div>
            </div>
          </div>

          {/* Rincian Pos Anggaran Nyata (Makan, Jajan, dll) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-zinc-100 pt-5">
            {/* Needs Items */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-violet-600 bg-violet-600/5 px-2.5 py-1 rounded-lg border border-violet-500/10 w-fit block">
                Rincian Kebutuhan Pokok
              </span>
              <div className="border rounded-2xl bg-white overflow-hidden divide-y divide-zinc-100 shadow-sm">
                {plan.needsItems && plan.needsItems.length > 0 ? (
                  plan.needsItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-[10px] font-bold">
                      <span className="text-zinc-600 truncate mr-2">{item.name}</span>
                      <span className="text-zinc-900 shrink-0">Rp {item.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-zinc-400 italic p-4 text-center">Tidak ada rincian kebutuhan.</p>
                )}
              </div>
            </div>

            {/* Wants Items */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10 w-fit block">
                Rincian Gaya Hidup
              </span>
              <div className="border rounded-2xl bg-white overflow-hidden divide-y divide-zinc-100 shadow-sm">
                {plan.wantsItems && plan.wantsItems.length > 0 ? (
                  plan.wantsItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-[10px] font-bold">
                      <span className="text-zinc-600 truncate mr-2">{item.name}</span>
                      <span className="text-zinc-900 shrink-0">Rp {item.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-zinc-400 italic p-4 text-center">Tidak ada rincian gaya hidup.</p>
                )}
              </div>
            </div>

            {/* Savings Items */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10 w-fit block">
                Rincian Simpanan Target
              </span>
              <div className="border rounded-2xl bg-white overflow-hidden divide-y divide-zinc-100 shadow-sm">
                {plan.savingsItems && plan.savingsItems.length > 0 ? (
                  plan.savingsItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center px-4 py-2.5 text-[10px] font-bold">
                      <span className="text-emerald-700 truncate mr-2">{item.name}</span>
                      <span className="text-emerald-600 shrink-0">Rp {item.amount.toLocaleString("id-ID")}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-zinc-400 italic p-4 text-center">Tidak ada rincian tabungan.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Nasihat Box */}
          <div className="p-4.5 rounded-2xl border border-violet-500/15 bg-violet-600/[0.02] space-y-1.5">
            <h5 className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Sparkles size={13} className="animate-pulse text-violet-500" />
              Hasil Analisis AI Sahabat Finansialmu
            </h5>
            <p className="text-[11px] leading-relaxed text-zinc-700 font-bold text-justify pl-0.5">
              "{plan.advice}"
            </p>
          </div>

          {/* Tips & Roadmap columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips */}
            <div className="p-4 bg-white border rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                💡 Taktik Hidup Hemat Harian
              </span>
              <ul className="space-y-1.5 list-disc list-inside text-[10px] text-zinc-600 leading-normal font-bold">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="pl-1 text-justify">{tip}</li>
                ))}
              </ul>
            </div>

            {/* Roadmap */}
            <div className="p-4 bg-white border rounded-2xl space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                🛣️ Roadmap Eksekusi Bulanan
              </span>
              <ul className="space-y-1.5 list-none text-[10px] text-zinc-600 leading-normal font-bold">
                {plan.roadmap.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5 pl-1 text-justify">
                    <span className="text-violet-600 select-none font-black">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
