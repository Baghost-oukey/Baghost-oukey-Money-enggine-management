"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  label: string;
  subLabel?: string;
  amount: number;
  pct: number;
}

interface SaranStrategiMengelolaUangProps {
  targetValue: string;
  suggestedDailySaving: number;
  suggestedDaysNeeded: number;
  suggestedMonthlySaving: number;
  suggestedMonthsNeeded: number;
  monthStep: number;
  dailyTimeline: TimelineStep[];
  monthlyTimeline: TimelineStep[];
  remainingBudget: number;
  opportunityCost: {
    investmentAlternative: string;
    savingAlternative: string;
  };
}

export function SaranStrategiMengelolaUang({
  targetValue,
  suggestedDailySaving,
  suggestedDaysNeeded,
  suggestedMonthlySaving,
  suggestedMonthsNeeded,
  monthStep,
  dailyTimeline,
  monthlyTimeline,
  remainingBudget,
  opportunityCost,
}: SaranStrategiMengelolaUangProps) {
  const targetValNum = Number(targetValue || 0);
  const canBuyImmediately = remainingBudget > 0 && targetValNum <= remainingBudget * 0.3;

  return (
    <AccordionItem value="money-management-strategy" className="px-4">
      <AccordionTrigger className="text-sm font-semibold  hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Strategi Pengelolaan Uang </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-3 text-xs leading-relaxed">
        {canBuyImmediately ? (
          /* Success/Instant Buy Card */
          <div className="p-4 rounded-xl  border space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest block">
              Bisa Langsung Beli Tunai!
            </span>
            <p className="text-foreground leading-relaxed font-semibold">
              Kamu tidak perlu menabung bertahap atau berutang! Uang bulananmu sebesar{" "}
              <span className="text-emerald-600 font-bold">Rp {remainingBudget.toLocaleString("id-ID")}</span>{" "}
              sangat cukup untuk langsung membeli barang seharga{" "}
              <span className="text-emerald-600 font-bold">Rp {targetValNum.toLocaleString("id-ID")}</span>{" "}
              secara tunai bulan ini.
            </p>
            <p className="text-[10px] text-muted-foreground italic leading-normal">
              💡 Keuanganmu berada dalam kondisi prima untuk rencana transaksi ini. Lakukan pembelian tunai secara penuh agar bebas dari kecemasan tagihan dan bunga cicilan di bulan-bulan mendatang.
            </p>
          </div>
        ) : (
          /* Daily & Monthly Saving Target Recommendation */
          <div className="p-2 rounded-xl space-y-2">
            <span className="text-xs font-semibold uppercase block">
              Rencana Target Nabung Terbaik (Harian vs Bulanan)
            </span>

            {/* Warning when it fits the monthly surplus but eats too much buffer (>30% and <= 100%) */}
            {remainingBudget > 0 && targetValNum > remainingBudget * 0.3 && targetValNum <= remainingBudget && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 font-semibold space-y-1">
                <span className="font-extrabold uppercase tracking-wider block text-amber-600 dark:text-amber-400">⚠️ Peringatan Buffer Keuangan</span>
                <p className="text-foreground leading-relaxed font-semibold">
                  Meskipun sisa anggaran bulananmu sebesar <span className="text-amber-600 dark:text-amber-400 font-bold">Rp {remainingBudget.toLocaleString("id-ID")}</span> mencukupi untuk membeli barang seharga <span className="text-amber-600 dark:text-amber-400 font-bold">Rp {targetValNum.toLocaleString("id-ID")}</span> secara tunai, pembelian langsung bulan ini akan menghabiskan sekitar <span className="text-rose-600 dark:text-rose-400 font-extrabold">{Math.round((targetValNum / remainingBudget) * 100)}%</span> dari seluruh sisa uang cadanganmu.
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                  Untuk keamanan finansial harianmu agar tidak defisit, sangat direkomendasikan untuk membagi pengeluaran ini dengan menabung selama estimasi durasi di bawah daripada langsung menghabiskan seluruh sisa budget bulan ini.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground font-semibold text-xs">
              {/* Daily Savings Block */}
              <div className="p-3 rounded-lg bg-background/55 border border-muted/20 space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Tabungan Harian:</span>
                  <span className="text-emerald-600 font-extrabold text-sm block">
                    Rp {suggestedDailySaving.toLocaleString("id-ID")} / hari
                  </span>
                  <span className="text-[10px] text-foreground font-semibold block pt-0.5 border-t">
                    Estimasi Durasi: <span className="font-extrabold text-emerald-600">{suggestedDaysNeeded} hari</span>
                  </span>
                </div>

                {/* Daily Timeline */}
                <div className="pt-2 border-t border-muted/20 space-y-2">
                  <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                    Peta Jalan Harian (Tiap 60 Hari) 📅
                  </span>
                  <div className="relative pl-3 border-l border-emerald-500/20 space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                    {dailyTimeline.map((step, idx) => (
                      <div key={idx} className="relative space-y-0.5">
                        <div className={cn(
                          "absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full border border-emerald-500 bg-card",
                          step.pct === 100 ? "bg-emerald-500" : "bg-card"
                        )} />
                        <div className="flex justify-between text-[9px] font-semibold text-foreground">
                          <span>{step.label}</span>
                          <span>Rp {step.amount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${step.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Monthly Savings Block */}
              <div className="p-3 rounded-lg bg-background/55 border border-muted/20 space-y-3">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Tabungan Bulanan:</span>
                  <span className="text-emerald-600 font-extrabold text-sm block">
                    Rp {suggestedMonthlySaving.toLocaleString("id-ID")} / bulan
                  </span>
                  <span className="text-[10px] text-foreground font-semibold block pt-0.5 border-t">
                    Estimasi Durasi: <span className="font-extrabold text-emerald-600">~{suggestedMonthsNeeded} bulan</span>
                  </span>
                </div>

                {/* Monthly Timeline */}
                <div className="pt-2 border-t border-muted/20 space-y-2">
                  <span className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                    Peta Jalan Bulanan ({monthStep} Bulan Sekali) 🗓️
                  </span>
                  <div className="relative pl-3 border-l border-emerald-500/20 space-y-2.5 max-h-[150px] overflow-y-auto pr-1">
                    {monthlyTimeline.map((step, idx) => (
                      <div key={idx} className="relative space-y-0.5">
                        <div className={cn(
                          "absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full border border-emerald-500 bg-card",
                          step.pct === 100 ? "bg-emerald-500" : "bg-card"
                        )} />
                        <div className="flex justify-between text-[9px] font-semibold text-foreground">
                          <span className="truncate max-w-[100px] sm:max-w-none">{step.label}</span>
                          <span>Rp {step.amount.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${step.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal italic">
              💡 Strategi ini dihitung secara realistis mengambil {remainingBudget > 0 ? "60% dari sisa anggaran bulananmu" : "standar hemat pos pengeluaran bulananmu"} agar kebutuhan pokok harianmu tidak terganggu.
            </p>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-violet-500/[0.02] border border-violet-500/10 space-y-1.5">
          <span className="text-[9px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-widest block">
            {canBuyImmediately ? "Rencana Alokasi Anggaran Sehat 📈" : "Rencana Target Nabung Masuk Akal"}
          </span>
          <p className="text-foreground leading-relaxed font-semibold">
            {canBuyImmediately 
              ? `Karena barang ini bisa langsung dibeli tunai, sisa uang anggaranmu bulan ini sebesar Rp ${(remainingBudget - targetValNum).toLocaleString("id-ID")} dapat dialokasikan langsung untuk memperkuat tabungan atau investasi jangka panjang!`
              : opportunityCost.investmentAlternative
            }
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
  );
}
