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
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
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
    <div className="relative overflow-hidden rounded-2xl border bg-card/40 backdrop-blur-md md:p-6 shadow-xl transition-all duration-300">


      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        Formulir Data Finansial
      </h2>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Budget Input */}
        <LabelInputContainer>
          <Label htmlFor="budgetBulanan" className="text-sm font-medium flex items-center gap-2">
            Budget Bulanan Anda
          </Label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground group-focus-within:text-blue-500 transition-colors">
              Rp
            </span>
            <Input
              id="budgetBulanan"
              type="number"
              placeholder="Contoh: 5000000"
              className="pl-12 bg-muted/30 focus-visible:ring-blue-500 transition-all border-muted/50 rounded-xl"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </LabelInputContainer>

        {/* Target Name */}
        <LabelInputContainer>
          <Label htmlFor="targetGoals" className="text-sm font-medium flex items-center gap-2">
            Apa Yang Ingin Anda Capai?
          </Label>
          <Input
            id="targetGoals"
            placeholder="Contoh: Membeli Laptop Baru, Dana Darurat, Investasi Saham..."
            type="text"
            className="bg-muted/30 focus-visible:ring-blue-500 transition-all border-muted/50 rounded-xl"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </LabelInputContainer>

        {/* Target Value & Date Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabelInputContainer>
            <Label htmlFor="targetValue" className="text-sm font-medium flex items-center gap-2">
              Nominal Target Pencapaian
            </Label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground group-focus-within:text-cyan-500 transition-colors">
                Rp
              </span>
              <Input
                id="targetValue"
                type="number"
                placeholder="Contoh: 15000000"
                className="pl-12 bg-muted/30 focus-visible:ring-blue-500 transition-all border-muted/50 rounded-xl"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="dateAwal" className="text-sm font-medium flex items-center gap-2">
              <Calendar size={16} className="text-rose-500" />
              Batas Waktu (Deadline)
            </Label>
            <Input
              id="dateAwal"
              type="date"
              className="bg-muted/30 focus-visible:ring-blue-500 transition-all border-muted/50 rounded-xl"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </LabelInputContainer>
        </div>

        {/* Expenses Manager Section */}
        <LabelInputContainer>
          <Label className="text-sm font-medium mb-1">Daftar Pengeluaran Bulanan</Label>
          <DynamicInput expenses={expenses} setExpenses={setExpenses} />
          <ExpenseChips expenses={expenses} onRemove={onRemoveExpense} />
        </LabelInputContainer>

        {/* Submit Button */}
        <button
          className={cn(
            "group/btn relative block h-11 w-full rounded-xl bg-blue-600 text-white font-medium shadow-md transition-all duration-200",
            "hover:bg-blue-700 active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            (status === "loading" || isLoading) && "opacity-50 cursor-not-allowed"
          )}
          type="submit"
          disabled={status === "loading" || isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
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
