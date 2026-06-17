import React from "react";
import { Wallet, TrendingUp, ArrowUpRight, Coins, CreditCard } from "lucide-react";

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
  debtsTarget: number;
  debtsPercentage: number;
  setDebtsPercentage: (val: number) => void;
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
  debtsTarget,
  debtsPercentage,
  setDebtsPercentage,
}: BudgetSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 z-10 relative">
      
      {/* Card 1: Total Balance (Salary) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Pemasukan
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground font-medium">Gaji & uang masuk bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Wallet size={20} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-black text-foreground">
            Rp {salary.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1 border-t border-muted/20">
            <span className="inline-block px-2 py-0.5 text-xs font-black bg-violet-500/10 text-violet-600 rounded-md">
              100%
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 2: Income / Kebutuhan Primer (Needs) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Kebutuhan Utama
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground font-medium">Makan harian, kos, bensin, & tagihan</h4>
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
            <span className="inline-block px-2 py-0.5 text-xs font-black bg-violet-500/10 text-violet-600 rounded-md">
              {Math.round(needsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 3: Expense / Kebutuhan Sekunder (Wants) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Jajan & Gaya Hidup
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground font-medium">Uang kopi, nonton, shopping, & hobi</h4>
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
            <span className="inline-block px-2 py-0.5 text-xs font-black bg-amber-500/10 text-amber-600 rounded-md">
              {Math.round(wantsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 4: Total Savings / Kebutuhan Tersier (Savings) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Tabungan & Investasi
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground font-medium">Simpanan masa depan & dana darurat</h4>
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
            <span className="inline-block px-2 py-0.5 text-xs font-black bg-emerald-500/10 text-emerald-600 rounded-md">
              {Math.round(savingsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">dari pendapatan</span>
          </div>
        </div>
      </div>

      {/* Card 5: Cicilan & Utang (Debts) */}
      <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Cicilan & Utang
            </span>
            <h4 className="text-xs font-semibold text-muted-foreground font-medium">Pembayaran cicilan & utang bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            Rp {debtsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1 border-t border-muted/20">
            <span className="inline-block px-2 py-0.5 text-xs font-black bg-rose-500/10 text-rose-600 rounded-md">
              {Math.round(debtsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold">dari pendapatan</span>
          </div>
        </div>
      </div>

    </div>
  );
}
