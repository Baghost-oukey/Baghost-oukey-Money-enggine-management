import React from "react";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-xs mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-zinc-500/10 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" style={{ animationDuration: "1.2s" }} />
        <div className="absolute w-11 h-11 border-4 border-zinc-500/5 border-b-zinc-400 rounded-full animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
        <div className="absolute w-8 h-8 rounded-full bg-zinc-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-inner">
          <Sparkles size={14} className="animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-foreground">
          {message}
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Kecerdasan buatan sedang mengklasifikasikan pos keuangan.
        </p>
      </div>
    </div>
  );
}
