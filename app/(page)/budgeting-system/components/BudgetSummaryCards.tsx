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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 z-10 relative">
      
      {/* Card 1: Total Balance (Salary) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgb(99,102,241,0.06)] dark:hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] hover:border-indigo-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-muted-foreground/80 dark:text-muted-foreground uppercase tracking-widest block">
              Total Pemasukan
            </span>
            <h4 className="text-[11px] font-medium text-muted-foreground leading-snug">Pendapatan bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Wallet size={18} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Rp {salary.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
              100%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">Acuan Anggaran</span>
          </div>
        </div>
      </div>

      {/* Card 2: Income / Kebutuhan Primer (Needs) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgb(124,58,237,0.06)] dark:hover:shadow-[0_8px_30px_rgb(124,58,237,0.12)] hover:border-violet-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400 uppercase tracking-widest block">
              Kebutuhan Utama
            </span>
            <h4 className="text-[11px] font-medium text-muted-foreground leading-snug">Makan, kos, tagihan wajib</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400 border border-violet-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-violet-600 dark:text-violet-400">
            Rp {needsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-md">
              {Math.round(needsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium font-semibold">Alokasi Wajib</span>
          </div>
        </div>
      </div>

      {/* Card 3: Expense / Kebutuhan Sekunder (Wants) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgb(245,158,11,0.06)] dark:hover:shadow-[0_8px_30px_rgb(245,158,11,0.12)] hover:border-amber-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
              Jajan & Gaya Hidup
            </span>
            <h4 className="text-[11px] font-medium text-muted-foreground leading-snug">Kopi, shopping, hiburan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            Rp {wantsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
              {Math.round(wantsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium font-semibold">Alokasi Gaya Hidup</span>
          </div>
        </div>
      </div>

      {/* Card 4: Total Savings / Kebutuhan Tersier (Savings) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgb(16,185,129,0.06)] dark:hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] hover:border-emerald-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
              Tabungan & Investasi
            </span>
            <h4 className="text-[11px] font-medium text-muted-foreground leading-snug">Simpanan & dana darurat</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Coins size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            Rp {savingsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
              {Math.round(savingsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium font-semibold">Alokasi Tabungan</span>
          </div>
        </div>
      </div>

      {/* Card 5: Cicilan & Utang (Debts) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm hover:shadow-[0_8px_30px_rgb(244,63,94,0.06)] dark:hover:shadow-[0_8px_30px_rgb(244,63,94,0.12)] hover:border-rose-500/30 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 ease-out flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-widest block">
              Cicilan & Utang
            </span>
            <h4 className="text-[11px] font-medium text-muted-foreground leading-snug">Kewajiban cicilan bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <CreditCard size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
            Rp {debtsTarget.toLocaleString("id-ID")}
          </div>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">
              {Math.round(debtsPercentage)}%
            </span>
            <span className="text-[10px] text-muted-foreground font-medium font-semibold">Alokasi Utang</span>
          </div>
        </div>
      </div>

    </div>
  );
}
