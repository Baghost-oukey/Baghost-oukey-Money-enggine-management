import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "./LoadingScreen";

interface BudgetInputFormProps {
  salary: string;
  setSalary: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: string;
  isLoading: boolean;
  loadingMessage: string;
}

export function BudgetInputForm({
  salary,
  setSalary,
  notes,
  setNotes,
  onSubmit,
  status,
  isLoading,
  loadingMessage,
}: BudgetInputFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full max-w-7xl mx-auto py-6">

      <div className="lg:col-span-7 space-y-6 text-left px-10 pt-10 pb-12 border border-muted-foreground/20 rounded-3xl bg-card/10 relative overflow-hidden">
        
        {/* Loading Overlay inside the Form Container only (no background blur) */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/70 flex items-center justify-center rounded-3xl">
            <LoadingScreen message={loadingMessage} />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-medium">
            <span className="text-violet-600">AI Analisis Budgeting</span> membantu menentukan pengeluaran bulanan
          </h2>
          <p className="text-sm font-light leading-relaxed max-w-xl">
            membantu kamu dalam melakukan menentukan pengeluaran bulanan dengan menggunakan AI
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={onSubmit} className="space-y-5 max-w-xl">

          {/* Salary Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              Input Gaji Kamu
            </label>
            <div className="relative">
              <p className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold">
                Rp
              </p>
              <Input
                type="number"
                placeholder="Contoh: 6000000"
                className="pl-12 h-12 rounded-xl text-base"
                value={salary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalary(e.target.value)}
              />
            </div>
          </div>

          {/* Additional Notes Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              Keterangan tambahan
            </label>
            <textarea
              placeholder="Contoh: Saya anak kos di Jakarta, punya tanggungan cicilan motor 500rb per bulan, dan ingin fokus menabung dana darurat."
              className="flex min-h-[100px] w-full rounded-xl border text-xs p-3 leading-relaxed placeholder:text-muted-foreground"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit action */}
          <div className="pt-2">
            {status !== "authenticated" ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400">
                <span>Kamu harus masuk (login) terlebih dahulu untuk membuat rencana anggaran AI.</span>
              </div>
            ) : (
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white px-10 rounded-xl h-11 text-xs font-bold cursor-pointer transition-all duration-200 hover:scale-[1.01] shadow-md flex items-center justify-center "
              >
                Hasilkan
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Right Column: Hero Visual Asset Image */}
      <div className="lg:col-span-5 relative w-full h-[350px] lg:h-[450px] rounded-3xl overflow-hidden">
        <Image
          src="/image/asset.jpg"
          alt="Grafik Budgeting"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
      </div>

    </div>
  );
}
