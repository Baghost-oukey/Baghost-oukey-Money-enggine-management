"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  subLabel?: string;
  amount: number;
  pct: number;
}

interface MinimalTimelineListProps {
  timeline: TimelineStep[];
}

export function MinimalTimelineList({ timeline }: MinimalTimelineListProps) {
  return (
    <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-1">
      {timeline.map((step, idx) => (
        <div key={idx} className="flex gap-3 items-center">
          {/* Dot & Line column */}
          <div className="flex flex-col items-center shrink-0 w-3 self-stretch">
            <div className={cn(
              "w-[1px] flex-1",
              idx === 0 ? "bg-transparent" : "bg-emerald-500/25"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full shrink-0 transition-all duration-300",
              step.pct === 100 
                ? "bg-amber-500 shadow-sm ring-2 ring-amber-500/20" 
                : "bg-emerald-500"
            )} />
            <div className={cn(
              "w-[1px] flex-1",
              idx === timeline.length - 1 ? "bg-transparent" : "bg-emerald-500/25"
            )} />
          </div>

          {/* Text details */}
          <div className="flex-1 flex justify-between items-center py-1 text-[10px] text-foreground font-semibold">
            <span className={step.pct === 100 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground font-medium"}>
              {step.label} {step.pct === 100 && "🎉"}
            </span>
            <div className="flex items-center gap-1.5 font-bold">
              <span>Rp {step.amount.toLocaleString("id-ID")}</span>
              <span className="text-[8px] text-muted-foreground font-medium">({step.pct}%)</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
