import React from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Target,
  CalendarDays,
  FileText,
  Activity,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetNum = Number(budget || 0);
  const remainingBudget = budgetNum - totalExpenses;
  const percentSpent = budgetNum > 0 ? Math.min(100, (totalExpenses / budgetNum) * 100) : 0;
  const isDeficit = remainingBudget < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-card/25 backdrop-blur-md p-5 sm:p-6 shadow-lg border-muted/20 space-y-5 flex flex-col justify-between h-full"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="border-b border-muted/20 pb-4">
          <h2 className="text-lg font-bold text-foreground">
            Ringkasan Rencana Finansial
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Visualisasi alokasi pengeluaran dan kelayakan target bulanan kamu.
          </p>
        </div>

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Budget Bulanan */}
          <div className="p-3.5 rounded-xl bg-muted/15 border border-muted/30 flex flex-col justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Budget Bulanan
            </span>
            <span className="text-base font-extrabold text-foreground mt-1.5">
              Rp {budgetNum.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Sisa Anggaran */}
          <div className={cn(
            "p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-300",
            isDeficit 
              ? "bg-rose-500/[0.03] border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          )}>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sisa Anggaran
            </span>
            <span className="text-base font-extrabold mt-1.5">
              Rp {remainingBudget.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Dynamic Budget Allocation Progress Bar */}
        {budgetNum > 0 && (
          <div className="space-y-2 bg-muted/10 p-4 rounded-xl border border-muted/25">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Activity size={13} className="text-violet-500" />
                Alokasi Pengeluaran
              </span>
              <span className={cn("font-bold", isDeficit ? "text-rose-500" : "text-violet-600 dark:text-violet-400")}>
                {percentSpent.toFixed(0)}% Terpakai
              </span>
            </div>
            
            {/* The Visual Progress Bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-muted/30">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  isDeficit ? "bg-rose-500" : "bg-violet-600"
                )}
                style={{ width: `${percentSpent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider pt-0.5">
              <span>Pengeluaran: Rp {totalExpenses.toLocaleString("id-ID")}</span>
              <span>Sisa: Rp {remainingBudget.toLocaleString("id-ID")}</span>
            </div>
          </div>
        )}

        {/* Target Goals Card */}
        {(target || targetValue) && (
          <div className="p-4 rounded-xl bg-violet-600/[0.02] border border-violet-500/10 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest border-b border-violet-500/10 pb-2">
              <Target size={14} />
              Rencana Target Kamu
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {target && (
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Tujuan Target</span>
                  <span className="font-bold text-sm text-foreground mt-0.5">{target}</span>
                </div>
              )}

              <div className="flex justify-between items-end gap-4">
                {targetValue && (
                  <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Nilai Target</span>
                    <span className="font-extrabold text-base text-foreground mt-0.5">
                      Rp {Number(targetValue).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                {targetDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold bg-card px-2.5 py-1 rounded-lg border border-muted/30 shadow-sm leading-none shrink-0 mb-0.5">
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
          </div>
        )}

        {/* List of expenses */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText size={13} className="text-muted-foreground" />
              Rincian Kebutuhan ({expenses.length})
            </div>

            <div className="border border-muted/40 rounded-xl overflow-hidden divide-y divide-muted/30 max-h-32 overflow-y-auto bg-muted/5 scrollbar-thin">
              {expenses.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/20 transition-colors"
                >
                  <span className="text-muted-foreground font-medium truncate max-w-[220px]">{item.description}</span>
                  <span className="font-bold text-foreground">
                    Rp {item.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aesthetic clean subtle bottom note */}
      <div className="text-[10px] text-muted-foreground/85 leading-relaxed text-center pt-2 border-t border-muted/20">
        Tekan <strong className="text-foreground font-bold">Analisis Sekarang</strong> di sebelah kiri untuk evaluasi AI secara instan.
      </div>
    </motion.div>
  );
}