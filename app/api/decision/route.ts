import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, monthlyBudget, targetName, targetValue, targetDate, expenses, userProfile } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }
    if (!monthlyBudget || isNaN(Number(monthlyBudget))) {
      return NextResponse.json(
        { success: false, message: "Valid Monthly Budget is required." },
        { status: 400 }
      );
    }
    if (!targetName) {
      return NextResponse.json(
        { success: false, message: "Target Goals name is required." },
        { status: 400 }
      );
    }

    const parsedExpenses = Array.isArray(expenses) ? expenses : [];
    const totalExpenses = parsedExpenses.reduce(
      (sum: number, exp: any) => sum + Number(exp.amount || 0),
      0
    );
    const remainingBudget = Number(monthlyBudget) - totalExpenses;

    // Calculate metrics programmatically in Node to enforce mathematical accuracy in AI prompt
    const currentDate = new Date();
    const currentDateStr = currentDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let monthsDiff = 1;
    let daysDiff = 0;
    if (targetDate) {
      const tDate = new Date(targetDate);
      const diffTime = tDate.getTime() - currentDate.getTime();
      daysDiff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      monthsDiff = Math.max(1, Math.ceil(daysDiff / 30.44)); // Using average month length
    }

    const targetValNum = Number(targetValue || 0);
    const requiredMonthlySavings = monthsDiff > 0 ? targetValNum / monthsDiff : targetValNum;
    const feasibilityRatio = requiredMonthlySavings > 0 ? remainingBudget / requiredMonthlySavings : 1.0;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable is not defined");
      return NextResponse.json(
        { success: false, message: "Konfigurasi API AI tidak ditemukan. Silakan hubungi admin." },
        { status: 500 }
      );
    }

    // AI Analysis Prompt with strict mathematical logic and audience customization
    const systemPrompt = `
Anda adalah seorang analis keputusan keuangan (financial decision analyst) pribadi yang sangat ramah, suportif, logis, dan matematis. Panggil pengguna dengan sebutan yang akrab ("kamu").
Tugas utama Anda adalah **mengambil keputusan** dan menganalisis kelayakan rencana keuangan pengguna secara jujur, realistis, dan tajam.

Data Keuangan Nyata (Hari ini: ${currentDateStr}):
1. Budget Bulanan Kamu: Rp ${Number(monthlyBudget).toLocaleString("id-ID")}
2. Total Pengeluaran Diajukan: Rp ${totalExpenses.toLocaleString("id-ID")}
3. Sisa Anggaran Bulanan (Sisa): Rp ${remainingBudget.toLocaleString("id-ID")}
4. Rencana Target: "${targetName}"
5. Nominal Target: Rp ${targetValNum.toLocaleString("id-ID")}
6. Batas Waktu Target (Deadline): ${targetDate ? new Date(targetDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "Tidak ditentukan"}
7. Durasi Hingga Deadline: ${daysDiff} Hari (~ ${monthsDiff} Bulan)
8. Kebutuhan Tabungan Bulanan Ideal (Target / Durasi Bulan): Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan
9. Rasio Kelayakan Tabungan (Sisa / Kebutuhan Tabungan Ideal): ${(feasibilityRatio * 100).toFixed(1)}%

---
PROFIL SASARAN PENGGUNA:
Analisislah tipe/profil pengguna secara dinamis dari konteks nama target dan daftar pengeluaran yang di-inputkan (misalnya: jika ada biaya kos maka dia anak kos, jika ada biaya tugas/kuliah maka dia mahasiswa, jika ada modal usaha maka dia UMKM, jika ada pos gaji bulanan tetap maka dia karyawan, freelancer, pekerja harian, pasangan muda, keluarga kecil, dll).
Gunakan gaya bahasa, analogi pengeluaran, dan saran keuangan yang sesuai dengan hasil deduksi profil tersebut secara natural.

---
ATURAN PANJANG OUTPUT (WAJIB SINGKAT & CONCISE):
Pengguna malas membaca teks panjang. Tulis respon sesingkat mungkin!
- "impactOnTarget": Maksimal 2 kalimat pendek dan langsung ke poin keterlambatan/kelayakan secara matematis.
- "healthScoreExplanation": Maksimal 2 kalimat ringkas.
- Poin-poin "budgetEvolution": Maksimal 2 poin, masing-masing 1 baris pendek.
- "emergencyMode.strategy": Maksimal 2 kalimat taktis terpendek.
- Alasan "sacrificeTransparency": Maksimal 1 kalimat sangat pendek per poin alasan.
- "aiRecommendationText": Maksimal 1 kalimat kesimpulan/keputusan tegas.

---
PANDUAN SKOR KESEHATAN KEUANGAN (WAJIB DIIKUTI SECARA RIGID):
- Jika Sisa Anggaran Bulanan NEGATIF (Defisit): Skor Kesehatan Keuangan WAJIB rendah (10 - 39). Risiko Tinggi.
- Jika Rasio Kelayakan Tabungan di bawah 100% (Sisa < Kebutuhan Tabungan Ideal): Target ini tidak realistis dicapai tepat waktu!
  - Skor Kesehatan Keuangan TIDAK BOLEH melebihi 55! WAJIB bernilai (30 - 55). Risiko Sedang/Tinggi. Katakan dengan jujur dan ramah bahwa rencana ini tidak layak/tidak realistis.
  - Hitung secara matematis berapa lama waktu yang sebenarnya dibutuhkan untuk menabung (Nominal Target / Sisa Anggaran) dan nyatakan berapa bulan/hari keterlambatannya dibandingkan deadline awal.
- Jika Rasio Kelayakan >= 100% (Sisa >= Kebutuhan Tabungan Ideal): Keuangan sehat dan target realistis! Skor Kesehatan Keuangan bernilai tinggi (80-100). Risiko Rendah.

Anda WAJIB memberikan respon dalam format JSON murni dengan skema berikut:
{
  "score": number, // Skor sesuai aturan di atas.
  "riskLevel": "Rendah" | "Sedang" | "Tinggi", // Tingkat risiko sesuai analisis di atas.
  "impactOnTarget": string, // Evaluasi kelayakan super ringkas (maks 2 kalimat). Sebutkan durasi/persentase keterlambatan riil.
  "healthScoreExplanation": string, // Penjelasan gap matematis (maks 2 kalimat).
  "budgetEvolution": string[], // 2 poin perkembangan alokasi budget super pendek.
  "emergencyMode": {
    "isActive": boolean,
    "strategy": string // Taktik pemulihan ringkas (maks 2 kalimat).
  },
  "sacrificeTransparency": [ // Rekomendasi barang yang diajukan yang bisa dikurangi.
    {
      "item": string, // Nama barang
      "reasons": string[] // Minimal 3 alasan satu kalimat pendek (misal: "Bukan prioritas utamamu saat ini.", "Membantu menambal gap tabungan kamu.", "Bisa diganti opsi lain yang lebih hemat.")
    }
  ],
  "aiRecommendationText": string // Keputusan akhir super singkat (1 kalimat).
}

Pastikan respon Anda adalah JSON valid tanpa dibungkus markdown codeblock. Gunakan Bahasa Indonesia yang hangat, alami, bersahabat, namun tetap tegas dan jujur secara finansial.
`;

    let aiAnalysis: any = null;

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
      aiAnalysis = JSON.parse(cleanedText);
    } catch (apiError) {
      console.error("Gemini API error, falling back to local analysis:", apiError);
      
      // Local fallback using the exact same metrics and profile customizations
      const isDeficit = remainingBudget < 0;
      const isUnrealistic = feasibilityRatio < 1.0;
      
      let score = 95;
      let riskLevel = "Rendah";
      
      if (isDeficit) {
        score = 25;
        riskLevel = "Tinggi";
      } else if (feasibilityRatio < 0.3) {
        score = 40;
        riskLevel = "Tinggi";
      } else if (isUnrealistic) {
        score = 55;
        riskLevel = "Sedang";
      }

      const calculatedMonthsNeeded = remainingBudget > 0 ? (targetValNum / remainingBudget).toFixed(1) : "selamanya";
      const delayMonths = remainingBudget > 0 ? Math.max(0, Number(calculatedMonthsNeeded) - monthsDiff).toFixed(1) : "tidak terhingga";

      // Tailored fallback terms
      let profileNote = "keuangan kamu";
      let tipsNote = "pangkas pengeluaran non-esensial";
      if (userProfile === "Mahasiswa" || userProfile === "Anak kos") {
        profileNote = "anggaran mahasiswa/kos kamu";
        tipsNote = "kurangi jajan luar dan nongkrong";
      } else if (userProfile === "UMKM skala kecil") {
        profileNote = "kas bisnis UMKM kamu";
        tipsNote = "pisahkan kas pribadi dan kas usaha";
      } else if (userProfile === "Freelancer" || userProfile === "Pekerja harian") {
        profileNote = "pos pendapatan tidak menentumu";
        tipsNote = "sisihkan ekstra saat proyek ramai";
      }

      aiAnalysis = {
        score,
        riskLevel,
        impactOnTarget: isDeficit 
          ? `Rencana target "${targetName}" terhambat karena anggaran kamu defisit Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}.`
          : isUnrealistic
          ? `Rencana target "${targetName}" kurang realistis. Dengan sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan, kamu butuh ${calculatedMonthsNeeded} bulan dan akan terlambat ${delayMonths} bulan.`
          : `Target kamu realistis! Sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan cukup menutupi tabungan ideal bulananmu.`,
        healthScoreExplanation: isUnrealistic
          ? `Skor keuangan ${score} karena gap tabungan bulanan masih besar. Sisa uang Rp ${remainingBudget.toLocaleString("id-ID")} sedangkan butuh Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")}/bulan.`
          : `Skor keuangan ${score} karena pos pengeluaran aman dan menyisakan dana tabungan yang memadai.`,
        budgetEvolution: [
          `Pengeluaran bulanan menyerap sekitar ${((totalExpenses / monthlyBudget) * 100).toFixed(1)}% dari total budget.`,
          `Tabungan bulanan memenuhi ${(feasibilityRatio * 100).toFixed(1)}% dari target ideal bulanan.`
        ],
        emergencyMode: {
          isActive: isDeficit || isUnrealistic,
          strategy: isDeficit
            ? `Posisi darurat! Segera tunda belanja tersier dan ${tipsNote} sampai saldo stabil.`
            : isUnrealistic
            ? `Target kurang realistis. Coba perpanjang batas waktu targetmu menjadi minimal ${Math.ceil(Number(calculatedMonthsNeeded))} bulan agar lebih ringan.`
            : "Sisa anggaran aman. Jaga kestabilan dengan menyusun dana darurat pos kecil."
        },
        sacrificeTransparency: parsedExpenses.slice(0, 2).map((exp: any) => ({
          item: exp.name,
          reasons: [
            "Bukan pengeluaran wajib harian kamu.",
            "Bisa dialokasikan untuk menambal kekurangan tabungan bulanan.",
            "Dapat dikurangi tanpa mengganggu kenyamanan pokok harian."
          ]
        })),
        aiRecommendationText: isDeficit
          ? "Keputusan akhir: Tunda rencana belanja ini demi kesehatan dompet kamu."
          : isUnrealistic
          ? "Keputusan akhir: Revisi deadline target tabungan agar keuangan tidak tertekan."
          : "Keputusan akhir: Lanjutkan rencana belanja dan tetap menabung dengan disiplin!"
      };
    }

    // Save decision analysis and its nested expenses inside a transaction
    const decision = await prisma.decisionAnalysis.create({
      data: {
        userId,
        monthlyBudget: Number(monthlyBudget),
        targetName,
        targetValue: Number(targetValue || 0),
        targetDate: targetDate ? new Date(targetDate) : null,
        score: aiAnalysis.score,
        riskLevel: aiAnalysis.riskLevel,
        recommendation: JSON.stringify(aiAnalysis),
        status: "SELESAI",
        expenses: {
          create: parsedExpenses.map((exp: any) => ({
            name: exp.name,
            amount: Number(exp.amount),
          })),
        },
      },
      include: {
        expenses: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Analisis keputusan keuangan berhasil disimpan.",
        data: decision,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating financial decision analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat menyimpan analisis.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


