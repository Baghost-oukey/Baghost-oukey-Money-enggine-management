"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Scale,
  Activity,
  Coins,
  Brain,
  Sparkles,
  Flame,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultCommentsProps {
  aiData: any;
  targetValue: string;
  monthsDiff: number;
  remainingBudget: number;
  totalExpenses: number;
}

export function ResultComments({
  aiData,
  targetValue,
  monthsDiff,
  remainingBudget,
  totalExpenses,
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
  
  const verdictOpinion = aiData.verdictOpinion || {
    title: "Keputusan Keuangan",
    explanation: aiData.healthScoreExplanation || "Silakan evaluasi detail budget bulanan Anda.",
  };
  
  const opportunityCost = aiData.opportunityCost || {
    investmentAlternative: `Jika dana tunai Rp ${Number(targetValue || 0).toLocaleString("id-ID")} ini dialokasikan ke reksa dana dengan return 8% per tahun, dalam 5 tahun nilainya akan bertumbuh menjadi Rp ${Math.round(Number(targetValue || 0) * 1.46).toLocaleString("id-ID")}.`,
    savingAlternative: `Nominal ini dapat dialokasikan untuk memperkuat dana darurat demi menjaga ketahanan finansial Anda.`,
  };
  
  const psychologicalInsight = aiData.psychologicalInsight || {
    purchaseDriver: "Kebutuhan Nyata",
    motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan.",
    riskText: "Pembelian yang impulsif atau didasari motif gengsi dapat memicu kecemasan dan stres cicilan bulanan.",
  };

  const plans = aiData.paylaterSimulation?.plans || [3, 6, 12].map((tenor: number) => {
    const cashPrice = aiData.paylaterSimulation?.cashPrice || Number(targetValue || 0);
    const adminRatePct = aiData.paylaterSimulation?.adminRatePct || 1.0;
    const interestRatePct = aiData.paylaterSimulation?.interestRatePct || 2.95;
    
    const planAdminFee = Math.round(cashPrice * (adminRatePct / 100));
    const planInterest = Math.round(cashPrice * (interestRatePct / 100) * tenor);
    const planWasted = planAdminFee + planInterest;
    const totalPrice = cashPrice + planWasted;
    const monthlyInstallment = Math.round(totalPrice / tenor);
    
    return {
      tenor,
      monthlyInstallment,
      totalPrice,
      interestAmount: planInterest,
      adminFee: planAdminFee,
      moneyWasted: planWasted,
    };
  });

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full border rounded-xl overflow-hidden bg-card/15 backdrop-blur-sm"
    >


      {/* 4. Paylater Simulation */}
      {aiData.paylaterSimulation && (
        <AccordionItem value="paylater-simulation" className="px-4">
          <AccordionTrigger className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
            <div className="flex items-center gap-2">
              <Activity className="text-amber-500 shrink-0" size={15} />
              <span>Simulasi Nabung Mandiri vs Paylater 📊</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-4">
            <p className="text-[10px] text-muted-foreground font-light leading-relaxed">
              Dibandingkan berdasarkan tarif riil paylater di Indonesia: Bunga flat{" "}
              <strong>2.95%/bulan</strong> & Admin <strong>1%</strong>.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Nabung Mandiri Option */}
              <div className="p-3.5 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    1. Nabung Mandiri (Sangat Disarankan)
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Hemat 100%
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Target Nabung:</span>
                    <span className="font-semibold text-foreground">
                      Rp {Number(targetValue || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rekomendasi Tabungan/Bulan:</span>
                    <span className="font-semibold text-emerald-600">
                      Rp {suggestedMonthlySaving.toLocaleString("id-ID")} / bulan
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rekomendasi Waktu:</span>
                    <span className="font-semibold text-foreground">{suggestedMonthsNeeded} bulan</span>
                  </div>
                  <div className="flex justify-between border-t pt-1.5 font-bold text-foreground">
                    <span>Total Pengeluaran:</span>
                    <span>Rp {Number(targetValue || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-600 font-medium">
                    <span>Bunga & Admin:</span>
                    <span>Rp 0 (Aman & Tenang!)</span>
                  </div>
                </div>
              </div>

              {/* Cicilan Paylater Options */}
              <div className="p-3.5 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 space-y-2.5">
                <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">
                  2. Pilihan Cicilan Paylater (Utang Konsumtif)
                </span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {plans.map((plan: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{plan.tenor} Bulan Cicilan</span>
                        <span className="text-[10px] text-rose-500 font-semibold">
                          Rp {plan.monthlyInstallment.toLocaleString("id-ID")}/bulan
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          Total: Rp {plan.totalPrice.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">
                          Bunga + Admin: Rp {plan.moneyWasted.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 text-xs space-y-0.5">
              <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest block">
                Konsekuensi Nyata Buat Dompetmu:
              </span>
              <p className="text-muted-foreground leading-normal font-semibold">
                {aiData.paylaterSimulation.consequencesNote}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 5. Saran Strategi Mengelola Uang */}
      <AccordionItem value="money-management-strategy" className="px-4">
        <AccordionTrigger className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <Coins className="text-amber-500 shrink-0" size={15} />
            <span>Saran Strategi Mengelola Uang 💸</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
          <div className="p-3.5 rounded-xl bg-violet-500/[0.02] border border-violet-500/10 space-y-1.5">
            <span className="text-[9px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-widest block">
              Rencana Target Nabung Masuk Akal
            </span>
            <p className="text-foreground leading-relaxed font-semibold">
              {opportunityCost.investmentAlternative}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background/55 border border-muted/20 space-y-1.5">
            <span className="text-[8px] text-muted-foreground font-extrabold uppercase tracking-wider block">
              Langkah Taktis Pengelolaan Uang
            </span>
            <p className="text-foreground leading-relaxed font-medium">
              {opportunityCost.savingAlternative}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 6. Insight Psikologis */}
      <AccordionItem value="psychological-insight" className="px-4">
        <AccordionTrigger className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <Brain className="text-sky-500 shrink-0" size={15} />
            <span>Insight Psikologis & Tips Emosional 🧠</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold">Pemicu Belanja:</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
              {psychologicalInsight.purchaseDriver}
            </span>
          </div>
          <p className="italic pl-1.5 border-l-2 text-muted-foreground leading-relaxed mt-1.5">
            "{psychologicalInsight.motivationText}"
          </p>
          <div className="p-3 rounded-lg bg-rose-500/[0.02] border border-rose-500/10 text-xs">
            <span className="text-[8px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest block mb-0.5">
              Risiko Emosional & Mental
            </span>
            <p className="text-muted-foreground leading-normal font-semibold">
              {psychologicalInsight.riskText}
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* 7. Kabar Harga Pasar */}
      {aiData.realMarketPrice && (
        <AccordionItem value="market-price" className="px-4">
          <AccordionTrigger className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
            <div className="flex items-center gap-2">
              <Sparkles className="text-violet-500 shrink-0" size={15} />
              <span>Kabar Harga Real di Pasar 🏷️</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
            <div className="p-3.5 bg-violet-600/[0.02] border rounded-xl space-y-1.5">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                <span>Estimasi Harga Pasar:</span>
                <span className="text-violet-600 dark:text-violet-400 font-extrabold">
                  {aiData.realMarketPrice}
                </span>
              </div>
              {aiData.priceComparisonNote && (
                <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t pt-1 mt-1">
                  💡 {aiData.priceComparisonNote}
                </p>
              )}
            </div>

            {aiData.alternativeSuggestions && aiData.alternativeSuggestions.length > 0 && (
              <div className="p-3.5 bg-emerald-500/[0.02] border rounded-xl space-y-2">
                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={12} className="shrink-0 text-emerald-500" />
                  Pilihan Alternatif yang Lebih Bersahabat 💡
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
                  {aiData.alternativeSuggestions.map((item: string, index: number) => (
                    <li key={index}>
                      <span className="text-foreground font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {/* 8. Taktik Keuangan & Rencana Aksi */}
      <AccordionItem value="tactics-sacrifice" className="px-4">
        <AccordionTrigger className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
          <div className="flex items-center gap-2">
            <Flame className="text-violet-500 shrink-0" size={15} />
            <span>Taktik Keuangan & Rencana Aksi 📈</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground leading-relaxed">
          {/* Tactics */}
          <div className="p-3 rounded-xl bg-background/55 border border-muted/20 space-y-1">
            <h5 className="text-[9px] font-bold text-foreground flex items-center gap-1 uppercase tracking-widest">
              Taktik Keuangan Biar Dompet Sehat
            </h5>
            <p className="leading-normal text-foreground font-medium">{aiData.emergencyMode.strategy}</p>
          </div>

          {/* Sacrifice List */}
          {aiData.sacrificeTransparency && aiData.sacrificeTransparency.length > 0 && (
            <div className="p-3 rounded-xl bg-background/55 border border-muted/20 space-y-2">
              <h5 className="text-[9px] font-bold text-foreground flex items-center gap-1 uppercase tracking-widest">
                Rekomendasi Pemangkasan Jajan / Pos Belanja
              </h5>
              {aiData.sacrificeTransparency.slice(0, 2).map((sacrifice: any, index: number) => (
                <div
                  key={index}
                  className="space-y-1 text-xs border border-muted/20 p-2.5 rounded-lg bg-background/55"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      Pos:{" "}
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {sacrifice.item}
                      </span>
                    </span>
                    {sacrifice.nominalToCut && (
                      <span className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[9px]">
                        Potong Rp {sacrifice.nominalToCut.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1 pl-3 list-disc text-[10px] text-muted-foreground">
                    {sacrifice.reasons.map((reason: string, rIdx: number) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
