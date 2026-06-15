"use client";

import React from "react";
import { useBudgetPlan } from "./hooks/useBudgetPlan";
import { BudgetInputForm } from "./components/BudgetInputForm";

export function BudgetingSistem() {
  const {
    salary,
    setSalary,
    notes,
    setNotes,
    handleSubmit,
    status,
  } = useBudgetPlan();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-center">
      <div className="w-full">
        <BudgetInputForm
          salary={salary}
          setSalary={setSalary}
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmit}
          status={status}
        />
      </div>
    </div>
  );
}

export default BudgetingSistem;