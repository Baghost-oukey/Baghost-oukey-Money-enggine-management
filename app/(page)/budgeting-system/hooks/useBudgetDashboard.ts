import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  CategoryAllocation,
  RecommendationData,
  BudgetItem,
  getChangedItems,
} from "../utils/critiqueHelper";

interface UseBudgetDashboardProps {
  initialSalary: number;
  initialRecommendation: RecommendationData;
  onSave: (recommendation: RecommendationData, salary: number) => Promise<void>;
  onReset: () => void;
}

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

export function useBudgetDashboard({
  initialSalary,
  initialRecommendation,
  onSave,
  onReset,
}: UseBudgetDashboardProps) {
  const { data: session } = useSession();

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
  const [showCritiquePanel, setShowCritiquePanel] = useState<boolean>(
    !!initialRecommendation.suggestRejection
  );
  const [isCritiqueExpanded, setIsCritiqueExpanded] = useState<boolean>(true);
  const [pendingCategory, setPendingCategory] = useState<string | null>(
    initialRecommendation.suggestRejection
      ? (initialRecommendation.categories?.find((c: any) => c.type === "savings" || c.type === "debts")?.name || "Tabungan Masa Depan")
      : null
  );
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

  const lastSalaryRef = useRef<number>(initialSalary);

  // Sync state when initialRecommendation changes
  useEffect(() => {
    setSalary(initialSalary);
    lastSalaryRef.current = initialSalary;
    setLastValidRecommendation(initialRecommendation);
    applyRecommendation(initialRecommendation);
    setShowCritiquePanel(!!initialRecommendation.suggestRejection);
    setPendingCategory(
      initialRecommendation.suggestRejection
        ? (initialRecommendation.categories?.find((c: any) => c.type === "savings" || c.type === "debts")?.name || "Tabungan Masa Depan")
        : null
    );
  }, [initialRecommendation, initialSalary]);

  useEffect(() => {
    if (salary <= 0 || categories.length === 0) return;
    if (salary === lastSalaryRef.current) return;
    lastSalaryRef.current = salary;

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
   }, [salary, categories]); // eslint-disable-next-line react-hooks/exhaustive-deps

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

  const changedItems = getChangedItems(categories, lastValidRecommendation);

  return {
    salary,
    setSalary,
    frameworkUsed,
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
    totalPercentage,
    updateItem,
    addItem,
    deleteItem,
    handleUseExisting,
    handleForceContinue,
    handleNegotiate,
    handleSavePlan,
    onReset,
    changedItems,
  };
}
