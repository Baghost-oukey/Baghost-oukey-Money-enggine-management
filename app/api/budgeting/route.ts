import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BudgetItem {
  name: string;
  amount: number;
}

interface CategoryAllocation {
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

interface StandardBudgetResult {
  needs: CategoryAllocation;
  wants: CategoryAllocation;
  savings: CategoryAllocation;
  aiSummary: string;
  frameworkUsed: string;
}

function getStandardBaseline(salary: number, notes: string): StandardBudgetResult {
  const needsPercent = 50;
  const wantsPercent = 30;
  const savingsPercent = 20;

  const needsAmount = Math.round((salary * needsPercent) / 100);
  const wantsAmount = Math.round((salary * wantsPercent) / 100);
  const savingsAmount = Math.round((salary * savingsPercent) / 100);

  // Default items template using standard 50/30/20 ratios
  const needsItems: BudgetItem[] = [
    { name: "Makan & Minum Harian", amount: Math.round(needsAmount * 0.45) },
    { name: "Sewa Kamar Kos / Utilitas", amount: Math.round(needsAmount * 0.35) },
    { name: "Transportasi & Bensin", amount: Math.round(needsAmount * 0.12) },
    { name: "Cadangan Pengeluaran Mendadak", amount: Math.round(needsAmount * 0.08) }
  ];
  const calculatedNeedsSum = needsItems.reduce((s, i) => s + i.amount, 0);
  if (calculatedNeedsSum !== needsAmount && needsItems.length > 0) {
    needsItems[0].amount += (needsAmount - calculatedNeedsSum);
  }

  const wantsItems: BudgetItem[] = [
    { name: "Uang Jajan & Kopi", amount: Math.round(wantsAmount * 0.6) },
    { name: "Hiburan & Hobi", amount: Math.round(wantsAmount * 0.4) }
  ];
  const calculatedWantsSum = wantsItems.reduce((s, i) => s + i.amount, 0);
  if (calculatedWantsSum !== wantsAmount && wantsItems.length > 0) {
    wantsItems[0].amount += (wantsAmount - calculatedWantsSum);
  }

  const savingsItems: BudgetItem[] = [
    { name: "Tabungan Dana Darurat", amount: Math.round(savingsAmount * 0.5) },
    { name: "Investasi / Reksa Dana", amount: Math.round(savingsAmount * 0.5) }
  ];
  const calculatedSavingsSum = savingsItems.reduce((s, i) => s + i.amount, 0);
  if (calculatedSavingsSum !== savingsAmount && savingsItems.length > 0) {
    savingsItems[0].amount += (savingsAmount - calculatedSavingsSum);
  }

  const noteLower = notes.toLowerCase();
  let aiSummary = "";
  if (noteLower.includes("mahasiswa") || noteLower.includes("kos")) {
    aiSummary = `Rencana anggaran disesuaikan untuk mahasiswa/anak kos dengan menyisihkan nominal makan dan biaya kos. Kami juga merekomendasikan dana cadangan untuk keperluan mendadak.`;
  } else if (noteLower.includes("keluarga") || noteLower.includes("anak")) {
    aiSummary = `Rencana anggaran difokuskan pada pengeluaran rumah tangga bulanan dan tabungan dana darurat keluarga untuk masa depan.`;
  } else {
    aiSummary = `Rencana anggaran bulanan standar disusun seimbang menggunakan kerangka 50/30/20 untuk mendukung kemandirian finansial Anda.`;
  }

  return {
    needs: {
      percentage: needsPercent,
      amount: needsAmount,
      description: "Pos pengeluaran wajib untuk kelangsungan hidup harian (Makan, Kos, Transportasi, dan Tagihan).",
      items: needsItems
    },
    wants: {
      percentage: wantsPercent,
      amount: wantsAmount,
      description: "Pos hiburan, jajan sore, kopi, belanja pakaian, atau rekreasi harian.",
      items: wantsItems
    },
    savings: {
      percentage: savingsPercent,
      amount: savingsAmount,
      description: "Pos uang masa depan, tabungan dana darurat, cicilan utang, atau investasi jangka panjang.",
      items: savingsItems
    },
    aiSummary,
    frameworkUsed: "Metode Alokasi Anggaran 50/30/20"
  };
}

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

