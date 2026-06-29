"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Scale
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
            <div className="flex items-center gap-1.5 mt-3 bg-muted/10 p-1 rounded-xl w-fit">
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider pl-1.5 pr-2">Tenor Pilihan:</span>
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
                      "text-[10px] px-3 py-1 rounded-lg transition-all cursor-pointer font-bold",
                      isActive
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted/20"
                    )}
                  >
                    {tenorVal} Bulan
                  </button>
                );
              })}
            </div>

            {/* List Viewport converted to responsive grid deck */}
            <div className="mt-5 w-full">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-muted-foreground/25 rounded-2xl">
                  <p className="text-xs text-muted-foreground">Penyedia kredit tidak mendukung tenor ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch w-full">
                  {filteredOptions.map((opt, idx) => {

                    const getCategoryLabel = (c: string) => {
                      if (c === "KREDIT_BANK") return "Bank";
                      if (c === "PAYLATER") return "PayLater";
                      if (c === "KREDIT_TOKO") return "Toko";
                      return c;
                    };

                    const isFeasible = opt.monthlyInstallment <= remainingBudget;
                    const isWarning = !isFeasible && opt.monthlyInstallment <= (monthlyBudget || (remainingBudget * 3));

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-5 rounded-3xl border flex flex-col justify-between space-y-5 relative overflow-hidden bg-card/15 backdrop-blur-sm transition-all duration-300",
                          opt.riskLevel === "Tinggi"
                            ? "border-rose-500/20 bg-rose-500/[0.01]"
                            : "border-muted-foreground/15 hover:border-muted-foreground/30 bg-card/5"
                        )}
                      >
                        <div className="space-y-4 flex-1">
                          {/* Header tags */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[8px] font-black uppercase text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">
                              {getCategoryLabel(opt.category)}
                            </span>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none flex items-center gap-0.5",
                              opt.riskLevel === "Rendah"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : opt.riskLevel === "Sedang"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                              {opt.riskLevel === "Tinggi" && <AlertTriangle className="h-2.5 w-2.5" />}
                              Risiko {opt.riskLevel}
                            </span>
                          </div>

                          {/* Title */}
                          <div>
                            <h4 className="font-extrabold text-foreground text-sm leading-tight">
                              {opt.name}
                            </h4>
                          </div>

                          {/* Installment amount block */}
                          <div className="py-3 border-y border-dashed border-muted-foreground/10">
                            <span className="text-[9px] block font-bold uppercase tracking-wider mb-1 text-muted-foreground">
                              Cicilan Bulanan
                            </span>
                            <div className="flex items-baseline text-foreground">
                              <span className="text-xl sm:text-2xl font-black tracking-tight text-rose-500">
                                Rp {opt.monthlyInstallment.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[10px] font-extrabold ml-1">
                                /bln
                              </span>
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-1 block">
                              Rasio: {opt.installmentRatio}% gaji
                            </span>
                          </div>

                          {/* Financial Details Checklist */}
                          <div className="space-y-1.5 text-[10px] font-bold text-foreground">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Total Bayar:</span>
                              <span>Rp {opt.totalPayment.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Bunga & Admin:</span>
                              <span className="text-rose-500 font-extrabold">+{opt.costVariancePct}%</span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-muted-foreground/5">
                              <span className="text-muted-foreground">Kapasitas:</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                isFeasible
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
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
                          </div>

                          {/* Pros & Cons list rendered beautifully inside card */}
                          <div className="space-y-3 pt-3 border-t border-dashed border-muted-foreground/10 text-[10px] font-medium leading-relaxed text-muted-foreground">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">Kelebihan:</span>
                              <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5">
                                {opt.pros.map((pro, pIdx) => (
                                  <li key={pIdx} className="text-justify">{pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black uppercase text-rose-500 block tracking-wider">Kekurangan:</span>
                              <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5">
                                {opt.cons.map((con, cIdx) => (
                                  <li key={cIdx} className="text-justify">{con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {consequencesNote && (
            <div className="p-4 rounded-3xl border border-red-500/20 text-red-500 text-[10px] space-y-0.5 bg-red-500/[0.01]">
              <span className="font-extrabold uppercase block tracking-wider text-[10px]">
                Catatan Dampak Cicilan:
              </span>
              <p className="leading-relaxed font-semibold text-justify mt-1">
                {consequencesNote}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
