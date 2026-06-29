"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/portal";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Target, Landmark, AlertCircle, Loader2 } from "lucide-react";
import { ScraperItem } from "../../types";

export type ExpenseItem = {
  name: string;
  amount: number;
};

interface SusunAnggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  decisionId: string;
  initialTargetName: string;
  initialTargetValue: string;
  initialMonthlyBudget: number;
  initialExpenses: ExpenseItem[];
  targetDate?: string;
  selectedProduct: ScraperItem | null;
}

export function SusunAnggaranModal({
  isOpen,
  onClose,
  userId,
  decisionId,
  initialTargetName,
  initialTargetValue,
  initialMonthlyBudget,
  initialExpenses,
  targetDate,
  selectedProduct,
}: SusunAnggaranModalProps) {
  const router = useRouter();
  
  // Local states pre-filled with props
  const [targetName, setTargetName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  
  // Loading state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state with selectedProduct or defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedProduct) {
        setTargetName(selectedProduct.title);
        setTargetValue(String(selectedProduct.priceNumber));
      } else {
        setTargetName(initialTargetName || "");
        setTargetValue(initialTargetValue || "0");
      }
      setMonthlyBudget(String(initialMonthlyBudget || ""));
      setExpenses(initialExpenses || []);
      setErrorMsg("");
    }
  }, [isOpen, selectedProduct, initialTargetName, initialTargetValue, initialMonthlyBudget, initialExpenses]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setErrorMsg("");
    const finalBudget = Number(monthlyBudget);
    const finalTargetVal = Number(targetValue);

    if (!targetName.trim()) {
      setErrorMsg("Nama target tidak boleh kosong.");
      return;
    }
    if (isNaN(finalTargetVal) || finalTargetVal <= 0) {
      setErrorMsg("Nominal target harus lebih dari Rp 0.");
      return;
    }
    if (isNaN(finalBudget) || finalBudget <= 0) {
      setErrorMsg("Anggaran bulanan harus lebih dari Rp 0.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/goal-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          decisionId,
          targetName: targetName.trim(),
          targetValue: finalTargetVal,
          monthlyBudget: finalBudget,
          expenses,
          targetDate,
        }),
      });

      const res = await response.json();
      if (res.success) {
        onClose();
        router.push("/goal-analysis");
      } else {
        setErrorMsg(res.message || "Gagal menyimpan rencana anggaran.");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      {/* Background backdrop without blur */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 text-zinc-950 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 outline-none">
          {/* Header Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-violet-600/10 text-violet-600">
                <Target size={16} />
              </div>
              <div>
                <h3 className="text-[13px] font-extrabold text-zinc-900 leading-tight">
                  Susun Anggaran & Target Belanja
                  
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">
                  Konfirmasi pemasukan dan pengeluaran sebelum menyimpan target
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-bold animate-shake">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Target Item Details Banner */}
            {selectedProduct ? (
              <div className="p-3 bg-violet-600/5 border border-violet-500/15 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-violet-600 leading-none block">
                    Target Dipilih Dari Tokopedia
                  </span>
                  <h4 className="text-[11px] font-bold text-zinc-900 truncate leading-snug mt-0.5">
                    {selectedProduct.title}
                  </h4>
                  <span className="text-[11px] font-extrabold text-violet-600 block mt-0.5">
                    {selectedProduct.price}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-zinc-50 border rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center shrink-0">
                  <Target size={16} />
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 leading-none block">
                    Target Manual
                  </span>
                  <h4 className="text-[11px] font-bold text-zinc-900 leading-snug mt-0.5">
                    {targetName || initialTargetName}
                  </h4>
                  <span className="text-[11px] font-extrabold text-zinc-900 block mt-0.5">
                    Rp {Number(targetValue || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            {/* Target Info Static Text (Printed style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-b pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                  Nama Target
                </span>
                <div className="text-xs font-bold text-zinc-800 leading-tight py-1">
                  {targetName}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider block">
                  Harga Target
                </span>
                <div className="text-xs font-black text-zinc-900 py-1">
                  Rp {Number(targetValue || 0).toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {/* Income Static Text (Printed style) */}
            <div className="space-y-1.5 p-3.5 bg-violet-600/[0.02] border border-violet-500/10 rounded-2xl">
              <span className="text-[10px] font-extrabold uppercase text-violet-600 tracking-wider flex items-center gap-1.5 leading-none">
                <Landmark size={12} />
                Pemasukan / Uang Bulanan Kamu
              </span>
              <div className="text-[13px] font-black text-violet-600 leading-none pt-1">
                Rp {Number(monthlyBudget || 0).toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t px-5 py-3 bg-zinc-50">
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={onClose}
              className="h-9 text-[10px] font-bold rounded-xl border-zinc-200 bg-white cursor-pointer px-4"
            >
              Batal
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSave}
              className="h-9 text-[10px] font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white cursor-pointer px-5 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  Lanjutkan & Simpan Target
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
