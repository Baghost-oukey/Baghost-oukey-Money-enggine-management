"use client";

import React, { useState, useEffect } from "react";
import { Store, Scale, TrendingUp, Sparkles, Loader2, Calendar, Coins, Percent } from "lucide-react";
import { SimulasiNabungVsPaylater } from "../According/SimulationCard";
import { InsightPsikologis } from "../According/InsightCard";
import { KabarHargaPasar } from "../According/HargaPasarCard";
import { TaktikKeuangan } from "../According/TaktikCard";
import { ScraperItem } from "../../types";
import { cn } from "@/lib/utils";

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
      <div className="flex items-end gap-1 px-3 sm:px-4 overflow-x-auto scrollbar-none border-b border-muted-foreground/15 -mb-[1px] relative z-10 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer select-none relative border-b-2 border-transparent",
                isActive
                  ? "bg-card/35 backdrop-blur-md border border-muted-foreground/15 border-b-0 rounded-t-[16px] text-foreground font-black px-6 z-20"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground rounded-t-xl py-2 mb-1"
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
        "bg-card/25 backdrop-blur-md border border-muted-foreground/15 rounded-b-[20px] rounded-tr-[20px] p-5 sm:p-6 shadow-sm min-h-[380px] relative z-0",
        activeTab === tabs[0]?.id ? "rounded-tl-none" : "rounded-tl-[20px]"
      )}>
        {/* Tab 1: Timeline Nabung Mandiri */}
        {activeTab === "timeline" && (
          <div className="space-y-5">
            <div className="border-b pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Timeline Rencana Kegiatan Menabung Mandiri
                </h3>
                <p className="text-[10px] text-muted-foreground font-light mt-0.5 leading-relaxed">
                  Pilihan jalur aktivitas menabung mandiri bebas biaya bunga dan administrasi.
                </p>
              </div>
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/20">
                Hemat 100%
              </span>
            </div>

            {simLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                <p className="text-xs text-muted-foreground">Menyusun rencana aktivitas nabung...</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-muted-foreground/15 space-y-6 py-2 ml-2 max-w-4xl">
                {strategyList.map((strat: any, idx: number) => {
                  const isRecommended = recommendation?.recommendedStrategy === parseInt(strat.key) || recommendation?.recommendedStrategy === strat.key;

                  // Color mapping for connectors and badges
                  const colors = strat.key === "aman"
                    ? { dot: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600", card: "border-emerald-500/15 bg-emerald-500/[0.01]" }
                    : strat.key === "seimbang"
                    ? { dot: "bg-violet-500/10 border-violet-500/30 text-violet-600", card: "border-violet-500/20 bg-violet-500/[0.01]" }
                    : { dot: "bg-rose-500/10 border-rose-500/30 text-rose-600", card: "border-rose-500/15 bg-rose-500/[0.01]" };

                  return (
                    <div key={idx} className="relative space-y-2">
                      {/* Timeline Bullet indicator */}
                      <span className={cn(
                        "absolute -left-[31px] top-1.5 h-5 w-5 rounded-full border flex items-center justify-center text-[9px] font-black shadow-sm bg-background select-none",
                        colors.dot
                      )}>
                        {idx + 1}
                      </span>

                      {/* Timeline Activity card */}
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden",
                        isRecommended
                          ? "ring-2 ring-violet-500/20 shadow-md " + colors.card
                          : "bg-background/40 hover:bg-background/80"
                      )}>
                        {isRecommended && (
                          <span className="absolute top-0 right-0 bg-violet-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow-sm">
                            ⭐ Rekomendasi
                          </span>
                        )}

                        <div className="space-y-2">
                          {/* Header Details */}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-[12px] text-foreground leading-tight">
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
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                              Target Waktu Nabung: <strong className="text-foreground">{strat.targetMonths} bulan</strong> ({strat.targetDays} hari)
                            </p>
                          </div>

                          {/* Visual checklist showing daily, weekly, monthly targets */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-muted-foreground/10 text-[10px] font-bold text-center max-w-lg">
                            <div className="bg-card/45 border rounded-xl p-2">
                              <span className="text-[8px] text-muted-foreground block font-medium">Harian</span>
                              <span className="text-foreground font-black text-[11px] sm:text-xs">Rp {strat.dailySaving.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="bg-card/45 border rounded-xl p-2">
                              <span className="text-[8px] text-muted-foreground block font-medium">Mingguan</span>
                              <span className="text-foreground font-black text-[11px] sm:text-xs">Rp {strat.weeklySaving.toLocaleString("id-ID")}</span>
                            </div>
                            <div className="bg-card/45 border rounded-xl p-2">
                              <span className="text-[8px] text-muted-foreground block font-medium">Bulanan</span>
                              <span className="text-foreground font-black text-[11px] sm:text-xs">Rp {strat.monthlySaving.toLocaleString("id-ID")}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 text-justify font-medium">
                            {strat.explanation}
                          </p>
                        </div>
                      </div>
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
