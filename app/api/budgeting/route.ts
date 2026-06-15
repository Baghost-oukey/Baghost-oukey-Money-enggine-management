import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, salary, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const salaryNum = Number(salary);
    if (!salary || isNaN(salaryNum) || salaryNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid income salary is required." },
        { status: 400 }
      );
    }

    const additionalNotes = notes || "";
    const apiKey = process.env.API_KEY;

    let aiResult: {
      needs: { percentage: number; amount: number; description: string; items: string[] };
      wants: { percentage: number; amount: number; description: string; items: string[] };
      savings: { percentage: number; amount: number; description: string; items: string[] };
      aiSummary: string;
      frameworkUsed: string;
    };

    if (!apiKey) {
      console.warn("API_KEY environment variable is not defined, running local fallback.");
      aiResult = generateLocalBudgetFallback(salaryNum, additionalNotes);
    } else {
      const systemPrompt = `
Anda adalah konsultan keuangan pribadi cerdas dan ahli alokasi keuangan keluarga/pribadi. Panggil pengguna dengan sebutan "kamu".
Tugas Anda adalah membagi gaji bulanan Rp ${salaryNum.toLocaleString("id-ID")} ke dalam pos-pos pengeluaran yang ideal (menggunakan kerangka kerja seperti 50/30/20 atau 70/20/10, atau alokasi kustom yang Anda sesuaikan secara cerdas) berdasarkan catatan tambahan pengguna berikut:
"${additionalNotes}"

Analisis preferensi dan kondisi hidup mereka dari catatan tersebut (misal jika anak kos, beri alokasi sewa kamar di pos Kebutuhan; jika punya cicilan besar, prioritaskan pos Tabungan/Utang; jika fokus menabung nikah, sarankan alokasi savings agresif).

Hasil pembagian Anda wajib berupa JSON murni dengan format skema berikut:
{
  "needs": {
    "percentage": number, // Persentase alokasi Kebutuhan (misal: 50)
    "amount": number, // Nominal Rupiah (misal: 2500000)
    "description": "Penjelasan singkat pembagian pos Kebutuhan untuk profil mereka (maks 2 kalimat)...",
    "items": ["Contoh item 1", "Contoh item 2", "Contoh item 3"] // Minimal 3 contoh item pengeluaran spesifik profil mereka
  },
  "wants": {
    "percentage": number, // Persentase alokasi Keinginan (misal: 30)
    "amount": number, // Nominal Rupiah
    "description": "Penjelasan singkat alokasi pos Keinginan (maks 2 kalimat)...",
    "items": ["Contoh keinginan 1", "Contoh keinginan 2"]
  },
  "savings": {
    "percentage": number, // Persentase alokasi Tabungan/Investasi/Utang (misal: 20)
    "amount": number, // Nominal Rupiah
    "description": "Penjelasan singkat alokasi pos Tabungan/Investasi (maks 2 kalimat)...",
    "items": ["Contoh tabungan 1", "Contoh tabungan 2"]
  },
  "aiSummary": "Rangkuman taktis dan motivasi keuangan dari Anda mengenai keseluruhan anggaran ini (maks 3 kalimat)...",
  "frameworkUsed": "Aturan 50/30/20 Modifikasi" // Nama kerangka kerja yang Anda terapkan
}

Total persentase "needs.percentage" + "wants.percentage" + "savings.percentage" harus persis 100.
Nominal "amount" masing-masing pos harus sesuai perhitungan matematika persentase dikali gaji.
Pastikan respon Anda adalah JSON valid tanpa dibungkus markdown codeblock. Gunakan Bahasa Indonesia yang alami, ramah, dan solutif.
`;

      try {
        const apiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: systemPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!apiResponse.ok) {
          throw new Error(`Gemini API returned status ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        }

        const cleanedText = responseText.replace(/^\s*```json\s*|```\s*$/g, "").trim();
        aiResult = JSON.parse(cleanedText);
      } catch (err) {
        console.error("Gemini API error during budgeting, falling back locally:", err);
        aiResult = generateLocalBudgetFallback(salaryNum, additionalNotes);
      }
    }

    // Save budgeting analysis results to Database using Prisma client
    const budgetPlan = await prisma.budgetPlan.create({
      data: {
        userId,
        monthlyBudget: salaryNum,
        recommendation: aiResult as any,
        aiSummary: aiResult.aiSummary,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Alokasi anggaran bulanan berhasil dibuat.",
        data: budgetPlan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating budget plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat membuat alokasi anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function generateLocalBudgetFallback(salary: number, notes: string) {
  const noteLower = notes.toLowerCase();

  let needsPercent = 50;
  let wantsPercent = 30;
  let savingsPercent = 20;
  let frameworkUsed = "Aturan Klasik 50/30/20";
  let needsDesc = "Dialokasikan untuk pos primer penunjang hidup sehari-hari.";
  let wantsDesc = "Anggaran gaya hidup, rekreasi, dan jajan ringan agar hidup tetap seimbang.";
  let savingsDesc = "Tabungan masa depan, dana darurat, dan investasi produktif.";
  
  const needsItems = ["Belanja Bahan Makanan", "Biaya Listrik & Air", "Transportasi Harian"];
  const wantsItems = ["Makan di Luar / Jajan", "Hiburan & Streaming"];
  const savingsItems = ["Tabungan Dana Darurat", "Investasi Reksadana"];

  if (noteLower.includes("kos") || noteLower.includes("sewa")) {
    needsItems.push("Sewa Kamar Kos / Utilitas");
    needsDesc = "Termasuk anggaran sewa kos bulanan dan operasional primer harian kamu.";
  }
  if (noteLower.includes("menikah") || noteLower.includes("nikah") || noteLower.includes("kawin")) {
    needsPercent = 45;
    wantsPercent = 20;
    savingsPercent = 35;
    frameworkUsed = "Aturan 45/20/35 (Fokus Menikah)";
    savingsItems.unshift("Tabungan Persiapan Pernikahan");
    savingsDesc = "Alokasi savings diperbesar secara agresif untuk mempercepat dana pernikahan kamu.";
  } else if (noteLower.includes("cicilan") || noteLower.includes("hutang") || noteLower.includes("utang") || noteLower.includes("kredit")) {
    needsPercent = 60;
    wantsPercent = 15;
    savingsPercent = 25;
    frameworkUsed = "Aturan 60/15/25 (Prioritas Hutang & Cicilan)";
    needsItems.push("Pembayaran Cicilan Wajib");
    needsDesc = "Alokasi kebutuhan ditingkatkan untuk memastikan seluruh cicilan wajib terbayar tepat waktu.";
    wantsDesc = "Anggaran keinginan ditekan seminimal mungkin agar cash flow bulanan tetap sehat.";
  }

  return {
    needs: {
      percentage: needsPercent,
      amount: Math.round((salary * needsPercent) / 100),
      description: needsDesc,
      items: needsItems,
    },
    wants: {
      percentage: wantsPercent,
      amount: Math.round((salary * wantsPercent) / 100),
      description: wantsDesc,
      items: wantsItems,
    },
    savings: {
      percentage: savingsPercent,
      amount: Math.round((salary * savingsPercent) / 100),
      description: savingsDesc,
      items: savingsItems,
    },
    aiSummary: `Rencana keuangan ini dirancang menggunakan ${frameworkUsed} berdasarkan sisa dana kamu. Disiplin menyisihkan Rp ${(Math.round((salary * savingsPercent) / 100)).toLocaleString("id-ID")} di awal bulan akan menjadi fondasi kokoh untuk masa depan keuanganmu.`,
    frameworkUsed,
  };
}
