"use client";

import React from "react";
import { Accordion } from "@/components/ui/accordion";
import { SimulasiNabungVsPaylater } from "../According/SimulationCard";
import { SaranStrategiMengelolaUang } from "../According/FeedbackCard";
import { InsightPsikologis } from "../According/InsightCard";
import { KabarHargaPasar } from "../According/HargaPasarCard";
import { TaktikKeuangan } from "../According/TaktikCard";
import { ScraperItem } from "../../types";

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

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border rounded-xl overflow-hidden bg-card/15 backdrop-blur-sm"
    >
      {/* 4. Paylater Simulation */}
      {!canBuyImmediately && !isWantAndEnoughMoney && (
        <SimulasiNabungVsPaylater
          decisionId={decisionId}
          targetValue={targetValue}
          remainingBudget={remainingBudget}
          monthlyBudget={monthlyBudget || 0}
        />
      )}

      {/* 5. Saran Strategi Mengelola Uang */}
      {!isWantAndEnoughMoney && (
        <SaranStrategiMengelolaUang
          decisionId={decisionId}
          targetValue={targetValue}
          remainingBudget={remainingBudget}
          totalExpenses={totalExpenses}
          monthlyBudget={monthlyBudget}
          jenisTarget={jenisTarget}
          keteranganTambahan={keteranganTambahan}
        />
      )}

      {/* 6. Insight Psikologis */}
      <InsightPsikologis decisionId={decisionId} />

      {/* 7. Kabar Harga Pasar */}
      <KabarHargaPasar
        decisionId={decisionId}
        target={target}
        targetValue={targetValue}
        selectedProduct={selectedProduct}
        onSelectProduct={onSelectProduct}
      />

      {/* 8. Taktik Keuangan & Rencana Aksi */}
      {!isWantAndEnoughMoney && (
        <TaktikKeuangan
          decisionId={decisionId}
        />
      )}
    </Accordion>
  );
}
