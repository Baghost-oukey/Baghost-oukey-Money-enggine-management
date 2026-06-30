"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface SaranCardProps {
  decisionId: string;
}

export function SaranCard({ decisionId }: SaranCardProps) {
  const [loading, setLoading] = useState(true);
  const [saran, setSaran] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchSaran() {
      try {
        const res = await fetch(`/api/decision/according/saran?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setSaran(json.data.aiRecommendationText);
        }
      } catch (err) {
        console.error("Failed to fetch saran:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchSaran();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  return (
    <div className="p-4 rounded-xl bg-violet-500/[0.02] border border-violet-500/15 space-y-1">
      <h4 className="text-xs font-bold uppercase flex items-center gap-2 mb-2 text-violet-600 dark:text-violet-400">
        Pesan Singkat Sahabat Keuanganmu
      </h4>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Lagi merangkum pesan hangat buat kamu...</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic font-semibold leading-relaxed">
          "{saran || "Yuk, tetap kelola keuanganmu dengan bijak ya!"}"
        </p>
      )}
    </div>
  );
}
