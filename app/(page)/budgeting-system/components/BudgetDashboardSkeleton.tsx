import React from "react";
import { Sparkles } from "lucide-react";

interface BudgetDashboardSkeletonProps {
  loadingMessage: string;
}

export function BudgetDashboardSkeleton({ loadingMessage }: BudgetDashboardSkeletonProps) {
  return (
    <div className="w-full relative select-none">
      {/* Floating Center Loading Status */}
      <div className="absolute inset-0 z-20 bg-background/20 backdrop-blur-[2px] rounded-3xl">
        <div className="absolute top-[35vh] left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 sm:p-8 rounded-3xl border border-muted-foreground/10 bg-background/95 shadow-2xl max-w-sm w-[calc(100%-2rem)] flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-zinc-500/10 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute w-8 h-8 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-inner">
              <Sparkles size={14} className="animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h4 className="text-xs font-bold text-foreground">
              {loadingMessage || "Asisten AI sedang bekerja..."}
            </h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Kecerdasan buatan sedang mengklasifikasikan pos keuangan.
            </p>
          </div>
        </div>
      </div>

      {/* Pulsing Background Skeleton Layout */}
      <div className="w-full space-y-6 animate-pulse">
        {/* Title Skeleton */}
        <div className="space-y-2.5">
          <div className="h-9 w-64 bg-muted/40 rounded-xl" />
          <div className="h-10 max-w-4xl bg-muted/20 rounded-xl" />
        </div>

      {/* Grid 5 Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 rounded-3xl border border-muted-foreground/10 bg-card/20 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-muted/40 rounded" />
                <div className="h-2 w-24 bg-muted/20 rounded" />
              </div>
              <div className="w-9 h-9 rounded-2xl bg-muted/30" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-7 w-28 bg-muted/40 rounded-lg" />
              <div className="h-3 w-10 bg-muted/20 rounded pt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysis Highlight Panel Skeleton */}
      <div className="p-6 rounded-3xl border border-muted-foreground/10 bg-card/20 space-y-4">
        <div className="flex items-center gap-2.5 border-b pb-3 border-muted-foreground/10">
          <div className="w-8 h-8 rounded-xl bg-muted/30" />
          <div className="h-4 w-32 bg-muted/40 rounded" />
        </div>
        <div className="space-y-2.5 py-1">
          <div className="h-3.5 w-full bg-muted/30 rounded" />
          <div className="h-3.5 w-[90%] bg-muted/30 rounded" />
          <div className="h-3.5 w-[75%] bg-muted/30 rounded" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-muted-foreground/10">
          <div className="h-5 w-20 bg-muted/20 rounded-full" />
          <div className="h-5 w-24 bg-muted/20 rounded-full" />
        </div>
      </div>

      {/* Tab Switcher Skeleton */}
      <div className="flex gap-1 border-b border-muted-foreground/10 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-muted/20 rounded-t-2xl border-t border-x border-transparent" />
        ))}
      </div>

      {/* Category Table Card Skeleton */}
      <div className="p-5 rounded-3xl border border-muted-foreground/10 bg-card/20 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 border-muted-foreground/10">
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 bg-muted/30 rounded-full" />
            <div className="h-5 w-36 bg-muted/40 rounded-lg" />
          </div>
          <div className="h-8 w-24 bg-muted/30 rounded-lg" />
        </div>
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <div className="h-4 w-32 bg-muted/30 rounded" />
              <div className="h-4 w-20 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-muted-foreground/10 flex justify-between items-center">
          <div className="h-5 w-28 bg-muted/20 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-muted/30 rounded-xl" />
            <div className="h-8 w-28 bg-muted/30 rounded-xl" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
