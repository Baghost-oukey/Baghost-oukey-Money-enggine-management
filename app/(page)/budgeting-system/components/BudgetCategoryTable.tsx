import React from "react";
import { Trash2, Plus, Coins, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetCategoryCritiquePanel } from "./BudgetCategoryCritiquePanel";

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

  // Critique props
  showCritiquePanel?: boolean;
  isCritiqueExpanded?: boolean;
  onToggleCritique?: () => void;
  changedItems?: {
    name: string;
    categoryName: string;
    oldAmount: number;
    newAmount: number;
    difference: number;
    isCritical: boolean;
    description: string;
    critique: string;
    shortCritique: string;
  }[];
  selectedChangeIndex?: number;
  onChangeSelectedChangeIndex?: (idx: number) => void;
  onUseExisting?: () => void;
  onForceContinue?: () => void;
  aiSummary?: string;
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
  showCritiquePanel = false,
  isCritiqueExpanded = true,
  onToggleCritique,
  changedItems = [],
  selectedChangeIndex = 0,
  onChangeSelectedChangeIndex,
  onUseExisting,
  onForceContinue,
  aiSummary,
}: BudgetCategoryTableProps) {
  // Theme styling configurations
  const cardBorderStyles = {
    violet: "border-muted-foreground/15 dark:border-muted-foreground/10 hover:border-zinc-400 dark:hover:border-zinc-600",
    amber: "border-muted-foreground/15 dark:border-muted-foreground/10 hover:border-zinc-400 dark:hover:border-zinc-600",
    emerald: "border-muted-foreground/15 dark:border-muted-foreground/10 hover:border-zinc-400 dark:hover:border-zinc-600",
    rose: "border-rose-500/20 hover:border-rose-500/40",
  }[themeColor];

  const badgeStyles = {
    violet: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
    amber: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
    emerald: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10",
  }[themeColor];

  const textStyles = {
    violet: "text-zinc-800 dark:text-zinc-200",
    amber: "text-zinc-800 dark:text-zinc-200",
    emerald: "text-zinc-800 dark:text-zinc-200",
    rose: "text-rose-600 dark:text-rose-400",
  }[themeColor];

  const focusStyles = {
    violet: "focus-visible:border-zinc-500/80",
    amber: "focus-visible:border-zinc-500/80",
    emerald: "focus-visible:border-zinc-500/80",
    rose: "focus-visible:border-rose-500/80",
  }[themeColor];

  const buttonStyles = {
    violet: "hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-500/5",
    amber: "hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-500/5",
    emerald: "hover:border-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-500/5",
    rose: "hover:border-rose-500 hover:text-rose-500 hover:bg-rose-500/5",
  }[themeColor];

  const negoButtonStyles = {
    violet: "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm",
    amber: "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm",
    emerald: "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm",
    rose: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-rose-500/10 hover:shadow-rose-500/20",
  }[themeColor];

  const itemsSum = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border bg-card/45 backdrop-blur-md space-y-4 shadow-sm transition-all duration-300 ${cardBorderStyles}`}>
      <div className="flex flex-wrap items-center justify-between border-b pb-3 border-muted-foreground/10 gap-3">
        <div className="flex items-center gap-2">
          <small className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeStyles}`}>
            {badgeText}
          </small>
          <h4 className="text-sm sm:text-base font-black text-foreground">{title} ({Math.round(percentage)}%)</h4>
        </div>
        <div className="text-right">
          <small className="text-[10px] text-muted-foreground font-semibold block leading-none mb-0.5">Jatah Anggaran</small>
          <p className={`text-base font-black tracking-tight ${textStyles} leading-none`}>
            Rp {targetAmount.toLocaleString("id-ID")}
          </p>
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
          <p className="py-6 text-center text-xs text-muted-foreground/60 italic">
            Belum ada daftar pengeluaran.
          </p>
        )}
      </div>

      <div className="pt-3.5 border-t border-muted-foreground/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <p className="text-muted-foreground">
              Total Pos: <strong className="text-foreground font-bold">Rp {itemsSum.toLocaleString("id-ID")}</strong>
            </p>
            
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
              showCritiquePanel 
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 cursor-pointer" 
                : "bg-background/50 border border-muted-foreground/10"
            }`}>
              {showCritiquePanel ? (
                <button
                  onClick={onToggleCritique}
                  className="flex items-center gap-1 font-extrabold cursor-pointer outline-none focus:outline-none w-full text-left"
                >
                  <AlertTriangle size={11} className="animate-pulse shrink-0 text-rose-500" />
                  <span>Evaluasi AI: Butuh Konfirmasi {isCritiqueExpanded ? "▲" : "▼"}</span>
                </button>
              ) : itemsSum < targetAmount ? (
                <small className={`flex items-center gap-1 font-bold ${textStyles}`}>
                  <Coins size={11} /> Sisa: Rp {(targetAmount - itemsSum).toLocaleString("id-ID")}
                </small>
              ) : itemsSum === targetAmount ? (
                <small className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={11} /> Anggaran Pas
                </small>
              ) : (
                <small className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold">
                  <AlertTriangle size={11} /> Lebih: Rp {(itemsSum - targetAmount).toLocaleString("id-ID")}
                </small>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
            {onNegotiate && (
              <Button
                disabled={isNegotiating}
                onClick={() => onNegotiate(categoryKey)}
                className={`w-auto text-[11px] font-extrabold h-8.5 px-4 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all duration-200 ${negoButtonStyles}`}
              >
                <Sparkles size={11} className={isNegotiating ? "animate-spin" : ""} />
                {isNegotiating ? "Mengoptimalkan..." : "Optimalkan"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onAddItem(categoryKey)}
              className={`w-auto text-[11px] font-extrabold h-8.5 px-4 rounded-xl border-dashed border-muted-foreground/20 bg-background/20 flex items-center justify-center gap-1 cursor-pointer transition-all duration-200 ${buttonStyles}`}
            >
              <Plus size={12} /> Tambah Item
            </Button>
          </div>
        </div>
      </div>

      {/* Collapsible AI Critique Panel inside the Category Container Card */}
      {showCritiquePanel && isCritiqueExpanded && (
        <BudgetCategoryCritiquePanel
          changedItems={changedItems}
          selectedChangeIndex={selectedChangeIndex}
          onChangeSelectedChangeIndex={onChangeSelectedChangeIndex}
          onUseExisting={onUseExisting}
          onForceContinue={onForceContinue}
          aiSummary={aiSummary}
        />
      )}
    </div>
  );
}
