"use client";

import React from "react";
import { Milestone, ShieldCheck, HelpCircle, Sparkles, RefreshCw } from "lucide-react";

export function ActionRoadmap() {
  const steps = [
    {
      phase: "Fase 1",
      title: "Bangun Bantalan Dana Darurat",
      description: "Sebelum menabung agresif untuk target barang keinginan, sisihkan minimal 1-2 bulan biaya pengeluaran esensial sebagai dana darurat agar keuanganmu tetap aman dari keadaan tidak terduga.",
      status: "Penting"
    },
    {
      phase: "Fase 2",
      title: "Otomatisasi Tabungan Sejak Hari Gajian",
      description: "Jadwalkan auto-debit tabungan ke rekening khusus di awal bulan setelah menerima uang bulanan atau gaji. Menabunglah di awal, bukan menyisakan di akhir bulan!",
      status: "Rekomendasi"
    },
    {
      phase: "Fase 3",
      title: "Substitusi Pintar & Kontrol Pengeluaran",
      description: "Gunakan data alternatif Tokopedia yang lebih murah saat budget mepet. Kurangi belanja keinginan non-esensial demi mempercepat pencapaian target impianmu.",
      status: "Eksekusi"
    }
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/60 backdrop-blur-md p-5 sm:p-6 shadow-sm space-y-6">
      {/* Glow */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-violet-500/[0.03] rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div>
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-violet-600 bg-violet-600/5 px-2 py-0.5 rounded-full border border-violet-500/10 w-fit block">
          Peta Perjalanan Target
        </span>
        <h3 className="text-sm font-extrabold text-zinc-900 mt-2 leading-none">
          Langkah Aksi Sahabat Finansialmu
        </h3>
      </div>

      {/* Steps List */}
      <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-[15px] before:w-[2px] before:bg-violet-100">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex items-start gap-4 pl-8 group">
            {/* Indicator Dot */}
            <div className="absolute left-[7px] top-1.5 w-[18px] h-[18px] rounded-full border-4 border-white bg-violet-600 shadow-sm z-10" />
            
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  {step.phase}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                  {step.status}
                </span>
              </div>
              <h4 className="text-[11px] font-bold text-zinc-900 mt-1">
                {step.title}
              </h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-normal text-justify">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
