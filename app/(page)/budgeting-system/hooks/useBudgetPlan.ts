import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useBudgetPlan() {
  const { data: session, status } = useSession();

  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadingMessages = [
    "Menganalisis penghasilan bulanan...",
    "Mengidentifikasi catatan profil dan kondisi tempat tinggal...",
    "Menyusun prioritas kebutuhan dan cicilan wajib...",
    "Menghitung rasio alokasi anggaran terbaik...",
    "Memformulasikan taktik hidup hemat ala AI...",
    "Menyelesaikan rancangan anggaran keuangan bulanan..."
  ];

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const importedSalary = localStorage.getItem("imported_budget_salary");
      const importedNotes = localStorage.getItem("imported_budget_notes");

      if (importedSalary) {
        const clean = importedSalary.replace(/[^\d]/g, "");
        const formatted = clean ? new Intl.NumberFormat("id-ID").format(Number(clean)) : "";
        setSalary(formatted);
        localStorage.removeItem("imported_budget_salary");
      }

      if (importedNotes) {
        setNotes(importedNotes);
        localStorage.removeItem("imported_budget_notes");
      }
    }
  }, []);

  const handleQuickNote = (phrase: string) => {
    setNotes((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return phrase;
      if (trimmed.includes(phrase)) return prev; // Avoid duplicate appends
      return `${trimmed}, ${phrase.toLowerCase()}`;
    });
  };

  const handleReset = () => {
    setSalary("");
    setNotes("");
    setAnalysisResult(null);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status !== "authenticated" || !session?.user?.id) {
      alert("Kamu harus login terlebih dahulu!");
      return;
    }

    const cleanSalary = salary.replace(/[^\d]/g, "");
    const salaryNum = Number(cleanSalary);
    if (!cleanSalary || isNaN(salaryNum) || salaryNum <= 0) {
      alert("Mohon masukkan nominal gaji bulanan yang valid!");
      return;
    }

    setIsLoading(true);
    setMsgIdx(0);

    try {
      const response = await fetch("/api/budgeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          salary: salaryNum,
          notes,
          resetModel: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result.data);
      } else {
        alert("Gagal memproses alokasi anggaran: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses anggaran.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBudget = async (recommendation: any, salaryNum: number) => {
    if (!analysisResult?.id) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/budgeting", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: analysisResult.id,
          monthlyBudget: salaryNum,
          recommendation,
          aiSummary: recommendation.aiSummary,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAnalysisResult(result.data);
        alert("Perubahan anggaran berhasil disimpan ke database!");
      } else {
        alert("Gagal menyimpan perubahan anggaran: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan perubahan anggaran.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    salary,
    setSalary,
    notes,
    setNotes,
    isLoading,
    loadingMessages,
    msgIdx,
    analysisResult,
    setAnalysisResult,
    handleQuickNote,
    handleReset,
    handleSubmit,
    handleUpdateBudget,
    isSaving,
    status,
  };
}
