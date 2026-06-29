"use client";

import React, { useState, useEffect } from "react";
import { Store, Scale, TrendingUp, Sparkles, Loader2, Calendar, Coins, Percent } from "lucide-react";
import { SimulasiNabungVsPaylater } from "../According/SimulationCard";
import { InsightPsikologis } from "../According/InsightCard";
import { KabarHargaPasar } from "../According/HargaPasarCard";
import { TaktikKeuangan } from "../According/TaktikCard";
import { ScraperItem } from "../../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ResultCommentsProps {
  decisionId: string;
  targetValue: string;
  remainingBudget: number;
  totalExpenses: number;
  target: string;
  monthlyBudget?: number;
  jenisTarget?: string;
  keteranganTambahan?: string;
  selectedProduct: ScraperItem | null;
  onSelectProduct: (product: ScraperItem | null) => void;
}

export function ResultComments({
  decisionId,
  targetValue,
  remainingBudget,
  totalExpenses,
  target,
  monthlyBudget,
  jenisTarget,
  keteranganTambahan,
  selectedProduct,
  onSelectProduct,
}: ResultCommentsProps) {
  const targetValNum = Number(targetValue || 0);

  const canBuyImmediately = remainingBudget > 0 && targetValNum <= remainingBudget * 0.3;
  const isWantAndEnoughMoney = jenisTarget === "Keinginan" && remainingBudget >= targetValNum;

  // Simulation state loaded at parent level to split into Left/Right panels
  const [simLoading, setSimLoading] = useState(true);
  const [savingStrategies, setSavingStrategies] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSim() {
      setSimLoading(true);
      try {
        const res = await fetch(`/api/decision/according/simulasi?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setSavingStrategies(json.data.savingStrategies || null);
          setRecommendation(json.data.recommendation || null);
        }
      } catch (err) {
        console.error("Failed to load timeline data in parent result", err);
      } finally {
        if (isMounted) setSimLoading(false);
      }
    }
    loadSim();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  // Tabs definitions
  const tabs = [
    {
      id: "timeline",
      label: "Timeline Nabung",
      icon: Calendar,
      visible: true,
    },
    {
      id: "harga-pasar",
      label: "Harga Pasaran & Produk",
      icon: Store,
      visible: true,
    },
    {
      id: "taktik",
      label: "Taktik & Rencana Aksi",
      icon: TrendingUp,
      visible: !isWantAndEnoughMoney,
    },
    {
      id: "insight",
      label: "Saran & Psikologi",
      icon: Sparkles,
      visible: true,
    },
    {
      id: "paylater",
      label: "Cicilan Kredit & PayLater",
      icon: Scale,
      visible: !canBuyImmediately && !isWantAndEnoughMoney,
    },
  ].filter((t) => t.visible);

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || "timeline");

  const strategyList = savingStrategies
    ? [savingStrategies.aman, savingStrategies.seimbang, savingStrategies.agresif].filter(Boolean)
    : [];

  return (
    <div className="w-full flex flex-col space-y-0">
      {/* Premium Folder-style Tabs Navigation */}
      <div className="flex items-end gap-1 px-3 sm:px-4 overflow-x-auto scrollbar-none border-b relative z-10 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-xs font-bold whitespace-nowrap cursor-pointer select-none relative rounded-t-[16px] transition-colors duration-150 border border-b-0",
                isActive
                  ? "bg-card/35 backdrop-blur-md border-muted-foreground/15 text-foreground font-black z-20"
                  : "border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              )}
            >
              <Icon size={13} className={isActive ? "animate-pulse text-violet-500" : ""} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Modern Card Body for Active Tab */}
      <div className={cn(
        "bg-card/25 border rounded-b-[20px] rounded-tr-[20px] p-5 sm:p-6 shadow-sm min-h-[380px] relative z-0",
        activeTab === tabs[0]?.id ? "rounded-tl-none" : "rounded-tl-[20px]"
      )}>
        {/* Tab 1: Timeline Nabung Mandiri */}
        {activeTab === "timeline" && (
          <div className="space-y-5">
            {simLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <p className="text-xs text-muted-foreground">Menyusun rencana aktivitas nabung...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
                {strategyList.map((strat: any, idx: number) => {
                  const isRecommended = recommendation?.recommendedStrategy === parseInt(strat.key) || recommendation?.recommendedStrategy === strat.key;

                  // Pricing plan card configurations
                  const colors = strat.key === "aman"
                    ? { border: "border-emerald-500/25", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", btn: "bg-emerald-600 hover:bg-emerald-700 text-white" }
                    : strat.key === "seimbang"
                    ? { border: "border-violet-500/40 ring-2 ring-violet-500/20 bg-violet-600/[0.01]", badge: "bg-violet-600 text-white", btn: "bg-violet-600 hover:bg-violet-700 text-white" }
                    : { border: "border-rose-500/25", badge: "bg-rose-500/10 text-rose-600 border-rose-500/20", btn: "bg-rose-600 hover:bg-rose-700 text-white" };

                  // Detect Daily/Monthly context
                  const isHarian = keteranganTambahan?.includes("[Harian]") || false;
                  const mainSavingRate = isHarian ? strat.dailySaving : strat.monthlySaving;
                  const mainPeriodLabel = isHarian ? "hari" : "bulan";

                  const strategyBenefits = strat.key === "aman"
                    ? [
                        "Nabungnya super ringan & bebas beban pikiran",
                        "Gak mengganggu uang jajan harian utamamu",
                        "Uang bulananmu tetap aman dan stabil"
                      ]
                    : strat.key === "seimbang"
                    ? [
                        "Barang impian kebeli pas sesuai target",
                        "Nabung dan jajan harian tetap seimbang",
                        "Sesuai target tanggal rencana awalmu"
                      ]
                    : [
                        "Barang impian kebeli 2x lebih cepat",
                        "Memakai sisa uang jajan dengan maksimal",
                        "Melatih disiplin dan fokus mengelola uang"
                      ];

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "p-5 rounded-3xl border flex flex-col justify-between space-y-6 relative overflow-hidden bg-card/15 backdrop-blur-sm transition-all duration-300",
                        isRecommended
                          ? "shadow-lg shadow-violet-500/5 " + colors.border
                          : "border-muted-foreground/15 hover:border-muted-foreground/30 bg-card/5"
                      )}
                    >
                      {/* Top badge */}
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                          Rekomedasi Ku
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Plan Header Title */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                            {strat.key === "aman" ? "Santai Plan" : strat.key === "seimbang" ? "Normal Plan" : "Agresif Plan"}
                          </span>
                          <h4 className="font-extrabold text-foreground text-sm leading-tight">
                            {strat.label}
                          </h4>
                        </div>

                        {/* Price Block */}
                        <div className="py-3 border-y border-dashed border-muted-foreground/10">
                          <span className="text-[9px] block font-bold uppercase tracking-wider mb-1">
                            {isHarian ? "Nabung Harian" : "Nabung Bulanan"}
                          </span>
                          <div className="flex items-baseline text-foreground">
                            <span className="text-xl sm:text-2xl font-black tracking-tight">
                              Rp {mainSavingRate.toLocaleString("id-ID")}
                            </span>
                            <span className="text-[10px] text-violet-700 font-extrabold ml-1">
                              /{mainPeriodLabel}
                            </span>
                          </div>
                        </div>

                        {/* Checklist Details */}
                        <div className="space-y-2">
                          <span className="text-[9px] block font-bold uppercase">
                            Rincian Nabung:
                          </span>
                          <div className="space-y-1.5 text-[10px] font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500">✓</span>
                              <span>Harian: Rp {strat.dailySaving.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500">✓</span>
                              <span>Mingguan: Rp {strat.weeklySaving.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500">✓</span>
                              <span>Bulanan: Rp {strat.monthlySaving.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500">✓</span>
                              <span>Beban Keuangan: {strat.difficulty}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-500">✓</span>
                              <span>Waktu: {strat.targetMonths} bln ({strat.targetDays} hari)</span>
                            </div>
                          </div>
                        </div>

                        {/* Keuntungan Jalur Ini */}
                        <div className="space-y-1.5 pt-2.5 border-t border-dashed border-muted-foreground/10">
                          <span className="text-xs text-violet-600 font-semibold uppercase block">
                            Keuntungan Rencana Ini:
                          </span>
                          <div className="space-y-1 text-[10px] font-semibold text-muted-foreground">
                            {strategyBenefits.map((benefit, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-1.5">
                                <span className="leading-normal text-justify">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-justify">
                          {strat.explanation}
                        </p>
                      </div>

                      {/* Action Button at bottom */}
                      <Button
                        type="button"
                        variant="default"
                        size="default"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            localStorage.setItem("selected_saving_strategy", JSON.stringify(strat));
                            
                            // Try calling setup budget dialog from DOM elements
                            const btnList = document.querySelectorAll("button");
                            btnList.forEach((b) => {
                              if (b.textContent?.includes("Susun Anggaran")) {
                                b.click();
                              }
                            });
                          }
                        }}
                        className="w-full rounded-xl text-[10px] font-black uppercase tracking-wider text-center cursor-pointer shadow-sm transition-all duration-200 select-none bg-violet-700 hover:bg-violet-800 text-white shadow-md shadow-violet-700/10"
                      >
                        Buat Rencana Menabung
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Harga Pasaran & Produk */}
        {activeTab === "harga-pasar" && (
          <KabarHargaPasar
            decisionId={decisionId}
            target={target}
            targetValue={targetValue}
            selectedProduct={selectedProduct}
            onSelectProduct={onSelectProduct}
          />
        )}

        {/* Tab 3: Taktik Keuangan */}
        {activeTab === "taktik" && !isWantAndEnoughMoney && (
          <TaktikKeuangan decisionId={decisionId} />
        )}

        {/* Tab 4: Insight Psikologis */}
        {activeTab === "insight" && (
          <InsightPsikologis decisionId={decisionId} />
        )}

        {/* Tab 5: Cicilan Kredit & Paylater */}
        {activeTab === "paylater" && !canBuyImmediately && !isWantAndEnoughMoney && (
          <SimulasiNabungVsPaylater
            decisionId={decisionId}
            targetValue={targetValue}
            remainingBudget={remainingBudget}
            monthlyBudget={monthlyBudget || 0}
            hideSavingsTimeline={true}
          />
        )}
      </div>
    </div>
  );
}
