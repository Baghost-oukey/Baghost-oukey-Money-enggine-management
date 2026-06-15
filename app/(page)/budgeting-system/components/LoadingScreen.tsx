import React from "react";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-xs mx-auto">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-16 h-16 border-4 border-violet-500/10 border-t-violet-600 rounded-full animate-spin" style={{ animationDuration: "1.2s" }} />
        {/* Inner reverse spin ring */}
        <div className="absolute w-11 h-11 border-4 border-violet-500/5 border-b-violet-400 rounded-full animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
        {/* Core glow icon */}
        <div className="relative w-8 h-8 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400 shadow-inner">
          <Sparkles size={14} className="animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-foreground transition-all duration-300">
          {message}
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Kecerdasan buatan sedang mengklasifikasikan pos keuangan.
        </p>
      </div>
    </div>
  );
}
