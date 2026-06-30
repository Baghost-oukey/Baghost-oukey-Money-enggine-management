"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Scale,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaylaterPlan {
  tenor: number;
  monthlyInstallment: number;
  totalPrice: number;
  interestAmount: number;
  adminFee: number;
  moneyWasted: number;
}

interface SimulationResult {
  category: "KREDIT_BANK" | "PAYLATER" | "KREDIT_TOKO";
  name: string;
  tenor: number;
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  totalExtraFees: number;
  costVariance: number;
  costVariancePct: number;
  installmentRatio: number;
  riskLevel: string;
  capacityClass: string;
  pros: string[];
  cons: string[];
}

interface SimulasiNabungVsPaylaterProps {
  decisionId: string;
  targetValue: string;
  remainingBudget: number;
  monthlyBudget: number;
  hideSavingsTimeline?: boolean;
}

export function SimulasiNabungVsPaylater({
  decisionId,
  targetValue,
  remainingBudget,
  monthlyBudget,
  hideSavingsTimeline = false,
}: SimulasiNabungVsPaylaterProps) {
  const [loading, setLoading] = useState(true);
  const [consequencesNote, setConsequencesNote] = useState("");
  const [financingOptions, setFinancingOptions] = useState<SimulationResult[]>([]);
  const [selectedTenor, setSelectedTenor] = useState<3 | 6 | 12>(6);

  const [expandedIndices, setExpandedIndices] = useState<Record<number, boolean>>({});
  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    let isMounted = true;
    async function loadSimulation() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/simulasi?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setConsequencesNote(json.data.consequencesNote || "");
          setFinancingOptions(json.data.financingOptions || []);
        }
      } catch (err) {
        console.error("Failed to load paylater simulation:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSimulation();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  const filteredOptions = financingOptions.filter((opt) => opt.tenor === selectedTenor);

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2 w-full">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          <p className="text-xs text-muted-foreground">Lagi menghitung rencana cicilan...</p>
        </div>
      ) : (
        <div className={cn("w-full flex flex-col space-y-5", !hideSavingsTimeline && "p-5 rounded-3xl border bg-card/15 backdrop-blur-sm")}>
          <div className="space-y-4">
            {/* Tenor selector row */}
            <div className="flex items-center gap-2 mt-3 bg-muted/20 p-1.5 rounded-xl w-fit">
              <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider pl-2 pr-2.5">Tenor Pilihan:</span>
              {([3, 6, 12] as const).map((tenorVal) => {
                const isActive = selectedTenor === tenorVal;
                return (
                  <button
                    key={tenorVal}
                    onClick={() => {
                      setSelectedTenor(tenorVal);
                    }}
                    type="button"
                    className={cn(
                      "text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold select-none",
                      isActive
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {tenorVal} Bulan
                  </button>
                );
              })}
            </div>

            {/* List Viewport converted to clean horizontal row table/list */}
            <div className="mt-5 w-full">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-muted-foreground/25 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Penyedia kredit tidak mendukung tenor ini.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  {filteredOptions.map((opt, idx) => {

                    const getCategoryLabel = (c: string) => {
                      if (c === "KREDIT_BANK") return "Bank";
                      if (c === "PAYLATER") return "PayLater";
                      if (c === "KREDIT_TOKO") return "Toko";
                      return c;
                    };

                    const isFeasible = opt.monthlyInstallment <= remainingBudget;
                    const isWarning = !isFeasible && opt.monthlyInstallment <= (monthlyBudget || (remainingBudget * 3));
                    const isExpanded = !!expandedIndices[idx];

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden bg-card/10 backdrop-blur-sm",
                          opt.riskLevel === "Tinggi"
                            ? "border-rose-500/20 bg-rose-500/[0.02]"
                            : "border-muted-foreground/15 bg-card/5 hover:bg-card/8"
                        )}
                      >
                        {/* Header Row: Flex/Grid layout for desktop, stacked on mobile */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center w-full">
                          
                          {/* Col 1: Provider Name & Labels (Bank/Paylater/Toko) */}
                          <div className="md:col-span-3 space-y-1.5 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                                {getCategoryLabel(opt.category)}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border leading-none flex items-center gap-0.5",
                                opt.riskLevel === "Rendah"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : opt.riskLevel === "Sedang"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              )}>
                                {opt.riskLevel === "Tinggi" && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                                {opt.riskLevel}
                              </span>
                            </div>
                            <h4 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                              {opt.name}
                            </h4>
                          </div>

                          {/* Col 2: Cicilan Bulanan */}
                          <div className="md:col-span-3 space-y-0.5 text-left">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                              Cicilan Bulanan
                            </span>
                            <div className="flex items-baseline text-foreground">
                              <span className="text-base sm:text-lg font-bold text-rose-500">
                                Rp {opt.monthlyInstallment.toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs font-semibold ml-0.5 text-muted-foreground">
                                /bln
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground mt-0.5 block font-semibold">
                              Rasio: {opt.installmentRatio}% gaji
                            </span>
                          </div>

                          {/* Col 3: Financial Details (Total & Admin) */}
                          <div className="md:col-span-3 space-y-0.5 text-left">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                              Total & Bunga
                            </span>
                            <div className="text-xs sm:text-sm font-semibold text-foreground">
                              Rp {opt.totalPayment.toLocaleString("id-ID")}
                            </div>
                            <span className="text-[11px] text-rose-500 font-bold block mt-0.5">
                              Bunga & Admin: +{opt.costVariancePct}%
                            </span>
                          </div>

                          {/* Col 4: Kapasitas */}
                          <div className="md:col-span-2 text-left">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">
                              Kapasitas
                            </span>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block",
                              isFeasible
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : isWarning
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                              {isFeasible
                                ? "Sisa Budget Cukup"
                                : isWarning
                                  ? "Budget Mepet"
                                  : "Over-budget"}
                            </span>
                          </div>

                          {/* Col 5: Action Drawer Toggle */}
                          <div className="md:col-span-1 flex md:justify-end">
                            <button
                              type="button"
                              onClick={() => toggleExpand(idx)}
                              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer select-none"
                            >
                              <span>Detail</span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              )}
                            </button>
                          </div>

                        </div>

                        {/* Collapsible Pros & Cons Details Panel */}
                        {isExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-muted-foreground/10 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="space-y-1.5 bg-emerald-500/[0.01] p-4 rounded-2xl border border-emerald-500/10">
                              <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider mb-1">Kelebihan:</span>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                                {opt.pros.map((pro, pIdx) => (
                                  <li key={pIdx} className="text-justify leading-relaxed">{pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-1.5 bg-rose-500/[0.01] p-4 rounded-2xl border border-rose-500/10">
                              <span className="text-xs font-bold uppercase text-rose-500 block tracking-wider mb-1">Kekurangan:</span>
                              <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                                {opt.cons.map((con, cIdx) => (
                                  <li key={cIdx} className="text-justify leading-relaxed">{con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Disclaimer text */}
            <p className="text-xs text-muted-foreground italic font-medium leading-normal mt-2">
              *Catatan: Rincian cicilan, bunga, dan rasio di atas adalah hasil simulasi perkiraan kasar saja untuk bahan pertimbangan Anda. Kondisi riil dapat berbeda tergantung pada kebijakan masing-masing penyedia kredit.
            </p>
          </div>

          {consequencesNote && (
            <div className="p-5 rounded-2xl border border-red-500/20 text-red-500 text-xs space-y-1.5 bg-red-500/[0.02]">
              <span className="font-bold uppercase block tracking-wider text-xs text-red-500">
                Catatan Dampak Cicilan:
              </span>
              <p className="leading-relaxed font-medium text-justify text-red-600 dark:text-red-400">
                {consequencesNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
