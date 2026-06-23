import React from "react";
import { Save, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetSummaryCards } from "./ResultComponent";
import { BudgetCategoryTable } from "./BudgetCategoryTable";
import { LoadingScreen } from "./LoadingScreen";
import { AiAnalysisHighlight } from "./AiAnalysisHighlight";
import { BudgetTabSwitcher } from "./TabComponents";
import { useBudgetDashboard } from "../hooks/useBudgetDashboard";
import { RecommendationData, BudgetItem } from "../utils/critiqueHelper";

interface BudgetDashboardProps {
  planId: string;
  initialSalary: number;
  initialRecommendation: RecommendationData;
  onSave: (recommendation: RecommendationData, salary: number) => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
}

export function BudgetDashboard({
  planId,
  initialSalary,
  initialRecommendation,
  onSave,
  onReset,
  isSaving,
}: BudgetDashboardProps) {
  const {
    salary,
    setSalary,
    aiSummary,
    isNegotiating,
    negotiatingCategory,
    categories,
    sources,
    activeTab,
    setActiveTab,
    lastValidRecommendation,
    showCritiquePanel,
    isCritiqueExpanded,
    setIsCritiqueExpanded,
    pendingCategory,
    selectedChangeIndex,
    setSelectedChangeIndex,
    needsPercentage,
    wantsPercentage,
    savingsPercentage,
    debtsPercentage,
    needsTarget,
    wantsTarget,
    savingsTarget,
    debtsTarget,
    isPercentageValid,
    updateItem,
    addItem,
    deleteItem,
    handleUseExisting,
    handleForceContinue,
    handleNegotiate,
    handleSavePlan,
    changedItems,
  } = useBudgetDashboard({
    initialSalary,
    initialRecommendation,
    onSave,
    onReset,
  });

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2.5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Hasil Analisis <span className="text-zinc-800 dark:text-zinc-200 font-bold">Anggaran</span> 
        </h1>
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card/30 backdrop-blur-md border border-muted-foreground/10 text-xs text-muted-foreground leading-relaxed max-w-4xl shadow-sm">
          <HelpCircle size={16} className="text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
          <p className="font-light text-black">Rencana anggaran disusun secara kritis oleh asisten AI berdasarkan kondisi keuanganmu. Silakan sesuaikan pos pengeluaran di bawah menggunakan tombol "Optimalkan" jika ada perbedaan dengan kebiasaan nyata harianmu.</p>
        </div>
      </div>

      {/* 4 Summary Cards Grid */}
      <BudgetSummaryCards
        salary={salary}
        setSalary={setSalary}
        needsTarget={needsTarget}
        needsPercentage={needsPercentage}
        setNeedsPercentage={() => {}}
        wantsTarget={wantsTarget}
        wantsPercentage={wantsPercentage}
        setWantsPercentage={() => {}}
        savingsTarget={savingsTarget}
        savingsPercentage={savingsPercentage}
        setSavingsPercentage={() => {}}
        debtsTarget={debtsTarget}
        debtsPercentage={debtsPercentage}
        setDebtsPercentage={() => {}}
      />

      {/* AI Analysis Highlight Panel */}
      <AiAnalysisHighlight
        aiSummary={aiSummary}
        modelUsed={lastValidRecommendation.modelUsed}
        isNegotiating={isNegotiating}
        sources={sources}
      />

      {/* Tab Switcher Panel */}
      <BudgetTabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Bottom Section: Filtered category tables */}
      <div className="space-y-6 z-10 relative transition-all duration-200">
        {categories.filter(c => c.type === activeTab).length === 0 && (
          <div className="text-center py-12 px-4 bg-card/20 rounded-3xl border border-muted-foreground/10 text-muted-foreground backdrop-blur-md">
            <p className="text-xs sm:text-sm font-semibold">Tidak ada pos anggaran dalam kategori ini.</p>
          </div>
        )}

        {categories
          .map((category, catIdx) => ({ category, catIdx }))
          .filter(({ category }) => category.type === activeTab)
          .map(({ category, catIdx }) => {
            const themeColorMap: Record<"needs" | "wants" | "savings" | "debts", "violet" | "amber" | "emerald" | "rose"> = {
              needs: "violet",
              wants: "amber",
              savings: "emerald",
              debts: "rose"
            };
            
            const badgeTextMap: Record<"needs" | "wants" | "savings" | "debts", string> = {
              needs: `${category.name} (Wajib)`,
              wants: `${category.name} (Keinginan)`,
              savings: `${category.name} (Tabungan & Investasi)`,
              debts: `${category.name} (Cicilan & Utang)`
            };

            return (
              <BudgetCategoryTable
                key={catIdx}
                categoryKey={category.type}
                title={category.name}
                percentage={category.percentage}
                targetAmount={category.amount}
                description={category.description}
                items={category.items}
                badgeText={badgeTextMap[category.type]}
                themeColor={themeColorMap[category.type]}
                isNegotiating={isNegotiating && negotiatingCategory === category.name}
                onNegotiate={() => handleNegotiate(category.name)}
                onUpdateItem={(cat: "needs" | "wants" | "savings" | "debts", itemIdx: number, field: keyof BudgetItem, value: string | number) => updateItem(catIdx, itemIdx, field, value)}
                onAddItem={() => addItem(catIdx)}
                onDeleteItem={(cat: "needs" | "wants" | "savings" | "debts", itemIdx: number) => deleteItem(catIdx, itemIdx)}
                showCritiquePanel={showCritiquePanel && pendingCategory === category.name}
                isCritiqueExpanded={isCritiqueExpanded}
                onToggleCritique={() => setIsCritiqueExpanded(!isCritiqueExpanded)}
                changedItems={changedItems}
                selectedChangeIndex={selectedChangeIndex}
                onChangeSelectedChangeIndex={setSelectedChangeIndex}
                onUseExisting={handleUseExisting}
                onForceContinue={handleForceContinue}
                aiSummary={aiSummary}
              />
            );
          })}
      </div>

      {/* Action Buttons Panel */}
      <div className="flex justify-end gap-3.5 pt-4 relative z-10">
        <Button
          variant="outline"
          disabled={isNegotiating}
          onClick={onReset}
          className="px-6 h-11 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer border-muted-foreground/20 bg-background/30 transition-all duration-200"
        >
          <RefreshCw size={13} /> Reset / Mulai Ulang
        </Button>
        <Button
          onClick={handleSavePlan}
          disabled={isSaving || isNegotiating || !isPercentageValid}
          className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-900/40 text-white px-8 h-11 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all duration-200"
        >
          <Save size={14} /> {isSaving ? "Menyimpan..." : "Simpan Anggaran"}
        </Button>
      </div>

      {/* Loading Overlay during AI negotiation */}
      {isNegotiating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="p-6 rounded-3xl border border-muted-foreground/15 bg-background/95 shadow-2xl max-w-sm w-full mx-4 flex flex-col items-center justify-center">
            <LoadingScreen message="Asisten AI sedang menyelaraskan anggaranmu..." />
          </div>
        </div>
      )}
    </div>
  );
}
