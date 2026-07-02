import React from "react";
import { 
  ShoppingBag, 
  Calendar, 
  Coins, 
  Clock, 
  TrendingUp, 
  CreditCard, 
  PiggyBank 
} from "lucide-react";

interface BudgetItem {
  name: string;
  amount: number;
}

interface GoalPlan {
  allocation: {
    needs: number;
    wants: number;
    savings: number;
    explanation: string;
  };
  needsItems: BudgetItem[];
  wantsItems: BudgetItem[];
  savingsItems: BudgetItem[];
  verdict: string;
  tips: string[];
  roadmap: string[];
  advice: string;
}

interface GoalItem {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  targetDate: string | null;
  isCompleted: boolean;
  currentAmount: number;
  createdAt: string;
  plan: GoalPlan | null;
}

interface GoalDetailViewProps {
  activeGoal: GoalItem;
}

export function GoalDetailView({ activeGoal }: GoalDetailViewProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Goal Detail Banner */}
      <div className="p-6 rounded-3xl border border-muted-foreground/15 bg-card/20 backdrop-blur-md shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-violet-600/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/15 px-2.5 py-0.5 rounded-md">
                Target Aktif
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <ShoppingBag className="text-violet-600 shrink-0 h-6 w-6" />
              {activeGoal.title}
            </h2>
          </div>

          <div className="space-y-1.5 text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">Harga Barang</span>
            <span className="text-xl sm:text-2xl font-extrabold text-foreground">
              Rp {activeGoal.targetAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-muted-foreground/10 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted/40 rounded-xl">
              <Calendar size={14} className="text-muted-foreground" />
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider leading-none">Target Waktu</span>
              <span className="text-foreground text-[11px]">
                {activeGoal.targetDate ? new Date(activeGoal.targetDate).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted/40 rounded-xl">
              <Coins size={14} className="text-muted-foreground" />
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider leading-none">Tabungan Bulanan</span>
              <span className="text-rose-500 font-bold text-[11px]">
                Rp {activeGoal.plan?.allocation.savings.toLocaleString("id-ID") || "0"}/bln
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted/40 rounded-xl">
              <Clock size={14} className="text-muted-foreground" />
            </div>
            <div>
              <span className="text-muted-foreground block text-[9px] uppercase tracking-wider leading-none">Dibuat Pada</span>
              <span className="text-foreground text-[11px]">
                {new Date(activeGoal.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Allocation Summary Cards Grid */}
      {activeGoal.plan?.allocation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Needs Card */}
          <div className="p-5 rounded-3xl border border-muted-foreground/15 bg-card/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-muted-foreground">Kebutuhan Pokok</span>
                <span className="text-[9px] font-medium text-muted-foreground">Pengeluaran Wajib (Needs)</span>
              </div>
              <div className="p-2 bg-violet-500/10 text-violet-600 rounded-xl">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                Rp {activeGoal.plan.allocation.needs.toLocaleString("id-ID")}
              </p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/10 text-violet-600 rounded">
                Alokasi: {Math.round((activeGoal.plan.allocation.needs / (activeGoal.plan.allocation.needs + activeGoal.plan.allocation.wants + activeGoal.plan.allocation.savings)) * 100)}%
              </span>
            </div>
          </div>

          {/* Wants Card */}
          <div className="p-5 rounded-3xl border border-muted-foreground/15 bg-card/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-muted-foreground">Gaya Hidup</span>
                <span className="text-[9px] font-medium text-muted-foreground">Keinginan & Jajan (Wants)</span>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg sm:text-xl font-extrabold text-foreground">
                Rp {activeGoal.plan.allocation.wants.toLocaleString("id-ID")}
              </p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/10 text-amber-600 rounded">
                Alokasi: {Math.round((activeGoal.plan.allocation.wants / (activeGoal.plan.allocation.needs + activeGoal.plan.allocation.wants + activeGoal.plan.allocation.savings)) * 100)}%
              </span>
            </div>
          </div>

          {/* Savings Card */}
          <div className="p-5 rounded-3xl border border-violet-500/20 bg-violet-500/[0.01] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-violet-600">Tabungan Target</span>
                <span className="text-[9px] font-medium text-violet-500">Alokasi Impian (Savings)</span>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <PiggyBank size={16} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg sm:text-xl font-extrabold text-emerald-600">
                Rp {activeGoal.plan.allocation.savings.toLocaleString("id-ID")}
              </p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-600 rounded">
                Alokasi: {Math.round((activeGoal.plan.allocation.savings / (activeGoal.plan.allocation.needs + activeGoal.plan.allocation.wants + activeGoal.plan.allocation.savings)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Quote block */}
      {activeGoal.plan?.allocation?.explanation && (
        <div className="p-4 rounded-2xl bg-card/25 border border-muted-foreground/10 text-xs italic font-medium text-center text-muted-foreground">
          &quot;{activeGoal.plan.allocation.explanation}&quot;
        </div>
      )}

      {/* itemized lists tables */}
      {activeGoal.plan && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Needs List */}
          <div className="p-5 rounded-3xl border border-muted-foreground/15 bg-card/5 space-y-3">
            <span className="text-xs font-bold text-foreground block border-b border-muted-foreground/10 pb-2">
              Rincian Kebutuhan Pokok
            </span>
            <div className="space-y-2">
              {activeGoal.plan.needsItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium">
                  <span className="text-muted-foreground truncate max-w-[170px]">{item.name}</span>
                  <span className="text-foreground shrink-0 font-bold">Rp {item.amount.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wants List */}
          <div className="p-5 rounded-3xl border border-muted-foreground/15 bg-card/5 space-y-3">
            <span className="text-xs font-bold text-foreground block border-b border-muted-foreground/10 pb-2">
              Rincian Gaya Hidup / Jajan
            </span>
            <div className="space-y-2">
              {activeGoal.plan.wantsItems.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic py-2">Tidak ada alokasi jajan tambahan.</p>
              ) : (
                activeGoal.plan.wantsItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-medium">
                    <span className="text-muted-foreground truncate max-w-[170px]">{item.name}</span>
                    <span className="text-foreground shrink-0 font-bold">Rp {item.amount.toLocaleString("id-ID")}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Savings List */}
          <div className="p-5 rounded-3xl border border-violet-500/15 bg-violet-500/[0.01] space-y-3">
            <span className="text-xs font-bold text-violet-600 block border-b border-muted-foreground/10 pb-2">
              Alokasi Tabungan Impian
            </span>
            <div className="space-y-2">
              {activeGoal.plan.savingsItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium">
                  <span className="text-violet-600 truncate max-w-[170px] font-bold">{item.name}</span>
                  <span className="text-emerald-600 font-extrabold shrink-0">Rp {item.amount.toLocaleString("id-ID")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
