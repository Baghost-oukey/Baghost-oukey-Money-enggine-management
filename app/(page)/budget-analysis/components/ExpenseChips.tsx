import React from "react";
import { X } from "lucide-react";
import { Expense } from "@/components/inputState";

interface ExpenseChipsProps {
  expenses: Expense[];
  onRemove: (index: number) => void;
}

export function ExpenseChips({ expenses, onRemove }: ExpenseChipsProps) {
  if (expenses.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <span className="text-xs text-muted-foreground font-semibold">Pengeluaran ditambahkan:</span>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 border border-muted/30 rounded-xl bg-muted/5 scrollbar-thin">
        {expenses.map((expense, index) => (
          <div
            key={index}
            className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-full px-3 py-1 text-xs font-semibold shadow-sm hover:bg-rose-500/15 transition-all"
          >
            <span>{expense.name}</span>
            <span className="opacity-70 font-light">•</span>
            <span>Rp {expense.amount.toLocaleString("id-ID")}</span>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-1 text-rose-500 hover:text-rose-700 transition-colors p-0.5 hover:bg-rose-500/10 rounded-full"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
