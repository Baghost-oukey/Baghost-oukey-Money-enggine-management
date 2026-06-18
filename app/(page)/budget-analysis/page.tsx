"use client";

import React from "react";
import { useBudgetAnalysis } from "./hooks/useBudgetAnalysis";
import { BudgetForm } from "./components/BudgetForm";
import { BudgetSummaryPreview } from "./components/BudgetSummaryPreview";
import { AnalysisDashboard } from "./components/AnalysisDashboard";
import { motion, AnimatePresence } from "framer-motion";

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
    jenisTarget,
    setJenisTarget,
    keteranganTambahan,
    setKeteranganTambahan,
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
        {/* Left Side: Form Input */}
        <div className="lg:col-span-6">
          <BudgetForm
            budget={budget}
            setBudget={setBudget}
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
        </div>

        {/* Right Side: Real-time Preview */}
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
          />
        </div>
      </div>

      {/* Bottom Row: AI Analysis Result */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            <AnalysisDashboard
              analysisResult={analysisResult}
              remainingBudget={remainingBudget}
              targetValue={targetValue}
              target={target}
              targetDate={targetDate}
              onReset={handleReset}
              monthlyBudget={Number(budget || 0)}
              totalExpenses={totalExpenses}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BudgetaAnalysis;
