"use client";

import React, { useState } from "react";
import { BasicStepper } from "@/components/ui/step-proration";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  Heart, 
  User, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  Target, 
  Briefcase, 
  Star, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles 
} from "lucide-react";

interface FormPlaningProps {
  onSubmit: (answers: any) => void;
  onCancel: () => void;
}

export function FormPlaning({ onSubmit, onCancel }: FormPlaningProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    tempatTinggal: "",
    penghasilan: "",
    prioritasTarget: "",
    hutangCicilan: "",
    danaDarurat: "",
  });

  const steps = [
    { label: "Tempat Tinggal", description: "Langkah 1 dari 5: Kondisi hunian" },
    { label: "Pendapatan", description: "Langkah 2 dari 5: Sifat penghasilan" },
    { label: "Prioritas Rencana", description: "Langkah 3 dari 5: Urgensi target" },
    { label: "Cicilan & Hutang", description: "Langkah 4 dari 5: Beban kewajiban" },
    { label: "Dana Darurat", description: "Langkah 5 dari 5: Fondasi cadangan" },
  ];

  const handleSelect = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const isNextDisabled = () => {
    if (step === 1) return !answers.tempatTinggal;
    if (step === 2) return !answers.penghasilan;
    if (step === 3) return !answers.prioritasTarget;
    if (step === 4) return !answers.hutangCicilan;
    if (step === 5) return !answers.danaDarurat;
    return false;
  };

  const handleNext = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);
    } else {
      onSubmit(answers);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Form */}
      <div className="text-center">
        <h4 className="text-lg font-bold text-foreground">Kuesioner Roadmap Personal</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Jawab 5 pertanyaan singkat berikut untuk memetakan rencana finansial kamu.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="bg-muted/15 border border-muted/30 rounded-xl p-3.5 shadow-sm">
        <BasicStepper activeStep={step} totalSteps={5} steps={steps} />
      </div>

      {/* Step Content Area */}
      <div className="min-h-[200px] flex flex-col justify-center py-2">
        {step === 1 && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Home size={14} className="text-violet-500" />
              1. Kondisi Tempat Tinggal Kamu?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: "Tinggal sendiri", label: "Tinggal Sendiri", icon: User, desc: "Sewa/indekos/apartemen mandiri" },
                { value: "Bersama orang tua", label: "Bersama Orang Tua", icon: Home, desc: "Tinggal bersama orang tua/keluarga besar" },
                { value: "Bersama pasangan", label: "Bersama Pasangan", icon: Heart, desc: "Suami/istri (belum memiliki anak)" },
                { value: "Bersama keluarga", label: "Bersama Keluarga", icon: Users, desc: "Keluarga inti dengan anak/kerabat" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = answers.tempatTinggal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect("tempatTinggal", opt.value)}
                    className={cn(
                      "flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.01]",
                      isSelected 
                        ? "border-violet-600 bg-violet-600/[0.03] ring-2 ring-violet-500/20"
                        : "border-muted-foreground/15 bg-card/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={isSelected ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"} />
                      <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 mt-1 leading-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Wallet size={14} className="text-violet-500" />
              2. Apakah Penghasilanmu Relatif Tetap?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: "Ya, relatif tetap", label: "Ya, Tetap", icon: TrendingUp, desc: "Karyawan swasta/PNS/pendapatan bulanan pasti" },
                { value: "Tidak, berubah-ubah", label: "Tidak, Fluktuatif", icon: TrendingDown, desc: "Freelancer/UMKM/pekerja lepas/harian" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = answers.penghasilan === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect("penghasilan", opt.value)}
                    className={cn(
                      "flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.01]",
                      isSelected 
                        ? "border-violet-600 bg-violet-600/[0.03] ring-2 ring-violet-500/20"
                        : "border-muted-foreground/15 bg-card/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={isSelected ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"} />
                      <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 mt-1 leading-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Target size={14} className="text-violet-500" />
              3. Bagaimana Urgensi/Prioritas Rencana Target Ini?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: "Keinginan pribadi", label: "Keinginan Pribadi", icon: Heart, desc: "Gaya hidup/hiburan/belanja tersier" },
                { value: "Penting", label: "Penting", icon: Star, desc: "Kebutuhan penunjang produktivitas/hidup harian" },
                { value: "Sangat penting", label: "Sangat Penting", icon: AlertCircle, desc: "Kebutuhan utama/edukasi/kesehatan mendesak" },
                { value: "Kebutuhan pekerjaan", label: "Kebutuhan Kerja", icon: Briefcase, desc: "Modal bisnis/peralatan utama mata pencaharian" },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = answers.prioritasTarget === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect("prioritasTarget", opt.value)}
                    className={cn(
                      "flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.01]",
                      isSelected 
                        ? "border-violet-600 bg-violet-600/[0.03] ring-2 ring-violet-500/20"
                        : "border-muted-foreground/15 bg-card/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={isSelected ? "text-violet-600 dark:text-violet-400" : "text-muted-foreground"} />
                      <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 mt-1 leading-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle size={14} className="text-violet-500" />
              4. Beban Cicilan atau Hutang Kamu Saat Ini?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: "Tidak ada", label: "Tidak Ada", desc: "Bebas dari kewajiban cicilan/hutang bulanan." },
                { value: "Ada, ringan", label: "Ada, Ringan", desc: "Cicilan bernilai ringan (< 20% dari budget bulanan)." },
                { value: "Ada, cukup besar", label: "Cukup Besar", desc: "Cicilan cukup berat (> 20% dari budget bulanan)." },
              ].map((opt) => {
                const isSelected = answers.hutangCicilan === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect("hutangCicilan", opt.value)}
                    className={cn(
                      "flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.01]",
                      isSelected 
                        ? "border-violet-600 bg-violet-600/[0.03] ring-2 ring-violet-500/20"
                        : "border-muted-foreground/15 bg-card/50"
                    )}
                  >
                    <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</span>
                    <span className="text-[9px] text-muted-foreground mt-1 leading-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-violet-500" />
              5. Bagaimana Ketersediaan Dana Darurat Kamu?
            </label>
            <div className="space-y-2.5">
              {[
                { value: "Belum ada", label: "Belum Ada Dana Darurat", desc: "Belum memiliki simpanan dana darurat sama sekali." },
                { value: "Kurang dari 3 bulan pengeluaran", label: "Kurang dari 3 Bulan Pengeluaran", desc: "Simpanan sudah ada, namun belum aman untuk menutupi 3 bulan pengeluaran pokok." },
                { value: "Lebih dari 3 bulan pengeluaran", label: "Aman (Lebih dari 3 Bulan)", desc: "Simpanan memadai untuk menopang kebutuhan pokok lebih dari 3 bulan." },
              ].map((opt) => {
                const isSelected = answers.danaDarurat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect("danaDarurat", opt.value)}
                    className={cn(
                      "w-full flex flex-col items-start text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/[0.01]",
                      isSelected 
                        ? "border-violet-600 bg-violet-600/[0.03] ring-2 ring-violet-500/20"
                        : "border-muted-foreground/15 bg-card/50"
                    )}
                  >
                    <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-violet-600 dark:text-violet-400" : "text-foreground")}>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center gap-3 pt-3 border-t border-muted/50">
        <Button
          type="button"
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          className="flex-1 rounded-xl h-10 text-xs font-bold border-muted/50 hover:bg-muted cursor-pointer"
        >
          {step === 1 ? "Batal" : "Kembali"}
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled()}
          className={cn(
            "flex-1 rounded-xl h-10 text-xs font-bold cursor-pointer transition-all duration-200 shadow-md",
            step === 5 
              ? "bg-violet-600 hover:bg-violet-700 text-white" 
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {step === 5 ? (
            <span className="flex items-center justify-center gap-1.5">
              <Sparkles size={13} />
              Hasilkan Roadmap
            </span>
          ) : (
            "Lanjut"
          )}
        </Button>
      </div>
    </div>
  );
}