"use client";

import React, { useEffect, useState } from "react";
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
    <div className="space-y-4">
      <div className="border-b pb-3 mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          Taktik Keuangan & Rencana Penghematan
        </h3>
        <p className="text-[10px] text-muted-foreground font-light mt-0.5 leading-relaxed">
          Trik praktis dan daftar penyesuaian jajan harian/bulanan agar target finansialmu cepat terwujud.
        </p>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          <p className="text-xs text-muted-foreground">Merancang taktik penghematan jajan buat kamu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      )}
    </div>
  );
}
