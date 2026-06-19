"use client";

import React from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Sparkles, ShieldCheck } from "lucide-react";

interface KabarHargaPasarProps {
  realMarketPrice?: string;
  priceComparisonNote?: string;
  alternativeSuggestions?: string[];
  target?: string;
}

export function KabarHargaPasar({
  realMarketPrice,
  priceComparisonNote,
  alternativeSuggestions,
  target,
}: KabarHargaPasarProps) {
  return (
    <AccordionItem value="market-price" className="px-4">
      <AccordionTrigger className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-500 shrink-0" size={15} />
          <span>Kabar Harga Real di Pasar 🏷️</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        <div className="p-3.5 bg-violet-600/[0.02] border rounded-xl space-y-1">
          <div className="text-xs font-semibold text-foreground flex flex-col gap-1">
            <span className="text-muted-foreground font-medium">
              Estimasi Harga Pasar untuk "{target}":
            </span>
            <span className="text-violet-600 dark:text-violet-400 font-extrabold text-sm">
              {realMarketPrice}
            </span>
          </div>
          {priceComparisonNote && (
            <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t pt-1 mt-1">
              💡 {priceComparisonNote}
            </p>
          )}
        </div>

        {alternativeSuggestions && alternativeSuggestions.length > 0 && (
          <div className="p-3.5 bg-emerald-500/[0.02] border rounded-xl space-y-2">
            <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={12} className="shrink-0 text-emerald-500" />
              Pilihan Alternatif yang Lebih Bersahabat 💡
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
              {alternativeSuggestions.map((item, index) => (
                <li key={index}>
                  <span className="text-foreground font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