    // Calculate deterministic standard baseline
    const baseline = getStandardBaseline(salaryNum, additionalNotes);

    let aiResult: typeof baseline;

    if (!apiKey) {
      console.warn("API_KEY environment variable is not defined, running local fallback.");
      aiResult = baseline;
    } else {
      const systemPrompt = `
Anda adalah konsultan keuangan pribadi cerdas dan pakar perencanaan anggaran (budgeting planner) real di Indonesia. Panggil pengguna dengan sebutan "kamu" secara sopan atau gunakan panggilan yang netral dan bersahabat.

Tugas utama Anda adalah menganalisis gaji bulanan Rp ${salaryNum.toLocaleString("id-ID")} dan catatan tambahan dari pengguna berikut:
"${additionalNotes}"

Sebagai referensi, sistem kami telah melakukan perhitungan baseline deterministik alokasi 50/30/20 sebagai berikut:
${JSON.stringify(baseline, null, 2)}

Silakan gunakan data baseline di atas sebagai landasan dasar Anda. Tugas Anda adalah melakukan review terhadap data di atas, menyempurnakan struktur kalimatnya agar terdengar natural, ramah, bersahabat, dan mudah dipahami oleh semua kalangan usia (dari usia 18 sampai 60 tahun ke atas).

Aturan Khusus:
1. Pastikan Anda mengidentifikasi profil dengan benar (misal Mahasiswa/Anak Kos vs Keluarga vs Pekerja Single).
2. Di Indonesia, pengeluaran mendadak sangat sering terjadi. Untuk mahasiswa, pastikan ada item "Cadangan Pengeluaran Mendadak (Tugas/Fotokopi)" atau sejenisnya. Untuk keluarga, pastikan ada "Dana Darurat Kesehatan Keluarga" atau sejenisnya.
3. Seluruh nama item di "items" harus menggunakan Bahasa Indonesia yang sangat sederhana dan bebas dari jargon asing (contoh: gunakan 'Uang Jajan' bukan 'Wants budget', gunakan 'Sewa Kos' bukan 'Renting').
4. Nilai total persentase needs + wants + savings wajib tepat 100.
5. Anda boleh menyesuaikan sedikit nominal item di dalam baseline di atas agar terdengar lebih kontekstual, tetapi pastikan total jumlah amount di dalam items untuk masing-masing kategori persis sama dengan amount dari kategori bersangkutan.
6. Analisis Anda pada "aiSummary" dan penjelasan deskripsi untuk "needs.description", "wants.description", dan "savings.description" harus dibuat sangat spesifik terhadap kondisi nyata pengguna yang ditulis di catatan tambahan. Jangan gunakan template kalimat yang umum. Hubungkan secara langsung dengan nominal gajinya yang kecil/besar, statusnya (misal jika ia mahasiswa dengan kos seharga 250rb, berikan perhitungan konkret sisa uang makan per hari dari total anggaran makan yang Anda buat, sebutkan warung makan murah/indomie/warteg secara ramah, serta rekomendasi aksi konkret lainnya agar anggaran kos 250rb tersebut tetap aman).

Hasil pembagian wajib dikembalikan berupa JSON murni dengan skema berikut:
{
  "needs": {
    "percentage": number,
    "amount": number,
    "description": "Penjelasan singkat pos Kebutuhan menggunakan Bahasa Indonesia yang sangat sederhana, dibuat spesifik menghubungkan nominal kebutuhan pokok dengan catatan tambahan pengguna...",
    "items": [
      { "name": "Makan & Minum Harian", "amount": number },
      { "name": "Sewa Kamar Kos", "amount": number },
      { "name": "Bensin & Transportasi", "amount": number },
      { "name": "Cadangan Pengeluaran Mendadak (Tugas/Fotokopi)", "amount": number }
    ]
  },
  "wants": {
    "percentage": number,
    "amount": number,
    "description": "Penjelasan alokasi pos Keinginan yang spesifik dikaitkan dengan jajan/kopi/hiburan bulanan pengguna...",
    "items": [
      { "name": "Uang Jajan & Kopi", "amount": number }
    ]
  },
  "savings": {
    "percentage": number,
    "amount": number,
    "description": "Penjelasan alokasi Tabungan/Investasi yang spesifik dikaitkan dengan target finansial masa depan atau dana darurat pengguna...",
    "items": [
      { "name": "Tabungan Dana Darurat", "amount": number },
      { "name": "Tabungan Masa Depan", "amount": number }
    ]
  },
  "aiSummary": "Analisis taktis, spesifik, dan saran hidup hemat konkret yang disesuaikan secara mendalam dengan catatan tambahan pengguna (contohnya menyebutkan secara presisi nominal sisa uang jajan, menyarankan warung makan murah/indomie/warteg, taktik hemat bensin/kos, secara sangat ramah, sederhana dan memotivasi. Maksimal 4 kalimat)...",
  "frameworkUsed": "Nama metode alokasi berbasis Metode 50/30/20 & Profil"
}

Aturan Validitas Matematika:
1. Total persentase "needs.percentage" + "wants.percentage" + "savings.percentage" harus persis 100.
2. Nominal "amount" total masing-masing kategori harus persis sama dengan persentase dikali gaji (amount = (percentage * salary) / 100).
3. Jumlah total seluruh "amount" dari item di dalam list "items" untuk masing-masing kategori harus persis sama dengan total "amount" dari kategori bersangkutan.
4. Respon Anda harus berupa JSON valid tanpa markdown codeblock.
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
        aiResult = baseline;
      }
    }

    // Sanitize the AI result to enforce schema consistency
    const sanitizedResult = sanitizeAiResult(aiResult);

    // Save budgeting analysis results to Database using Prisma client
    const budgetPlan = await prisma.budgetPlan.create({
      data: {
        userId,
        monthlyBudget: salaryNum,
        recommendation: sanitizedResult as any,
        aiSummary: sanitizedResult.aiSummary,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, monthlyBudget, recommendation, aiSummary } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Budget Plan ID is required." },
        { status: 400 }
      );
    }

    const updatedPlan = await prisma.budgetPlan.update({
      where: { id },
      data: {
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : undefined,
        recommendation: recommendation ? recommendation : undefined,
        aiSummary: aiSummary ? aiSummary : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Anggaran berhasil diperbarui.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating budget plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function sanitizeAiResult(rawResult: any): any {
  const sanitizeCategory = (cat: any) => {
    if (!cat) return { percentage: 0, amount: 0, description: "", items: [] };
    const items = Array.isArray(cat.items)
      ? cat.items.map((item: any) => {
          if (typeof item === "string") {
            return { name: item, amount: 0 };
          }
          if (item && typeof item === "object") {
            return {
              name: String(item.name || item.item || item.description || item.title || "Item Pengeluaran"),
              amount: Number(item.amount || item.value || item.cost || 0),
            };
          }
          return { name: "Item Pengeluaran", amount: 0 };
        })
      : [];
    return {
      percentage: Number(cat.percentage || 0),
      amount: Number(cat.amount || 0),
      description: String(cat.description || ""),
      items,
    };
  };

  return {
    needs: sanitizeCategory(rawResult.needs),
    wants: sanitizeCategory(rawResult.wants),
    savings: sanitizeCategory(rawResult.savings),
    aiSummary: String(rawResult.aiSummary || ""),
    frameworkUsed: String(rawResult.frameworkUsed || "AI Planner"),
  };
}
