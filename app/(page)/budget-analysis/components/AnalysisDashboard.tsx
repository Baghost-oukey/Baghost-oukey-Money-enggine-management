import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
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
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (analysisResult.score / 100) * circumference;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border bg-card p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden"
    >
      {/* Score Header */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-foreground mb-4">Hasil Evaluasi Finansial</h3>

        {/* Circular Score Gauge */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Trail Circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-muted fill-none"
              strokeWidth="8"
            />
            {/* Active Circle */}
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              className={cn(
                "fill-none transition-all duration-1000 ease-out",
                analysisResult.score >= 80
                  ? "stroke-green-500"
                  : analysisResult.score >= 60
                  ? "stroke-amber-500"
                  : "stroke-red-500"
              )}
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: scoreOffset }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-foreground">{analysisResult.score}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Skor</span>
          </div>
        </div>

        {/* Risk Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm mb-2">
          {analysisResult.riskLevel === "Tinggi" ? (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <ShieldAlert size={14} />
              Risiko Tinggi
            </span>
          ) : analysisResult.riskLevel === "Sedang" ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle size={14} />
              Risiko Sedang
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <ShieldCheck size={14} />
              Risiko Rendah
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-muted/50 pt-4 space-y-4">
        {/* Recommendation Card */}
        <div className="bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 dark:border-blue-400/10 rounded-xl p-4 flex gap-3">
          <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={18} />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Rekomendasi AI</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{analysisResult.recommendation}</p>
          </div>
        </div>

        {/* Proyeksi Pencapaian Target */}
        {targetValue && (
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 flex gap-3">
            <Target className="text-indigo-500 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Proyeksi Target</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {remainingBudget > 0 ? (
                  <>
                    Dengan menyisihkan sisa anggaran sebesar{" "}
                    <span className="font-semibold text-foreground">
                      Rp {remainingBudget.toLocaleString("id-ID")}
                    </span>{" "}
                    tiap bulan, Anda dapat mencapai target nominal{" "}
                    <span className="font-semibold text-foreground">
                      Rp {Number(targetValue).toLocaleString("id-ID")}
                    </span>{" "}
                    dalam waktu sekitar{" "}
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.ceil(Number(targetValue) / remainingBudget)} bulan
                    </span>
                    .
                  </>
                ) : (
                  <span className="text-red-500">
                    Anggaran bulanan Anda saat ini mengalami defisit. Anda tidak memiliki sisa anggaran untuk ditabung guna membeli/mencapai target ini.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Summary items */}
        <div className="bg-muted/20 border border-muted/50 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Finansial</span>
            <span className="font-medium text-foreground">{target}</span>
          </div>
          {targetDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batas Waktu (Deadline)</span>
              <span className="font-medium text-foreground">
                {new Date(targetDate).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 hover:bg-muted border-muted/50 rounded-xl text-sm font-medium"
        onClick={onReset}
      >
        <RefreshCw size={14} />
        Mulai Analisis Baru
      </Button>
    </motion.div>
  );
}
