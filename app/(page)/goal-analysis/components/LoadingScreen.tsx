import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Memuat data perencanaan target..." }: LoadingScreenProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[70vh] space-y-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      <p className="text-sm text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
