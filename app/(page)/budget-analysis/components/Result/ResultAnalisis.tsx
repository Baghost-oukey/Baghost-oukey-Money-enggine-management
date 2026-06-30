"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Scale,
  PlusCircle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResultComments } from "./ResultComments";
import { ScoreRing } from "./ScoreChart";
import { getFallbackAIData } from "../analysisUtils";
import { SaranCard } from "../tab-component/SaranCard";
import { ScraperItem } from "../../types";

interface ResultAnalisisProps {
  analysisResult: any;
  remainingBudget: number;
  targetValue: string;
  target: string;
  targetDate: string;
  onReset: () => void;
  monthlyBudget?: number;
  totalExpenses?: number;
  expenses?: any[];
}

export function ResultAnalisis({
  analysisResult,
  remainingBudget,
  targetValue,
  target,
  targetDate,
  onReset,
  monthlyBudget,
  totalExpenses,
  expenses,
}: ResultAnalisisProps) {
  const router = useRouter();

  // Selected Tokopedia Product state
  const [selectedProduct, setSelectedProduct] = useState<ScraperItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const targetValNum = Number(targetValue || 0);

  // Calculate months difference for savings
  const currentDate = new Date();
  let monthsDiff = 1;
  if (targetDate) {
    const tDate = new Date(targetDate);
    const diffTime = tDate.getTime() - currentDate.getTime();
    const daysDiff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    monthsDiff = Math.max(1, Math.ceil(daysDiff / 30.44));
  }

  // Parse recommendation JSON or build fallback AI data
  let aiData: any = {};
  try {
    aiData = typeof analysisResult.recommendation === "string"
      ? JSON.parse(analysisResult.recommendation)
      : analysisResult.recommendation;
  } catch (e) {
    aiData = getFallbackAIData(
      remainingBudget,
      targetValue,
      target,
      targetDate,
      monthsDiff,
      totalExpenses,
      analysisResult.jenisTarget,
      analysisResult.keteranganTambahan,
      analysisResult.score,
      analysisResult.riskLevel,
      analysisResult.recommendation
    );
  }

  const verdictOpinion = aiData.verdictOpinion || {
    title: "Saran Sahabat Keuanganmu",
    explanation: aiData.healthScoreExplanation || "Yuk, coba cek kembali rincian anggaran bulananmu."
  };

  const score = aiData.score ?? 70;

  const getVerdictLabel = (verdict?: string) => {
    switch (verdict) {
      case "BOLEH_BELI":
      case "RECOMMENDED_CASH":
        return "Boleh Beli";
      case "BELI_DENGAN_MENABUNG":
        return "Bisa Beli Tapi Nabung Dulu";
      case "TUNDA":
      case "WARNING_REPLAN":
        return "Tunda Dulu Ya";
      case "JANGAN_BELI":
      case "BLOCKED_DANGER":
        return "Mending Jangan Beli Deh";
      default:
        return "Cek Ulang Yuk";
    }
  };

  const getVerdictBadgeStyles = (verdict?: string) => {
    switch (verdict) {
      case "BOLEH_BELI":
      case "RECOMMENDED_CASH":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400";
      case "BELI_DENGAN_MENABUNG":
        return "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400";
      case "TUNDA":
      case "WARNING_REPLAN":
        return "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400";
      case "JANGAN_BELI":
      case "BLOCKED_DANGER":
        return "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400";
      default:
        return "bg-muted border-muted/50 text-muted-foreground";
    }
  };

  const getVerdictIcon = (verdict?: string) => {
    switch (verdict) {
      case "BOLEH_BELI":
      case "RECOMMENDED_CASH":
        return <ShieldCheck size={13} />;
      case "BELI_DENGAN_MENABUNG":
        return <CheckCircle2 size={13} />;
      case "TUNDA":
      case "WARNING_REPLAN":
        return <AlertCircle size={13} />;
      case "JANGAN_BELI":
      case "BLOCKED_DANGER":
        return <ShieldAlert size={13} className="animate-pulse" />;
      default:
        return <HelpCircle size={13} />;
    }
  };
  const getVerdictTheme = (score: number) => {
    if (score >= 80) return { glow: "bg-emerald-500/5", bg: "bg-emerald-600/[0.02]", border: "border-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" };
    if (score >= 50) return { glow: "bg-amber-500/5", bg: "bg-amber-600/[0.02]", border: "border-amber-500/10", text: "text-amber-600 dark:text-amber-400" };
    return { glow: "bg-rose-500/5", bg: "bg-rose-600/[0.02]", border: "border-rose-500/10", text: "text-rose-600 dark:text-rose-400" };
  };

  const scoreTheme = getVerdictTheme(score);
  const cleanTarget = analysisResult.targetName || target;

  return (
    <div className="relative overflow-hidden rounded-[32px] border bg-card/25 backdrop-blur-md p-5 sm:p-6 shadow-sm transition-all duration-300 space-y-5">
      {/* Glow Effects */}
      <div className={cn("absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500", scoreTheme.glow)} />
      <div className={cn("absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500", scoreTheme.glow)} />

      {/* Target Belanja Impian Header outside the cards */}
      <div className="border-b pb-4 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider block">
              Uang Yang Ingin kamu dapat
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Rp {targetValNum.toLocaleString("id-ID")}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 items-center md:justify-end">
            <div className="px-3 py-1 rounded-xl border border-muted-foreground/10 bg-card/40 backdrop-blur-md flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Nama Barang:</span>
              <span className="text-xs font-bold text-foreground">{cleanTarget}</span>
            </div>
            <div className="px-3 py-1 rounded-xl border border-muted-foreground/10 bg-card/40 backdrop-blur-md flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Kategori:</span>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded border leading-none",
                (analysisResult?.jenisTarget || aiData?.jenisTarget) === "Kebutuhan"
                  ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}>
                {analysisResult?.jenisTarget || aiData?.jenisTarget || "Kebutuhan"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Pipeline Style Dashboard Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Card Container 1: Rencana Target */}
        <div className="p-4 sm:p-5 rounded-[24px] border border-muted-foreground/10 bg-card/25 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-violet-500/20 hover:bg-card/35 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-muted-foreground/10 mb-3">
            <span className="text-xs font-bold uppercase text-foreground tracking-wider">
              Target Mu
            </span>
          </div>

          {/* Sub-cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Sub-card 1.1: Nama Barang */}
            <div className="p-3.5 rounded-2xl border border-muted-foreground/5 bg-card/40 hover:bg-card/70 hover:border-violet-500/10 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide block mb-0.5">
                  Nama Barang
                </span>
                <span className="text-sm sm:text-base font-extrabold text-foreground block truncate" title={cleanTarget}>
                  {cleanTarget}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-muted-foreground/5">
                <span className="text-xs text-muted-foreground">Kategori:</span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded border leading-none",
                  (analysisResult?.jenisTarget || aiData?.jenisTarget) === "Kebutuhan"
                    ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                )}>
                  {analysisResult?.jenisTarget || aiData?.jenisTarget || "Kebutuhan"}
                </span>
              </div>
            </div>

            {/* Sub-card 1.2: Tenggat Target */}
            <div className="p-3.5 rounded-2xl border border-muted-foreground/5 bg-card/40 hover:bg-card/70 hover:border-violet-500/10 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide block mb-0.5">
                  Target Kamu Dapatkan
                </span>
                <span className="text-sm sm:text-base font-extrabold text-foreground block">
                  {targetDate ? new Date(targetDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground pt-2 border-t border-muted-foreground/5">
                Dalam Waktu : <span className="font-bold text-foreground">{monthsDiff} bulan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Container 2: Analisis Finansial */}
        <div className="p-4 sm:p-5 rounded-[24px] border border-muted-foreground/10 bg-card/25 backdrop-blur-md flex flex-col justify-between shadow-sm hover:border-violet-500/20 hover:bg-card/35 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-muted-foreground/10 mb-3">
            <span className="text-xs font-bold uppercase text-foreground tracking-wider">
              Kondisi Keuangan Mu
            </span>
          </div>

          {/* Sub-cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Sub-card 2.1: Uang Bulanan */}
            <div className="p-3.5 rounded-2xl border border-muted-foreground/5 bg-card/40 hover:bg-card/70 hover:border-violet-500/10 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide block mb-0.5">
                  Uang {aiData.budgetPeriod === "harian" ? "Jajan Harian Mu" : "Bulanan Mu"}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-foreground block">
                  Rp {((aiData.budgetPeriod === "harian" ? aiData.dailyBudget : monthlyBudget) || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground pt-2 border-t border-muted-foreground/5">
                Sisa budget: <span className="font-bold text-emerald-600">Rp {remainingBudget.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Sub-card 2.2: Status Kelayakan */}
            <div className="p-3.5 rounded-2xl border border-muted-foreground/5 bg-card/40 hover:bg-card/70 hover:border-violet-500/10 hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-medium tracking-wide block mb-0.5">
                  Kesimpulan nya
                </span>
                <span className={cn(
                  "text-sm sm:text-base font-extrabold block truncate",
                  aiData.decisionVerdict === "BOLEH_BELI" || aiData.decisionVerdict === "RECOMMENDED_CASH"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : aiData.decisionVerdict === "BELI_DENGAN_MENABUNG"
                      ? "text-sky-600 dark:text-sky-400"
                      : aiData.decisionVerdict === "TUNDA" || aiData.decisionVerdict === "WARNING_REPLAN"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                )}>
                  {getVerdictLabel(aiData.decisionVerdict)}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* AI Professional Opinion Card & Score Ring */}
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-4 sm:p-5 rounded-3xl border transition-all duration-500",
        scoreTheme.bg,
        scoreTheme.border
      )}>
        <div className="md:col-span-3 flex items-center justify-center">
          <ScoreRing score={score} />
        </div>
        <div className="md:col-span-9 flex flex-col justify-center space-y-2">
          <div className={cn("text-sm font-bold flex items-center gap-1.5 uppercase tracking-wider font-black", scoreTheme.text)}>
            {verdictOpinion.title || "Pendapat Sahabat Finansialmu"}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed font-normal text-muted-foreground text-justify">
            {verdictOpinion.explanation}
          </p>
        </div>
      </div>

      {/* Trap Warning Panel (Judi / Pinjol / Paylater warnings) */}
      {aiData.financialTrapWarning && (
        <div className="p-4 sm:p-5 rounded-3xl border border-rose-500/20 bg-rose-500/[0.02] space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={15} className="animate-pulse text-rose-500 shrink-0" />
            Peringatan Penting Buat Kamu
          </h4>
          <p className="text-xs sm:text-sm text-rose-600/90 dark:text-rose-400/90 leading-relaxed font-normal text-justify">
            {aiData.financialTrapWarning}
          </p>
        </div>
      )}

      {/* Detailed Analysis Collapsible Comments Drawer */}
      <ResultComments
        decisionId={analysisResult.id}
        targetValue={targetValue}
        remainingBudget={remainingBudget}
        totalExpenses={totalExpenses || 0}
        target={cleanTarget}
        monthlyBudget={monthlyBudget}
        jenisTarget={analysisResult?.jenisTarget || aiData?.jenisTarget}
        keteranganTambahan={analysisResult?.keteranganTambahan || aiData?.keteranganTambahan}
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
        onOpenSusunModal={() => setIsModalOpen(true)}
      />

      {/* Final recommendation text */}
      <SaranCard decisionId={analysisResult.id} />

      {/* Action Buttons */}
      <div className="flex justify-end border-t pt-4 w-full">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-1.5 hover:bg-muted border-muted/50 rounded-xl text-xs font-semibold uppercase tracking-wider h-10 px-6 shadow-sm cursor-pointer select-none transition-all duration-200"
          onClick={onReset}
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          Mulai Baru
        </Button>
      </div>

     
    </div>
  );
}

