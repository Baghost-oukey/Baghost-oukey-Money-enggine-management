import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormPlaning } from "./FormPlaning";
import { Loader2 } from "lucide-react";


interface AnalysisDashboardProps {
  analysisResult: any;
  remainingBudget: number;
  targetValue: string;
  target: string;
  targetDate: string;
  onReset: () => void;
  monthlyBudget?: number;
  totalExpenses?: number;
}

export function AnalysisDashboard({
  analysisResult,
  remainingBudget,
  targetValue,
  target,
  targetDate,
  onReset,
  monthlyBudget,
  totalExpenses,
}: AnalysisDashboardProps) {
  // Dialog planning states
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogState, setDialogState] = React.useState<"intro" | "form" | "loading" | "roadmap">("intro");
  const [roadmap, setRoadmap] = React.useState<any>(null);
  const [msgIdx, setMsgIdx] = React.useState(0);

  // Syncing states
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isSynced, setIsSynced] = React.useState(analysisResult.status === "TERSINKRONISASI");

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

  React.useEffect(() => {
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

  // Parse recommendation JSON from database representation
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
    // Safe fallback for old/plain text entries
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

  // Determine score color classes
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
    <div
      className="rounded-2xl border p-5 md:p-6 shadow-2xl space-y-6 relative overflow-hidden"
    >
      {/* Background soft glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-muted/50 pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            Hasil Analisis Keuangan Mu
          </h3>
          <p className="text-xs text-light mt-0.5">
            Keputusan yang di hasilkan oleh AI adalah keputusan yang bisa dijadikan referensi dalam mengelola keuangan mu.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm bg-background/50">
          {aiData.decisionVerdict === "BLOCKED_DANGER" ? (
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-wider">
              <ShieldAlert size={14} className="animate-pulse" />
              Verdict: Dilarang Belanja
            </span>
          ) : aiData.decisionVerdict === "WARNING_REPLAN" ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
              <AlertCircle size={14} />
              Verdict: Tunda / Re-Plan
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
              <ShieldCheck size={14} />
              Verdict: Recommended (Cash)
            </span>
          )}
        </div>
      </div>

      {/* Main Grid Layout for Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Score, Recommendation & Action */}
        <div className="lg:col-span-4 space-y-6">

          {/* Score Card */}
          <div className="flex flex-col items-center p-5 rounded-2xl bg-muted/15 border border-muted/30 relative overflow-hidden">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-muted/40 fill-none"
                  strokeWidth="7"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={cn("fill-none transition-all duration-1000 ease-out", getScoreColor(score))}
                  strokeWidth="7.5"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: scoreOffset }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">{score}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Skor</span>
              </div>
            </div>
            <div className={cn("mt-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider text-center", getScoreBgColor(score))}>
              Kesehatan Budget
            </div>

            <div className="mt-4 pt-3.5 border-t border-muted/30 w-full text-center text-xs text-muted-foreground leading-relaxed italic">
              "{aiData.healthScoreExplanation}"
            </div>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4 text-[9px] text-muted-foreground/85">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span>Tabungan</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span>Kebutuhan</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span>Spending</span>
              </div>
            </div>
          </div>

          {/* AI General Summary Recommendation */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/5 to-violet-500/5 border border-violet-500/10 dark:border-violet-500/10 space-y-2">
            <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              Keputusan Akhir AI
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground italic font-medium">
              "{aiData.aiRecommendationText}"
            </p>
          </div>

          {/* Action and Buttons */}
          <div className="p-4 rounded-2xl bg-muted/10 border border-muted/20 space-y-2">
            {targetDate && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center mb-1.5">
                <Calendar size={13} className="text-rose-500" />
                <span>Deadline: {new Date(targetDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full flex items-center justify-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold px-1 h-9 shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    title="Buat Rencana (Planning)"
                  >
                    Planning
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  noBlur
                  size={dialogState === "form" || dialogState === "roadmap" ? "lg" : "md"}
                  className="p-5 sm:p-6 rounded-2xl border bg-card/95 shadow-2xl duration-200 transition-all outline-none w-[95vw] sm:w-full"
                >
                  {dialogState === "intro" && (
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Floating Glow/Icon */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative w-14 h-14 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400 border border-violet-500/20 shadow-inner">
                          <Sparkles size={26} className="animate-bounce" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>

                      <AlertDialogHeader className="space-y-1.5">
                        <AlertDialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
                          Buat Rencana Personal
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                          "Saya bisa membuat roadmap yang lebih personal."
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      {/* Attractive Highlight Box */}
                      <div className="w-full bg-muted/30 p-4 rounded-xl border border-muted/20 text-left space-y-2.5">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          <Target size={14} className="text-violet-500" />
                          Apa Keuntungan Roadmap Personal?
                        </p>
                        <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Disesuaikan dengan Profil:</strong> Menyesuaikan taktik untuk Mahasiswa, Karyawan, UMKM, atau Keluarga Kecil.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Langkah Aksi Nyata:</strong> Panduan langkah demi langkah memangkas pengeluaran tanpa mengurangi kualitas hidup.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Prediksi & Mitigasi:</strong> Menghindari risiko defisit dengan strategi alokasi dana darurat yang adaptif.</span>
                          </div>
                        </div>
                      </div>

                      <AlertDialogFooter className="w-full grid grid-cols-2 gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenChange(false)}
                          className="w-full rounded-xl hover:bg-muted text-xs font-bold py-2.5 border-muted/50 cursor-pointer"
                        >
                          Nanti Saja
                        </Button>
                        <Button
                          onClick={() => setDialogState("form")}
                          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold py-2.5 shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer"
                        >
                          Buat Planing
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
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-20 h-20 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
                        <div className="relative w-12 h-12 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400">
                          <Sparkles size={22} className="animate-pulse" />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <h4 className="text-sm font-bold text-foreground transition-all duration-300">
                          {loadingMessages[msgIdx]}
                        </h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Harap tunggu, kecerdasan buatan sedang merancang keputusan dan strategi keuangan terbaikmu.
                        </p>
                      </div>
                    </div>
                  )}

                  {dialogState === "roadmap" && roadmap && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 border-b border-muted/50 pb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 shadow-inner shrink-0">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-foreground">Roadmap Finansial Kamu</h4>
                          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Peta jalan keuangan yang dirancang khusus oleh AI.</p>
                        </div>
                      </div>

                      {/* Scrollable roadmap content */}
                      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-muted-foreground/10 text-left">
                        {/* Summary */}
                        <div className="p-4 rounded-xl bg-violet-500/[0.02] border-l-4 border-violet-500/80 text-xs text-muted-foreground leading-relaxed italic">
                          "{roadmap.summary}"
                        </div>

                        {/* Phases */}
                        <div className="space-y-4">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Activity size={14} className="text-violet-500" />
                            Fase Rencana Aksi
                          </h5>
                          <div className="relative pl-3 border-l-2 border-muted/80 ml-2.5 space-y-6">
                            {roadmap.phases.map((phase: any, index: number) => (
                              <div key={index} className="relative space-y-2">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[18.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-violet-600 border border-background shadow-sm" />

                                <div className="flex items-center justify-between">
                                  <h6 className="text-xs font-bold text-foreground">{phase.name}</h6>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-muted/60 border text-muted-foreground leading-none">
                                    {phase.duration}
                                  </span>
                                </div>
                                <ul className="space-y-1.5 pl-3 list-disc text-[11px] text-muted-foreground leading-relaxed">
                                  {phase.steps.map((stepStr: string, sIdx: number) => (
                                    <li key={sIdx}>{stepStr}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tips */}
                        {roadmap.tips && roadmap.tips.length > 0 && (
                          <div className="space-y-2.5 bg-muted/15 border border-muted/30 p-4 rounded-xl">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                              <FileText size={14} className="text-amber-500" />
                              Tips Finansial Tambahan
                            </h5>
                            <ul className="space-y-1.5 pl-3 list-disc text-[11px] text-muted-foreground leading-relaxed">
                              {roadmap.tips.map((tip: string, tIdx: number) => (
                                <li key={tIdx}>{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Conclusion */}
                        {roadmap.conclusion && (
                          <div className="text-center text-[11px] text-muted-foreground font-medium italic pt-2">
                            "{roadmap.conclusion}"
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-muted/50">
                        <Button
                          onClick={() => handleOpenChange(false)}
                          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold py-2.5 cursor-pointer shadow-md"
                        >
                          Selesai
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDialogContent>
              </AlertDialog>

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
                  "w-full flex items-center justify-center gap-1 text-[10px] font-bold px-1 h-9 rounded-xl shadow-sm cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                  isSynced
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : aiData.decisionVerdict === "BLOCKED_DANGER"
                    ? "bg-muted text-muted-foreground border border-muted-foreground/15 cursor-not-allowed hover:scale-100"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                )}
                title={
                  aiData.decisionVerdict === "BLOCKED_DANGER"
                    ? "Sinkronisasi dinonaktifkan untuk rencana belanja berbahaya"
                    : "Sinkronisasikan nominal tabungan bulanan target ini ke Anggaran Bulanan Anda"
                }
              >
                {isSynced ? "Tersinkron ✔" : isSyncing ? "Syncing..." : "Sync Budget"}
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-1 hover:bg-muted border-muted/50 rounded-xl text-[10px] font-bold px-1 h-9 shadow-sm"
                onClick={onReset}
                title="Mulai Analisis Baru"
              >
                Reset
              </Button>
            </div>
          </div>

        </div>

        {/* Right Column: Feasibility, Evolution & Sacrifice */}
        <div className="lg:col-span-8 space-y-6">

          {/* Financial Trap Warning Panel (Paylater/Pinjol/Judol Alert) */}
          {aiData.financialTrapWarning && (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.03] space-y-2 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert size={15} className="animate-pulse text-rose-500" />
                Peringatan Bahaya Finansial!
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground font-semibold">
                {aiData.financialTrapWarning}
              </p>
            </div>
          )}

          {/* Kelayakan & Emergency Mode Status */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300 space-y-4",
            aiData.emergencyMode.isActive
              ? "bg-rose-500/[0.03] border-rose-500/20 dark:border-rose-400/20"
              : "bg-violet-500/[0.02] border-violet-500/10 dark:border-violet-500/10"
          )}>

            {/* Status Header Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Target size={15} className="text-violet-500" />
                Rencana Target: <strong className="text-violet-600 dark:text-violet-400">{target}</strong>
              </span>
              <div className={cn(
                "text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1",
                aiData.emergencyMode.isActive
                  ? "bg-rose-500/15 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              )}>
                {aiData.emergencyMode.isActive ? (
                  <>
                    <Flame size={10} className="animate-pulse" />
                    Siaga Finansial
                  </>
                ) : (
                  <>
                    <ShieldCheck size={10} />
                    Anggaran Aman
                  </>
                )}
              </div>
            </div>

            {/* Target Value and AI Feasibility Statement */}
            <div className="space-y-2 text-xs">
              {targetValue && (
                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <span>Target Nominal:</span>
                  <span className="text-foreground font-bold text-sm bg-muted/20 px-2 py-0.5 rounded-md border border-muted/30">
                    Rp {Number(targetValue).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <p className="text-muted-foreground leading-relaxed">
                {aiData.impactOnTarget}
              </p>
            </div>

            {/* Real Market Price Facts Section */}
            {aiData.realMarketPrice && (
              <div className="p-3 bg-violet-600/[0.03] border border-violet-500/15 rounded-xl space-y-1">
                <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse" />
                  Riset Harga Pasar Nyata (Fakta AI)
                </div>
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Estimasi Harga Asli:</span>
                  <span className="text-violet-600 dark:text-violet-400 font-extrabold">{aiData.realMarketPrice}</span>
                </div>
                {aiData.priceComparisonNote && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    💡 {aiData.priceComparisonNote}
                  </p>
                )}
              </div>
            )}

            {/* Alternative Suggestions (Faktual & Realistis) */}
            {aiData.alternativeSuggestions && aiData.alternativeSuggestions.length > 0 && (
              <div className="p-3.5 bg-emerald-500/[0.03] border border-emerald-500/15 rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                  Alternatif Pilihan Lebih Realistis
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
                  {aiData.alternativeSuggestions.map((item, index) => (
                    <li key={index}>
                      <span className="text-foreground font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Paylater vs Nabung Cash Cost Simulator */}
            {aiData.paylaterSimulation && (
              <div className="p-3.5 bg-amber-500/[0.02] border border-amber-500/15 rounded-xl space-y-3 animate-in fade-in duration-300">
                <h5 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={13} className="text-amber-500" />
                  Simulasi Kerugian Kredit / Paylater (12 Bulan)
                </h5>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-background/55 border border-muted/20 space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Harga Tunai (Cash)</span>
                    <p className="text-xs font-bold text-emerald-600">Rp {aiData.paylaterSimulation.cashPrice.toLocaleString("id-ID")}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background/55 border border-muted/20 space-y-0.5">
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Total Harga Paylater</span>
                    <p className="text-xs font-bold text-rose-600">Rp {aiData.paylaterSimulation.paylaterPrice.toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <div className="text-[10px] space-y-1 text-muted-foreground border-t border-muted/20 pt-2 leading-relaxed">
                  <div className="flex justify-between">
                    <span>Biaya Admin (5%):</span>
                    <span className="font-semibold text-foreground">Rp {aiData.paylaterSimulation.adminFee.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bunga Kredit (3.5%/bln x 12):</span>
                    <span className="font-semibold text-foreground">Rp {aiData.paylaterSimulation.interestExpense.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-muted/30 pt-1 font-bold text-rose-600 dark:text-rose-400 text-xs">
                    <span>Kerugian Uang Sia-Sia:</span>
                    <span>Rp {aiData.paylaterSimulation.moneyWasted.toLocaleString("id-ID")}</span>
                  </div>
                  <p className="mt-1.5 text-[9px] italic text-muted-foreground/80 leading-normal">
                    💡 {aiData.paylaterSimulation.comparisonNote}
                  </p>
                </div>
              </div>
            )}

            {/* Emergency Mode Strategy (if applicable) */}
            <div className="p-3.5 rounded-xl bg-background/55 border border-muted/30 space-y-1">
              <h5 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                {aiData.emergencyMode.isActive ? (
                  <Flame size={12} className="text-rose-500" />
                ) : (
                  <ShieldCheck size={12} className="text-emerald-500" />
                )}
                Taktik Keuangan AI
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiData.emergencyMode.strategy}
              </p>
            </div>

          </div>

          {/* Sub-grid for Evolution & Sacrifice (Side-by-side on desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Evolution Card */}
            <div className="p-5 rounded-2xl bg-muted/15 border border-muted/20 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-muted/30 pb-3">
                <TrendingUp size={14} className="text-violet-500" />
                Perkembangan Anggaran
              </h4>
              <div className="space-y-3">
                {aiData.budgetEvolution.map((evo, i) => {
                  const isDown = evo.toLowerCase().includes("turun") || evo.toLowerCase().includes("kurang") || evo.toLowerCase().includes("defisit");
                  return (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                      {isDown ? (
                        <TrendingDown size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <TrendingUp size={14} className="text-violet-500 shrink-0 mt-0.5" />
                      )}
                      <span>{evo}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sacrifice Card */}
            <div className="p-5 rounded-2xl bg-muted/10 border border-muted/20 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-muted/30 pb-3">
                <FileText size={14} className="text-amber-500" />
                Saran Pengorbanan Uang
              </h4>

              {aiData.sacrificeTransparency && aiData.sacrificeTransparency.length > 0 ? (
                <div className="space-y-4">
                  {aiData.sacrificeTransparency.slice(0, 1).map((sacrifice, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Pangkas: <span className="text-amber-600 dark:text-amber-400">{sacrifice.item}</span>
                        </span>
                        <span className="text-[9px] text-muted-foreground font-semibold bg-muted/40 px-2 py-0.5 rounded-md border border-muted/20">
                          Non-Esensial
                        </span>
                      </div>

                      {sacrifice.nominalToCut && sacrifice.nominalToCut > 0 && (
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 px-2.5 py-1.5 rounded-lg border border-rose-500/10 my-1">
                          Nominal Pemotongan: <span className="font-extrabold text-foreground">Rp {Number(sacrifice.nominalToCut).toLocaleString("id-ID")}</span>
                        </div>
                      )}

                      <ul className="space-y-1.5 pl-3 list-disc text-xs text-muted-foreground">
                        {sacrifice.reasons.map((reason, rIdx) => (
                          <li key={rIdx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic p-3 text-center bg-background/25 rounded-xl border border-dashed border-muted/40">
                  Hebat! Seluruh pengeluaran bulanan kamu sudah dinilai esensial.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
