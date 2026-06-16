import React, { useState, useEffect } from "react";
import { Sparkles, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import { BudgetDistributionProgressBar } from "./BudgetDistributionProgressBar";
import { BudgetCategoryTable } from "./BudgetCategoryTable";

interface BudgetItem {
  name: string;
  amount: number;
}

interface CategoryAllocation {
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

interface RecommendationData {
  needs: CategoryAllocation;
  wants: CategoryAllocation;
  savings: CategoryAllocation;
  aiSummary: string;
  frameworkUsed: string;
}

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

  // Local state for salary
  const [salary, setSalary] = useState<number>(initialSalary);
  
  // Local state for recommendation structure
  const [frameworkUsed, setFrameworkUsed] = useState<string>(initialRecommendation.frameworkUsed);
  const [aiSummary, setAiSummary] = useState<string>(initialRecommendation.aiSummary);
  
  const [needs, setNeeds] = useState<CategoryAllocation>({
    percentage: initialRecommendation.needs.percentage,
    amount: initialRecommendation.needs.amount || 0,
    description: initialRecommendation.needs.description,
    items: sanitizeItems(initialRecommendation.needs.items),
  });

  const [wants, setWants] = useState<CategoryAllocation>({
    percentage: initialRecommendation.wants.percentage,
    amount: initialRecommendation.wants.amount || 0,
    description: initialRecommendation.wants.description,
    items: sanitizeItems(initialRecommendation.wants.items),
  });

  const [savings, setSavings] = useState<CategoryAllocation>({
    percentage: initialRecommendation.savings.percentage,
    amount: initialRecommendation.savings.amount || 0,
    description: initialRecommendation.savings.description,
    items: sanitizeItems(initialRecommendation.savings.items),
  });

  // Sync state when initialRecommendation changes
  useEffect(() => {
    setSalary(initialSalary);
    setFrameworkUsed(initialRecommendation.frameworkUsed);
    setAiSummary(initialRecommendation.aiSummary);
    setNeeds({
      percentage: initialRecommendation.needs.percentage,
      amount: initialRecommendation.needs.amount || 0,
      description: initialRecommendation.needs.description,
      items: sanitizeItems(initialRecommendation.needs.items),
    });
    setWants({
      percentage: initialRecommendation.wants.percentage,
      amount: initialRecommendation.wants.amount || 0,
      description: initialRecommendation.wants.description,
      items: sanitizeItems(initialRecommendation.wants.items),
    });
    setSavings({
      percentage: initialRecommendation.savings.percentage,
      amount: initialRecommendation.savings.amount || 0,
      description: initialRecommendation.savings.description,
      items: sanitizeItems(initialRecommendation.savings.items),
    });
  }, [initialRecommendation, initialSalary]);

  // Calculate target amounts dynamically
  const needsTarget = Math.round((salary * needs.percentage) / 100);
  const wantsTarget = Math.round((salary * wants.percentage) / 100);
  const savingsTarget = Math.round((salary * savings.percentage) / 100);

  // Validate percentages sum to 100%
  const totalPercentage = needs.percentage + wants.percentage + savings.percentage;
  const isPercentageValid = totalPercentage === 100;

  // Handle item update
  const updateItem = (
    category: "needs" | "wants" | "savings",
    index: number,
    field: keyof BudgetItem,
    value: string | number
  ) => {
    const updater = (prev: CategoryAllocation) => {
      const updatedItems = [...prev.items];
      if (field === "amount") {
        const val = typeof value === "number" ? value : Number(value) || 0;
        updatedItems[index] = { ...updatedItems[index], amount: Math.max(0, val) };
      } else {
        updatedItems[index] = { ...updatedItems[index], name: String(value) };
      }
      return { ...prev, items: updatedItems };
    };

    if (category === "needs") setNeeds(updater);
    else if (category === "wants") setWants(updater);
    else if (category === "savings") setSavings(updater);
  };

  // Handle add item
  const addItem = (category: "needs" | "wants" | "savings") => {
    const newItem: BudgetItem = { name: "Item Baru", amount: 0 };
    const updater = (prev: CategoryAllocation) => ({
      ...prev,
      items: [...prev.items, newItem],
    });

    if (category === "needs") setNeeds(updater);
    else if (category === "wants") setWants(updater);
    else if (category === "savings") setSavings(updater);
  };

  // Handle delete item
  const deleteItem = (category: "needs" | "wants" | "savings", index: number) => {
    const updater = (prev: CategoryAllocation) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    });

    if (category === "needs") setNeeds(updater);
    else if (category === "wants") setWants(updater);
    else if (category === "savings") setSavings(updater);
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
      needs: {
        percentage: needs.percentage,
        description: needs.description,
        amount: needsTarget,
        items: needs.items,
      },
      wants: {
        percentage: wants.percentage,
        description: wants.description,
        amount: wantsTarget,
        items: wants.items,
      },
      savings: {
        percentage: savings.percentage,
        description: savings.description,
        amount: savingsTarget,
        items: savings.items,
      },
    };

    onSave(payload, salary);
  };

  return (
    <div className="w-full space-y-8 pb-16">
      
      {/* 4 Summary Cards Grid */}
      <BudgetSummaryCards
        salary={salary}
        setSalary={setSalary}
        needsTarget={needsTarget}
        needsPercentage={needs.percentage}
        setNeedsPercentage={(val) => setNeeds({ ...needs, percentage: val })}
        wantsTarget={wantsTarget}
        wantsPercentage={wants.percentage}
        setWantsPercentage={(val) => setWants({ ...wants, percentage: val })}
        savingsTarget={savingsTarget}
        savingsPercentage={savings.percentage}
        setSavingsPercentage={(val) => setSavings({ ...savings, percentage: val })}
      />

      {/* Progress Bar & Validation Status */}
      <BudgetDistributionProgressBar
        frameworkUsed={frameworkUsed}
        needsPercentage={needs.percentage}
        wantsPercentage={wants.percentage}
        savingsPercentage={savings.percentage}
        totalPercentage={totalPercentage}
        isPercentageValid={isPercentageValid}
      />

      {/* Split Layout: Budget Table (Left) & AI Analysis Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start z-10 relative">
        
        {/* Left Column: Budgeting Categories (Stacked vertically for maximum width) */}
        <div className="lg:col-span-8 space-y-6">
          <BudgetCategoryTable
            categoryKey="needs"
            title="Pokok"
            percentage={needs.percentage}
            targetAmount={needsTarget}
            description={needs.description}
            items={needs.items}
            badgeText="Kebutuhan Pokok (Wajib)"
            themeColor="violet"
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
          />

          <BudgetCategoryTable
            categoryKey="wants"
            title="Gaya Hidup"
            percentage={wants.percentage}
            targetAmount={wantsTarget}
            description={wants.description}
            items={wants.items}
            badgeText="Keinginan & Gaya Hidup"
            themeColor="amber"
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
          />

          <BudgetCategoryTable
            categoryKey="savings"
            title="Tabungan"
            percentage={savings.percentage}
            targetAmount={savingsTarget}
            description={savings.description}
            items={savings.items}
            badgeText="Tabungan & Investasi"
            themeColor="emerald"
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
          />
        </div>

        {/* Right Column: AI Analysis Notes & Control Action Buttons */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Summary Box */}
          <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/20 space-y-4">
            <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 border-muted-foreground/10">
              <Sparkles size={14} className="animate-pulse" /> Saran & Analisis Asisten AI
            </h4>
            <textarea
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              rows={8}
              className="w-full text-sm leading-relaxed text-foreground bg-transparent border border-muted/30 focus:border-violet-500 focus:ring-0 rounded-xl p-3.5 italic focus:outline-none"
              placeholder="Tulis saran atau catatan taktis keuangan kamu di sini..."
            />
          </div>

          {/* Action Buttons Panel */}
          <div className="p-6 rounded-3xl border border-muted-foreground/20 bg-card/25 space-y-3">
            <Button
              onClick={handleSavePlan}
              disabled={isSaving || !isPercentageValid}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/40 text-white px-8 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] transition-all duration-200"
            >
              <Save size={15} /> {isSaving ? "Menyimpan..." : "Simpan Anggaran"}
            </Button>
            
            <Button
              variant="outline"
              onClick={onReset}
              className="w-full px-6 h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-muted/60 hover:bg-muted"
            >
              <RefreshCw size={14} /> Reset / Mulai Ulang
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
