"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ShieldAlert, Lightbulb, Loader2 } from "lucide-react";
import {
  analyzeDailySavings,
  analyzeMonthlySavings,
  generateSavingsTimelines,
  calculateSavingOptions
} from "../analysisUtils";
import { SavingStrategyCard } from "./SavingStrategyCard";
import { TimelineStep } from "./MinimalTimelineList";

interface SaranStrategiMengelolaUangProps {
  decisionId: string;
  targetValue: string;
  remainingBudget: number;
  totalExpenses?: number;
  monthlyBudget?: number;
  jenisTarget?: string;
  keteranganTambahan?: string;
}

export function SaranStrategiMengelolaUang({
  decisionId,
  targetValue,
  remainingBudget,
  totalExpenses = 0,
  monthlyBudget,
  jenisTarget = "Keinginan",
  keteranganTambahan,
}: SaranStrategiMengelolaUangProps) {
  const targetValNum = Number(targetValue || 0);
  const surplus = remainingBudget;
  const income = monthlyBudget || (surplus + totalExpenses);
  const canBuyImmediately = surplus > 0 && targetValNum <= surplus * 0.3;

  // Suggested dynamic saving target and months calculation
  let suggestedMonthlySaving = 0;
  let suggestedMonthsNeeded = 12;

  if (surplus > 0) {
    suggestedMonthlySaving = Math.round(surplus * 0.6);
    if (suggestedMonthlySaving > 0) {
      suggestedMonthsNeeded = Math.ceil(targetValNum / suggestedMonthlySaving);
    }
    if (suggestedMonthsNeeded <= 0) suggestedMonthsNeeded = 1;
  } else {
    suggestedMonthlySaving = 300000;
    suggestedMonthsNeeded = Math.ceil(targetValNum / suggestedMonthlySaving);
  }

  // Calculate saving options dynamically
  const savingOptions = calculateSavingOptions(surplus, targetValue);

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

  // Run AI analysis logic (defined in analysisUtils.ts)
  const daily = analyzeDailySavings(
    surplus,
    suggestedDailySaving,
    suggestedDaysNeeded,
    targetValNum,
    jenisTarget
  );

  const monthly = analyzeMonthlySavings(
    surplus,
    suggestedMonthlySaving,
    suggestedMonthsNeeded,
    targetValNum,
    income
  );

  // Lazy load opportunity cost from backend
  const [loading, setLoading] = useState(true);
  const [opportunityCost, setOpportunityCost] = useState({
    investmentAlternative: "",
    savingAlternative: ""
  });

  useEffect(() => {
    let isMounted = true;
    async function loadOpportunityCost() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/saving?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setOpportunityCost(json.data);
        }
      } catch (err) {
        console.error("Failed to load opportunity cost:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOpportunityCost();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  return (
    <AccordionItem value="money-management-strategy" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Saran Ku untuk mu jika kamu milih menabung</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-4 text-xs leading-relaxed">
        {canBuyImmediately ? (
          /* Success/Instant Buy Card */
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest block text-emerald-600">
              Rekomendasi Terbaik: Langsung Beli Tunai! 🎉
            </span>
            <p className="text-foreground leading-relaxed font-semibold">
              Kamu tidak perlu bersusah payah menabung bertahap atau tergiur utang cicilan! Sisa uang peganganmu bulan ini sebesar{" "}
              <span className="text-emerald-600 font-bold">Rp {surplus.toLocaleString("id-ID")}</span>{" "}
              sangat aman untuk langsung digunakan membeli barang seharga{" "}
              <span className="text-emerald-600 font-bold">Rp {targetValNum.toLocaleString("id-ID")}</span>{" "}
              secara tunai penuh bulan ini.
            </p>
            <div className="pt-2 border-t border-emerald-500/10 text-[10px] text-muted-foreground leading-normal flex gap-1.5 items-start">
              <Lightbulb size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <span>
                <strong>Kenapa Cash Lebih Enak?</strong> Membeli secara tunai melindungimu dari jeratan bunga paylater, biaya administrasi bulanan, dan kecemasan tagihan berulang. Ini adalah keputusan paling aman untuk keuanganmu saat ini.
              </span>
            </div>
          </div>
        ) : (
          /* Daily & Monthly Saving Target Recommendation */
          <div className="space-y-4">
            {/* Warning when it fits the monthly surplus but eats too much buffer (>30% and <= 100%) */}
            {surplus > 0 && targetValNum > surplus * 0.3 && targetValNum <= surplus && (
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 font-semibold space-y-1.5">
                <span className="font-extrabold uppercase tracking-wider block text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <ShieldAlert size={12} />
                  ⚠️ Hati-hati, Pegangan Uang Bulanan Bisa Mepet
                </span>
                <p className="text-foreground leading-relaxed font-semibold">
                  Meskipun sisa uang bulananmu sebesar <span className="text-amber-600 dark:text-amber-400 font-bold">Rp {surplus.toLocaleString("id-ID")}</span> cukup buat beli barang seharga <span className="text-amber-600 dark:text-amber-400 font-bold">Rp {targetValNum.toLocaleString("id-ID")}</span> langsung bulan ini, tindakan tersebut bakal menghabiskan <span className="text-rose-600 dark:text-rose-400 font-extrabold">{Math.round((targetValNum / surplus) * 100)}%</span> dari seluruh sisa uang cadanganmu.
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                  Biar kalau ada kebutuhan mendadak kamu nggak pusing, sangat disarankan untuk membagi pengeluaran ini dengan menabung secara bertahap daripada langsung menghabiskan sisa uang peganganmu bulan ini.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Savings Card */}
              <SavingStrategyCard
                title="Jalan Nabung Harian"
                rateText={`Rp ${suggestedDailySaving.toLocaleString("id-ID")} / hari`}
                durationText={` ${suggestedDaysNeeded} hari`}
                status={daily.status}
                badgeClass={daily.badgeClass}
                impactMessage={daily.message}
                considerations={
                  <>
                    <p>{daily.lifestyleCut}.</p>
                    <p className="mt-1">{daily.reason}</p>
                    {keteranganTambahan && (
                      <p className="text-violet-500 italic mt-1 font-semibold">
                        Catatan Tambahanmu: "{keteranganTambahan}"
                      </p>
                    )}
                  </>
                }
                options={daily.options}
                timeline={dailyTimeline}
                timelineTitle="Peta Jalan Harian"
              />

              {/* Monthly Savings Card */}
              <SavingStrategyCard
                title="Jalan Nabung Bulanan"
                rateText={`Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} / bulan`}
                durationText={`🗓️ ~${suggestedMonthsNeeded} bulan`}
                status={monthly.status}
                badgeClass={monthly.badgeClass}
                impactMessage={monthly.message}
                considerations={
                  <>
                    <p>{monthly.reason}</p>
                    <p className="mt-1">
                      Nabung bulanan itu melatih kedisiplinan keuangan bulananmu. Dengan memisahkan dananya di awal bulan, uangmu nggak bakal gampang menguap buat jajan tidak terduga.
                    </p>
                  </>
                }
                options={monthly.options}
                timeline={monthlyTimeline}
                timelineTitle="Peta Jalan Bulanan"
              />
            </div>

            <p className="text-[10px] text-muted-foreground leading-normal italic text-center">
              Strategi ini dihitung secara realistis mengambil {surplus > 0 ? "60% dari sisa uang bulananmu" : "standar aman kelayakan tabungan"} agar pengeluaran pokok harianmu tetap aman berjalan.
            </p>
          </div>
        )}

        {/* Dynamic Opportunity Cost Block */}
        <div className="p-3.5 rounded-xl bg-violet-500/[0.02] border border-violet-500/10 space-y-1.5">
          <span className="text-[9px] text-violet-600 dark:text-violet-400 font-extrabold uppercase tracking-widest block">
            {canBuyImmediately ? "Rencana Alokasi Uang Biar Dompet Sehat 📈" : "Cara Nabung yang Masuk Akal"}
          </span>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Membuat rencana menabung yang sehat...</span>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed font-semibold">
              {canBuyImmediately
                ? `Karena barangnya bisa langsung dibeli tunai, sisa uang peganganmu bulan ini sebesar Rp ${(surplus - targetValNum).toLocaleString("id-ID")} bisa kamu alokasikan langsung buat memperkuat tabungan atau investasi biar makin berkembang!`
                : opportunityCost.investmentAlternative
              }
            </p>
          )}
        </div>

        {/* Dynamic Saving Action Step Block */}
        <div className="p-3 rounded-lg bg-background/55 border border-muted/20 space-y-1.5">
          <span className="text-[8px] text-muted-foreground font-extrabold uppercase tracking-wider block">
            Langkah Taktis Ngatur Uang Bulanan
          </span>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Membuat saran pengelolaan uang...</span>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed font-medium">
              {opportunityCost.savingAlternative}
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
