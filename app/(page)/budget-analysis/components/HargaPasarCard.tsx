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
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Berapa sih Harga Pasaran Aslinya? 🏷️</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        <div className="p-3.5 border rounded-xl space-y-1">
          <div className="text-xs font-semibold text-foreground flex flex-col gap-1">
            <span className="font-medium">
              Harga pasaran asli untuk "{target}":
            </span>
            <span className="font-medium text-sm text-justify mx-1">
              {realMarketPrice}
            </span>
          </div>
          {priceComparisonNote && (
            <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t pt-1 mt-1">
              {priceComparisonNote}
            </p>
          )}
        </div>

        {alternativeSuggestions && alternativeSuggestions.length > 0 && (
          <div className="p-3.5 border rounded-xl space-y-2">
            <div className="text-md font-semibold uppercase flex items-center gap-1">
              Coba lirik alternatif yang lebih hemat ini:
            </div>
            <ul className="space-y-1.5 pl-4 list-disc text-[10px] text-justify mx-2">
              {alternativeSuggestions.map((item, index) => (
                <li key={index}>
                  <span className="text-gray-500 font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
