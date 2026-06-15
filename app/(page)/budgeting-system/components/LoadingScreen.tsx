import React from "react";
import { Sparkles } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center space-y-6 max-w-md mx-auto rounded-3xl border bg-card/40 backdrop-blur-sm shadow-xl border-dashed">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute w-20 h-20 border-4 border-violet-500/10 border-t-violet-600 rounded-full animate-spin" style={{ animationDuration: "1.2s" }} />
        {/* Inner reverse spin ring */}
        <div className="absolute w-14 h-14 border-4 border-violet-500/5 border-b-violet-400 rounded-full animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
        {/* Core glow icon */}
        <div className="relative w-10 h-10 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400 shadow-inner">
          <Sparkles size={18} className="animate-pulse" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground transition-all duration-300">
          {message}
        </h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Kecerdasan buatan sedang mengklasifikasikan pos keuangan dan menyusun tips taktis hidup hemat yang aman untuk profilmu.
        </p>
      </div>
    </div>
  );
}
