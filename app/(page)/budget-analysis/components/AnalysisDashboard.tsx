import React from "react";
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

interface AnalysisDashboardProps {
  analysisResult: any;
  remainingBudget: number;
  targetValue: string;
  target: string;
  targetDate: string;
  onReset: () => void;
}

export function AnalysisDashboard({
  analysisResult,
  remainingBudget,
  targetValue,
  target,
  targetDate,
  onReset,
}: AnalysisDashboardProps) {
  // Parse recommendation JSON from database representation
  let aiData: {
    score: number;
    riskLevel: string;
    impactOnTarget: string;
    healthScoreExplanation: string;
    budgetEvolution: string[];
    emergencyMode: { isActive: boolean; strategy: string };
    sacrificeTransparency: Array<{ item: string; reasons: string[] }>;
    aiRecommendationText: string;
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
      impactOnTarget: isDeficit
        ? "Keputusan ini mengurangi peluang pencapaian target tabungan secara signifikan karena kondisi anggaran Anda saat ini defisit."
        : "Keputusan ini cukup stabil namun membutuhkan alokasi yang lebih disiplin untuk mencapai target.",
      healthScoreExplanation: analysisResult.recommendation || "Penilaian kesehatan keuangan bulanan Anda berdasarkan sisa anggaran saat ini.",
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
      aiRecommendationText: analysisResult.recommendation || "Kelola budget Anda secara bijak."
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
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border bg-card/40 backdrop-blur-md p-5 md:p-6 shadow-2xl space-y-6 relative overflow-hidden"
    >
      {/* Background soft glow effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-muted/50 pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-blue-500" size={18} />
            Evaluasi Keputusan AI
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keputusan finansial objektif dan realistis untuk kamu.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm bg-background/50">
          {aiData.riskLevel === "Tinggi" ? (
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <ShieldAlert size={14} className="animate-pulse" />
              Risiko Tinggi
            </span>
          ) : aiData.riskLevel === "Sedang" ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle size={14} />
              Risiko Sedang
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={14} />
              Risiko Rendah
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
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 dark:border-indigo-400/10 space-y-2">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              Keputusan Akhir AI
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground italic font-medium">
              "{aiData.aiRecommendationText}"
            </p>
          </div>

          {/* Action and Deadline */}
          <div className="p-4 rounded-2xl bg-muted/10 border border-muted/20 space-y-3.5">
            {targetDate && (
              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center">
                <Calendar size={13} className="text-rose-500" />
                <span>Deadline: {new Date(targetDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 hover:bg-muted border-muted/50 rounded-xl text-xs font-semibold px-4 h-9.5 shadow-sm"
              onClick={onReset}
            >
              <RefreshCw size={13} />
              Mulai Analisis Baru
            </Button>
          </div>

        </div>

        {/* Right Column: Feasibility, Evolution & Sacrifice */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Kelayakan & Emergency Mode Status */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all duration-300 space-y-4",
            aiData.emergencyMode.isActive
              ? "bg-rose-500/[0.03] border-rose-500/20 dark:border-rose-400/20"
              : "bg-blue-500/[0.02] border-blue-500/10 dark:border-blue-400/10"
          )}>
            
            {/* Status Header Badge */}
            <div className="flex items-center justify-between pb-3.5 border-b border-muted/30">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Target size={15} className="text-blue-500" />
                Rencana Target: <strong className="text-blue-600 dark:text-blue-400">{target}</strong>
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
                <TrendingUp size={14} className="text-indigo-500" />
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
                        <TrendingUp size={14} className="text-indigo-500 shrink-0 mt-0.5" />
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

    </motion.div>
  );
}
