"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateSavingOptions } from "../analysisUtils";

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
  const [savingOptions, setSavingOptions] = useState<SavingOption[]>([]);
  const [isTargetUnrealistic, setIsTargetUnrealistic] = useState(false);
  const [alternativeTargetPrice, setAlternativeTargetPrice] = useState(0);
  const [alternativeCategory, setAlternativeCategory] = useState("barang");
  const [alternativeReason, setAlternativeReason] = useState("");

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
          setSavingOptions(json.data.savingOptions || calculateSavingOptions(remainingBudget, targetValue));
          setIsTargetUnrealistic(!!json.data.isTargetUnrealistic);
          setAlternativeTargetPrice(json.data.alternativeTargetPrice || 0);
          setAlternativeCategory(json.data.alternativeCategory || "barang");
          setAlternativeReason(json.data.alternativeReason || "");
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

  return (
    <AccordionItem value="paylater-simulation" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center">
          <p>Saran Dalam Menabung</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Lagi menghitung rencana cicilan buat kamu...</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-light leading-relaxed text-gray-700">
              Bagian Ini Adalah alternatif kamu untuk mengumpulkan uang mu nih untuk mencapai impian mu, Perbandingan ini bersifat Asumsi Yang Telah ai Berikan Jika kamu Beli dengan cicil kemungkinan Bungamu : {" "}
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
                {isTargetUnrealistic && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                    <span className="font-bold block">⚠️ Rencana Nabung Disesuaikan (Lebih Realistis)</span>
                    <p>
                      Target aslimu (<strong>Rp {targetValNum.toLocaleString("id-ID")}</strong>) terlalu tinggi untuk diselesaikan dalam waktu wajar. 
                      Biar kamu lekas punya barang penunjang tugas/kerjaan, kami menyarankan target alternatif <strong>{alternativeCategory}</strong> seharga <strong>Rp {alternativeTargetPrice.toLocaleString("id-ID")}</strong> di bawah ini.
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  {savingOptions.map((opt, idx) => {
                    const monthlySavingNeeded = opt.dailySaving * 30;
                    const remB = remainingBudget ?? 0;
                    const monB = monthlyBudget ?? 0;
                    const displayTargetPrice = isTargetUnrealistic ? alternativeTargetPrice : targetValNum;
                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold text-foreground block">{opt.label}</span>
                          <span className="text-[10px] text-muted-foreground block font-medium leading-none mt-0.5">
                            Estimasi {opt.daysNeeded} hari ({opt.monthsNeeded} bulan)
                          </span>
                          <span className="text-[10px] font-semibold text-foreground block mt-1.5">
                            Rp {opt.dailySaving.toLocaleString("id-ID")}/hari (~Rp {monthlySavingNeeded.toLocaleString("id-ID")}/bln)
                          </span>
                          {remainingBudget !== undefined && (
                            <span className={cn(
                              "inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none",
                              monthlySavingNeeded <= remB
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : monthlySavingNeeded <= (monB || (remB * 3))
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse"
                            )}>
                              {monthlySavingNeeded <= remB
                                ? "Realisasi: Sangat Mungkin ✅"
                                : monthlySavingNeeded <= (monB || (remB * 3))
                                ? "Realisasi: Berat (Butuh Penghematan) ⚠️"
                                : "Realisasi: Tidak Masuk Akal/Beban Berlebih ❌"}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[12px] text-gray-600 block font-bold">
                            Total: Rp {displayTargetPrice.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            Bebas Bunga & Admin: Hemat 100%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!isTargetUnrealistic && remainingBudget !== undefined && remainingBudget > 0 && targetValNum / remainingBudget > 12 && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    💡 <strong>Tips Sahabat:</strong> Target barang ini terlalu besar dibanding budget-mu sekarang. Nabung dengan sisa uangmu saat ini (Rp {Math.round((remainingBudget ?? 0)/30).toLocaleString("id-ID")}/hari) butuh waktu <strong>{Math.ceil(targetValNum / (remainingBudget || 1))} bulan</strong>. 
                    Yuk, coba cek tab <strong>Berapa sih Harga Pasaran Aslinya?</strong> di atas untuk cari alternatif yang lebih ramah kantong!
                  </div>
                )}
                {remainingBudget !== undefined && remainingBudget <= 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-800 dark:text-rose-300 leading-relaxed">
                    ⚠️ <strong>Peringatan Penting:</strong> Saat ini keuanganmu sedang minus/defisit. Menabung tidak memungkinkan sebelum keuanganmu stabil. Silakan cek tab <strong>Taktik Hemat (Emergency Mode)</strong> untuk menyehatkan kembali budget-mu!
                  </div>
                )}

                <div className="space-y-1 text-xs text-gray-600 border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span>Target Barang:</span>
                    <div className="text-right">
                      {isTargetUnrealistic && (
                        <span className="text-[10px] line-through text-muted-foreground mr-1.5 leading-none block">
                          Rp {targetValNum.toLocaleString("id-ID")}
                        </span>
                      )}
                      <span className="font-semibold text-foreground">
                        Rp {(isTargetUnrealistic ? alternativeTargetPrice : targetValNum).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cicilan Paylater Options */}
              <div className="p-3.5 rounded-xl border space-y-2.5">
                <span className="text-xs font-semibold uppercase tracking-wide block">
                  2. Pilihan Jika Kamu Mengajukan Cicilan Atau Paylater
                </span>
                <div className="space-y-2 mt-3">
                  {plans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-background/55 border border-muted/20 text-xs flex justify-between items-center"
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
              <div className="p-2.5 rounded-xl border border-red-500/20 text-red-500 text-xs space-y-0.5 bg-red-500/[0.01]">
                <span className="text-md font-bold uppercase block mx-4">
                  Catatan Saran Buat Mu:
                </span>
                <p className="leading-normal font-medium text-justify mt-1 mx-4">
                  {consequencesNote}
                </p>
              </div>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
