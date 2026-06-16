import React from "react";
import { Wallet, TrendingUp, ArrowUpRight, Coins } from "lucide-react";

interface BudgetSummaryCardsProps {
  salary: number;
  setSalary: (val: number) => void;
  needsTarget: number;
  needsPercentage: number;
  setNeedsPercentage: (val: number) => void;
  wantsTarget: number;
  wantsPercentage: number;
  setWantsPercentage: (val: number) => void;
  savingsTarget: number;
  savingsPercentage: number;
  setSavingsPercentage: (val: number) => void;
}

export function BudgetSummaryCards({
  salary,
  setSalary,
  needsTarget,
  needsPercentage,
  setNeedsPercentage,
  wantsTarget,
  wantsPercentage,
  setWantsPercentage,
  savingsTarget,
  savingsPercentage,
  setSavingsPercentage,
}: BudgetSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 z-10 relative">
      
      {/* Card 1: Total Balance (Salary) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Balance
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground">Total Pendapatan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Wallet size={20} />
          </div>
        </div>
        
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground">Klik di bawah untuk mengubah:</span>
          <div className="relative flex items-center">
            <span className="absolute left-0 text-xl font-black text-foreground">Rp</span>
            <input
              type="text"
              value={new Intl.NumberFormat("id-ID").format(salary)}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^\d]/g, "");
                setSalary(Number(clean) || 0);
              }}
              className="pl-7 w-full bg-transparent border-none text-2xl font-black focus:ring-0 focus:outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Income / Kebutuhan Primer (Needs) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Kebutuhan Primer
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground">Pos Pokok & Wajib</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-violet-600 dark:text-violet-400">
            Rp {needsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1 border-t border-muted/20">
            <input
              type="number"
              min="0"
              max="100"
              value={needsPercentage}
              onChange={(e) => setNeedsPercentage(Number(e.target.value) || 0)}
              className="w-12 h-6 text-xs text-center font-bold bg-violet-500/10 border border-violet-500/20 text-violet-600 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <span className="text-[10px] text-muted-foreground font-semibold">% dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 3: Expense / Kebutuhan Sekunder (Wants) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Kebutuhan Sekunder
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground">Pos Gaya Hidup & Hiburan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            Rp {wantsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1 border-t border-muted/20">
            <input
              type="number"
              min="0"
              max="100"
              value={wantsPercentage}
              onChange={(e) => setWantsPercentage(Number(e.target.value) || 0)}
              className="w-12 h-6 text-xs text-center font-bold bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-[10px] text-muted-foreground font-semibold">% dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 4: Total Savings / Kebutuhan Tersier (Savings) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Kebutuhan Tersier
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground">Pos Tabungan & Investasi</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Coins size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            Rp {savingsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1 border-t border-muted/20">
            <input
              type="number"
              min="0"
              max="100"
              value={savingsPercentage}
              onChange={(e) => setSavingsPercentage(Number(e.target.value) || 0)}
              className="w-12 h-6 text-xs text-center font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-muted-foreground font-semibold">% dari pendapatan</span>
          </div>
        </div>
      </div>

    </div>
  );
}
