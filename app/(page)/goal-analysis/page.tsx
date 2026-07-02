"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";

import { LoadingScreen } from "./components/LoadingScreen";
import { AccessDenied } from "./components/AccessDenied";
import { HistoryRows } from "./components/HistoryRows";
import { GoalDetailView } from "./components/GoalDetailView";

interface BudgetItem {
  name: string;
  amount: number;
}

interface GoalPlan {
  allocation: {
    needs: number;
    wants: number;
    savings: number;
    explanation: string;
  };
  needsItems: BudgetItem[];
  wantsItems: BudgetItem[];
  savingsItems: BudgetItem[];
  verdict: string;
  tips: string[];
  roadmap: string[];
  advice: string;
}

interface GoalItem {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  targetDate: string | null;
  isCompleted: boolean;
  currentAmount: number;
  createdAt: string;
  plan: GoalPlan | null;
}

function GoalAnalysisDashboard() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const activeId = searchParams ? searchParams.get("activeId") : null;

  const [goals, setGoals] = useState<GoalItem[]>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_goals_data");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) {}
      }
    }
    return [];
  });

  const [activeGoal, setActiveGoal] = useState<GoalItem | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_goals_data");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (activeId) {
              const found = parsed.find((g: any) => g.id === activeId);
              return found || parsed[0];
            }
            return parsed[0];
          }
        } catch (e) {}
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("cached_goals_data");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return false;
          }
        } catch (e) {}
      }
    }
    return true;
  });

  // Keep activeGoal synchronized if activeId changes
  useEffect(() => {
    if (activeId && goals.length > 0) {
      const found = goals.find((g) => g.id === activeId);
      if (found) {
        setActiveGoal(found);
      }
    }
  }, [activeId, goals]);

  const fetchGoalsAndDraf = async (uid: string) => {
    try {
      const res = await fetch(`/api/goal-analysis?userId=${uid}`);
      const json = await res.json();
      if (json.success && json.data) {
        const fetchedGoals = json.data.goals || [];
        setGoals(fetchedGoals);
        if (typeof window !== "undefined") {
          localStorage.setItem("cached_goals_data", JSON.stringify(fetchedGoals));
        }
        return json.data;
      }
    } catch (e) {
      console.error("Error loading goals history", e);
    }
    return null;
  };

  // Revalidate in the background
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      if (status !== "loading") {
        setIsLoading(false);
      }
      return;
    }

    const initPage = async () => {
      if (goals.length === 0) {
        setIsLoading(true);
      }

      const data = await fetchGoalsAndDraf(session.user.id);
      if (data && data.goals) {
        if (activeId) {
          const found = data.goals.find((g: any) => g.id === activeId);
          if (found) {
            setActiveGoal(found);
          } else if (data.goals.length > 0) {
            setActiveGoal(data.goals[0]);
          }
        } else if (data.goals.length > 0) {
          setActiveGoal((currentActive) => currentActive || data.goals[0]);
        }
      }
      setIsLoading(false);
    };

    initPage();
  }, [status, session, activeId]);

  const handleBackToList = () => {
    setActiveGoal(null);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/goal-analysis");
    }
  };

  const handleSelectGoal = (goal: GoalItem) => {
    setActiveGoal(goal);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/goal-analysis?activeId=${goal.id}`);
    }
  };

  if (status === "loading" || isLoading) {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <AccessDenied />;
  }

  return (
    <div className="w-full p-4 md:p-8 min-h-screen flex flex-col justify-start relative overflow-hidden mt-6">
      {/* Subtle Mesh Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header section changes based on whether viewing detail or list */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted-foreground/10 pb-6 mb-8 relative z-10">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {activeGoal ? (
              <>
                Detail <span className="text-violet-600">Anggaran Rencana</span>
              </>
            ) : (
              <>
                Riwayat <span className="text-violet-600">Rencana Anggaran</span>
              </>
            )}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            {activeGoal 
              ? `Rincian alokasi anggaran bulanan untuk mencapai target barang ${activeGoal.title}.` 
              : "Daftar target rencana belanja barang impian yang telah berhasil disimulasikan."
            }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeGoal && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToList}
              className="gap-1.5 rounded-xl text-xs font-bold border-muted-foreground/20 hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <History size={14} /> Daftar Riwayat
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = "/budget-analysis"}
            className="gap-1.5 rounded-xl text-xs font-bold border-muted-foreground/20 hover:bg-muted/40 cursor-pointer transition-colors"
          >
            <ArrowLeft size={14} /> Analisis Ulang
          </Button>
        </div>
      </div>

      <div className="relative z-10 w-full">
        {activeGoal ? (
          <GoalDetailView activeGoal={activeGoal} />
        ) : (
          <HistoryRows goals={goals} onSelectGoal={handleSelectGoal} />
        )}
      </div>
    </div>
  );
}

export default function GoalAnalysisPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GoalAnalysisDashboard />
    </Suspense>
  );
}
