import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface BudgetDistributionProgressBarProps {
  frameworkUsed: string;
  needsPercentage: number;
  wantsPercentage: number;
  savingsPercentage: number;
  totalPercentage: number;
  isPercentageValid: boolean;
}

export function BudgetDistributionProgressBar({
  frameworkUsed,
  needsPercentage,
  wantsPercentage,
  savingsPercentage,
  totalPercentage,
  isPercentageValid,
}: BudgetDistributionProgressBarProps) {
  return (
    <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/10 z-10 relative space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">Distribusi Anggaran</h3>
          <p className="text-[10px] text-muted-foreground">Metode Pembagian: {frameworkUsed}</p>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-bold bg-background/50">
          {isPercentageValid ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={14} /> Total 100% Pas
            </span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-pulse">
              <AlertTriangle size={14} /> Total {totalPercentage}% (Wajib 100%)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="w-full h-4 rounded-full flex overflow-hidden bg-muted border border-muted/30">
          <div className="h-full bg-violet-600 transition-all duration-300" style={{ width: `${(needsPercentage / (totalPercentage || 1)) * 100}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(wantsPercentage / (totalPercentage || 1)) * 100}%` }} />
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(savingsPercentage / (totalPercentage || 1)) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground font-semibold gap-2">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-violet-600 rounded-full"/> Kebutuhan Pokok ({needsPercentage}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"/> Keinginan & Hiburan ({wantsPercentage}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"/> Tabungan & Investasi ({savingsPercentage}%)</span>
        </div>
      </div>
    </div>
  );
}
