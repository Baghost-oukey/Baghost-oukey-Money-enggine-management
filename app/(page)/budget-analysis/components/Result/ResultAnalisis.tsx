"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ResultComments } from "./ResultAccording";
import { ScoreRing } from "./ScoreChart";
import { ModalSync } from "../modal-sync";
import { getFallbackAIData } from "../analysisUtils";
import { SaranCard } from "../According/SaranCard";
import { ScraperItem } from "../../types";
import { SusunAnggaranModal } from "./SusunAnggaranModal";

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
  
  // Syncing states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(
    analysisResult.status === "TERSINKRONISASI" || analysisResult.status === "TERINTEGRASI"
  );

  // Selected Tokopedia Product state
  const [selectedProduct, setSelectedProduct] = useState<ScraperItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            Yuk cek hasil analisis bersahabat dari kami untuk membantumu mengambil keputusan terbaik!
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
            <div className="text-[14px] font-extrabold text-violet-600 dark:text-violet-400 flex items-center gap-1">
              {verdictOpinion.title || "Pendapat Sahabat Finansialmu"}
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
        decisionId={analysisResult.id}
        targetValue={targetValue}
        remainingBudget={remainingBudget}
        totalExpenses={totalExpenses || 0}
        target={target}
        monthlyBudget={monthlyBudget}
        jenisTarget={analysisResult?.jenisTarget || aiData?.jenisTarget}
        keteranganTambahan={analysisResult?.keteranganTambahan || aiData?.keteranganTambahan}
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
      />

      {/* Final recommendation text */}
      <SaranCard decisionId={analysisResult.id} />

      {/* Action Buttons */}
      <div className="flex justify-end border-t pt-4 w-full">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:max-w-[420px]">

          {/* Sync Button */}
          <Button
            disabled={isSyncing || isSynced || aiData.decisionVerdict === "JANGAN_BELI" || aiData.decisionVerdict === "BLOCKED_DANGER"}
            onClick={async () => {
              if (isSynced || isSyncing) return;
              setIsSyncing(true);
              try {
                const targetSavings = Math.round(Number(targetValue || 0) / (monthsDiff || 1) / 1000) * 1000;
                const response = await fetch("/api/decision/sync", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userId: analysisResult.userId,
                    decisionId: analysisResult.id,
                    targetName: target,
                    monthlySavingsRequired: targetSavings,
                    sumberDana: aiData.sumberDana || (aiData.paylaterSimulation ? "Paylater/Kredit" : "Nabung Cash"),
                  }),
                });
                const res = await response.json();
                if (res.success) {
                  setIsSynced(true);

                  // Pre-fill localStorage
                  if (typeof window !== "undefined") {
                    localStorage.setItem("imported_budget_salary", String(monthlyBudget || 0));
                    localStorage.setItem("imported_budget_sync_target", JSON.stringify({ target, amount: targetSavings }));

                    const expensesList = (expenses || [])
                      .map((exp: any) => `${exp.name} Rp ${Number(exp.amount || 0).toLocaleString("id-ID")}`)
                      .join(", ");

                    const notesText = expensesList
                      ? `Pengeluaran bulanan saat ini: ${expensesList}.`
                      : "";

                    localStorage.setItem("imported_budget_notes", notesText);
                  }

                  // Instantly navigate to budgeting system
                  router.push("/budgeting-system");
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
            {isSynced ? "Tersinkron" : isSyncing ? "Menyimpan..." : "Masukkan Anggaran"}
          </Button>

          {/* Import to Budgeting Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center text-[10px] font-bold h-9 rounded-xl shadow-sm cursor-pointer bg-violet-600 hover:bg-violet-700 text-white"
          >
            Susun Anggaran
          </Button>

          {/* Reset Button */}
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-1 hover:bg-muted border-muted/50 rounded-xl text-[10px] font-bold h-9 shadow-sm cursor-pointer"
            onClick={onReset}
          >
            Mulai Baru
          </Button>
        </div>
      </div>

      <ModalSync
        isOpen={isSyncing}
        onClose={() => setIsSyncing(false)}
        title="Lagi Menyimpan ke Anggaran..."
        description="Tunggu sebentar ya, kami sedang memasukkan rencana belanja ini ke dalam daftar anggaran bulananmu."
        showCancel={false}
      />

      <SusunAnggaranModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={analysisResult.userId}
        decisionId={analysisResult.id}
        initialTargetName={target}
        initialTargetValue={targetValue}
        initialMonthlyBudget={monthlyBudget || 0}
        initialExpenses={(expenses || []).map((exp: any) => ({
          name: exp.name,
          amount: Number(exp.amount),
        }))}
        targetDate={targetDate}
        selectedProduct={selectedProduct}
      />
    </div>
  );
}

