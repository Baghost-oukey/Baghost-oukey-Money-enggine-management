"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { 
  Loader2, 
  Building2, 
  Smartphone, 
  Store, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingStrategy {
  key: string;
  label: string;
  targetMonths: number;
  targetDays: number;
  dailySaving: number;
  weeklySaving: number;
  monthlySaving: number;
  savingsRatio: number;
  difficulty: string;
  feasibility: string;
  explanation: string;
}

interface SavingRecommendation {
  recommendedStrategy: string;
  reasoning: string;
}

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
}

export function SimulasiNabungVsPaylater({
  decisionId,
  targetValue,
  remainingBudget,
  monthlyBudget,
}: SimulasiNabungVsPaylaterProps) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PaylaterPlan[]>([]);
  const [consequencesNote, setConsequencesNote] = useState("");
  const [savingStrategies, setSavingStrategies] = useState<Record<string, SavingStrategy> | null>(null);
  const [recommendation, setRecommendation] = useState<SavingRecommendation | null>(null);
  const [financingOptions, setFinancingOptions] = useState<SimulationResult[]>([]);
  const [selectedTenor, setSelectedTenor] = useState<3 | 6 | 12>(6);
  const [expandedIndices, setExpandedIndices] = useState<Record<string, boolean>>({});

  const targetValNum = Number(targetValue || 0);

  useEffect(() => {
    let isMounted = true;
    async function loadSimulation() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/simulasi?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setPlans(json.data.plans || []);
          setConsequencesNote(json.data.consequencesNote || "");
          setSavingStrategies(json.data.savingStrategies || null);
          setRecommendation(json.data.recommendation || null);
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

  const toggleExpand = (providerName: string) => {
    setExpandedIndices((prev) => ({
      ...prev,
      [providerName]: !prev[providerName]
    }));
  };

  const filteredOptions = financingOptions.filter((opt) => opt.tenor === selectedTenor);

  const strategyList = savingStrategies
    ? [savingStrategies.aman, savingStrategies.seimbang, savingStrategies.agresif].filter(Boolean)
    : [];

  return (
    <AccordionItem value="paylater-simulation" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center">
          <p>Simulasi Menabung vs Kredit & PayLater</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Lagi menghitung rencana cicilan & strategi nabung...</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-light leading-relaxed text-gray-700">
              Bagian ini membantu kamu menentukan strategi menabung terbaik yang paling realistis sesuai kondisi pendapatan harian dan batas waktu menabung, dibandingkan dengan opsi mengajukan cicilan paylater.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Nabung Mandiri Option */}
              <div className="p-3.5 rounded-xl border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                    1. Rencana Strategi Menabung Mandiri
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Hemat 100%
                  </span>
                </div>

                {/* Planner Recommendation reasoning */}
                {recommendation && (
                  <div className="p-2.5 rounded-xl bg-violet-600/5 border border-violet-500/20 space-y-1">
                    <span className="text-[10px] font-black uppercase text-violet-600 tracking-wider block">
                      💡 Rekomendasi Perencana Keuangan:
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-normal font-medium">
                      {recommendation.reasoning}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {strategyList.map((strat, idx) => {
                    const isRecommended = recommendation?.recommendedStrategy === strat.key;
                    const monthlySavingNeeded = strat.monthlySaving;
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden",
                          isRecommended
                            ? "border-violet-500 bg-violet-500/[0.03] ring-1 ring-violet-500/20 shadow-sm"
                            : "border-muted/20 bg-background/55"
                        )}
                      >
                        {/* Pilihan Terbaik Badge */}
                        {isRecommended && (
                          <div className="absolute top-0 right-0 bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-lg shadow-sm">
                            ⭐ Pilihan Terbaik
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-foreground text-[11px]">
                              {strat.label}
                            </span>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none",
                              strat.difficulty === "Rendah"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : strat.difficulty === "Sedang"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                              Beban: {strat.difficulty}
                            </span>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none",
                              strat.feasibility.includes("Layak")
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : strat.feasibility.includes("Penyesuaian")
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            )}>
                              {strat.feasibility}
                            </span>
                          </div>

                          <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                            Estimasi waktu menabung: <strong className="text-foreground">{strat.targetMonths} bulan</strong> ({strat.targetDays} hari)
                          </p>
                        </div>

                        {/* Financial figures grid */}
                        <div className="grid grid-cols-3 gap-1 bg-muted/10 p-1.5 rounded-lg text-center mt-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Harian</span>
                            <span className="text-[10px] font-extrabold text-foreground">Rp {strat.dailySaving.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex flex-col border-x border-muted/20">
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Mingguan</span>
                            <span className="text-[10px] font-extrabold text-foreground">Rp {strat.weeklySaving.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Bulanan</span>
                            <span className="text-[10px] font-extrabold text-foreground">Rp {strat.monthlySaving.toLocaleString("id-ID")}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1.5 border-t border-muted/5 mt-1 leading-none">
                          <span>Rasio tabungan: <strong>{strat.savingsRatio}%</strong> dari gaji</span>
                          <span className="text-right text-[9px] font-extrabold text-foreground">Target: Rp {targetValNum.toLocaleString("id-ID")}</span>
                        </div>
                        
                        <p className="text-[10px] italic text-muted-foreground leading-snug mt-1 bg-violet-500/[0.01] p-1.5 rounded border border-dotted border-muted/15">
                          💡 {strat.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cicilan Paylater Options */}
              <div className="p-3.5 rounded-xl border space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                      2. Perbandingan Kredit & PayLater (DSS)
                    </span>
                    <Scale className="h-4 w-4 text-violet-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                    Bandingkan cicilan dari penyedia jasa kredit terpopuler di Indonesia untuk tenor pilihanmu.
                  </p>
                  
                  {/* Tenor selector row */}
                  <div className="flex items-center gap-1.5 mt-3 bg-muted/10 p-1 rounded-lg">
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider pl-1.5 mr-auto">Tenor Pilihan:</span>
                    {([3, 6, 12] as const).map((tenorVal) => {
                      const isActive = selectedTenor === tenorVal;
                      return (
                        <button
                          key={tenorVal}
                          onClick={() => {
                            setSelectedTenor(tenorVal);
                            setExpandedIndices({});
                          }}
                          type="button"
                          className={cn(
                            "text-[10px] px-3 py-1 rounded-md transition-all cursor-pointer font-bold",
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

                  {/* List Viewport */}
                  <div className="mt-4 space-y-2.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-violet-500/20">
                    {filteredOptions.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-muted/25 rounded-xl">
                        <p className="text-[10px] text-muted-foreground">Penyedia kredit tidak mendukung tenor ini.</p>
                      </div>
                    ) : (
                      filteredOptions.map((opt, idx) => {
                        const isExpanded = !!expandedIndices[opt.name];
                        
                        const getCategoryIcon = () => {
                          switch (opt.category) {
                            case "KREDIT_BANK":
                              return <Building2 className="h-3 w-3 text-blue-500" />;
                            case "PAYLATER":
                              return <Smartphone className="h-3 w-3 text-purple-500" />;
                            case "KREDIT_TOKO":
                              return <Store className="h-3 w-3 text-amber-500" />;
                            default:
                              return <Building2 className="h-3 w-3" />;
                          }
                        };

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
                            className="p-3 rounded-xl border border-muted/20 bg-background/50 hover:bg-background/80 transition-all flex flex-col space-y-2"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {getCategoryIcon()}
                                <span className="font-extrabold text-foreground text-[11px]">
                                  {opt.name}
                                </span>
                                <span className="text-[8px] font-medium text-muted-foreground px-1 bg-muted/20 rounded">
                                  {getCategoryLabel(opt.category)}
                                </span>
                              </div>
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1.5 py-0.5 rounded border leading-none flex items-center gap-0.5",
                                opt.riskLevel === "Rendah"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : opt.riskLevel === "Sedang"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              )}>
                                {opt.riskLevel === "Tinggi" && <AlertTriangle className="h-2 w-2" />}
                                Risiko {opt.riskLevel}
                              </span>
                            </div>

                            {/* Financial Details */}
                            <div className="grid grid-cols-2 gap-2 bg-muted/10 p-2 rounded-lg text-xs">
                              <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Cicilan</span>
                                <span className="text-[11px] font-extrabold text-foreground">
                                  Rp {opt.monthlyInstallment.toLocaleString("id-ID")}/bln
                                </span>
                                <span className="text-[8px] text-muted-foreground mt-0.5 leading-none">
                                  Rasio: {opt.installmentRatio}% gaji
                                </span>
                              </div>
                              <div className="flex flex-col border-l border-muted/20 pl-2">
                                <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold">Total Pembayaran</span>
                                <span className="text-[11px] font-extrabold text-foreground">
                                  Rp {opt.totalPayment.toLocaleString("id-ID")}
                                </span>
                                <span className="text-[8px] text-rose-500 font-bold mt-0.5 leading-none">
                                  Bunga & Admin: +{opt.costVariancePct}%
                                </span>
                              </div>
                            </div>

                            {/* Action Button & Feasibility Label */}
                            <div className="flex items-center justify-between gap-2 mt-1">
                              {remainingBudget !== undefined ? (
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded border leading-none",
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
                              ) : (
                                <div />
                              )}
                              
                              <button
                                onClick={() => toggleExpand(opt.name)}
                                type="button"
                                className="flex items-center gap-0.5 text-[9px] font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                              >
                                <span>Detail Pro-Kontra</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            </div>

                            {/* Pros & Cons list */}
                            {isExpanded && (
                              <div className="space-y-1.5 p-2 rounded bg-muted/5 border border-dotted border-muted/20 mt-1">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-2 w-2" /> Kelebihan:
                                  </span>
                                  <ul className="list-none space-y-0.5 pl-1.5">
                                    {opt.pros.map((pro, pIdx) => (
                                      <li key={pIdx} className="text-[9px] text-muted-foreground leading-normal flex items-start gap-1">
                                        <span className="text-emerald-500">•</span>
                                        <span>{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="space-y-1 mt-1.5">
                                  <span className="text-[8px] font-black uppercase text-rose-500 flex items-center gap-1">
                                    <Info className="h-2 w-2" /> Kekurangan & Risiko:
                                  </span>
                                  <ul className="list-none space-y-0.5 pl-1.5">
                                    {opt.cons.map((con, cIdx) => (
                                      <li key={cIdx} className="text-[9px] text-muted-foreground leading-normal flex items-start gap-1">
                                        <span className="text-rose-500">•</span>
                                        <span>{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {consequencesNote && (
                  <div className="p-2.5 rounded-xl border border-red-500/20 text-red-500 text-[10px] space-y-0.5 bg-red-500/[0.01] mt-3">
                    <span className="font-extrabold uppercase block tracking-wider text-[10px]">
                      Catatan Dampak Cicilan:
                    </span>
                    <p className="leading-relaxed font-medium text-justify mt-1">
                      {consequencesNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
