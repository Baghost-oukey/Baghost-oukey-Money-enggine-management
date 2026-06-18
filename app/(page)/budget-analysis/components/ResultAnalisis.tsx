"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Flame,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogContent
} from "@/components/ui/alert-dialog";
import { FormPlaning } from "./FormPlaning";

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
  // Dialog planning states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<"intro" | "form" | "loading" | "roadmap">("intro");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [msgIdx, setMsgIdx] = useState(0);

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

  const loadingMessages = [
    "Menganalisis profil tempat tinggal...",
    "Memetakan target berdasarkan urgensi...",
    "Menghitung kapasitas dana darurat...",
    "Menyusun peta rencana keuangan...",
    "Menyempurnakan roadmap finansial kamu..."
  ];

  useEffect(() => {
    if (dialogState !== "loading") return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [dialogState]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setDialogState("intro");
        setRoadmap(null);
      }, 200);
    }
  };

  const handleSubmitQuestionnaire = async (answers: any) => {
    setDialogState("loading");
    try {
      const response = await fetch("/api/planning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetData: {
            monthlyBudget: monthlyBudget || remainingBudget + (totalExpenses || 0),
            totalExpenses: totalExpenses || 0,
            remainingBudget: remainingBudget,
            targetName: target,
            targetValue: targetValue,
            targetDate: targetDate,
            expenses: []
          },
          answers,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setRoadmap(resData.data);
        setDialogState("roadmap");
      } else {
        setDialogState("intro");
        alert("Gagal memproses roadmap keuangan: " + (resData.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setDialogState("intro");
      alert("Terjadi kesalahan saat menghubungi server.");
    }
  };

  // Parse recommendation JSON
  let aiData: {
    score: number;
    riskLevel: string;
    decisionVerdict?: "RECOMMENDED_CASH" | "WARNING_REPLAN" | "BLOCKED_DANGER";
    impactOnTarget: string;
    healthScoreExplanation: string;
    financialTrapWarning?: string;
    paylaterSimulation?: {
      cashPrice: number;
      paylaterPrice: number;
      adminFee: number;
      interestExpense: number;
      moneyWasted: number;
      comparisonNote: string;
    };
    budgetEvolution: string[];
    emergencyMode: { isActive: boolean; strategy: string };
    sacrificeTransparency: Array<{ item: string; nominalToCut?: number; reasons: string[] }>;
    aiRecommendationText: string;
    realMarketPrice?: string;
    priceComparisonNote?: string;
    alternativeSuggestions?: string[];
    sumberDana?: string;
    jenisTarget?: string;
  };

  try {
    aiData = typeof analysisResult.recommendation === "string"
      ? JSON.parse(analysisResult.recommendation)
      : analysisResult.recommendation;
  } catch (e) {
    const isDeficit = remainingBudget < 0;
    aiData = {
      score: analysisResult.score || 70,
      riskLevel: analysisResult.riskLevel || "Sedang",
      decisionVerdict: isDeficit ? "BLOCKED_DANGER" : "RECOMMENDED_CASH",
      impactOnTarget: isDeficit
        ? "Keputusan ini mengurangi peluang pencapaian target tabungan secara signifikan karena kondisi anggaran Anda saat ini defisit."
        : "Keputusan ini cukup stabil namun membutuhkan alokasi yang lebih disiplin untuk mencapai target.",
      healthScoreExplanation: analysisResult.recommendation || "Penilaian kesehatan keuangan bulanan Anda berdasarkan sisa anggaran saat ini.",
      financialTrapWarning: isDeficit ? "Anggaran Anda saat ini mengalami defisit. Memaksakan diri membelinya sekarang dapat menjerumuskan Anda pada pinjaman cepat atau paylater." : "",
      realMarketPrice: targetValue ? `Rp ${Number(targetValue).toLocaleString("id-ID")}` : undefined,
      priceComparisonNote: "Menggunakan nominal target sebagai patokan harga dasar di fallback.",
      alternativeSuggestions: [],
      budgetEvolution: [
        "Sisa anggaran bulanan bernilai positif.",
        "Butuh monitoring rutin terhadap pengeluaran harian."
      ],
      emergencyMode: {
        isActive: isDeficit,
        strategy: isDeficit
          ? "Anggaran Anda mengalami defisit! Segera pangkas pengeluaran non-esensial dan tunda rencana belanja tersier."
          : "Anggaran masih aman. Jaga rasio tabungan minimal 20% dari total pendapatan."
      },
      sacrificeTransparency: [],
      aiRecommendationText: analysisResult.recommendation || "Kelola budget Anda secara bijak.",
      sumberDana: undefined,
      jenisTarget: undefined
    };
  }

  const score = aiData.score ?? 70;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return "stroke-emerald-500 text-emerald-500";
    if (scoreValue >= 60) return "stroke-amber-500 text-amber-500";
    return "stroke-rose-500 text-rose-500";
  };

  const getScoreBgColor = (scoreValue: number) => {
    if (scoreValue >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300";
    if (scoreValue >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300";
    return "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/25 backdrop-blur-md p-5 sm:p-6 shadow-sm transition-all duration-300 space-y-6">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Hasil Analisis <span className="text-violet-600">Keputusan</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-light">
            Evaluasi finansial & kelayakan target belanja oleh AI.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide shadow-sm bg-background/50 w-fit">
          {aiData.decisionVerdict === "BLOCKED_DANGER" ? (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={12} className="animate-pulse" />
              Dilarang Belanja
            </span>
          ) : aiData.decisionVerdict === "WARNING_REPLAN" ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle size={12} />
              Tunda / Re-Plan
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={12} />
              Recommended (Cash)
            </span>
          )}
        </div>
      </div>

      {/* Score and Main Summary */}
      <div className="flex flex-col sm:flex-row gap-5 items-center p-4 rounded-xl bg-muted/10 border">
        {/* Circle Score Chart */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-muted/40 fill-none"
              strokeWidth="6"
            />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              className={cn("fill-none transition-all duration-1000 ease-out", getScoreColor(score))}
              strokeWidth="7"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: scoreOffset }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-foreground">{score}</span>
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-semibold">Skor</span>
          </div>
        </div>

        <div className="space-y-1.5 text-center sm:text-left">
          <div className={cn("text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider w-fit mx-auto sm:mx-0", getScoreBgColor(score))}>
            Kesehatan Rencana
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            "{aiData.healthScoreExplanation}"
          </p>
        </div>
      </div>

      {/* Trap Warning Panel */}
      {aiData.financialTrapWarning && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] space-y-1.5 animate-in fade-in slide-in-from-top-1">
          <h4 className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert size={14} className="animate-pulse text-rose-500" />
            Peringatan Bahaya Finansial!
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
            {aiData.financialTrapWarning}
          </p>
        </div>
      )}

      {/* Target Details & Market Info */}
      <div className="space-y-3">
        {/* Real Market Price Facts */}
        {aiData.realMarketPrice && (
          <div className="p-3.5 bg-violet-600/[0.02] border rounded-xl space-y-1">
            <div className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} className="animate-pulse" />
              Fakta Harga Pasar AI
            </div>
            <div className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Estimasi Harga Nyata:</span>
              <span className="text-violet-600 dark:text-violet-400 font-extrabold">{aiData.realMarketPrice}</span>
            </div>
            {aiData.priceComparisonNote && (
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                💡 {aiData.priceComparisonNote}
              </p>
            )}
          </div>
        )}

        {/* Alternative Suggestions */}
        {aiData.alternativeSuggestions && aiData.alternativeSuggestions.length > 0 && (
          <div className="p-3.5 bg-emerald-500/[0.02] border rounded-xl space-y-2">
            <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} className="shrink-0 text-emerald-500" />
              Alternatif Lebih Terjangkau
            </div>
            <ul className="space-y-1 pl-4 list-disc text-xs text-muted-foreground">
              {aiData.alternativeSuggestions.map((item, index) => (
                <li key={index}>
                  <span className="text-foreground font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Paylater vs Cash Calculator */}
        {aiData.paylaterSimulation && (
          <div className="p-3.5 bg-amber-500/[0.01] border rounded-xl space-y-3">
            <h5 className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Activity size={12} className="text-amber-500" />
              Simulasi Kerugian Paylater / Cicilan (12 Bulan)
            </h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 rounded-xl bg-background/55 border border-muted/20">
                <span className="text-[8px] text-muted-foreground font-semibold uppercase">Harga Cash</span>
                <p className="text-xs font-bold text-emerald-600">Rp {aiData.paylaterSimulation.cashPrice.toLocaleString("id-ID")}</p>
              </div>
              <div className="p-2 rounded-xl bg-background/55 border border-muted/20">
                <span className="text-[8px] text-muted-foreground font-semibold uppercase">Total Paylater</span>
                <p className="text-xs font-bold text-rose-600">Rp {aiData.paylaterSimulation.paylaterPrice.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <div className="text-[10px] space-y-1 text-muted-foreground border-t pt-2">
              <div className="flex justify-between">
                <span>Biaya Admin (5%):</span>
                <span className="font-semibold text-foreground">Rp {aiData.paylaterSimulation.adminFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between">
                <span>Bunga Kredit (42%):</span>
                <span className="font-semibold text-foreground">Rp {aiData.paylaterSimulation.interestExpense.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between border-t border-dashed pt-1 font-bold text-rose-600 dark:text-rose-400 text-xs">
                <span>Kerugian Uang Sia-Sia:</span>
                <span>Rp {aiData.paylaterSimulation.moneyWasted.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Taktik & Sacrifice */}
      <div className="space-y-3">
        {/* Financial Tactics */}
        <div className="p-3.5 rounded-xl bg-muted/10 border space-y-1">
          <h5 className="text-[10px] font-bold text-foreground flex items-center gap-1">
            <Flame size={12} className="text-violet-500" />
            Taktik Finansial AI
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {aiData.emergencyMode.strategy}
          </p>
        </div>

        {/* Sacrifice Saran */}
        {aiData.sacrificeTransparency && aiData.sacrificeTransparency.length > 0 && (
          <div className="p-3.5 rounded-xl bg-muted/10 border space-y-2">
            <h5 className="text-[10px] font-bold text-foreground flex items-center gap-1">
              <FileText size={12} className="text-amber-500" />
              Saran Pengorbanan Pengeluaran
            </h5>
            {aiData.sacrificeTransparency.slice(0, 1).map((sacrifice, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Pos: <span className="text-amber-600 dark:text-amber-400">{sacrifice.item}</span>
                  </span>
                  {sacrifice.nominalToCut && (
                    <span className="font-bold text-rose-500">
                      Potong Rp {sacrifice.nominalToCut.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <ul className="space-y-1 pl-3.5 list-disc text-xs text-muted-foreground leading-relaxed">
                  {sacrifice.reasons.map((reason, rIdx) => (
                    <li key={rIdx}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keputusan Akhir AI */}
      <div className="p-4 rounded-xl bg-violet-500/[0.02] border border-violet-500/15 space-y-1 leading-relaxed">
        <h4 className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} />
          Rekomendasi Akhir
        </h4>
        <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">
          "{aiData.aiRecommendationText}"
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 border-t pt-4">
        {/* Dialog Planning Button */}
        <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold h-9 shadow-sm cursor-pointer"
            >
              Roadmap
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            noBlur
            size={dialogState === "form" || dialogState === "roadmap" ? "lg" : "md"}
            className="p-5 sm:p-6 rounded-2xl border bg-card/95 shadow-2xl w-[95vw] sm:w-full outline-none"
          >
            {dialogState === "intro" && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative w-14 h-14 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400 border border-violet-500/20">
                    <Sparkles size={26} className="animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                </div>

                <AlertDialogHeader className="space-y-1">
                  <AlertDialogTitle className="text-lg font-extrabold tracking-tight">
                    Buat Rencana Personal
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    "Saya bisa membuat roadmap yang lebih personal."
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="w-full bg-muted/30 p-4 rounded-xl border text-left space-y-2 text-xs">
                  <p className="font-bold text-foreground flex items-center gap-1 uppercase tracking-wider">
                    <Target size={14} className="text-violet-500" />
                    Mengapa Perlu Roadmap?
                  </p>
                  <div className="space-y-2 text-muted-foreground leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>Disesuaikan spesifik untuk profil pekerjaan & Hunian.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>Taktik alokasi dana darurat & rasio cicilan OJK.</span>
                    </div>
                  </div>
                </div>

                <AlertDialogFooter className="w-full grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    className="w-full rounded-xl text-xs font-bold border-muted/50"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => setDialogState("form")}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
                  >
                    Mulai
                  </Button>
                </AlertDialogFooter>
              </div>
            )}

            {dialogState === "form" && (
              <FormPlaning
                onSubmit={handleSubmitQuestionnaire}
                onCancel={() => handleOpenChange(false)}
              />
            )}

            {dialogState === "loading" && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
                  <Sparkles size={20} className="text-violet-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    {loadingMessages[msgIdx]}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Menyusun peta rencana keuangan terbaikmu...
                  </p>
                </div>
              </div>
            )}

            {dialogState === "roadmap" && roadmap && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 border-b pb-3">
                  <ShieldCheck size={20} className="text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-bold">Roadmap Finansial AI</h4>
                    <p className="text-[9px] text-muted-foreground">Rencana aksi keuangan adaptif.</p>
                  </div>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4 text-xs text-muted-foreground leading-relaxed italic">
                  "{roadmap.summary}"
                </div>

                <div className="pt-2 border-t">
                  <Button
                    onClick={() => handleOpenChange(false)}
                    className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold py-2"
                  >
                    Selesai
                  </Button>
                </div>
              </div>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Sync Button */}
        <Button
          disabled={isSyncing || isSynced || aiData.decisionVerdict === "BLOCKED_DANGER"}
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
              : aiData.decisionVerdict === "BLOCKED_DANGER"
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
