"use client";

import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { 
  calculateSavingOptions, 
  generateSavingsTimelines, 
  calculatePaylaterPlans 
} from "./analysisUtils";
import { SimulasiNabungVsPaylater } from "./SimulasiNabungVsPaylater";
import { SaranStrategiMengelolaUang } from "./Saran";
import { InsightPsikologis } from "./Insight";
import { KabarHargaPasar } from "./HargaPasar";
import { TaktikKeuangan } from "./TaktikKeuangan";

interface ResultCommentsProps {
  aiData: any;
  targetValue: string;
  monthsDiff: number;
  remainingBudget: number;
  totalExpenses: number;
  target: string;
  monthlyBudget?: number;
  jenisTarget?: string;
  keteranganTambahan?: string;
}

export function ResultComments({
  aiData,
  targetValue,
  monthsDiff,
  remainingBudget,
  totalExpenses,
  target,
  monthlyBudget,
  jenisTarget,
  keteranganTambahan,
}: ResultCommentsProps) {
  const targetValNum = Number(targetValue || 0);

  // Suggested dynamic saving target and months calculation
  let suggestedMonthlySaving = 0;
  let suggestedMonthsNeeded = 12;

  if (remainingBudget > 0) {
    // Recommend saving 60% of surplus budget
    suggestedMonthlySaving = Math.round(remainingBudget * 0.6);
    if (suggestedMonthlySaving > 0) {
      suggestedMonthsNeeded = Math.ceil(targetValNum / suggestedMonthlySaving);
    }
    if (suggestedMonthsNeeded <= 0) suggestedMonthsNeeded = 1;
  } else {
    // If budget is deficit or zero, suggest saving Rp 300.000 after budget adjustments
    suggestedMonthlySaving = 300000;
    suggestedMonthsNeeded = Math.ceil(targetValNum / suggestedMonthlySaving);
  }

  // Calculate saving options dynamically
  const savingOptions = calculateSavingOptions(remainingBudget, targetValue);

  // Calculate timelines
  const suggestedDailySaving = Math.round(suggestedMonthlySaving / 30);
  const suggestedDaysNeeded = Math.ceil(targetValNum / (suggestedDailySaving || 1000));
  const { monthlyTimeline, dailyTimeline, monthStep } = generateSavingsTimelines(
    targetValNum,
    suggestedDailySaving,
    suggestedMonthlySaving,
    suggestedMonthsNeeded,
    suggestedDaysNeeded
  );

  // Extract psychological insight fallbacks
  const psychologicalInsight = aiData.psychologicalInsight || {
    purchaseDriver: "Kebutuhan Nyata",
    motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan.",
    riskText: "Pembelian yang impulsif atau didasari motif gengsi dapat memicu kecemasan dan stres cicilan bulanan.",
  };

  // Calculate paylater options
  const plans = calculatePaylaterPlans(targetValue, aiData);

  const opportunityCost = aiData.opportunityCost || {
    investmentAlternative: `Jika dana tunai Rp ${Number(targetValue || 0).toLocaleString("id-ID")} ini dialokasikan ke reksa dana dengan return 8% per tahun, dalam 5 tahun nilainya akan bertumbuh menjadi Rp ${Math.round(Number(targetValue || 0) * 1.46).toLocaleString("id-ID")}.`,
    savingAlternative: `Nominal ini dapat dialokasikan untuk memperkuat dana darurat demi menjaga ketahanan finansial Anda.`,
  };

  const canBuyImmediately = remainingBudget > 0 && targetValNum <= remainingBudget * 0.3;

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border rounded-xl overflow-hidden bg-card/15 backdrop-blur-sm"
    >
      {/* 4. Paylater Simulation */}
      {aiData.paylaterSimulation && !canBuyImmediately && (
        <SimulasiNabungVsPaylater
          savingOptions={savingOptions}
          plans={plans}
          targetValue={targetValue}
          consequencesNote={aiData.paylaterSimulation.consequencesNote}
        />
      )}

      {/* 5. Saran Strategi Mengelola Uang */}
      <SaranStrategiMengelolaUang
        targetValue={targetValue}
        suggestedDailySaving={suggestedDailySaving}
        suggestedDaysNeeded={suggestedDaysNeeded}
        suggestedMonthlySaving={suggestedMonthlySaving}
        suggestedMonthsNeeded={suggestedMonthsNeeded}
        monthStep={monthStep}
        dailyTimeline={dailyTimeline}
        monthlyTimeline={monthlyTimeline}
        remainingBudget={remainingBudget}
        opportunityCost={opportunityCost}
        totalExpenses={totalExpenses}
        monthlyBudget={monthlyBudget}
        jenisTarget={jenisTarget}
        keteranganTambahan={keteranganTambahan}
      />

      {/* 6. Insight Psikologis */}
      <InsightPsikologis psychologicalInsight={psychologicalInsight} />

      {/* 7. Kabar Harga Pasar */}
      {aiData.realMarketPrice && (
        <KabarHargaPasar
          realMarketPrice={aiData.realMarketPrice}
          priceComparisonNote={aiData.priceComparisonNote}
          alternativeSuggestions={aiData.alternativeSuggestions}
          target={target}
        />
      )}

      {/* 8. Taktik Keuangan & Rencana Aksi */}
      <TaktikKeuangan
        strategy={aiData.emergencyMode?.strategy}
        sacrificeTransparency={aiData.sacrificeTransparency}
      />
    </Accordion>
  );
}
