"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

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
  remainingBudget?: number;
  monthlyBudget?: number;
}

export function SimulasiNabungVsPaylater({
  savingOptions,
  plans,
  targetValue,
  consequencesNote,
  remainingBudget,
  monthlyBudget,
}: SimulasiNabungVsPaylaterProps) {
  return (
    <AccordionItem value="paylater-simulation" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center">
          <span>Simulasi: Nabung vs Nyicil (Paylater) 📊</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5">
        <p className="text-xs font-light leading-relaxed text-gray-700">
          Perbadingan ini bersifat Asumsi Yang Telah ai Berikan Berdasarkan data data cicilan paylater di Indonesia, dan bisa berbeda beda tiap wilayah : Bunga flat{" "}
          <strong>2.95% per bulan</strong> & Admin <strong>1%</strong>.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Nabung Mandiri Option */}
          <div className="p-3.5 rounded-xl border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide">
                1. Jika Kamu Memutuskan Menabung Sendiri
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                Hemat 100%
              </span>
            </div>
            
            <div className="space-y-1">
              {savingOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-light text-foreground block">{opt.label}</span>
                    <span className="text-[10px] font-semibold">
                      Rp {opt.dailySaving.toLocaleString("id-ID")} per hari
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block font-medium">
                     Estimasi {opt.daysNeeded} hari  atau {opt.monthsNeeded} bulan
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-xs text-gray-600 border-t pt-2">
              <div className="flex justify-between">
                <span>Target Barang:</span>
                <span className="font-semibold text-foreground">
                  Rp {Number(targetValue || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Cicilan Paylater Options */}
          <div className="p-3.5 rounded-xl  border space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide block">
              2. Pilihan Jika Kamu Mengajukan Cicilan Atau Paylater
            </span>
            <div className="space-y-2 mt-3">
              {plans.map((plan, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center "
                >
                  <div>
                    <span className="font-light text-foreground block">{plan.tenor} Bulan Cicilan</span>
                    <span className="text-[10px] font-semibold text-foreground">
                      Rp {plan.monthlyInstallment.toLocaleString("id-ID")}/bulan
                    </span>
                    {remainingBudget !== undefined && (
                      <span className={cn(
                        "inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none",
                        plan.monthlyInstallment <= remainingBudget
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : plan.monthlyInstallment <= (monthlyBudget || (remainingBudget * 3))
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse"
                      )}>
                        {plan.monthlyInstallment <= remainingBudget
                          ? "Realisasi: Sangat Mungkin ✅"
                          : plan.monthlyInstallment <= (monthlyBudget || (remainingBudget * 3))
                          ? "Realisasi: Berat (Butuh Penghematan) ⚠️"
                          : "Realisasi: Tidak Masuk Akal/Beban Berlebih ❌"}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] text-gray-600 block font-bold">
                      Total: Rp {plan.totalPrice.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">
                      Perkiraan Bunga + Admin: Rp {plan.moneyWasted.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {consequencesNote && (
          <div className="p-2.5 rounded-xl  border text-red-500 text-xs space-y-0.5">
            <span className="text-md font-bold uppercase block mx-4">
              Catatan Saran Buat Mu :
            </span>
            <p className="leading-normal font-medium text-justify mt-1 mx-4">
              {consequencesNote}
            </p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
