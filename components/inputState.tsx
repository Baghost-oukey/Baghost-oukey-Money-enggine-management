"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type Expense = {
  description: string;
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
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const addExpense = () => {
    if (!description.trim() || !amount) return;

    setExpenses((prev) => [
      ...prev,
      {
        description,
        amount: Number(amount),
      },
    ]);

    setDescription("");
    setAmount("");
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="space-y-4">
        <Input
          placeholder="Contoh: Makan Siang, Bensin, Belanja..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </div>
    </div>
  );
}