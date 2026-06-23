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
      <AccordionTrigger className="text-sm font-bold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Pertimbangan Anda</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold mx-1">Keputusan Anda Membeli Karena :</span>
          <span className="text-xs font-bold px-2 text-justify py-0.5 rounded border bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400">
            {psychologicalInsight.purchaseDriver}
          </span>
        </div>
        <p className="italic pl-2 border-l-2 text-muted-foreground leading-relaxed">
          "{psychologicalInsight.motivationText}"
        </p>
        <div className="p-3 rounded-lg border text-xs">
          <span className="text-[12px] text-red-600  font-extrabold uppercase block mb-1">
            Catatan Untuk Anda
          </span>
          <p className="leading-normal font-medium text-justify mx-2 text-red-500">
            {psychologicalInsight.riskText}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
