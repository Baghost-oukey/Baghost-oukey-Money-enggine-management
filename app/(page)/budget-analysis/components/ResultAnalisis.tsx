"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle
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
import { ResultComments } from "./ResultComments";

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
  let aiData: any = {};

  try {
    aiData = typeof analysisResult.recommendation === "string"
      ? JSON.parse(analysisResult.recommendation)
      : analysisResult.recommendation;
  } catch (e) {
    const isDeficit = remainingBudget < 0;
    const isUnrealistic = targetDate ? (remainingBudget < (Number(targetValue) / monthsDiff)) : true;
    const decisionVerdict = isDeficit ? "JANGAN_BELI" : isUnrealistic ? "BELI_DENGAN_MENABUNG" : "BOLEH_BELI";
    
    // Fallbacks
    const cashPrice = Number(targetValue || 0);
    const adminFee = Math.round(cashPrice * 0.05);
    const interestExpense = Math.round(cashPrice * 0.42);
    const moneyWasted = adminFee + interestExpense;
    const paylaterPrice = cashPrice + moneyWasted;
    const monthlyDebtPayment = Math.round(paylaterPrice / 12);
    const debtImpactPct = remainingBudget > 0 ? Math.round((monthlyDebtPayment / remainingBudget) * 100) : 100;
    
    const futureInvestedVal = Math.round(cashPrice * 1.46);
    const savingsMonthsCovered = totalExpenses && totalExpenses > 0 ? Math.round(cashPrice / totalExpenses) : 6;

    aiData = {
      score: analysisResult.score || 70,
      riskLevel: analysisResult.riskLevel || "Sedang",
      decisionVerdict: decisionVerdict,
      realityCheck: {
        isRealistic: !isUnrealistic && !isDeficit,
        impactDescription: isDeficit
          ? "Arus kas bulanan Anda saat ini mengalami defisit. Membeli target ini sekarang sangat tidak realistis dan berisiko membahayakan kestabilan hidup harian Anda."
          : isUnrealistic
          ? "Pembelian target ini kurang realistis dengan sisa uang menabung bulanan Anda saat ini. Rencana Anda berpotensi mengalami penundaan dari deadline awal."
          : "Rencana target belanja Anda cukup realistis dan masih aman dijangkau dengan kapasitas anggaran bulanan Anda."
      },
      verdictOpinion: {
        title: decisionVerdict === "BOLEH_BELI" ? "Keputusan: Boleh Beli" : decisionVerdict === "BELI_DENGAN_MENABUNG" ? "Keputusan: Beli Dengan Menabung" : "Keputusan: Tunda/Jangan Beli",
        explanation: isDeficit
          ? "Sebagai konsultan keuangan, kami melarang keras pembelian ini karena anggaran Anda defisit. Memaksakan membeli barang mewah di kala anggaran negatif akan merusak arus kas bulanan Anda."
          : isUnrealistic
          ? "Kami merekomendasikan membeli barang ini hanya dengan cara menabung tunai secara bertahap. Hindari utang konsumtif/paylater dan sesuaikan target deadline agar lebih realistis."
          : "Pembelian disetujui penuh secara tunai. Keuangan Anda sehat dan menyisakan kapasitas menabung yang ideal untuk membeli target ini tanpa mengorbankan pos pengeluaran dasar."
      },
      paylaterSimulation: {
        cashPrice,
        paylaterPrice,
        adminFee,
        interestExpense,
        moneyWasted,
        consequencesNote: `Jika kamu nekat menggunakan cicilan, beban bulanan Rp ${monthlyDebtPayment.toLocaleString("id-ID")} akan mengambil sekitar ${debtImpactPct}% dari sisa anggaran belanjamu.`
      },
      opportunityCost: {
        investmentAlternative: `Jika dialokasikan ke reksa dana dengan return 8% per tahun, dalam 5 tahun uang ini akan bertumbuh menjadi sekitar Rp ${futureInvestedVal.toLocaleString("id-ID")}.`,
        savingAlternative: `Nominal ini setara dengan jaring pengaman dana darurat yang mampu menanggung pengeluaran wajib harianmu selama ${savingsMonthsCovered} bulan.`
      },
      psychologicalInsight: {
        purchaseDriver: "Kebutuhan Nyata",
        motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan. Memiliki dana darurat yang aman jauh lebih membahagiakan.",
        riskText: "Membeli barang tersier secara terburu-buru atau karena dorongan impulsif dapat merusak cash flow bulanan dan memicu stres finansial akibat tagihan cicilan."
      },
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
      aiRecommendationText: "Kelola budget Anda secara bijak.",
      sumberDana: undefined,
      jenisTarget: undefined
    };
  }

  // Safely extract nested structures from aiData
  const realityCheck = aiData.realityCheck || {
    isRealistic: false,
    impactDescription: aiData.impactOnTarget || "Analisis kelayakan realita belum tersedia secara rinci."
  };
  const verdictOpinion = aiData.verdictOpinion || {
    title: "Keputusan Keuangan",
    explanation: aiData.healthScoreExplanation || "Silakan evaluasi detail sisa anggaran bulanan Anda."
  };
  const opportunityCost = aiData.opportunityCost || {
    investmentAlternative: `Jika dana tunai Rp ${Number(targetValue || 0).toLocaleString("id-ID")} ini dialokasikan ke reksa dana dengan return 8% per tahun, dalam 5 tahun nilainya akan bertumbuh menjadi Rp ${Math.round(Number(targetValue || 0) * 1.46).toLocaleString("id-ID")}.`,
    savingAlternative: `Nominal ini dapat dialokasikan untuk memperkuat dana darurat demi menjaga ketahanan finansial Anda.`
  };
  const psychologicalInsight = aiData.psychologicalInsight || {
    purchaseDriver: "Kebutuhan Nyata",
    motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan.",
    riskText: "Pembelian yang impulsif atau didasari motif gengsi dapat memicu kecemasan dan stres cicilan bulanan."
  };

  const plans = aiData.paylaterSimulation?.plans || [3, 6, 12].map((tenor: number) => {
    const cashPrice = aiData.paylaterSimulation?.cashPrice || Number(targetValue || 0);
    const adminRatePct = aiData.paylaterSimulation?.adminRatePct || 1.0;
    const interestRatePct = aiData.paylaterSimulation?.interestRatePct || 2.95;
    
    const planAdminFee = Math.round(cashPrice * (adminRatePct / 100));
    const planInterest = Math.round(cashPrice * (interestRatePct / 100) * tenor);
    const planWasted = planAdminFee + planInterest;
    const totalPrice = cashPrice + planWasted;
    const monthlyInstallment = Math.round(totalPrice / tenor);
    
    return {
      tenor,
      monthlyInstallment,
      totalPrice,
      interestAmount: planInterest,
      adminFee: planAdminFee,
      moneyWasted: planWasted,
    };
  });

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
          <h2 className="text-lg font-bold text-foreground">
            Hasil Analisis <span className="text-violet-600">Keuangan Sobat</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-light">
            Yuk cek pendapat dan kalkulasi jujur dari sahabat finansialmu.
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
        {/* Score Ring */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-muted/10 border text-center">
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
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-semibold">Skor Rencana</span>
            </div>
          </div>
          <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mt-2.5", getScoreBgColor(score))}>
            Kesehatan
          </div>
        </div>

        {/* AI Professional Opinion Card */}
        <div className="md:col-span-8 p-4.5 rounded-xl bg-violet-600/[0.02] border border-violet-500/15 flex flex-col justify-between space-y-2">
          <div className="space-y-1">
            <div className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
              <HelpCircle size={13} className="text-violet-500" />
              {verdictOpinion.title || "Komentar Asisten Finansial"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold pl-0.5 mt-1">
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
            Peringatan Penting Buat Kamu ⚠️
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
      />

      {/* Final recommendation text */}
      <div className="p-4 rounded-xl bg-violet-500/[0.02] border border-violet-500/15 space-y-1">
        <h4 className="text-[9px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
          <Sparkles size={12} />
          Saran Hangat Akhir dari Sahabatmu ❤️
        </h4>
        <p className="text-xs text-muted-foreground italic font-semibold leading-relaxed">
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
                    Bikin Roadmap Finansialmu 🗺️
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    "Yuk susun strategi menabung yang paling cocok buat kondisi hidupmu!"
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="w-full bg-muted/30 p-4 rounded-xl border text-left space-y-2 text-xs">
                  <p className="font-bold text-foreground flex items-center gap-1 uppercase tracking-wider">
                    <Target size={14} className="text-violet-500" />
                    Kenapa Penting Punya Roadmap?
                  </p>
                  <div className="space-y-2 text-muted-foreground leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>Sangat pas dengan profil pekerjaan & tempat tinggalmu.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>Taktik alokasi dana darurat & rasio aman cicilan OJK.</span>
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
