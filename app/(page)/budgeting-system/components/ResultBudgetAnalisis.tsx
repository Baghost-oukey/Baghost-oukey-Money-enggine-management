import React from "react";
import { Sparkles, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BudgetItem {
  name: string;
  amount: number;
}

interface AllocationDetails {
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

interface RecommendationData {
  needs: AllocationDetails;
  wants: AllocationDetails;
  savings: AllocationDetails;
  aiSummary: string;
  frameworkUsed: string;
}

interface ResultBudgetAnalisisProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyBudget: number;
  recommendation: RecommendationData | null;
}

export default function ResultBudgetAnalisis({
  isOpen,
  onClose,
  monthlyBudget,
  recommendation,
}: ResultBudgetAnalisisProps) {
  if (!recommendation) return null;

  const { needs, wants, savings, aiSummary, frameworkUsed } = recommendation;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialogContent 
        noBlur 
        size="lg"
        className="p-5 sm:p-7 rounded-3xl border bg-card/95 shadow-2xl duration-200 transition-all outline-none w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header section with Close button */}
        <div className="flex items-start justify-between border-b border-muted/50 pb-4 relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <Sparkles size={11} className="animate-pulse" />
                {frameworkUsed}
              </span>
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground mt-1">
              Hasil Analisis Alokasi Anggaran
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Rekomendasi alokasi pendapatan ideal bulanan kamu berdasarkan analisis AI.
            </AlertDialogDescription>
          </div>
          
          <button 
            onClick={onClose} 
            className="absolute top-0 right-0 p-1.5 rounded-lg border hover:bg-muted/80 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal content body */}
        <div className="space-y-6 py-5 text-left">
          
          {/* Income summary header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-muted/40">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Gaji Masuk:</span>
            <span className="text-lg font-black text-foreground">
              Rp {Number(monthlyBudget).toLocaleString("id-ID")}
            </span>
          </div>

          {/* Stacked allocation bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
              <span>Alokasi Kategori:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                  <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                  Needs ({needs.percentage}%)
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  Wants ({wants.percentage}%)
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Savings ({savings.percentage}%)
                </span>
              </div>
            </div>
            
            <div className="w-full h-3.5 rounded-full flex overflow-hidden bg-muted border border-muted/30">
              <div className="h-full bg-violet-600" style={{ width: `${needs.percentage}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${wants.percentage}%` }} />
              <div className="h-full bg-emerald-500" style={{ width: `${savings.percentage}%` }} />
            </div>
          </div>

          {/* AI Summary Alert Box */}
          <div className="p-4 rounded-xl bg-violet-600/[0.03] border border-violet-500/15">
            <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
              💡 Saran Taktis AI
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground italic font-medium mt-1">
              "{aiSummary}"
            </p>
          </div>

          {/* Pos cards layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Needs card */}
            <div className="p-4 rounded-xl border bg-background/50 border-l-4 border-l-violet-600 border-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Kebutuhan</span>
                <span className="text-sm font-black text-violet-600 dark:text-violet-400">{needs.percentage}%</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                Rp {needs.amount.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {needs.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-muted/40">
                {needs.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-[11px] text-muted-foreground py-0.5">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-violet-600 shrink-0" />
                      {item.name}
                    </span>
                    <span className="font-bold text-foreground">Rp {item.amount.toLocaleString("id-ID")}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Wants card */}
            <div className="p-4 rounded-xl border bg-background/50 border-l-4 border-l-amber-500 border-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Keinginan</span>
                <span className="text-sm font-black text-amber-500">{wants.percentage}%</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                Rp {wants.amount.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {wants.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-muted/40">
                {wants.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-[11px] text-muted-foreground py-0.5">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-amber-500 shrink-0" />
                      {item.name}
                    </span>
                    <span className="font-bold text-foreground">Rp {item.amount.toLocaleString("id-ID")}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Savings card */}
            <div className="p-4 rounded-xl border bg-background/50 border-l-4 border-l-emerald-500 border-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tabungan</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{savings.percentage}%</span>
              </div>
              <div className="text-base font-extrabold text-foreground">
                Rp {savings.amount.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {savings.description}
              </p>
              <ul className="space-y-1.5 pt-2 border-t border-muted/40">
                {savings.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between text-[11px] text-muted-foreground py-0.5">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      {item.name}
                    </span>
                    <span className="font-bold text-foreground">Rp {item.amount.toLocaleString("id-ID")}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Modal footer actions */}
        <AlertDialogFooter className="border-t border-muted/50 pt-4 flex sm:justify-end">
          <Button 
            onClick={onClose} 
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-6 h-10 cursor-pointer shadow-md"
          >
            Selesai
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
