"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Brain } from "lucide-react";

interface InsightPsikologisProps {
  psychologicalInsight: {
    purchaseDriver: string;
    motivationText: string;
    riskText: string;
  };
}

export function InsightPsikologis({ psychologicalInsight }: InsightPsikologisProps) {
  return (
    <AccordionItem value="psychological-insight" className="px-4">
      <AccordionTrigger className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <Brain className="text-sky-500 shrink-0" size={15} />
          <span>Insight Psikologis & Tips Emosional 🧠</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold">Pemicu Belanja:</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
            {psychologicalInsight.purchaseDriver}
          </span>
        </div>
        <p className="italic pl-1.5 border-l-2 text-muted-foreground leading-relaxed mt-1.5">
          "{psychologicalInsight.motivationText}"
        </p>
        <div className="p-3 rounded-lg bg-rose-500/[0.02] border border-rose-500/10 text-xs">
          <span className="text-[8px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest block mb-0.5">
            Risiko Emosional & Mental
          </span>
          <p className="text-muted-foreground leading-normal font-semibold">
            {psychologicalInsight.riskText}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
