import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BudgetInputFormProps {
  salary: string;
  setSalary: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  status: string;
}

export function BudgetInputForm({
  salary,
  setSalary,
  notes,
  setNotes,
  onSubmit,
  status,
}: BudgetInputFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full max-w-7xl mx-auto py-6">

      <div className="lg:col-span-7 space-y-6 text-left px-10 pt-10 pb-12 border border-muted-foreground/20 rounded-3xl bg-card/10 relative overflow-hidden">

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
                type="text"
                placeholder="Contoh: 6.000.000"
                className="pl-12 h-12 rounded-xl text-base"
                value={salary}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const clean = e.target.value.replace(/[^\d]/g, "");
                  const formatted = clean ? new Intl.NumberFormat("id-ID").format(Number(clean)) : "";
                  setSalary(formatted);
                }}
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
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-10 rounded-2xl h-11 text-xs font-black cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center shadow-violet-500/10 hover:shadow-violet-500/20"
            >
              Hasilkan
            </Button>
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
