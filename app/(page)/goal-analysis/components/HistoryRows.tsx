import React from "react";
import { ShoppingBag, Clock, ChevronRight } from "lucide-react";

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

interface HistoryRowsProps {
  goals: GoalItem[];
  onSelectGoal: (goal: GoalItem) => void;
}

export function HistoryRows({ goals, onSelectGoal }: HistoryRowsProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-muted-foreground/25 rounded-3xl bg-card/10 max-w-xl mx-auto">
        <ShoppingBag size={32} className="mx-auto text-muted-foreground opacity-50 mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Belum ada riwayat rencana anggaran aktif.</p>
        <p className="text-xs text-muted-foreground/75 mt-2 max-w-sm mx-auto px-4">
          Silakan buka menu analisis keputusan belanja, tentukan barang impianmu, lalu susun rencana menabung untuk memunculkan target anggaran di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {goals.map((g) => (
        <div
          key={g.id}
          onClick={() => onSelectGoal(g)}
          className="group p-5 rounded-2xl border border-muted-foreground/15 bg-card/10 hover:bg-card/15 hover:border-violet-500/30 transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden grid grid-cols-1 md:grid-cols-12 items-start md:items-center gap-4"
        >
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-gradient-to-bl from-violet-600/[0.02] to-transparent rounded-full blur-[40px] pointer-events-none" />
          
          {/* Col 1: Icon & Target Name (4 cols) */}
          <div className="flex items-center gap-4 md:col-span-4 min-w-0">
            <div className="p-3 bg-violet-500/10 text-violet-600 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag size={18} />
            </div>
            <div className="space-y-1 truncate">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                {g.title}
              </h3>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium leading-none">
                <Clock size={11} />
                Dibuat {new Date(g.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Col 2: Harga Target (2 cols) */}
          <div className="flex flex-col text-left md:col-span-2 space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Harga Target</span>
            <span className="text-sm font-semibold text-foreground">
              Rp {g.targetAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Col 3: Tabungan Bulanan (2 cols) */}
          <div className="flex flex-col text-left md:col-span-2 space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tabungan Bulanan</span>
            {g.plan?.allocation ? (
              <span className="text-sm font-bold text-rose-500">
                Rp {g.plan.allocation.savings.toLocaleString("id-ID")}/bln
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">-</span>
            )}
          </div>

          {/* Col 4: Target Waktu (2 cols) */}
          <div className="flex flex-col text-left md:col-span-2 space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Target Waktu</span>
            <span className="text-sm font-semibold text-foreground">
              {g.targetDate 
                ? new Date(g.targetDate).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) 
                : "Tidak Ditentukan"
              }
            </span>
          </div>

          {/* Col 5: Action Link (2 cols) */}
          <div className="flex md:justify-end items-center md:col-span-2 shrink-0">
            <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:gap-1.5 transition-all">
              Lihat Anggaran <ChevronRight size={14} className="shrink-0" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
