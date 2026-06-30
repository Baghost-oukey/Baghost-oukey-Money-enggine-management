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

  // Testimonial show/hide details toggles for long texts
  const [showMotiv, setShowMotiv] = useState(false);
  const [showRisk, setShowRisk] = useState(false);

  const motivText = insight.motivationText || "";
  const shouldTruncateMotiv = motivText.length > 180;
  const displayMotiv = shouldTruncateMotiv && !showMotiv ? `${motivText.slice(0, 160)}...` : motivText;

  const riskText = insight.riskText || "";
  const shouldTruncateRisk = riskText.length > 180;
  const displayRisk = shouldTruncateRisk && !showRisk ? `${riskText.slice(0, 160)}...` : riskText;

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
    <div className="space-y-6 py-2">
      {/* Centered Testimonial Section Header */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          <p className="text-xs text-muted-foreground">Membaca psikologi belanjamu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch w-full">
          {/* Card 1: Motivasi Emosional (Light Turquoise Background) */}
          <div className="bg-[#e6fcfb] text-[#0d2f2d] rounded-2xl p-6 flex flex-col justify-between items-start text-left min-h-[260px] shadow-sm">
            <div>
              <span className="text-5xl font-serif text-[#a8e3e0] block leading-none select-none pointer-events-none mb-3">“</span>
              <p className="text-sm sm:text-[15px] font-semibold leading-relaxed text-[#0d2f2d] text-justify mb-6">
                {displayMotiv || "Rencana belanjamu didorong oleh keinginan spontan yang perlu dianalisis lebih lanjut."}
                {shouldTruncateMotiv && (
                  <button
                    onClick={() => setShowMotiv(!showMotiv)}
                    className="text-[#0d2f2d] font-black underline ml-1.5 text-xs hover:text-teal-900 cursor-pointer select-none inline-block"
                  >
                    {showMotiv ? "Tutup" : "Selengkapnya"}
                  </button>
                )}
              </p>
            </div>

          </div>

          {/* Card 2: Analisis Risiko Finansial (Deep Navy/Black Background) */}
          <div className="bg-slate-200 text-white rounded-2xl p-6 flex flex-col justify-between items-start text-left min-h-[260px] shadow-md">
            <div>
              <span className="text-5xl font-serif text-black block leading-none select-none pointer-events-none mb-3">“</span>
              <p className="text-sm sm:text-[15px] font-semibold leading-relaxed text-black text-justify mb-6">
                {displayRisk || "Pertimbangkan lagi dampaknya pada saldo tabungan jangka panjangmu sebelum melakukan checkout."}
                {shouldTruncateRisk && (
                  <button
                    onClick={() => setShowRisk(!showRisk)}
                    className="text-white font-black underline ml-1.5 text-xs hover:text-slate-300 cursor-pointer select-none inline-block"
                  >
                    {showRisk ? "Tutup" : "Selengkapnya"}
                  </button>
                )}
              </p>
            </div>

           
          </div>

          {/* Card 3: Saran Sahabat Finansial (Light Gray/Lavender Background) */}
          <div className="bg-[#f0f2f5] text-slate-900 rounded-2xl p-6 flex flex-col justify-between items-start text-left min-h-[260px] shadow-sm">
            <div>
              <span className="text-5xl font-serif text-[#d1d5db] block leading-none select-none pointer-events-none mb-3">“</span>
              <p className="text-sm sm:text-[15px] font-semibold leading-relaxed text-slate-800 text-justify mb-6">
                Belanja pintar itu bukan tentang seberapa banyak barang yang kamu beli, tapi tentang seberapa besar kendali dirimu atas uang jajan dan masa depanmu.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
