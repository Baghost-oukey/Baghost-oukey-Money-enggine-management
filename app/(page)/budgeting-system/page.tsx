"use client";

import React, { useState } from "react";
import { useBudgetPlan } from "./hooks/useBudgetPlan";
import { BudgetInputForm } from "./components/BudgetInputForm";
import { LoadingScreen } from "./components/LoadingScreen";
import ResultBudgetAnalisis from "./components/ResultBudgetAnalisis";

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
    setAnalysisResult,
    handleSubmit,
    status,
  } = useBudgetPlan();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronize modal state with analysisResult
  React.useEffect(() => {
    if (analysisResult) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [analysisResult]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setAnalysisResult(null); // Clear result to close modal state
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center relative">
      <div className="w-full relative">
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

        <ResultBudgetAnalisis
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          monthlyBudget={analysisResult ? analysisResult.monthlyBudget : 0}
          recommendation={
            analysisResult
              ? typeof analysisResult.recommendation === "string"
                ? JSON.parse(analysisResult.recommendation)
                : analysisResult.recommendation
              : null
          }
        />
      </div>
    </div>
  );
}

export default BudgetingSistem;