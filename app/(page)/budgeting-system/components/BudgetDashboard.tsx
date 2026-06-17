import React, { useState, useEffect } from "react";
import { Save, RefreshCw, HelpCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import { BudgetCategoryTable } from "./BudgetCategoryTable";
import { LoadingScreen } from "./LoadingScreen";
import { AiAnalysisHighlight } from "./AiAnalysisHighlight";
import { BudgetTabSwitcher } from "./BudgetTabSwitcher";
import {
  getChangedItems,
  CategoryAllocation,
  RecommendationData,
  BudgetItem,
} from "../utils/critiqueHelper";

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
  const { data: session } = useSession();

  const sanitizeItems = (items: any[]): BudgetItem[] => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      if (typeof item === "string") {
        return { name: item, amount: 0 };
      }
      if (item && typeof item === "object") {
        return {
          name: String(item.name || item.item || item.description || item.title || "Item Pengeluaran"),
          amount: Number(item.amount || item.value || item.cost || 0),
        };
      }
      return { name: "Item Pengeluaran", amount: 0 };
    });
  };

  // State management
  const [salary, setSalary] = useState<number>(initialSalary);
  const [frameworkUsed, setFrameworkUsed] = useState<string>(initialRecommendation.frameworkUsed);
  const [aiSummary, setAiSummary] = useState<string>(initialRecommendation.aiSummary);
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  const [negotiatingCategory, setNegotiatingCategory] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryAllocation[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"needs" | "wants" | "savings" | "debts">("needs");

  // Revert / Apply helper state
  const [lastValidRecommendation, setLastValidRecommendation] = useState<RecommendationData>(initialRecommendation);
  const [showCritiquePanel, setShowCritiquePanel] = useState<boolean>(false);
  const [isCritiqueExpanded, setIsCritiqueExpanded] = useState<boolean>(true);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [selectedChangeIndex, setSelectedChangeIndex] = useState<number>(0);

  const applyRecommendation = (reco: RecommendationData) => {
    setFrameworkUsed(reco.frameworkUsed || "AI Budget Negotiator");
    setAiSummary(reco.aiSummary || "");
    setSources(Array.isArray(reco.sources) ? reco.sources : ["Survei Biaya Hidup BPS", "Rekomendasi OJK"]);
    
    if (Array.isArray(reco.categories)) {
      setCategories(reco.categories.map((c: CategoryAllocation) => ({
        ...c,
        items: sanitizeItems(c.items)
      })));
    } else {
      // Map old format to dynamic categories format
      const cats: CategoryAllocation[] = [];
      if (reco.needs) {
        cats.push({
          name: "Pokok",
          type: "needs",
          percentage: Number(reco.needs.percentage) || 50,
          amount: Number(reco.needs.amount) || 0,
          description: reco.needs.description || "",
          items: sanitizeItems(reco.needs.items)
        });
      }
      if (reco.wants) {
        cats.push({
          name: "Gaya Hidup",
          type: "wants",
          percentage: Number(reco.wants.percentage) || 30,
          amount: Number(reco.wants.amount) || 0,
          description: reco.wants.description || "",
          items: sanitizeItems(reco.wants.items)
        });
      }
      if (reco.savings) {
        cats.push({
          name: "Tabungan",
          type: "savings",
          percentage: Number(reco.savings.percentage) || 20,
          amount: Number(reco.savings.amount) || 0,
          description: reco.savings.description || "",
          items: sanitizeItems(reco.savings.items)
        });
      }
      if (reco.debts) {
        cats.push({
          name: "Cicilan & Utang",
          type: "debts",
          percentage: Number(reco.debts.percentage) || 0,
          amount: Number(reco.debts.amount) || 0,
          description: reco.debts.description || "Pos pelunasan cicilan bulanan.",
          items: sanitizeItems(reco.debts.items)
        });
      }
      setCategories(cats);
    }
  };

  // Sync state when initialRecommendation changes
  useEffect(() => {
    setSalary(initialSalary);
    setLastValidRecommendation(initialRecommendation);
    applyRecommendation(initialRecommendation);
  }, [initialRecommendation, initialSalary]);

  useEffect(() => {
    if (salary <= 0 || categories.length === 0) return;

    // Calculate total debts amount
    const totalDebtsAmount = categories
      .filter(c => c.type === "debts")
      .reduce((sum, c) => sum + c.items.reduce((s, i) => s + i.amount, 0), 0);

    const newDebtsPercent = (totalDebtsAmount / salary) * 100;
    const remainingPercent = Math.max(0, 100 - newDebtsPercent);

    const newNeedsPercent = remainingPercent * 0.5;
    const newWantsPercent = remainingPercent * 0.3;
    const newSavingsPercent = remainingPercent * 0.2;

    const newNeedsAmount = Math.round((salary * newNeedsPercent) / 100);
    const newWantsAmount = Math.round((salary * newWantsPercent) / 100);
    const newSavingsAmount = salary - totalDebtsAmount - newNeedsAmount - newWantsAmount;

    const targetAmounts: Record<"needs" | "wants" | "savings" | "debts", number> = {
      needs: newNeedsAmount,
      wants: newWantsAmount,
      savings: newSavingsAmount,
      debts: totalDebtsAmount
    };

    const updatedCategories = categories.map(c => {
      const typeCats = categories.filter(x => x.type === c.type);
      const typeSum = typeCats.reduce((sum, x) => sum + x.amount, 0) || 1;
      
      const weight = c.amount / typeSum;
      const newAmt = Math.round(targetAmounts[c.type] * weight);
      const newPct = salary > 0 ? (newAmt / salary) * 100 : 0;

      const updatedItems = [...c.items];
      if (updatedItems.length > 0) {
        const itemsSum = updatedItems.reduce((s, i) => s + i.amount, 0);
        if (itemsSum !== newAmt) {
          updatedItems[updatedItems.length - 1] = {
            ...updatedItems[updatedItems.length - 1],
            amount: Math.max(0, updatedItems[updatedItems.length - 1].amount + (newAmt - itemsSum))
          };
        }
      }

      return {
        ...c,
        amount: newAmt,
        percentage: newPct,
        items: updatedItems
      };
    });

    const adjustTargetMatches = (type: "needs" | "wants" | "savings" | "debts", targetVal: number) => {
      const typeCats = updatedCategories.filter(c => c.type === type);
      if (typeCats.length === 0) return;
      const typeCatsSum = typeCats.reduce((sum, c) => sum + c.amount, 0);
      if (typeCatsSum !== targetVal) {
        const diff = targetVal - typeCatsSum;
        const lastCat = typeCats[typeCats.length - 1];
        lastCat.amount = Math.max(0, lastCat.amount + diff);
        lastCat.percentage = salary > 0 ? (lastCat.amount / salary) * 100 : 0;
        
        if (lastCat.items.length > 0) {
          const itemsSum = lastCat.items.reduce((s, i) => s + i.amount, 0);
          lastCat.items[lastCat.items.length - 1].amount = Math.max(0, lastCat.items[lastCat.items.length - 1].amount + (lastCat.amount - itemsSum));
        }
      }
    };

    adjustTargetMatches("needs", newNeedsAmount);
    adjustTargetMatches("wants", newWantsAmount);
    adjustTargetMatches("savings", newSavingsAmount);
    adjustTargetMatches("debts", totalDebtsAmount);

    const hasChanged = JSON.stringify(categories) !== JSON.stringify(updatedCategories);
    if (hasChanged) {
      setCategories(updatedCategories);
    }
  }, [salary, initialRecommendation]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Aggregate target calculations
  const getPercentageByType = (type: "needs" | "wants" | "savings" | "debts") => {
    return categories.filter(c => c.type === type).reduce((sum, c) => sum + c.percentage, 0);
  };
  const getAmountByType = (type: "needs" | "wants" | "savings" | "debts") => {
    return categories.filter(c => c.type === type).reduce((sum, c) => sum + c.amount, 0);
  };

  const needsPercentage = getPercentageByType("needs");
  const wantsPercentage = getPercentageByType("wants");
  const savingsPercentage = getPercentageByType("savings");
  const debtsPercentage = getPercentageByType("debts");

  const needsTarget = getAmountByType("needs");
  const wantsTarget = getAmountByType("wants");
  const savingsTarget = getAmountByType("savings");
  const debtsTarget = getAmountByType("debts");

  // Validate percentages sum to 100%
  const totalPercentage = needsPercentage + wantsPercentage + savingsPercentage + debtsPercentage;
  const isPercentageValid = Math.round(totalPercentage) === 100;

  // Handle item update
  const updateItem = (
    catIndex: number,
    itemIndex: number,
    field: keyof BudgetItem,
    value: string | number
  ) => {
    setCategories((prev) => {
      const updated = [...prev];
      const category = { ...updated[catIndex] };
      const updatedItems = [...category.items];
      
      if (field === "amount") {
        const val = typeof value === "number" ? value : Number(value) || 0;
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], amount: Math.max(0, val) };
      } else {
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], name: String(value) };
      }
      
      category.items = updatedItems;
      category.amount = updatedItems.reduce((sum, i) => sum + i.amount, 0);
      category.percentage = salary > 0 ? (category.amount / salary) * 100 : 0;
      
      updated[catIndex] = category;
      return updated;
    });
  };

  // Handle add item
  const addItem = (catIndex: number) => {
    setCategories((prev) => {
      const updated = [...prev];
      const category = { ...updated[catIndex] };
      category.items = [...category.items, { name: "Item Baru", amount: 0 }];
      updated[catIndex] = category;
      return updated;
    });
  };

  // Handle delete item
  const deleteItem = (catIndex: number, itemIndex: number) => {
    setCategories((prev) => {
      const updated = [...prev];
      const category = { ...updated[catIndex] };
      category.items = category.items.filter((_, idx) => idx !== itemIndex);
      category.amount = category.items.reduce((sum, i) => sum + i.amount, 0);
      category.percentage = salary > 0 ? (category.amount / salary) * 100 : 0;
      updated[catIndex] = category;
      return updated;
    });
  };

  // Revert state back to pre-negotiation valid state
  const handleUseExisting = () => {
    applyRecommendation(lastValidRecommendation);
    setShowCritiquePanel(false);
    setPendingCategory(null);
  };

  // Continue with force override
  const handleForceContinue = () => {
    if (pendingCategory) {
      handleNegotiate(pendingCategory, true);
    }
    setShowCritiquePanel(false);
    setPendingCategory(null);
  };

  // Handle negotiation request with AI
  const handleNegotiate = async (categoryName: string, force: boolean = false) => {
    const userId = session?.user?.id;
    if (!userId) {
      alert("Kamu harus masuk (login) terlebih dahulu!");
      return;
    }

    setIsNegotiating(true);
    setNegotiatingCategory(categoryName);

    try {
      const targetCat = categories.find(c => c.name === categoryName);
      const categoryType = targetCat ? targetCat.type : null;

      const response = await fetch("/api/budgeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          salary,
          categoryName,
          categoryType,
          notes: `Negosiasi optimasi anggaran dilakukan oleh pengguna pada pos ${categoryName}.`,
          action: "negotiate",
          recommendation: {
            categories,
            sources,
            aiSummary,
            frameworkUsed,
          },
          force,
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.recommendation) {
        const reco = typeof result.data.recommendation === "string"
          ? JSON.parse(result.data.recommendation)
          : result.data.recommendation;

        if (reco.suggestRejection) {
          setPendingCategory(categoryName);
          setSelectedChangeIndex(0);
          setShowCritiquePanel(true);
          setIsCritiqueExpanded(true);
          setAiSummary(reco.aiSummary || "Pengeluaran yang baru kamu perbarui melebihi batasan wajar.");
        } else {
          applyRecommendation(reco);
          setLastValidRecommendation(reco);
        }
      } else {
        alert("Gagal memproses negosiasi: " + (result.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Negotiation error:", err);
      alert("Terjadi kesalahan saat memproses negosiasi anggaran dengan AI.");
    } finally {
      setIsNegotiating(false);
      setNegotiatingCategory(null);
    }
  };

  // Handle saving the plan
  const handleSavePlan = () => {
    if (!isPercentageValid) {
      alert("Error: Jumlah persentase alokasi kategori harus tepat 100%!");
      return;
    }

    const payload: RecommendationData = {
      frameworkUsed,
      aiSummary,
      categories,
      sources,
      needs: {
        name: "Pokok",
        type: "needs",
        percentage: needsPercentage,
        description: "Kebutuhan Pokok",
        amount: needsTarget,
        items: categories.filter(c => c.type === "needs").reduce((list, c) => [...list, ...c.items], [] as BudgetItem[])
      },
      wants: {
        name: "Gaya Hidup",
        type: "wants",
        percentage: wantsPercentage,
        description: "Keinginan & Gaya Hidup",
        amount: wantsTarget,
        items: categories.filter(c => c.type === "wants").reduce((list, c) => [...list, ...c.items], [] as BudgetItem[])
      },
      savings: {
        name: "Tabungan",
        type: "savings",
        percentage: savingsPercentage,
        description: "Tabungan & Investasi",
        amount: savingsTarget,
        items: categories.filter(c => c.type === "savings").reduce((list, c) => [...list, ...c.items], [] as BudgetItem[])
      },
      debts: {
        name: "Cicilan & Utang",
        type: "debts",
        percentage: debtsPercentage,
        description: "Cicilan & Utang",
        amount: debtsTarget,
        items: categories.filter(c => c.type === "debts").reduce((list, c) => [...list, ...c.items], [] as BudgetItem[])
      }
    };

    onSave(payload, salary);
  };

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
                onUpdateItem={(_, itemIdx, field, value) => updateItem(catIdx, itemIdx, field, value)}
                onAddItem={() => addItem(catIdx)}
                onDeleteItem={(_, itemIdx) => deleteItem(catIdx, itemIdx)}
                showCritiquePanel={showCritiquePanel && pendingCategory === category.name}
                isCritiqueExpanded={isCritiqueExpanded}
                onToggleCritique={() => setIsCritiqueExpanded(!isCritiqueExpanded)}
                changedItems={getChangedItems(categories, lastValidRecommendation)}
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
