"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Expense = {
  name: string;
  amount: number;
};

type DynamicInputProps = {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
};

export default function DynamicInput({
  expenses,
  setExpenses,
}: DynamicInputProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const addExpense = () => {
    if (!name.trim() || !amount) return;

    setExpenses((prev) => [
      ...prev,
      {
        name,
        amount: Number(amount),
      },
    ]);

    setName("");
    setAmount("");
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        <Input
          placeholder="Contoh: Makan Siang, Bensin, Belanja..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            Rp
          </span>

          <Input
            type="number"
            placeholder="0"
            className="pl-10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <Button
          type="button"
          onClick={addExpense}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>
    </div>
  );
}