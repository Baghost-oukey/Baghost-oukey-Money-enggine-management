import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useBudgetPlan() {
  const { data: session, status } = useSession();

  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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

    const salaryNum = Number(salary);
    if (!salary || isNaN(salaryNum) || salaryNum <= 0) {
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
    status,
  };
}
