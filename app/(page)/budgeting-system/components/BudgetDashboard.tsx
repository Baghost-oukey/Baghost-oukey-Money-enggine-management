import React, { useState, useEffect } from "react";
import { Sparkles, Save, RefreshCw, CreditCard, Plus, HelpCircle, ArrowUpRight, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import { BudgetCategoryTable } from "./BudgetCategoryTable";
import { LoadingScreen } from "./LoadingScreen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BudgetItem {
  name: string;
  amount: number;
}

interface CategoryAllocation {
  key?: string;
  name: string;
  type: "needs" | "wants" | "savings" | "debts";
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

interface RecommendationData {
  needs?: CategoryAllocation;
  wants?: CategoryAllocation;
  savings?: CategoryAllocation;
  debts?: CategoryAllocation;
  categories?: CategoryAllocation[];
  sources?: string[];
  aiSummary: string;
  frameworkUsed: string;
  suggestRejection?: boolean;
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
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

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

  const categoriesItemsKey = JSON.stringify(categories.map(c => ({ type: c.type, name: c.name, items: c.items })));

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
  }, [salary, categoriesItemsKey]);

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
    setShowWarningModal(false);
    setPendingCategory(null);
  };

  // Continue with force override
  const handleForceContinue = () => {
    if (pendingCategory) {
      handleNegotiate(pendingCategory, true);
    }
    setShowWarningModal(false);
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
      const response = await fetch("/api/budgeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          salary,
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
          setShowWarningModal(true);
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hasil Analisis Berdasarkan kondisi keuangan mu</h1>
        <p className="text-xs text-muted-foreground">*hasil yang kami hasilkan tidak 100% opsi terbaik dan kamu bisa sesuaikan sesuai kebutuhan kebiasaan mu dan kami akan melakukan optimasi pada pengeluaran yang dapat anda gunakan</p>
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

      {/* AI Analysis Highlight Panel (Full Width with highlighted border) */}
      <div className="p-6 rounded-3xl border-2 border-violet-500/30 bg-violet-500/[0.03] dark:bg-violet-500/[0.06] shadow-xl shadow-violet-500/5 space-y-4 relative z-10">
        <div className="flex items-center gap-2.5 border-b pb-3 border-violet-500/20">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Sparkles size={16} className={isNegotiating ? "animate-spin" : "animate-pulse"} />
          </div>
          <h4 className="text-sm font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
            Hasil Analisis Asisten AI
          </h4>
        </div>

        <div className="text-[13px] md:text-[14px] leading-relaxed text-foreground italic whitespace-pre-line px-1 max-h-[140px] overflow-y-auto">
          "{aiSummary}"
        </div>

        {((sources && sources.length > 0) || true) && (
          <div className="pt-3 border-t border-violet-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {sources && sources.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                  Referensi:
                </span>
                {sources.map((src, i) => (
                  <span key={i} className="text-[9px] font-medium px-2.5 py-1 rounded bg-muted text-muted-foreground border border-muted-foreground/10 flex items-center gap-1">
                    📚 <span>{src}</span>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground leading-tight max-w-md sm:text-right self-end sm:self-center">
              *Gunakan tombol <strong>"Nego dengan AI"</strong> pada tabel pos di bawah untuk menyeimbangkan pos secara otomatis.
            </p>
          </div>
        )}
      </div>

      {/* Tab Switcher Panel (Modern Folder-Tab Style) */}
      <div className="flex gap-1 items-end border-b border-muted-foreground/15 w-full mt-8 mb-6 z-10 relative">
        <button
          onClick={() => setActiveTab("needs")}
          className={`py-2 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 border-t border-x -mb-[1px] ${
            activeTab === "needs"
              ? "bg-background border-muted-foreground/15 text-violet-600 dark:text-violet-400 font-extrabold shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
              : "bg-muted/10 hover:bg-muted/20 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp size={14} /> Wajib
        </button>
        <button
          onClick={() => setActiveTab("wants")}
          className={`py-2 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 border-t border-x -mb-[1px] ${
            activeTab === "wants"
              ? "bg-background border-muted-foreground/15 text-violet-600 dark:text-violet-400 font-extrabold shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
              : "bg-muted/10 hover:bg-muted/20 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ArrowUpRight size={14} /> Gaya Hidup
        </button>
        <button
          onClick={() => setActiveTab("savings")}
          className={`py-2 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 border-t border-x -mb-[1px] ${
            activeTab === "savings"
              ? "bg-background border-muted-foreground/15 text-violet-600 dark:text-violet-400 font-extrabold shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
              : "bg-muted/10 hover:bg-muted/20 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles size={14} className="animate-pulse" /> Tabungan
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`py-2 px-4 sm:px-6 rounded-t-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 border-t border-x -mb-[1px] ${
            activeTab === "debts"
              ? "bg-background border-muted-foreground/15 text-violet-600 dark:text-violet-400 font-extrabold shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
              : "bg-muted/10 hover:bg-muted/20 border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard size={14} /> Hutang
        </button>
      </div>

      {/* Bottom Section: Filtered category tables */}
      <div className="space-y-6 z-10 relative">
        {categories.filter(c => c.type === activeTab).length === 0 && (
          <div className="text-center py-12 px-4 bg-muted/5 rounded-3xl border border-muted-foreground/10 text-muted-foreground">
            <p className="text-xs sm:text-sm">Tidak ada pos anggaran dalam kategori ini.</p>
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
              />
            );
          })}
      </div>

      {/* Action Buttons Panel */}
      <div className="flex justify-end gap-4 pt-4 relative z-10">
        <Button
          variant="outline"
          disabled={isNegotiating}
          onClick={onReset}
          className="px-6 h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer border-muted/60 hover:bg-muted"
        >
          <RefreshCw size={14} /> Reset / Mulai Ulang
        </Button>
        <Button
          onClick={handleSavePlan}
          disabled={isSaving || isNegotiating || !isPercentageValid}
          className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/40 text-white px-8 h-12 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01] transition-all duration-200"
        >
          <Save size={15} /> {isSaving ? "Menyimpan..." : "Simpan Anggaran"}
        </Button>
      </div>

      {/* Alert Dialog for budget negotiation warning */}
      <AlertDialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <AlertDialogContent className="max-w-md bg-background border border-muted-foreground/15 rounded-3xl p-6 shadow-2xl">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center justify-center sm:justify-start gap-2">
              <span className="p-2 bg-rose-500/10 rounded-xl">⚠️</span>
              Peringatan Anggaran AI
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed mt-3">
              Maaf, berdasarkan pengeluaran yang baru kamu perbarui kami sarankan untuk tidak menyetujui perubahan Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <AlertDialogCancel
              onClick={handleUseExisting}
              className="w-full sm:w-auto h-11 px-5 rounded-xl border border-muted-foreground/20 text-xs font-bold hover:bg-muted cursor-pointer transition-all"
            >
              Pakai yang Sudah Ada
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceContinue}
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              Tetap Lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
