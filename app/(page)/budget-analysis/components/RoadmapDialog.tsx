"use client";

import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogContent
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, CheckCircle2, ShieldCheck } from "lucide-react";
import { FormPlaning } from "./FormPlaning";

interface RoadmapDialogProps {
  monthlyBudget?: number;
  target?: string;
  targetValue?: string;
  targetDate?: string;
}

export function RoadmapDialog({
  monthlyBudget,
  target,
  targetValue,
  targetDate,
}: RoadmapDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<"intro" | "form" | "loading" | "roadmap">("intro");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [msgIdx, setMsgIdx] = useState(0);

  const loadingMessages = [
    "Menganalisis profil tempat tinggal...",
    "Memetakan target berdasarkan urgensi...",
    "Menghitung kapasitas dana darurat...",
    "Menyusun peta rencana keuangan...",
    "Menyempurnakan roadmap finansial kamu..."
  ];

  useEffect(() => {
    if (dialogState !== "loading") return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [dialogState]);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setDialogState("intro");
        setRoadmap(null);
      }, 200);
    }
  };

  const handleSubmitQuestionnaire = async (answers: any) => {
    setDialogState("loading");
    try {
      const response = await fetch("/api/planning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetData: {
            monthlyBudget,
            targetName: target,
            targetValue: targetValue,
            targetDate: targetDate,
          },
          answers,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setRoadmap(resData.data);
        setDialogState("roadmap");
      } else {
        setDialogState("intro");
        alert("Gagal memproses roadmap keuangan: " + (resData.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      setDialogState("intro");
      alert("Terjadi kesalahan saat menghubungi server.");
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-bold h-9 shadow-sm cursor-pointer"
        >
          Roadmap
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        noBlur
        size={dialogState === "form" || dialogState === "roadmap" ? "lg" : "md"}
        className="p-5 sm:p-6 rounded-2xl border bg-card/95 shadow-2xl w-[95vw] sm:w-full outline-none"
      >
        {dialogState === "intro" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-14 h-14 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-500 dark:text-violet-400 border border-violet-500/20">
                <Sparkles size={26} className="animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            <AlertDialogHeader className="space-y-1">
              <AlertDialogTitle className="text-lg font-extrabold tracking-tight">
                Bikin Roadmap Finansialmu 🗺️
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                "Yuk susun strategi menabung yang paling cocok buat kondisi hidupmu!"
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="w-full bg-muted/30 p-4 rounded-xl border text-left space-y-2 text-xs">
              <p className="font-bold text-foreground flex items-center gap-1 uppercase tracking-wider">
                <Target size={14} className="text-violet-500" />
                Kenapa Penting Punya Roadmap?
              </p>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Sangat pas dengan profil pekerjaan & tempat tinggalmu.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Taktik alokasi dana darurat & rasio aman cicilan OJK.</span>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="w-full grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full rounded-xl text-xs font-bold border-muted/50"
              >
                Batal
              </Button>
              <Button
                onClick={() => setDialogState("form")}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold"
              >
                Mulai
              </Button>
            </AlertDialogFooter>
          </div>
        )}

        {dialogState === "form" && (
          <FormPlaning
            onSubmit={handleSubmitQuestionnaire}
            onCancel={() => handleOpenChange(false)}
          />
        )}

        {dialogState === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-16 h-16 border-4 border-violet-500/10 border-t-violet-500 rounded-full animate-spin" />
              <Sparkles size={20} className="text-violet-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">
                {loadingMessages[msgIdx]}
              </h4>
              <p className="text-[10px] text-muted-foreground">
                Menyusun peta rencana keuangan terbaikmu...
              </p>
            </div>
          </div>
        )}

        {dialogState === "roadmap" && roadmap && (
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 border-b pb-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold">Roadmap Finansial AI</h4>
                <p className="text-[9px] text-muted-foreground">Rencana aksi keuangan adaptif.</p>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-4 text-xs text-muted-foreground leading-relaxed italic">
              "{roadmap.summary}"
            </div>

            <div className="pt-2 border-t">
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl text-xs font-bold py-2"
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
