"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ModalSyncProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  showCancel?: boolean;
}

export function ModalSync({
  isOpen,
  onClose,
  title,
  description,
  showCancel = true,
}: ModalSyncProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent
        noBlur
        size="sm"
        overlayClassName="bg-black/40 backdrop-blur-xs"
        className="p-6 rounded-3xl border border-zinc-200/80 bg-white text-zinc-900 max-w-sm w-[90vw] mx-auto shadow-2xl flex flex-col items-center justify-center text-center space-y-6 outline-none"
      >
        {/* Spinner process styled like LoadingScreen.tsx but bright themed */}
        <div className="relative w-16 h-16 flex items-center justify-center mt-2">
          <div className="absolute inset-0 border-4 border-zinc-100 border-t-violet-600 rounded-full animate-spin" style={{ animationDuration: "1.2s" }} />
          <div className="absolute w-11 h-11 border-4 border-zinc-50 border-b-violet-400 rounded-full animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
          <div className="absolute w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shadow-inner">
            <Sparkles size={14} className="animate-pulse" />
          </div>
        </div>

        <AlertDialogHeader className="space-y-2 flex flex-col items-center text-center">
          <AlertDialogTitle className="text-sm font-bold tracking-tight text-zinc-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-zinc-500 leading-relaxed font-normal px-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {showCancel && (
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold px-6 py-2 h-9 transition-colors active:scale-[0.98] w-24 cursor-pointer mt-2"
          >
            Batal
          </Button>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
