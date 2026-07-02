import React from "react";
import { AlertTriangle } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3 max-w-md mx-auto text-center px-4">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <h3 className="text-lg font-bold">Akses Dibatasi</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Silakan masuk/login terlebih dahulu untuk mulai menyusun rencana anggaran dan memantau target finansial Anda.
      </p>
    </div>
  );
}
