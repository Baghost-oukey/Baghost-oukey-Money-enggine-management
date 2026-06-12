import React from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Target,
  CalendarDays,
  ListTodo,
  Sparkles,
  Info,
  CheckCircle2,
} from "lucide-react";

interface Expense {
  description: string;
  amount: number;
}

interface BudgetSummaryPreviewProps {
  budget: string;
  target: string;
  targetValue: string;
  targetDate?: string;
  expenses: Expense[];
}

export function BudgetSummaryPreview({
  budget,
  target,
  targetValue,
  targetDate,
  expenses,
}: BudgetSummaryPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-card/50 backdrop-blur-md p-5 shadow-md space-y-4 border-muted/60"
    >
      {/* Header */}
      <div className="border-b border-muted/50 pb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          Ringkasan Budget
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          data budget ini akan di analisis dengan bantuan kecerdasan buatan
        </p>
      </div>

      {/* Financial Details Rows */}
      <div className="space-y-4">
        {/* Budget */}
        {budget && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
              Budget Bulanan
            </div>
            <div className="text-lg font-bold text-foreground">
              Rp {Number(budget).toLocaleString("id-ID")}
            </div>
          </div>
        )}

        {/* Target */}
        {(target || targetValue) && (
          <div className="rounded-xl bg-muted/20 border border-muted/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rencana Target
            </div>

            {target && (
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tujuan</span>
                <span className="font-semibold text-sm text-foreground">{target}</span>
              </div>
            )}

            <div className="flex justify-between items-end gap-4">
              {targetValue && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nilai Target</span>
                  <span className="font-bold text-base text-foreground">
                    Rp {Number(targetValue).toLocaleString("id-ID")}
                  </span>
                </div>
              )}

              {targetDate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-2.5 py-1 rounded-lg border border-muted/30">
                  <CalendarDays size={12} className="text-rose-500" />
                  {new Date(targetDate).toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expenses */}
      {expenses.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kebutuhan yang Dipertimbangkan ({expenses.length})
          </div>

          <div className="border border-muted/40 rounded-xl overflow-hidden divide-y divide-muted/30 max-h-40 overflow-y-auto bg-muted/10">
            {expenses.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/30 transition-colors"
              >
                <span className="text-muted-foreground truncate max-w-[200px]">{item.description}</span>
                <span className="font-semibold text-foreground">
                  Rp {item.amount.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Evaluate */}
      <div className="bg-gradient-to-br from-blue-500/[0.02] to-indigo-500/[0.02] border border-blue-500/10 dark:border-blue-400/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          AI Akan Mengevaluasi
        </div>

        <ul className="space-y-2 text-xs text-muted-foreground">
          {[
            "Kelayakan target realistis",
            "Estimasi waktu pencapaian target",
            "Tingkat risiko terhadap kondisi keuangan",
            "Strategi terbaik yang memungkinkan",
            "Rekomendasi keputusan yang lebih sehat",
          ].map((text, i) => (
            <li key={i} className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-blue-500 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Info Box */}
      <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.02] p-3.5 flex gap-2.5 items-start text-xs text-muted-foreground leading-relaxed">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={14} />
        <span>
          Klik <strong className="text-foreground font-semibold">Analisis Sekarang</strong> untuk mendapatkan rekomendasi keputusan finansial yang dipersonalisasi oleh AI.
        </span>
      </div>
    </motion.div>
  );
}