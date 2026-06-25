"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
    <AccordionItem value="psychological-insight" className="px-4">
      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <p>Saran ku Untuk mu</p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Membaca psikologi belanjamu...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold mx-1">Alasan kamu kepingin beli:</span>
              <span className="text-xs font-bold px-2 text-justify py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
                {insight.purchaseDriver}
              </span>
            </div>
            <p className="italic pl-2 border-l-2 text-muted-foreground leading-relaxed">
              "{insight.motivationText}"
            </p>
            <div className="p-3 rounded-lg border text-xs">
              <span className="text-[12px] text-red-600 font-extrabold uppercase block mb-1">
                Pesan penting buat Kamu:
              </span>
              <p className="leading-normal font-medium text-justify mx-2 text-red-500">
                {insight.riskText}
              </p>
            </div>
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
