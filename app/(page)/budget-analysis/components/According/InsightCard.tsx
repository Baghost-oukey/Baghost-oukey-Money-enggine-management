"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface InsightPsikologisProps {
  decisionId: string;
}

export function InsightPsikologis({ decisionId }: InsightPsikologisProps) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState({
    purchaseDriver: "Menganalisis...",
    motivationText: "",
    riskText: ""
  });

  useEffect(() => {
    let isMounted = true;
    async function loadInsight() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/insight?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setInsight(json.data);
        }
      } catch (err) {
        console.error("Failed to load psychological insight:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInsight();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  return (
    <div className="space-y-4">
      <div className="border-b pb-3 mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          Saran Keuangan & Psikologi Belanja
        </h3>
        <p className="text-[10px] text-muted-foreground font-light mt-0.5 leading-relaxed">
          Refleksi motivasi emosional di balik rencana belanjamu.
        </p>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          <p className="text-xs text-muted-foreground">Membaca psikologi belanjamu...</p>
        </div>
      ) : (
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold">Alasan kamu kepingin beli:</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
              {insight.purchaseDriver}
            </span>
          </div>
          <p className="italic pl-2 border-l-2 text-muted-foreground leading-relaxed">
            "{insight.motivationText}"
          </p>
          <div className="p-4 rounded-xl border text-xs">
            <span className="text-[12px] text-red-600 font-extrabold uppercase block mb-1">
              Pesan penting buat Kamu:
            </span>
            <p className="leading-normal font-medium text-justify text-red-500">
              {insight.riskText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
