"use client";

import React from "react";
import { Landmark, AlertCircle, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface DecisionBudget {
  id: string;
  monthlyBudget: number;
  targetName: string;
  targetValue: number;
  targetDate?: string | null;
  targetBudget: number;
  expenses: ExpenseItem[];
}

interface BudgetSummaryCardProps {
  decision: DecisionBudget | null;
}

export function BudgetSummaryCard({ decision }: BudgetSummaryCardProps) {
  if (!decision) {
    return (
      <div className="rounded-3xl border border-zinc-200/80 bg-white/60 backdrop-blur-md p-6 text-center space-y-2">
        <Landmark className="h-8 w-8 text-zinc-300 mx-auto" />
        <p className="text-xs text-zinc-400 font-bold italic">
          Belum ada data rencana anggaran bulanan.
        </p>
      </div>
    );
  }

  const totalExpenses = decision.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = decision.monthlyBudget - totalExpenses;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm space-y-6">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/[0.03] rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-full border border-violet-500/10 w-fit block">
          Alokasi Bulanan Aktif
        </span>
        <h3 className="text-sm font-extrabold text-zinc-900 mt-2 leading-none">
          Struktur Keuangan Bulanan
        </h3>
      </div>

      {/* Financial stats boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-white border rounded-2xl shadow-inner-sm">
          <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Uang Bulanan
          </span>
          <span className="text-[13px] font-black text-zinc-900 block mt-1">
            Rp {decision.monthlyBudget.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="p-3 bg-white border rounded-2xl shadow-inner-sm">
          <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Total Pengeluaran
          </span>
          <span className="text-[13px] font-black text-rose-500 block mt-1">
            Rp {totalExpenses.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="p-3 bg-zinc-900 border rounded-2xl shadow-sm text-white">
          <span className="text-[8px] text-zinc-400 font-extrabold uppercase tracking-wider block">
            Uang Bersih (Surplus)
          </span>
          <span className={cn(
            "text-[13px] font-black block mt-1",
            remainingBudget >= 0 ? "text-emerald-400" : "text-rose-400"
          )}>
            Rp {remainingBudget.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Expenses list */}
      <div className="space-y-2">
        <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1">
          <TrendingDown className="h-3.5 w-3.5 text-zinc-400" />
          Rincian Pengeluaran Terdaftar:
        </span>
        <div className="border rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto bg-zinc-50/50">
          {decision.expenses.length === 0 ? (
            <p className="text-[10px] text-zinc-400 italic text-center p-4">
              Tidak ada pengeluaran bulanan yang dicatat.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 bg-white">
              {decision.expenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center px-4 py-2.5 text-xs">
                  <span className="font-bold text-zinc-800 truncate max-w-[220px]">
                    {exp.name}
                  </span>
                  <span className="font-black text-zinc-900 shrink-0">
                    Rp {exp.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
