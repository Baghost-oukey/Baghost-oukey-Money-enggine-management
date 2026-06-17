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
  // Theme color maps
  const badgeStyles = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }[themeColor];

  const textStyles = {
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
  }[themeColor];

  const focusStyles = {
    violet: "focus-visible:border-violet-500",
    amber: "focus-visible:border-amber-500",
    emerald: "focus-visible:border-emerald-500",
    rose: "focus-visible:border-rose-500",
  }[themeColor];

  const buttonStyles = {
    violet: "hover:border-violet-600 hover:text-violet-600",
    amber: "hover:border-amber-500 hover:text-amber-500",
    emerald: "hover:border-emerald-500 hover:text-emerald-500",
    rose: "hover:border-rose-500 hover:text-rose-500",
  }[themeColor];

  const negoButtonStyles = {
    violet: "bg-violet-600 hover:bg-violet-700 text-white disabled:bg-violet-600/40",
    amber: "bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-600/40",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-emerald-600/40",
    rose: "bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-600/40",
  }[themeColor];

  const itemsSum = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-muted-foreground/15 bg-background/50 space-y-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b pb-2.5 border-muted-foreground/10 gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badgeStyles}`}>
            {badgeText}
          </span>
          <h4 className="text-sm sm:text-base font-black text-foreground">{title} ({Math.round(percentage)}%)</h4>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground font-semibold block leading-none mb-0.5">Jatah Anggaran</span>
          <div className={`text-base font-black ${textStyles} leading-none`}>
            Rp {targetAmount.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <p className="text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="space-y-1 pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2.5 items-center py-1 hover:bg-muted/10 px-2 rounded-lg transition-all duration-150 group">
            <Input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateItem(categoryKey, idx, "name", e.target.value)}
              className={`h-8 text-xs font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/20 focus-visible:ring-0 p-0.5 flex-1 rounded-md px-1 text-foreground ${focusStyles}`}
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
                className={`h-8 text-xs font-bold bg-transparent border-b border-transparent hover:border-muted-foreground/20 focus-visible:ring-0 p-0.5 w-24 sm:w-28 text-right rounded-md px-1 text-foreground ${focusStyles}`}
              />
            </div>
            <button
              onClick={() => onDeleteItem(categoryKey, idx)}
              className="p-1 rounded-md text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
              title="Hapus"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-5 text-center text-xs text-muted-foreground italic">
            Belum ada daftar pengeluaran.
          </div>
        )}
      </div>

      <div className="pt-3.5 border-t border-muted-foreground/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="text-muted-foreground">
              Total: <strong className="text-foreground">Rp {itemsSum.toLocaleString("id-ID")}</strong>
            </span>
            
            <div className="px-2 py-0.5 rounded-lg bg-background/50 border text-[11px]">
              {itemsSum < targetAmount ? (
                <span className={`flex items-center gap-1 ${textStyles}`}>
                  <Coins size={12} /> Sisa: Rp {(targetAmount - itemsSum).toLocaleString("id-ID")}
                </span>
              ) : itemsSum === targetAmount ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Anggaran Pas
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={12} /> Lebih: Rp {(itemsSum - targetAmount).toLocaleString("id-ID")}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
            {onNegotiate && (
              <Button
                disabled={isNegotiating}
                onClick={() => onNegotiate(categoryKey)}
                className={`w-auto text-[11px] font-bold h-8.5 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm hover:scale-[1.01] ${negoButtonStyles}`}
              >
                <Sparkles size={12} className={isNegotiating ? "animate-spin" : "animate-pulse"} />
                {isNegotiating ? "Nego..." : "Nego dengan AI"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onAddItem(categoryKey)}
              className={`w-auto text-[11px] font-bold h-8.5 px-3.5 rounded-xl border-dashed border-muted-foreground/30 transition-all flex items-center justify-center gap-1 cursor-pointer ${buttonStyles}`}
            >
              <Plus size={13} /> Tambah Item
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
