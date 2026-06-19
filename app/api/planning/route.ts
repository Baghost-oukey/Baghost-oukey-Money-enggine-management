import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budgetData, answers } = body;

    if (!budgetData || !answers) {
      return NextResponse.json(
        { success: false, message: "Data anggaran dan jawaban kuesioner diperlukan." },
        { status: 400 }
      );
    }

    const { monthlyBudget, targetName, targetValue, targetDate } = budgetData;
    const { tempatTinggal, penghasilan, prioritasTarget, hutangCicilan, danaDarurat } = answers;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API_KEY environment variable is not defined, using fallback roadmap.");
      return NextResponse.json({ success: true, data: generateFallbackRoadmap(budgetData, answers) }, { status: 200 });
    }

    const systemPrompt = `
Anda adalah seorang konsultan perencana keuangan (financial planner) profesional yang ramah, solutif, dan cerdas. Panggil pengguna dengan sebutan "kamu".
Tugas utama Anda adalah **merancang roadmap (rencana aksi) keuangan personal** berdasarkan data anggaran bulanan, target tabungan, dan profil kehidupan pengguna yang diperoleh dari kuesioner.

Data Anggaran & Target Keuangan:
1. Pendapatan/Budget Bulanan: Rp ${Number(monthlyBudget || 0).toLocaleString("id-ID")}
2. Rencana Target: "${targetName || "Target Keuangan"}"
3. Nominal Target: Rp ${Number(targetValue || 0).toLocaleString("id-ID")}
4. Batas Waktu Target: ${targetDate ? new Date(targetDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "Tidak ditentukan"}

Profil Kehidupan Pengguna (Hasil Kuesioner):
1. Kondisi Tempat Tinggal: ${tempatTinggal}
2. Stabilitas Penghasilan: ${penghasilan}
3. Prioritas Target: ${prioritasTarget}
4. Hutang atau Cicilan: ${hutangCicilan}
5. Ketersediaan Dana Darurat: ${danaDarurat}

---
PANDUAN STRATEGI ROADMAP PERSONAL & ATURAN BAHASA (WAJIB DIIKUTI SECARA KETAT):
- **JANGAN PERNAH menggunakan istilah "sisa anggaran" atau "sisa budget"** di seluruh hasil analisis, roadmap, dan fase-fase rencana Anda. Gunakan istilah "budget bulanan" atau "uang bulanan" saja.
- Jangan menyarankan menabung sebesar 100% dari budget bulanan. Rekomendasikan porsi alokasi menabung yang aman dan realistis (misalnya, menyisihkan 20% - 30% dari budget bulanan secara konsisten, atau hingga 50% jika target dinilai sangat mendesak/penting).
- **Kondisi Tempat Tinggal**:
   - Jika "Tinggal sendiri" atau "Bersama pasangan", ingatkan tentang biaya utilitas tersembunyi, sewa, dan pengeluaran rumah tangga mandiri.
   - Jika "Bersama orang tua", sarankan untuk memanfaatkan kesempatan ini untuk menabung secara agresif (>40% pendapatan).
   - Jika "Bersama keluarga", tekankan stabilitas alokasi belanja bulanan esensial.
- **Stabilitas Penghasilan**:
   - Jika "Tidak, berubah-ubah" (misal Freelancer / Pekerja harian), prioritaskan pembentukan "buffer fund" (dana penyangga) dan menabung lebih banyak saat pendapatan naik.
   - Jika "Ya, relatif tetap" (Karyawan), sarankan otomatisasi debet tabungan langsung setelah gajian.
- **Prioritas Target**:
   - Jika target adalah "Sangat penting" atau "Kebutuhan pekerjaan", rekomendasikan pemangkasan pos pengeluaran hiburan/keinginan untuk mencapainya lebih cepat.
   - Jika target adalah "Keinginan pribadi", ingatkan untuk tidak mengorbankan dana darurat demi target ini.
- **Hutang atau Cicilan**:
   - Jika "Ada, cukup besar", berikan saran taktik "Debt Snowball" atau "Debt Avalanche" sebelum menabung secara agresif untuk target. Prioritaskan pelunasan hutang berbunga tinggi.
   - Jika "Ada, ringan", ingatkan agar cicilan tidak melebihi 30% dari total pendapatan bulanan.
- **Dana Darurat**:
   - Jika "Belum ada" atau "Kurang dari 3 bulan pengeluaran", roadmap Fase 1 WAJIB berfokus pada pembentukan dana darurat dasar terlebih dahulu sebelum berfokus pada target tabungan utama.
   - Jika "Lebih dari 3 bulan pengeluaran", berikan pujian dan rekomendasikan investasi atau akselerasi target.

Format keluaran WAJIB berupa JSON murni dengan skema berikut:
{
  "summary": "Analisis ringkas profil keuangan kamu berdasarkan tempat tinggal, cicilan, dan dana darurat (maksimal 3 kalimat)...",
  "phases": [
    {
      "name": "Fase 1: Nama Fase",
      "duration": "Durasi waktu (misal: Bulan 1)",
      "steps": [
        "Langkah aksi konkret 1...",
        "Langkah aksi konkret 2..."
      ]
    },
    {
      "name": "Fase 2: Nama Fase",
      "duration": "Durasi waktu (misal: Bulan 2-3)",
      "steps": [
        "Langkah aksi konkret 1...",
        "Langkah aksi konkret 2..."
      ]
    }
  ],
  "tips": [
    "Tips praktis 1 sesuai jawaban kuesioner...",
    "Tips praktis 2 sesuai jawaban kuesioner..."
  ],
  "conclusion": "Kalimat penutup yang memotivasi dan ramah (maksimal 1 kalimat)."
}

Pastikan respon Anda adalah JSON valid tanpa dibungkus markdown codeblock. Gunakan Bahasa Indonesia yang ramah, taktis, objektif, dan sangat mudah dipahami oleh semua kalangan.
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
      const roadmapData = JSON.parse(cleanedText);

      return NextResponse.json({ success: true, data: roadmapData }, { status: 200 });

    } catch (apiError) {
      console.error("Gemini API error during planning, falling back to local:", apiError);
      return NextResponse.json({ success: true, data: generateFallbackRoadmap(budgetData, answers) }, { status: 200 });
    }

  } catch (error) {
    console.error("Internal server error in planning route:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat membuat roadmap personal.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Generates a tailored local roadmap fallback when Gemini is unavailable
function generateFallbackRoadmap(budgetData: any, answers: any) {
  const { monthlyBudget, targetName, targetValue } = budgetData;
  const { tempatTinggal, penghasilan, prioritasTarget, hutangCicilan, danaDarurat } = answers;

  const budgetNum = Number(monthlyBudget || 0);
  const suggestedSaving = Math.round(budgetNum * 0.3); // recommend saving 30% of monthly budget

  let summary = `Analisis profil menunjukkan kamu tinggal ${tempatTinggal.toLowerCase()} dengan stabilitas penghasilan yang ${penghasilan === "Ya, relatif tetap" ? "stabil" : "fluktuatif"}. `;
  
  if (hutangCicilan !== "Tidak ada") {
    summary += `Adanya cicilan keuangan memerlukan alokasi ketat agar pembayaran tidak terlambat. `;
  }
  if (danaDarurat === "Belum ada") {
    summary += `Prioritas utama kamu adalah membangun dana darurat sebagai pelindung finansial.`;
  } else {
    summary += `Pertahankan kedisiplinan keuangan demi merealisasikan target tabunganmu.`;
  }

  const phases = [];
  
  // Phase 1 setup
  if (danaDarurat === "Belum ada" || danaDarurat === "Kurang dari 3 bulan pengeluaran") {
    phases.push({
      name: "Fase 1: Penguatan Fondasi Keuangan & Dana Darurat",
      duration: "Bulan 1",
      steps: [
        "Sisihkan 10% - 15% pendapatan bulanan secara ketat untuk membangun dana darurat dasar.",
        "Tunda pengeluaran impulsif atau belanja keinginan tersier demi keamanan dompetmu.",
        "Catat setiap pengeluaran kecil untuk melacak kebocoran dana."
      ]
    });
  } else {
    phases.push({
      name: "Fase 1: Optimalisasi Pengeluaran & Rencana Awal",
      duration: "Bulan 1",
      steps: [
        "Pertahankan dana darurat yang sudah terkumpul dengan baik.",
        "Mulailah menyisihkan otomatis sebesar Rp " + suggestedSaving.toLocaleString("id-ID") + " dari budget bulananmu untuk target utama.",
        "Evaluasi langganan bulanan non-aktif untuk memperbesar kapasitas tabungan."
      ]
    });
  }

  // Phase 2 setup
  phases.push({
    name: "Fase 2: Akselerasi Target Rencana " + (targetName || "Keuangan"),
    duration: "Bulan 2-3",
    steps: [
      `Fokus menabung Rp ${suggestedSaving.toLocaleString("id-ID")} secara konsisten dari budget bulananmu untuk mengumpulkan target nominal Rp ${Number(targetValue || 0).toLocaleString("id-ID")}.`,
      hutangCicilan === "Ada, cukup besar" 
        ? "Gunakan metode cicilan minimum untuk hutang kecil lalu lunasi hutang terbesar (Debt Snowball)."
        : "Pastikan pengeluaran bulanan tetap stabil di bawah budget agar tidak mengganggu pos tabungan.",
      prioritasTarget === "Sangat penting" || prioritasTarget === "Kebutuhan pekerjaan"
        ? "Karena target ini dinilai Sangat Penting, alokasikan sisa bonus atau kerja sampingan langsung ke rekening target."
        : "Tetap seimbangkan antara menabung target dan pengeluaran hiburan ringan agar tidak stres."
    ]
  });

  const tips = [
    tempatTinggal === "Tinggal sendiri" 
      ? "Sebagai individu yang tinggal mandiri, waspadai pengeluaran makan luar yang bisa membengkak cepat."
      : "Manfaatkan dukungan bersama untuk menekan biaya konsumsi harian.",
    penghasilan === "Tidak, berubah-ubah"
      ? "Buat rekening tabungan terpisah. Saat bulan pendapatan tinggi, simpan lebih banyak sebagai cadangan bulan depan."
      : "Jadwalkan auto-debet ke tabungan khusus target minimal 1 hari setelah tanggal gajian tetapmu."
  ];

  return {
    summary,
    phases,
    tips,
    conclusion: "Langkah kecil yang konsisten akan membawa kamu mencapai target finansial ini dengan selamat!"
  };
}
