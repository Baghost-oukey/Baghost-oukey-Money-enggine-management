import React from "react";
import { Button } from "@/components/ui/button";

interface ChangedItem {
  name: string;
  categoryName: string;
  oldAmount: number;
  newAmount: number;
  difference: number;
  isCritical: boolean;
  description: string;
  critique: string;
  shortCritique: string;
}

interface BudgetCategoryCritiquePanelProps {
  changedItems: ChangedItem[];
  selectedChangeIndex: number;
  onChangeSelectedChangeIndex?: (idx: number) => void;
  onUseExisting?: () => void;
  onForceContinue?: () => void;
  aiSummary?: string;
}

export function BudgetCategoryCritiquePanel({
  changedItems,
  selectedChangeIndex,
  onChangeSelectedChangeIndex,
  onUseExisting,
  onForceContinue,
  aiSummary,
}: BudgetCategoryCritiquePanelProps) {
  return (
    <div className="mt-4 pt-4 border-t border-rose-500/10 space-y-4 animate-fadeIn duration-200 text-left">
      <p className="text-[11px] font-semibold text-muted-foreground leading-relaxed">
        Ada beberapa penyesuaian anggaran yang perlu kamu pertimbangkan kembali demi kesehatan finansialmu.
      </p>

      {/* Selection Box Dropdown & Details Card */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase text-muted-foreground tracking-wider block">Pilih Analisis & Alasan Kritis</label>
          <select
            value={selectedChangeIndex}
            onChange={(e) => onChangeSelectedChangeIndex?.(Number(e.target.value))}
            className="w-full text-xs font-bold bg-background text-foreground border border-muted-foreground/15 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer shadow-sm transition-all"
          >
            {changedItems.map((change, idx) => (
              <option key={idx} value={idx}>
                {change.isCritical ? "⚠️ Kritik: " : "💡 Saran: "} {change.shortCritique}
              </option>
            ))}
          </select>
        </div>

        {(() => {
          if (changedItems.length === 0) {
            return (
              <p className="p-3.5 rounded-2xl bg-muted/30 border border-muted-foreground/10 text-[11px] text-muted-foreground leading-relaxed">
                "{aiSummary}"
              </p>
            );
          }

          const selectedChange = changedItems[selectedChangeIndex >= changedItems.length ? 0 : selectedChangeIndex];
          if (!selectedChange) return null;

          return (
            <div className="p-3.5 rounded-2xl bg-card border border-muted-foreground/10 space-y-3 shadow-inner">
              <div className="flex justify-between items-center border-b pb-2 border-muted-foreground/5 gap-2">
                <h5 className="text-[11px] font-black text-foreground truncate">{selectedChange.name}</h5>
                <small className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                  selectedChange.difference > 0 
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/10' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10'
                }`}>
                  Rp {selectedChange.oldAmount.toLocaleString("id-ID")} ➔ Rp {selectedChange.newAmount.toLocaleString("id-ID")}
                </small>
              </div>
              
              <div className="space-y-2.5 text-xs">
                <div>
                  <h6 className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Deskripsi Pos</h6>
                  <p className="text-foreground font-semibold leading-relaxed mt-0.5">{selectedChange.description}</p>
                </div>
                <div>
                  <h6 className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Alasan Kritis & Pertimbangan</h6>
                  <p className={`p-3 rounded-xl border mt-1 font-bold leading-relaxed shadow-sm ${
                    selectedChange.isCritical 
                      ? 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400' 
                      : 'bg-zinc-500/5 border-zinc-500/15 text-zinc-700 dark:text-zinc-300'
                  }`}>
                    {selectedChange.critique}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-1 justify-end">
        <Button
          variant="outline"
          onClick={onUseExisting}
          className="h-8.5 text-[11px] px-4 rounded-xl border border-muted-foreground/20 font-bold hover:bg-muted cursor-pointer transition-all"
        >
          Tetap
        </Button>
        <Button
          onClick={onForceContinue}
          className="h-8.5 text-[11px] px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold cursor-pointer transition-all shadow-md"
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
}
