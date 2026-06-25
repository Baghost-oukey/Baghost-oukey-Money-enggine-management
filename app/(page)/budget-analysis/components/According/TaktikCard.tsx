"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";

interface SacrificeItem {
  item: string;
  nominalToCut?: number;
  reasons: string[];
}

interface TaktikKeuanganProps {
  decisionId: string;
}

export function TaktikKeuangan({
  decisionId,
}: TaktikKeuanganProps) {
  const [loading, setLoading] = useState(true);
  const [taktikData, setTaktikData] = useState({
    strategy: "",
    sacrificeTransparency: [] as SacrificeItem[]
  });

  useEffect(() => {
    let isMounted = true;
    async function loadTaktik() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/taktik?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setTaktikData({
            strategy: json.data.emergencyMode?.strategy || "",
            sacrificeTransparency: json.data.sacrificeTransparency || []
          });
        }
      } catch (err) {
        console.error("Failed to load taktik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTaktik();
    return () => {
      isMounted = false;
    };
  }, [decisionId]);

  return (
    <AccordionItem value="tactics-sacrifice" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Trik Buat bisa sampai target mu</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
        {loading ? (
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center py-6 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Merancang taktik penghematan jajan buat kamu...</p>
          </div>
        ) : (
          <>
            {/* Tactics */}
            {taktikData.strategy && (
              <div className="p-3 rounded-xl border border-muted/20 space-y-1">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1 uppercase mb-2">
                  Taktik Keuangan Biar Dompet Sehat
                </h5>
                <p className="font-medium text-gray-500 text-justify">{taktikData.strategy}</p>
              </div>
            )}

            {/* Sacrifice List */}
            {taktikData.sacrificeTransparency && taktikData.sacrificeTransparency.length > 0 && (
              <div className="p-3 rounded-xl bg-background/55 border border-muted/20 space-y-2">
                <h5 className="text-[9px] font-bold text-foreground flex items-center gap-1 uppercase tracking-widest">
                  Pengeluaran Jajan yang Bisa Dikurangi:
                </h5>
                {taktikData.sacrificeTransparency.slice(0, 2).map((sacrifice, index) => (
                  <div
                    key={index}
                    className="space-y-1 text-xs border border-muted/20 p-2.5 rounded-lg bg-background/55"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Pos Jajan:{" "}
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {sacrifice.item}
                        </span>
                      </span>
                      {sacrifice.nominalToCut && (
                        <span className="font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[9px]">
                          Kurangi Rp {sacrifice.nominalToCut.toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 pl-3 list-disc text-[10px] text-muted-foreground">
                      {sacrifice.reasons.map((reason, rIdx) => (
                        <li key={rIdx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
