"use client";

import React from "react";
import { useBudgetAnalysis } from "./hooks/useBudgetAnalysis";
import { BudgetForm } from "./components/BudgetForm";
import { BudgetSummaryPreview } from "./components/BudgetPreview";
import { ResultAnalisis } from "./components/Result/ResultAnalisis";
import { ModalSync } from "./components/modal-sync";
import { motion, AnimatePresence } from "framer-motion";

export function BudgetaAnalysis() {
  const {
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
    setIsLoading,
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
    <div className="max-w-8xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight ">
          Rencana <span className="text-violet-600">Keuangan</span>
        </h1>
        <p className="mt-2 font-black  max-w-xl font-light">
          Rancang rencana anggaran bulanan Anda, tentukan target finansial, dan biarkan sistem memproses evaluasi kelayakan secara instan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Input / Result */}
        <div className={analysisResult ? "lg:col-span-12 w-full" : "lg:col-span-6 w-full"}>
          <AnimatePresence mode="wait">
            {analysisResult ? (
              <motion.div
                key="result-analysis"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <ResultAnalisis
                  analysisResult={analysisResult}
                  remainingBudget={remainingBudget}
                  targetValue={targetValue}
                  target={target}
                  targetDate={targetDate}
                  onReset={handleReset}
                  monthlyBudget={Number(budget || 0)}
                  totalExpenses={totalExpenses}
                  expenses={expenses}
                />
              </motion.div>
            ) : (
              <motion.div
                key="budget-form"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full"
              >
                <BudgetForm
                  budget={budget}
                  setBudget={setBudget}
                  budgetPeriod={budgetPeriod}
                  setBudgetPeriod={setBudgetPeriod}
                  target={target}
                  setTarget={setTarget}
                  targetValue={targetValue}
                  setTargetValue={setTargetValue}
                  targetDate={targetDate}
                  setTargetDate={setTargetDate}
                  jenisTarget={jenisTarget}
                  setJenisTarget={setJenisTarget}
                  keteranganTambahan={keteranganTambahan}
                  setKeteranganTambahan={setKeteranganTambahan}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  isLoading={isLoading}
                  onRemoveExpense={removeExpense}
                  onSubmit={handleSubmit}
                  status={status}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Real-time Preview */}
        {!analysisResult && (
          <div className="lg:col-span-6 h-full">
            <BudgetSummaryPreview
              budget={budget}
              target={target}
              targetValue={targetValue}
              targetDate={targetDate}
              jenisTarget={jenisTarget}
              keteranganTambahan={keteranganTambahan}
              expenses={expenses.map((e) => ({
                description: e.name,
                amount: e.amount,
              }))}
              budgetPeriod={budgetPeriod}
            />
          </div>
        )}
      </div>

      <ModalSync
        isOpen={isLoading}
        onClose={() => setIsLoading(false)}
        title="Menganalisis Keuanganmu..."
        description="Harap tunggu sebentar, sistem sedang memproses analisis data keuangan Anda."
      />
    </div>
  );
}

export default BudgetaAnalysis;
