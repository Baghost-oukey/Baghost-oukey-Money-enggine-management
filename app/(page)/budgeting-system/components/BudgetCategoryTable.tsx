import React from "react";
import { Trash2, Plus, Coins, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BudgetItem {
  name: string;
  amount: number;
}

interface BudgetCategoryTableProps {
  categoryKey: "needs" | "wants" | "savings" | "debts";
  title: string;
  percentage: number;
  targetAmount: number;
  description: string;
  items: BudgetItem[];
  badgeText: string;
  themeColor: "violet" | "amber" | "emerald" | "rose";
  isNegotiating?: boolean;
  onNegotiate?: (category: "needs" | "wants" | "savings" | "debts") => void;
  onUpdateItem: (
    category: "needs" | "wants" | "savings" | "debts",
    index: number,
    field: keyof BudgetItem,
    value: string | number
  ) => void;
  onAddItem: (category: "needs" | "wants" | "savings" | "debts") => void;
  onDeleteItem: (category: "needs" | "wants" | "savings" | "debts", index: number) => void;
}

export function BudgetCategoryTable({
  categoryKey,
  title,
  percentage,
  targetAmount,
  description,
  items,
  badgeText,
  themeColor,
  isNegotiating = false,
  onNegotiate,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: BudgetCategoryTableProps) {
  // Theme styling configurations
  const cardBorderStyles = {
    violet: "border-violet-500/20 hover:border-violet-500/40 hover:shadow-[0_12px_40px_rgba(124,58,237,0.04)] dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.08)]",
    amber: "border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_12px_40px_rgba(245,158,11,0.04)] dark:hover:shadow-[0_12px_40px_rgba(245,158,11,0.08)]",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_12px_40px_rgba(16,185,129,0.04)] dark:hover:shadow-[0_12px_40px_rgba(16,185,129,0.08)]",
    rose: "border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_12px_40px_rgba(244,63,94,0.04)] dark:hover:shadow-[0_12px_40px_rgba(244,63,94,0.08)]",
  }[themeColor];

  const badgeStyles = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/10",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10",
  }[themeColor];

  const textStyles = {
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
  }[themeColor];

  const focusStyles = {
    violet: "focus-visible:border-violet-500/80",
    amber: "focus-visible:border-amber-500/80",
    emerald: "focus-visible:border-emerald-500/80",
    rose: "focus-visible:border-rose-500/80",
  }[themeColor];

  const buttonStyles = {
    violet: "hover:border-violet-600 hover:text-violet-600 hover:bg-violet-500/5",
    amber: "hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/5",
    emerald: "hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/5",
    rose: "hover:border-rose-500 hover:text-rose-500 hover:bg-rose-500/5",
  }[themeColor];

  const negoButtonStyles = {
    violet: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/10 hover:shadow-violet-500/20",
    amber: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/10 hover:shadow-amber-500/20",
    emerald: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20",
    rose: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-rose-500/10 hover:shadow-rose-500/20",
  }[themeColor];

  const itemsSum = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border bg-card/45 backdrop-blur-md space-y-4 shadow-sm transition-all duration-300 ${cardBorderStyles}`}>
      <div className="flex flex-wrap items-center justify-between border-b pb-3 border-muted-foreground/10 gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeStyles}`}>
            {badgeText}
          </span>
          <h4 className="text-sm sm:text-base font-black text-foreground">{title} ({Math.round(percentage)}%)</h4>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground font-semibold block leading-none mb-0.5">Jatah Anggaran</span>
          <div className={`text-base font-black tracking-tight ${textStyles} leading-none`}>
            Rp {targetAmount.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="space-y-1 pr-1 max-h-[300px] overflow-y-auto custom-scrollbar">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2.5 items-center py-1 hover:bg-muted/15 px-2 rounded-xl transition-all duration-200 group">
            <Input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateItem(categoryKey, idx, "name", e.target.value)}
              className={`h-8 text-xs font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/10 focus-visible:ring-0 p-0.5 flex-1 rounded-md px-1 text-foreground transition-all duration-200 ${focusStyles}`}
              placeholder="Nama pengeluaran..."
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground">Rp</span>
              <Input
                type="text"
                value={new Intl.NumberFormat("id-ID").format(item.amount)}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^\d]/g, "");
                  onUpdateItem(categoryKey, idx, "amount", Number(clean) || 0);
                }}
                className={`h-8 text-xs font-bold bg-transparent border-b border-transparent hover:border-muted-foreground/10 focus-visible:ring-0 p-0.5 w-24 sm:w-28 text-right rounded-md px-1 text-foreground transition-all duration-200 ${focusStyles}`}
              />
            </div>
            <button
              onClick={() => onDeleteItem(categoryKey, idx)}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 opacity-70 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
              title="Hapus"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground/60 italic">
            Belum ada daftar pengeluaran.
          </div>
        )}
      </div>

      <div className="pt-3.5 border-t border-muted-foreground/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-muted-foreground">
              Total Pos: <strong className="text-foreground font-bold">Rp {itemsSum.toLocaleString("id-ID")}</strong>
            </span>
            
            <div className="px-2.5 py-0.5 rounded-full bg-background/50 border border-muted-foreground/10 text-[10px] font-bold">
              {itemsSum < targetAmount ? (
                <span className={`flex items-center gap-1 ${textStyles}`}>
                  <Coins size={11} /> Sisa: Rp {(targetAmount - itemsSum).toLocaleString("id-ID")}
                </span>
              ) : itemsSum === targetAmount ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Anggaran Pas
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={11} /> Lebih: Rp {(itemsSum - targetAmount).toLocaleString("id-ID")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
            {onNegotiate && (
              <Button
                disabled={isNegotiating}
                onClick={() => onNegotiate(categoryKey)}
                className={`w-auto text-[11px] font-extrabold h-8.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] ${negoButtonStyles}`}
              >
                <Sparkles size={11} className={isNegotiating ? "animate-spin" : "animate-pulse"} />
                {isNegotiating ? "Nego..." : "Nego dengan AI"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onAddItem(categoryKey)}
              className={`w-auto text-[11px] font-extrabold h-8.5 px-4 rounded-xl border-dashed border-muted-foreground/20 bg-background/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${buttonStyles}`}
            >
              <Plus size={12} /> Tambah Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
