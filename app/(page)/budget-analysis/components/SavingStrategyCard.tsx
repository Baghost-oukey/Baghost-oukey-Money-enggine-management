"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { MinimalTimelineList, TimelineStep } from "./MinimalTimelineList";

interface SavingStrategyCardProps {
  title: string;
  rateText: string;
  durationText: string;
  status: string;
  badgeClass: string;
  impactMessage: string;
  considerations: React.ReactNode;
  options: string[];
  timeline: TimelineStep[];
  timelineTitle: string;
}

export function SavingStrategyCard({
  title,
  rateText,
  durationText,
  status,
  badgeClass,
  impactMessage,
  considerations,
  options,
  timeline,
  timelineTitle,
}: SavingStrategyCardProps) {
  return (
    <div className="p-4 rounded-xl bg-background/30 border border-muted/30 space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-start border-b pb-2">
          <div>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">{title}</span>
            <span className="text-emerald-600 font-extrabold text-sm block">
              {rateText}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-card text-foreground">
            {durationText}
          </span>
        </div>

        {/* Impact */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className={cn("text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-md", badgeClass)}>
              Dampak: {status}
            </span>
          </div>
          <p className="text-[10px] font-medium leading-relaxed text-muted-foreground">
            {impactMessage}
          </p>
        </div>

        {/* Considerations */}
        <div className="space-y-1 pt-1 border-t border-muted/10">
          <span className="text-[9px] font-extrabold text-foreground uppercase tracking-wide block">Pertimbangan & Alasan</span>
          <div className="text-[10px] font-medium leading-relaxed text-muted-foreground">
            {considerations}
          </div>
        </div>

        {/* Alternatives */}
        <div className="space-y-1.5 pt-1 border-t border-muted/10">
          <span className="text-[9px] font-extrabold text-foreground uppercase tracking-wide block">Opsi Lainnya</span>
          <ul className="space-y-1 text-[10px] font-semibold text-muted-foreground pl-2.5 list-disc">
            {options.map((opt, idx) => (
              <li key={idx}>{opt}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Timeline */}
      <div className="pt-3 border-t border-muted/20 space-y-2">
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
          {timelineTitle}
        </span>
        <MinimalTimelineList timeline={timeline} />
      </div>
    </div>
  );
}
