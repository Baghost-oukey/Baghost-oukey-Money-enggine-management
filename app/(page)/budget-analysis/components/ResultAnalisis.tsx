"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResultComments } from "./ResultComments";
import { ScoreRing } from "./ScoreRing";
import { RoadmapDialog } from "./RoadmapDialog";
import { getFallbackAIData } from "./analysisUtils";

interface ResultAnalisisProps {
  analysisResult: any;
  remainingBudget: number;
  targetValue: string;
  target: string;
  targetDate: string;
  onReset: () => void;
  monthlyBudget?: number;
  totalExpenses?: number;
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
}: ResultAnalisisProps) {
  // Syncing states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(analysisResult.status === "TERSINKRONISASI");

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
    title: "Keputusan Keuangan",
    explanation: aiData.healthScoreExplanation || "Silakan evaluasi detail budget bulanan Anda."
  };

  const score = aiData.score ?? 70;

  const getVerdictLabel = (verdict?: string) => {
    switch (verdict) {
      case "BOLEH_BELI":
      case "RECOMMENDED_CASH":
        return "Boleh Beli";
      case "BELI_DENGAN_MENABUNG":
        return "Beli dengan Menabung";
      case "TUNDA":
      case "WARNING_REPLAN":
        return "Tunda Rencana";
      case "JANGAN_BELI":
      case "BLOCKED_DANGER":
        return "Jangan Beli";
      default:
        return "Tinjau Kembali";
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

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/25 backdrop-blur-md p-5 sm:p-6 shadow-sm transition-all duration-300 space-y-6">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Hasil Analisis <span className="text-violet-600 font-bold">Keuangan mu nih</span>
          </h2>
          <p className="text-xs mt-0.5 font-semibold text-gray-500">
            Yuk Pertimbangkan Lagi apa yang mau kamu beli, Tabung dulu atau langsung beli
          </p>
        </div>

        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide shadow-sm w-fit",
          getVerdictBadgeStyles(aiData.decisionVerdict)
        )}>
          {getVerdictIcon(aiData.decisionVerdict)}
          {getVerdictLabel(aiData.decisionVerdict)}
        </div>
      </div>

      {/* Reality Check & Score Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Score Ring Component */}
        <div className="md:col-span-4 flex items-center justify-center">
          <ScoreRing score={score} />
        </div>

        {/* AI Professional Opinion Card */}
        <div className="md:col-span-8 p-4.5 rounded-xl bg-violet-600/[0.02] border border-violet-500/15 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <div className="text-[14px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
              {verdictOpinion.title || "Komentar Asisten Finansial"}
            </div>
            <p className="text-[13px] leading-relaxed font-medium text-gray-700 pl-0.5 mt-1 text-justify">
              {verdictOpinion.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Trap Warning Panel (Judi / Pinjol / Paylater warnings) */}
      {aiData.financialTrapWarning && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <h4 className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={14} className="animate-pulse text-rose-500" />
            Peringatan Penting Buat Kamu
          </h4>
          <p className="text-xs text-rose-600/90 dark:text-rose-400/90 leading-relaxed font-bold">
            {aiData.financialTrapWarning}
          </p>
        </div>
      )}

      {/* Detailed Analysis Collapsible Comments Drawer */}
      <ResultComments
        aiData={aiData}
        targetValue={targetValue}
        monthsDiff={monthsDiff}
        remainingBudget={remainingBudget}
        totalExpenses={totalExpenses || 0}
        target={target}
        monthlyBudget={monthlyBudget}
        jenisTarget={analysisResult?.jenisTarget || aiData?.jenisTarget}
        keteranganTambahan={analysisResult?.keteranganTambahan || aiData?.keteranganTambahan}
      />

      {/* Final recommendation text */}
      <div className="p-4 rounded-xl bg-violet-500/[0.02] border border-violet-500/15 space-y-1">
        <h4 className="text-xs font-bold uppercase flex items-center gap-2 mb-2">
          Saran Akhir
        </h4>
        <p className="text-xs text-muted-foreground italic font-semibold leading-relaxed">
          "{aiData.aiRecommendationText}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 border-t pt-4">
        {/* Dialog Planning Button */}
        <RoadmapDialog
          monthlyBudget={monthlyBudget}
          target={target}
          targetValue={targetValue}
          targetDate={targetDate}
        />

        {/* Sync Button */}
        <Button
          disabled={isSyncing || isSynced || aiData.decisionVerdict === "JANGAN_BELI" || aiData.decisionVerdict === "BLOCKED_DANGER"}
          onClick={async () => {
            if (isSynced) return;
            setIsSyncing(true);
            try {
              const response = await fetch("/api/decision/sync", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: analysisResult.userId,
                  decisionId: analysisResult.id,
                  targetName: target,
                  monthlySavingsRequired: Math.round(Number(targetValue || 0) / (monthsDiff || 1)),
                  sumberDana: aiData.sumberDana || (aiData.paylaterSimulation ? "Paylater/Kredit" : "Nabung Cash"),
                }),
              });
              const res = await response.json();
              if (res.success) {
                setIsSynced(true);
                alert(res.message);
              } else {
                alert("Gagal sinkron: " + res.message);
              }
            } catch (e) {
              console.error(e);
              alert("Kesalahan jaringan saat sinkronisasi anggaran.");
            } finally {
              setIsSyncing(false);
            }
          }}
          className={cn(
            "w-full flex items-center justify-center text-[10px] font-bold h-9 rounded-xl shadow-sm cursor-pointer",
            isSynced
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : (aiData.decisionVerdict === "JANGAN_BELI" || aiData.decisionVerdict === "BLOCKED_DANGER")
              ? "bg-muted text-muted-foreground border cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700 text-white"
          )}
        >
          {isSynced ? "Tersinkron" : isSyncing ? "Syncing..." : "Sync"}
        </Button>

        {/* Reset Button */}
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-1 hover:bg-muted border-muted/50 rounded-xl text-[10px] font-bold h-9 shadow-sm cursor-pointer"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
