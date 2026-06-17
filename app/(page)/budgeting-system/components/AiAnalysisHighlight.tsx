import React from "react";
import { Sparkles } from "lucide-react";

interface AiAnalysisHighlightProps {
  aiSummary: string;
  modelUsed?: string;
  isNegotiating: boolean;
  sources: string[];
}

export function AiAnalysisHighlight({
  aiSummary,
  modelUsed,
  isNegotiating,
  sources,
}: AiAnalysisHighlightProps) {
  return (
    <div className="p-6 rounded-3xl border space-y-4 relative z-10 border-muted-foreground/15">
      <div className="flex items-center gap-2.5 border-b pb-3 border-muted-foreground/10 w-full">
        <div className="p-2 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles size={15} className={isNegotiating ? "animate-spin" : ""} />
        </div>
        <h4 className="text-xs font-semibold uppercase text-foreground">
          Hasil Analisis AI
        </h4>
        {modelUsed && (
          <small className={`ml-auto text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
            modelUsed === "gemini-3.1-flash-lite"
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : modelUsed === "local-fallback"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"
          }`}>
            Engine: {
              modelUsed === "gemini-3.1-flash-lite"
                ? "Gemini 3.1 Flash-Lite (Backup)"
                : modelUsed === "local-fallback"
                ? "Local Fallback (Offline)"
                : "Gemini 2.5 Flash (Default)"
            }
          </small>
        )}
      </div>

      <p className="text-[13px] md:text-[14px] leading-relaxed text-foreground/90 italic whitespace-pre-line px-1 max-h-[140px] overflow-y-auto custom-scrollbar font-medium">
        "{aiSummary}"
      </p>

      {((sources && sources.length > 0) || true) && (
        <div className="pt-3.5 border-t border-muted-foreground/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {sources && sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <h6 className="text-[9px] font-semibold uppercase mr-1 text-muted-foreground">
                Referensi:
              </h6>
              {sources.map((src, i) => (
                <span key={i} className="text-[10px] font-extrabold px-3 py-1 rounded-full border border-muted-foreground/15 flex items-center gap-1.5 shadow-sm text-foreground bg-card/25">
                   {src}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] max-w-md sm:text-right self-end sm:self-center font-light text-muted-foreground">
            *Gunakan tombol <strong>"Optimalkan"</strong> pada tabel pos di bawah untuk menyelaraskan pos secara otomatis.
          </p>
        </div>
      )}
    </div>
  );
}
