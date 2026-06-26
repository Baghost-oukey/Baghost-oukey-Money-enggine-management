"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Target, Landmark, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { GoalProgressCard, GoalItem } from "./components/GoalProgressCard";
import { BudgetSummaryCard, DecisionBudget } from "./components/BudgetSummaryCard";
import { ActionRoadmap } from "./components/ActionRoadmap";

export default function GoalAnalysisDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ goals: GoalItem[]; latestDecision: DecisionBudget | null }>({
    goals: [],
    latestDecision: null,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      setError("Kamu harus login terlebih dahulu untuk mengakses dashboard ini.");
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await fetch(`/api/goal-analysis?userId=${session.user.id}`);
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          } else {
            setError(json.message || "Gagal memuat rencana target keuangan.");
          }
        } catch (e) {
          console.error("Failed to fetch dashboard data:", e);
          setError("Terjadi kesalahan jaringan saat memuat data.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [status, session?.user?.id]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-xs font-bold text-zinc-500">Memuat analisis target & anggaran kamu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl border border-rose-100 bg-rose-500/[0.02] text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto animate-bounce" />
        <h2 className="text-sm font-extrabold text-rose-700">Akses Terbatas</h2>
        <p className="text-xs text-rose-600/90 font-medium leading-relaxed">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Analisis <span className="text-violet-600">Target Belanja 🎯</span>
          </h1>
          <p className="text-xs text-zinc-500 font-bold mt-1 max-w-xl">
            Selamat datang! Di sini kamu bisa memantau kemajuan menabung, alokasi anggaran belanja bulanan bersih, dan taktik mencapainya secara realistis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Goal Cards List (Col Span 7) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 flex items-center gap-1">
              <Target className="h-4 w-4 text-violet-600" />
              Target Aktif Yang Sedang Berjalan:
            </span>
            <span className="text-[10px] text-zinc-500 font-bold">
              Total: {data.goals.length} Rencana
            </span>
          </div>

          {data.goals.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 p-8 text-center bg-zinc-50/50 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Target size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-700">Belum Ada Target Aktif</h4>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Buka menu <strong>Rencana Keuangan</strong>, lakukan analisis keputusan belanja, pilih produk, dan klik <strong>Susun Anggaran</strong> untuk menyimpan target pertamamu.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {data.goals.map((goal) => (
                <GoalProgressCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Budget Breakdown & Action Roadmap (Col Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <BudgetSummaryCard decision={data.latestDecision} />
          <ActionRoadmap />
        </div>
      </div>
    </div>
  );
}