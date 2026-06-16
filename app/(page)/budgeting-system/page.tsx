"use client";

import React from "react";
import { useBudgetPlan } from "./hooks/useBudgetPlan";
import { BudgetInputForm } from "./components/BudgetInputForm";
import { BudgetDashboard } from "./components/BudgetDashboard";

export function BudgetingSistem() {
  const {
    salary,
    setSalary,
    notes,
    setNotes,
    isLoading,
    loadingMessages,
    msgIdx,
    analysisResult,
    handleSubmit,
    handleUpdateBudget,
    handleReset,
    isSaving,
    status,
  } = useBudgetPlan();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-start relative overflow-hidden mt-20">
      {/* Background Decorative Glows */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full relative z-10 flex-1">
        {analysisResult ? (
          <BudgetDashboard
            planId={analysisResult.id}
            initialSalary={Number(analysisResult.monthlyBudget)}
            initialRecommendation={
              typeof analysisResult.recommendation === "string"
                ? JSON.parse(analysisResult.recommendation)
                : analysisResult.recommendation
            }
            onSave={handleUpdateBudget}
            onReset={handleReset}
            isSaving={isSaving}
          />
        ) : (
          <BudgetInputForm
            salary={salary}
            setSalary={setSalary}
            notes={notes}
            setNotes={setNotes}
            onSubmit={handleSubmit}
            status={status}
            isLoading={isLoading}
            loadingMessage={loadingMessages[msgIdx]}
          />
        )}
      </div>
    </div>
  );
}

export default BudgetingSistem;