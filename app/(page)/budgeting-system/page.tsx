"use client";
import React from "react";
import { useBudgetPlan } from "./hooks/useBudgetPlan";
import { BudgetInputForm } from "./components/BudgetInputForm";
import { BudgetDashboard } from "./components/BudgetDashboard";
import { BudgetDashboardSkeleton } from "./components/BudgetDashboardSkeleton";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex flex-col justify-start relative overflow-hidden mt-6">
      {/* Subtle Mesh Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.04)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative Shifting Mesh Gradients */}
      <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-fuchsia-600/5 via-rose-500/5 to-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[90px] pointer-events-none animate-pulse" />

      {/* Page Content Animation Wrapper */}
      <div className="w-full relative z-10 flex-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading-skeleton"
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <BudgetDashboardSkeleton loadingMessage={loadingMessages[msgIdx]} />
            </motion.div>
          ) : analysisResult ? (
            <motion.div
              key="dashboard-result"
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.99, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <BudgetInputForm
                salary={salary}
                setSalary={setSalary}
                notes={notes}
                setNotes={setNotes}
                onSubmit={handleSubmit}
                status={status}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BudgetingSistem;