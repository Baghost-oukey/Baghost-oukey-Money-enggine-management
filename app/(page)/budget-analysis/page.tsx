"use client";

import React from "react";
import { useBudgetAnalysis } from "./hooks/useBudgetAnalysis";
import { BudgetForm } from "./components/BudgetForm";
import { BudgetSummaryPreview } from "./components/BudgetSummaryPreview";
import { AnalysisDashboard } from "./components/AnalysisDashboard";
import { motion, AnimatePresence } from "framer-motion";
import { Target } from "lucide-react";

export function BudgetaAnalysis() {
  const {
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
    totalExpenses,
    remainingBudget,
    percentSpent,
    isEmpty,
    removeExpense,
    handleReset,
    handleSubmit,
    status,
  } = useBudgetAnalysis();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight ">
          Analisis Keputusan Keuangan
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-xl font-light">
          Rancang rencana anggaran bulanan Anda, tentukan target finansial, dan biarkan sistem memproses evaluasi kelayakan secara instan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Input */}
        <div className="lg:col-span-7">
          <BudgetForm
            budget={budget}
            setBudget={setBudget}
            target={target}
            setTarget={setTarget}
            targetValue={targetValue}
            setTargetValue={setTargetValue}
            targetDate={targetDate}
            setTargetDate={setTargetDate}
            expenses={expenses}
            setExpenses={setExpenses}
            isLoading={isLoading}
            onRemoveExpense={removeExpense}
            onSubmit={handleSubmit}
            status={status}
          />
        </div>

        {/* Right Side: Analysis Dashboard or Real-time Preview */}
        <div className="lg:col-span-5 h-full">
          <AnimatePresence mode="wait">
            {analysisResult ? (
              <AnalysisDashboard
                analysisResult={analysisResult}
                remainingBudget={remainingBudget}
                targetValue={targetValue}
                target={target}
                targetDate={targetDate}
                onReset={handleReset}
              />
            ) : isEmpty ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border bg-card/30 backdrop-blur-sm p-8 shadow-sm text-center border-dashed border-muted/80 h-full flex flex-col justify-center items-center min-h-[350px]"
              >
                <div className="h-16 w-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 animate-bounce">
                  <Target size={28} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Menunggu Data Finansial</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs font-light leading-relaxed">
                  Isi formulir anggaran dan pengeluaran di sebelah kiri untuk melihat ringkasan visual dan melakukan analisis AI.
                </p>
              </motion.div>
            ) : (
              <BudgetSummaryPreview
                budget={budget}
                target={target}
                targetValue={targetValue}
                targetDate={targetDate}
                expenses={expenses.map((e) => ({
                  description: e.name,
                  amount: e.amount,
                }))}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default BudgetaAnalysis;
