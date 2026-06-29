import React from "react";
import { Coins, Target, TrendingUp, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DynamicInput, { Expense } from "@/components/inputState";
import { DatePicker } from "@/components/datepicker";

interface BudgetFormProps {
  budget: string;
  setBudget: (value: string) => void;
  budgetPeriod: "bulanan" | "harian";
  setBudgetPeriod: (value: "bulanan" | "harian") => void;
  target: string;
  setTarget: (value: string) => void;
  targetValue: string;
  setTargetValue: (value: string) => void;
  targetDate: string;
  setTargetDate: (value: string) => void;
  jenisTarget: string;
  setJenisTarget: (value: string) => void;
  keteranganTambahan: string;
  setKeteranganTambahan: (value: string) => void;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  isLoading: boolean;
  onRemoveExpense: (index: number) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  status: string;
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-violet-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-1.5", className)}>{children}</div>
);

export function BudgetForm({
  budget,
  setBudget,
  budgetPeriod,
  setBudgetPeriod,
  target,
  setTarget,
  targetValue,
  setTargetValue,
  targetDate,
  setTargetDate,
  jenisTarget,
  setJenisTarget,
  keteranganTambahan,
  setKeteranganTambahan,
  expenses,
  setExpenses,
  isLoading,
  onRemoveExpense,
  onSubmit,
  status,
}: BudgetFormProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/25 backdrop-blur-md p-5 sm:p-6 shadow-sm transition-all duration-300">
      <h2 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2 tracking-tight">
        Formulir Data <span className="text-violet-600">Finansial</span>
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Tipe Pendapatan Selector */}
        <LabelInputContainer>
          <Label className="text-xs font-semibold uppercase tracking-wider">
            Tipe Pendapatan / Keuangan
          </Label>
          <div className="grid grid-cols-2 gap-2 h-10">
            <button
              type="button"
              onClick={() => setBudgetPeriod("bulanan")}
              className={cn(
                "text-[10px] font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
                budgetPeriod === "bulanan"
                  ? "border-violet-600 bg-violet-600/[0.04] text-violet-600 ring-2 ring-violet-500/10 font-black"
                  : "border-muted-foreground/15 bg-card/50 text-muted-foreground hover:border-violet-500/50"
              )}
            >
              <Calendar size={13} />
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setBudgetPeriod("harian")}
              className={cn(
                "text-[10px] font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5",
                budgetPeriod === "harian"
                  ? "border-violet-600 bg-violet-600/[0.04] text-violet-600 ring-2 ring-violet-500/10 font-black"
                  : "border-muted-foreground/15 bg-card/50 text-muted-foreground hover:border-violet-500/50"
              )}
            >
              <Coins size={13} />
              Harian (Uang Jajan)
            </button>
          </div>
        </LabelInputContainer>

        {/* Budget Input */}
        <LabelInputContainer>
          <Label htmlFor="budgetInput" className="text-xs font-semibold uppercase tracking-wider">
           <span className="text-violet-600 font-bold">Uang</span> {budgetPeriod === "harian" ? "Harian" : "Bulanan"} Anda
          </Label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-light group-focus-within:text-violet-600 transition-colors">
              Rp
            </span>
            <Input
              id="budgetInput"
              type="number"
              placeholder={budgetPeriod === "harian" ? "Contoh: 50000" : "Contoh: 5000000"}
              className="pl-10 h-10 transition-all rounded-xl text-xs"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </LabelInputContainer>

        {/* Target Name & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabelInputContainer>
            <Label htmlFor="targetGoals" className="text-xs font-semibold uppercase tracking-wider">
              Apa <span className="text-violet-600 font-bold">Tujuan</span> mu?
            </Label>
            <Input
              id="targetGoals"
              placeholder="Contoh: Membeli Laptop Baru, Dana..."
              type="text"
              className="h-10 transition-all rounded-xl text-xs"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label className="text-xs font-semibold uppercase tracking-wider">
              Kategori Belanja
            </Label>
            <div className="grid grid-cols-2 gap-2 h-10">
              <button
                type="button"
                onClick={() => setJenisTarget("Kebutuhan")}
                className={cn(
                  "text-[10px] font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center",
                  jenisTarget === "Kebutuhan"
                    ? "border-violet-600 bg-violet-600/[0.04] text-violet-600 ring-2 ring-violet-500/10 font-black"
                    : "border-muted-foreground/15 bg-card/50 text-muted-foreground hover:border-violet-500/50"
                )}
              >
                Kebutuhan
              </button>
              <button
                type="button"
                onClick={() => setJenisTarget("Keinginan")}
                className={cn(
                  "text-[10px] font-bold rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center",
                  jenisTarget === "Keinginan"
                    ? "border-violet-600 bg-violet-600/[0.04] text-violet-600 ring-2 ring-violet-500/10 font-black"
                    : "border-muted-foreground/15 bg-card/50 text-muted-foreground hover:border-violet-500/50"
                )}
              >
                Keinginan
              </button>
            </div>
          </LabelInputContainer>
        </div>

        {/* Target Value & Date Group */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LabelInputContainer>
            <Label htmlFor="targetValue" className="text-xs font-semibold uppercase tracking-wider">
              Nominal <span className="text-violet-600 font-bold">Target</span> Pencapaian
            </Label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground group-focus-within:text-violet-600 transition-colors">
                Rp
              </span>
              <Input
                id="targetValue"
                type="number"
                placeholder="Contoh: 15000000"
                className="pl-10 h-10 rounded-xl text-sm"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </LabelInputContainer>

          <LabelInputContainer>
            <Label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              Kapan Rencana Membeli ?
            </Label>
            <DatePicker
              value={targetDate ? new Date(targetDate) : undefined}
              onChange={(date) => {
                if (date) {
                  const yyyy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  setTargetDate(`${yyyy}-${mm}-${dd}`);
                } else {
                  setTargetDate("");
                }
              }}
              placeholder="Pilih tanggal rencana"
              className="h-10 transition-all rounded-xl text-xs"
            />
          </LabelInputContainer>
        </div>

        {/* Keterangan Tambahan / Curhatan Finansial */}
        <LabelInputContainer>
          <Label htmlFor="keteranganTambahan" className="text-xs font-semibold uppercase tracking-wider">
            Keterangan Tambahan & Curhatan Finansial
          </Label>
          <textarea
            id="keteranganTambahan"
            value={keteranganTambahan}
            onChange={(e) => setKeteranganTambahan(e.target.value)}
            placeholder="Ceritakan kondisi atau alasan keuanganmu di sini (misal: 'Sebenarnya aku mau pake paylater karena butuh cepat untuk kerja, tapi pengeluaranku lagi banyak banget...')"
            rows={4}
            className="w-full p-3 text-xs bg-background border border-muted-foreground/15 rounded-xl outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-text dark:bg-zinc-900 resize-none font-light leading-relaxed"
          />
        </LabelInputContainer>

        {/* Submit Button */}
        <button
          className={cn(
            "group/btn relative block h-10.5 w-full rounded-xl bg-violet-600 text-white text-sm font-bold shadow-md transition-all duration-200 cursor-pointer",
            "hover:bg-violet-700 active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            (status === "loading" || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          type="submit"
          disabled={status === "loading" || isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Memproses Analisis...
              </>
            ) : (
              <>
                Analisis Sekarang
              </>
            )}
          </span>
          <BottomGradient />
        </button>
      </form>
    </div>
  );
}
