"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

interface KabarHargaPasarProps {
  decisionId: string;
  target?: string;
}

export function KabarHargaPasar({
  decisionId,
  target,
}: KabarHargaPasarProps) {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState({
    realMarketPrice: "",
    priceComparisonNote: "",
    alternativeSuggestions: [] as string[]
  });

  useEffect(() => {
    let isMounted = true;
    async function loadMarketPrice() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/pasar?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setMarketData({
            realMarketPrice: json.data.realMarketPrice || "",
            priceComparisonNote: json.data.priceComparisonNote || "",
            alternativeSuggestions: json.data.alternativeSuggestions || []
          });
        }
      } catch (err) {
        console.error("Failed to load market prices:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMarketPrice();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  return (
    <AccordionItem value="market-price" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <p>Kemungkinan Harga nya nih </p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-3 text-xs leading-relaxed">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Mengecek harga pasar riil buat kamu...</p>
          </div>
        ) : (
          <>
            <div className="p-3.5 border rounded-xl space-y-1">
              <div className="text-xs font-semibold text-foreground flex flex-col gap-1">
                <span className="font-medium">
                  Harga pasaran asli untuk "{target}":
                </span>
                <span className="font-medium text-sm text-justify mx-1">
                  {marketData.realMarketPrice}
                </span>
              </div>
              {marketData.priceComparisonNote && (
                <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t pt-1 mt-1">
                  {marketData.priceComparisonNote}
                </p>
              )}
            </div>

            {marketData.alternativeSuggestions && marketData.alternativeSuggestions.length > 0 && (
              <div className="p-3.5 border rounded-xl space-y-2">
                <div className="text-md font-semibold uppercase flex items-center gap-1">
                  Coba lirik alternatif yang lebih hemat ini:
                </div>
                <ul className="space-y-1.5 pl-4 list-disc text-[10px] text-justify mx-2">
                  {marketData.alternativeSuggestions.map((item, index) => (
                    <li key={index}>
                      <span className="text-gray-500 font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
