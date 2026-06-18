import React from "react";
import {
  Target,
  CalendarDays,
  FileText,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  description: string;
  amount: number;
}

interface BudgetSummaryPreviewProps {
  budget: string;
  target: string;
  targetValue: string;
  targetDate?: string;
  jenisTarget?: string;
  keteranganTambahan?: string;
  expenses: Expense[];
}

export function BudgetSummaryPreview({
  budget,
  target,
  targetValue,
  targetDate,
  jenisTarget,
  keteranganTambahan,
  expenses,
}: BudgetSummaryPreviewProps) {
  // Live local keyword detection for preview
  const detectSumberDana = (text: string): string => {
    if (!text) return "Nabung Cash";
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("judi") ||
      lowerText.includes("slot") ||
      lowerText.includes("gacor") ||
      lowerText.includes("jp") ||
      lowerText.includes("maxwin") ||
      lowerText.includes("taruhan") ||
      lowerText.includes("depo") ||
      lowerText.includes("zeus") ||
      lowerText.includes("spekulasi")
    ) {
      return "Hasil Judi / Spekulasi";
    }
    if (
      lowerText.includes("pinjol") ||
      lowerText.includes("pinjam online") ||
      lowerText.includes("cair cepat") ||
      lowerText.includes("dana cepat") ||
      lowerText.includes("easycash") ||
      lowerText.includes("kredivo") ||
      lowerText.includes("adakami") ||
      lowerText.includes("rupiah cepat")
    ) {
      return "Pinjaman Online";
    }
    if (
      lowerText.includes("paylater") ||
      lowerText.includes("spaylater") ||
      lowerText.includes("gopaylater") ||
      lowerText.includes("cicil") ||
      lowerText.includes("kredit") ||
      lowerText.includes("cc") ||
      lowerText.includes("kartu kredit") ||
      lowerText.includes("tempo")
    ) {
      return "Paylater/Kredit";
    }
    if (
      lowerText.includes("tabungan") ||
      lowerText.includes("dana cadangan") ||
      lowerText.includes("simpanan") ||
      lowerText.includes("aktif") ||
      lowerText.includes("emas") ||
      lowerText.includes("celengan")
    ) {
      return "Dana Cadangan";
    }
    return "Nabung Cash";
  };

  const sDana = keteranganTambahan ? detectSumberDana(keteranganTambahan) : undefined;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetNum = Number(budget || 0);
  const remainingBudget = budgetNum - totalExpenses;

  // Calculate percent spent cleanly
  const percentSpent = budgetNum > 0 ? Math.min(100, (totalExpenses / budgetNum) * 100) : 0;
  const isDeficit = remainingBudget < 0;

  return (
    <div className="rounded-2xl border p-5 sm:p-6 shadow-md space-y-6 flex flex-col justify-between h-full min-h-[480px]">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-muted/20">
          <h2 className="text-lg font-semibold">
            Ringkasan Rencana <span className="text-violet-600 hover:text-violet-500">Finansial</span>
          </h2>
          <p className="text-xs font-light mt-0.5 leading-relaxed">
            Visualisasi alokasi pengeluaran dan kelayakan target bulanan kamu.
          </p>
        </div>

        {/* Financial Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Budget Bulanan */}
          <div className="p-4 rounded-xl bg-muted/10 border flex flex-col justify-between shadow-sm">
            <p className="text-[10px] font-light uppercase">
              <span className="text-violet-600 font-bold">Budget</span> Bulanan</p>
            <span className="text-lg font-extrabold text-foreground mt-2">
              Rp {budgetNum.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Sisa Anggaran */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between shadow-sm transition-colors duration-300",
          )}>
            <p className="text-[10px] font-light uppercase">
              Sisa <span className="text-violet-600 font-bold">Anggaran</span>
            </p>
            <span className="text-lg font-extrabold mt-2">
              Rp {remainingBudget.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Target Goals Card */}
        <div className="p-4 rounded-xl border space-y-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase border-b pb-2">
            Rencana Target Kamu
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            {/* Row 1: Target name and Date */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex flex-col">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Tujuan Target:</p>
                <p className="font-semibold text-sm mt-0.5 truncate max-w-[200px] sm:max-w-[240px]">
                  {target || <span className="text-muted-foreground/50 font-normal italic">Belum ditentukan</span>}
                </p>
              </div>

              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold bg-card px-2.5 py-1.5 rounded-lg border shadow-sm leading-none shrink-0",
                targetDate ? "text-rose-500 border-rose-500/15 bg-rose-500/[0.02]" : "text-muted-foreground/60 border-muted/30"
              )}>
                <CalendarDays size={12} className={targetDate ? "text-rose-500" : "text-muted-foreground/60"} />
                {targetDate ? (
                  new Date(targetDate).toLocaleDateString("id-ID", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                ) : (
                  <p className="italic font-normal">Belum diset</p>
                )}
              </div>
            </div>

            {/* Row 2: Target Value and Category Badge */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Nilai Target:</p>
                <p className="font-extrabold text-base text-foreground mt-0.5">
                  {targetValue ? `Rp ${Number(targetValue).toLocaleString("id-ID")}` : <span className="text-muted-foreground/50 font-normal italic text-sm">Rp 0</span>}
                </p>
              </div>

              {jenisTarget && (
                <span className={cn(
                  "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm tracking-wide uppercase shrink-0",
                  jenisTarget === "Kebutuhan"
                    ? "bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                )}>
                  {jenisTarget === "Kebutuhan" ? "💼 Kebutuhan" : "⭐ Keinginan"}
                </span>
              )}
            </div>


          </div>
        </div>


      </div>

      {/* Aesthetic clean subtle bottom note */}
      <div className="text-[10px] leading-relaxed text-center border-t">
        <p className="text-xs font-light"> Catatan : Tekan <strong className="text-foreground font-bold">Analisis Sekarang</strong> di sebelah kiri untuk evaluasi AI secara instan.</p>
      </div>
    </div>
  );
}