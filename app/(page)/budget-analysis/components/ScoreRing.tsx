"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: ScoreRingProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  const getScoreColor = (scoreValue: number) => {
    if (scoreValue >= 80) return "stroke-emerald-500 text-emerald-500";
    if (scoreValue >= 60) return "stroke-amber-500 text-amber-500";
    return "stroke-rose-500 text-rose-500";
  };

  const getScoreBgColor = (scoreValue: number) => {
    if (scoreValue >= 80) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300";
    if (scoreValue >= 60) return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300";
    return "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300";
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/10 border text-center w-full">
      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="stroke-muted/40 fill-none"
            strokeWidth="6"
          />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            className={cn("fill-none transition-all duration-1000 ease-out", getScoreColor(score))}
            strokeWidth="7"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: scoreOffset }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-foreground">{score}</span>
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-semibold">Skor Rencana</span>
        </div>
      </div>
      <div className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mt-2.5", getScoreBgColor(score))}>
        Kesehatan
      </div>
    </div>
  );
}
