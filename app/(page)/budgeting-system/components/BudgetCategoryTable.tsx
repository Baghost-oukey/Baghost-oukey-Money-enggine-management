import React from "react";
import { Trash2, Plus, Coins, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BudgetItem {
  name: string;
  amount: number;
}

interface BudgetCategoryTableProps {
  categoryKey: "needs" | "wants" | "savings";
  title: string;
  percentage: number;
  targetAmount: number;
  description: string;
  items: BudgetItem[];
  badgeText: string;
  themeColor: "violet" | "amber" | "emerald";
  onUpdateItem: (
    category: "needs" | "wants" | "savings",
    index: number,
    field: keyof BudgetItem,
    value: string | number
  ) => void;
  onAddItem: (category: "needs" | "wants" | "savings") => void;
  onDeleteItem: (category: "needs" | "wants" | "savings", index: number) => void;
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
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: BudgetCategoryTableProps) {
  // Theme color maps
  const badgeStyles = {
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[themeColor];

  const textStyles = {
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  }[themeColor];

  const focusStyles = {
    violet: "focus-visible:border-violet-500",
    amber: "focus-visible:border-amber-500",
    emerald: "focus-visible:border-emerald-500",
  }[themeColor];

  const buttonStyles = {
    violet: "hover:border-violet-600 hover:text-violet-600",
    amber: "hover:border-amber-500 hover:text-amber-500",
    emerald: "hover:border-emerald-500 hover:text-emerald-500",
  }[themeColor];

  const itemsSum = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 rounded-3xl border border-muted-foreground/15 bg-background/50 space-y-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between border-b pb-4 border-muted-foreground/10 gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeStyles}`}>
            {badgeText}
          </span>
          <h4 className="text-lg font-black text-foreground">{title} ({percentage}%)</h4>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground font-semibold">Jatah Anggaran</span>
          <div className={`text-lg font-black ${textStyles}`}>
            Rp {targetAmount.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="space-y-1.5 pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-center py-2.5 border-b border-dashed border-muted-foreground/15 hover:bg-muted/10 px-3 rounded-xl transition-all duration-150 group">
            <Input
              type="text"
              value={item.name}
              onChange={(e) => onUpdateItem(categoryKey, idx, "name", e.target.value)}
              className={`h-10 text-sm font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus-visible:ring-0 p-0.5 flex-1 rounded-md px-1 text-foreground ${focusStyles}`}
              placeholder="Nama pengeluaran..."
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="text-xs font-bold text-muted-foreground">Rp</span>
              <Input
                type="text"
                value={new Intl.NumberFormat("id-ID").format(item.amount)}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^\d]/g, "");
                  onUpdateItem(categoryKey, idx, "amount", Number(clean) || 0);
                }}
                className={`h-10 text-sm font-bold bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus-visible:ring-0 p-0.5 w-32 text-right rounded-md px-1 text-foreground ${focusStyles}`}
              />
            </div>
            <button
              onClick={() => onDeleteItem(categoryKey, idx)}
              className="p-1.5 rounded-lg text-muted-foreground/75 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer shrink-0"
              title="Hapus"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground italic">
            Belum ada daftar pengeluaran.
          </div>
        )}
      </div>

      <div className="pt-5 border-t border-muted-foreground/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            <span className="text-muted-foreground">
              Total Terpakai: <strong className="text-foreground">Rp {itemsSum.toLocaleString("id-ID")}</strong>
            </span>
            
            <div className="px-3 py-1 rounded-xl bg-background/50 border">
              {itemsSum < targetAmount ? (
                <span className={`flex items-center gap-1.5 ${textStyles}`}>
                  <Coins size={14} /> Sisa jatah: Rp {(targetAmount - itemsSum).toLocaleString("id-ID")}
                </span>
              ) : itemsSum === targetAmount ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> ✓ Anggaran Pas
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Kelebihan: Rp {(itemsSum - targetAmount).toLocaleString("id-ID")}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => onAddItem(categoryKey)}
            className={`w-full sm:w-auto text-xs font-bold h-10 rounded-xl border-dashed border-muted-foreground/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${buttonStyles}`}
          >
            <Plus size={15} /> Tambah Item Baru
          </Button>
        </div>
      </div>
    </div>
  );
}
