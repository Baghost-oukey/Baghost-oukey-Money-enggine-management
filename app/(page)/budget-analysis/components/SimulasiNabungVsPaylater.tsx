"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Activity } from "lucide-react";

interface SavingOption {
  label: string;
  dailySaving: number;
  daysNeeded: number;
  monthsNeeded: number;
}

interface PaylaterPlan {
  tenor: number;
  monthlyInstallment: number;
  totalPrice: number;
  interestAmount: number;
  adminFee: number;
  moneyWasted: number;
}

interface SimulasiNabungVsPaylaterProps {
  savingOptions: SavingOption[];
  plans: PaylaterPlan[];
  targetValue: string;
  consequencesNote?: string;
}

export function SimulasiNabungVsPaylater({
  savingOptions,
  plans,
  targetValue,
  consequencesNote,
}: SimulasiNabungVsPaylaterProps) {
  return (
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
          <div className="p-3.5 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                1. Nabung Mandiri (Sangat Disarankan)
              </span>
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                Hemat 100%
              </span>
            </div>
            
            <div className="space-y-2">
              {savingOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-foreground block">{opt.label}</span>
                    <span className="text-[10px] text-emerald-600 font-extrabold">
                      Rp {opt.dailySaving.toLocaleString("id-ID")}/hari
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block font-medium">
                      {opt.daysNeeded} hari (~{opt.monthsNeeded} bulan)
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      Bunga: Rp 0
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
              <div className="flex justify-between">
                <span>Target Barang:</span>
                <span className="font-semibold text-foreground">
                  Rp {Number(targetValue || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-emerald-600 font-medium">
                <span>Biaya Tambahan:</span>
                <span>Rp 0 (Bebas Cicilan!)</span>
              </div>
            </div>
          </div>

          {/* Cicilan Paylater Options */}
          <div className="p-3.5 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 space-y-2.5">
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wide block">
              2. Pilihan Cicilan Paylater (Utang Konsumtif)
            </span>
            <div className="space-y-2">
              {plans.map((plan, idx) => (
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

        {consequencesNote && (
          <div className="p-2.5 rounded-xl bg-rose-500/[0.02] border border-rose-500/10 text-xs space-y-0.5">
            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest block">
              Konsekuensi Nyata Buat Dompetmu:
            </span>
            <p className="text-muted-foreground leading-normal font-semibold">
              {consequencesNote}
            </p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
