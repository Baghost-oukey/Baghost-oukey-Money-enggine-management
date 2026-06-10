import { useState } from "react";
import { useSession } from "next-auth/react";
import { Expense } from "@/components/inputState";

export function useBudgetAnalysis() {
  const { data: session, status } = useSession();

  const [budget, setBudget] = useState("");
  const [target, setTarget] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = Number(budget || 0) - totalExpenses;
  const percentSpent =
    Number(budget) > 0 ? Math.min((totalExpenses / Number(budget)) * 100, 100) : 0;

  const isEmpty =
    !budget && !target && !targetValue && !targetDate && expenses.length === 0;

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setBudget("");
    setTarget("");
    setTargetValue("");
    setTargetDate("");
    setExpenses([]);
    setAnalysisResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status !== "authenticated" || !session?.user?.id) {
      alert("Kamu harus login terlebih dahulu!");
      return;
    }

    if (!budget || !target) {
      alert("Mohon isi budget bulanan dan target Anda!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          monthlyBudget: Number(budget),
          targetName: target,
          targetValue: Number(targetValue || 0),
          targetDate: targetDate || undefined,
          expenses,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.data);
      } else {
        alert("Gagal menyimpan data: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    analysisResult,
    setAnalysisResult,
    totalExpenses,
    remainingBudget,
    percentSpent,
    isEmpty,
    removeExpense,
    handleReset,
    handleSubmit,
    status,
  };
}
