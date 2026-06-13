import React from "react";
import { Coins, Target, TrendingUp, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import DynamicInput, { Expense } from "@/components/inputState";
import { ExpenseChips } from "./ExpenseChips";

interface BudgetFormProps {
  budget: string;
  setBudget: (value: string) => void;
  target: string;
  setTarget: (value: string) => void;
  targetValue: string;
  setTargetValue: (value: string) => void;
  targetDate: string;
  setTargetDate: (value: string) => void;
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
  target,
  setTarget,
  targetValue,
  setTargetValue,
  targetDate,
  setTargetDate,
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
        {/* Budget Input */}
        <LabelInputContainer>
          <Label htmlFor="budgetBulanan" className="text-xs font-semibold uppercase tracking-wider">
           <span className="text-violet-600 font-bold">Uang</span> Bulanan Anda
          </Label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-light group-focus-within:text-violet-600 transition-colors">
              Rp
            </span>
            <Input
              id="budgetBulanan"
              type="number"
              placeholder="Contoh: 5000000"
              className="pl-10 h-10 transition-all rounded-xl text-xs"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </LabelInputContainer>

        {/* Target Name */}
        <LabelInputContainer>
          <Label htmlFor="targetGoals" className="text-xs font-semibold uppercase tracking-wider">
            Apa <span className="text-violet-600 font-bold">Tujuan</span> mu?
          </Label>
          <Input
            id="targetGoals"
            placeholder="Contoh: Membeli Laptop Baru, Dana Darurat, Investasi..."
            type="text"
            className="h-10 transition-all rounded-xl text-xs"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </LabelInputContainer>

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
            <Label htmlFor="dateAwal" className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              Kapan Rencana Anda <span className="text-violet-600 font-bold">Membeli ?</span>
            </Label>
            <Input
              id="dateAwal"
              type="date"
              className="h-10 transition-all rounded-xl text-sm"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </LabelInputContainer>
        </div>

        {/* Expenses Manager Section */}
        <LabelInputContainer>
          <Label className="text-xs font-semibold uppercase tracking-wider mb-4">Daftar Pengeluaran Bulanan</Label>
          <DynamicInput expenses={expenses} setExpenses={setExpenses} />
          <ExpenseChips expenses={expenses} onRemove={onRemoveExpense} />
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
