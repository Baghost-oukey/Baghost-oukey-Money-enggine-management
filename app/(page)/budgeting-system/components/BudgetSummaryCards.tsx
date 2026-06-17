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
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 dark:border-muted-foreground/10 bg-card/40 backdrop-blur-md shadow-sm flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest block">
              Total Pemasukan
            </p>
            <h4 className="text-[11px] font-light">Pendapatan bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl shadow-inner">
            <Wallet size={18} />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Rp {salary.toLocaleString("id-ID")}
          </p>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <p className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
              100%
            </p>
            <p className="text-[10px] font-medium">Keuangan Anda</p>
          </div>
        </div>
      </div>

      {/* Card 2: Income / Kebutuhan Primer (Needs) */}
      <div className="group p-5 rounded-3xl border border-muted-foreground/15 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest block">
              Kebutuhan Pokok
            </p>
            <h4 className="text-[11px] font-light">Pengeluaran yang wajib anda keluarkan</h4>
          </div>
          <div className="p-2.5 rounded-2xl shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Rp {needsTarget.toLocaleString("id-ID")}
          </p>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <p className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-violet-500/10 text-blue-700 rounded-md">
              {Math.round(needsPercentage)}%
            </p>
            <p className="text-[10px] font-medium">Pengeluaran Wajib Anda</p>
          </div>
        </div>
      </div>

      {/* Card 3: Expense / Kebutuhan Sekunder (Wants) */}
      <div className="group p-5 rounded-3xl border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest block">
              Gaya Hidup
            </p>
            <h4 className="text-[11px] font-light">Kebutuhan Tambahan Anda</h4>
          </div>
          <div className="p-2.5 rounded-2xl">
            <ArrowUpRight size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Rp {wantsTarget.toLocaleString("id-ID")}
          </p>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t">
            <p className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-500/10 text-blue-700 rounded-md">
              {Math.round(wantsPercentage)}%
            </p>
            <p className="text-[10px] font-medium">Dana Keluarga</p>
          </div>
        </div>
      </div>

      {/* Card 4: Total Savings / Kebutuhan Tersier (Savings) */}
      <div className="group p-5 rounded-3xl border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest block">
              Tabungan & Investasi
            </p>
            <h4 className="text-[11px] font-medium">Simpanan & dana darurat</h4>
          </div>
          <div className="p-2.5 rounded-2xl">
            <Coins size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Rp {savingsTarget.toLocaleString("id-ID")}
          </p>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <p className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold text-blue-700 rounded-md">
              {Math.round(savingsPercentage)}%
            </p>
            <p className="text-[10px] font-medium">Dana Tabungan</p>
          </div>
        </div>
      </div>

      {/* Card 5: Cicilan & Utang (Debts) */}
      <div className="group p-5 rounded-3xl border flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest block">
              Cicilan & Utang
            </p>
            <h4 className="text-[11px] font-medium">Kewajiban cicilan bulanan</h4>
          </div>
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400 border border-rose-500/10 shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
            <CreditCard size={18} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
            Rp {debtsTarget.toLocaleString("id-ID")}
          </p>
          
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-muted-foreground/10">
            <p className="inline-block px-1.5 py-0.5 text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-md">
              {Math.round(debtsPercentage)}%
            </p>
            <p className="text-[10px] font-medium">Uang Tunggakan yang harus di bayar</p>
          </div>
        </div>
      </div>

    </div>
  );
}
