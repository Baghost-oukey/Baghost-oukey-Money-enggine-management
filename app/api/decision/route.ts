import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function detectSumberDana(text: string): string {
  if (!text) return "Nabung Cash";
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes("judi") ||
    lowerText.includes("slot") ||
    lowerText.includes("gacor") ||
    lowerText.includes("jp") ||
    lowerText.includes("maxwin") ||
    lowerText.includes("taruhan") ||
    lowerText.includes("depo") ||
    lowerText.includes("zeus") ||
    lowerText.includes("spekulasi")
  ) {
    return "Hasil Judi / Spekulasi";
  }
  
  if (
    lowerText.includes("pinjol") ||
    lowerText.includes("pinjam online") ||
    lowerText.includes("cair cepat") ||
    lowerText.includes("dana cepat") ||
    lowerText.includes("rupiah cepat") ||
    lowerText.includes("adakami") ||
    lowerText.includes("kredivo") ||
    lowerText.includes("easycash") ||
    lowerText.includes("pinjaman online")
  ) {
    return "Pinjaman Online";
  }
  
  if (
    lowerText.includes("paylater") ||
    lowerText.includes("spaylater") ||
    lowerText.includes("gopaylater") ||
    lowerText.includes("cicil") ||
    lowerText.includes("kredit") ||
    lowerText.includes("cc") ||
    lowerText.includes("kartu kredit") ||
    lowerText.includes("tempo")
  ) {
    return "Paylater/Kredit";
  }
  
  if (
    lowerText.includes("tabungan") ||
    lowerText.includes("dana cadangan") ||
    lowerText.includes("simpanan") ||
    lowerText.includes("aktif") ||
    lowerText.includes("emas") ||
    lowerText.includes("reksa") ||
    lowerText.includes("saham") ||
    lowerText.includes("celengan")
  ) {
    return "Dana Cadangan";
  }
  
  return "Nabung Cash";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, monthlyBudget, targetName, targetValue, targetDate, expenses, userProfile, jenisTarget, keteranganTambahan } = body;
    const sumberDana = detectSumberDana(keteranganTambahan || "");

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

    const expensesText = parsedExpenses.length > 0
      ? parsedExpenses.map((exp: any) => `   - ${exp.name}: Rp ${Number(exp.amount || 0).toLocaleString("id-ID")}`).join("\n")
      : "   - (Tidak ada pengeluaran bulanan spesifik yang diinput)";

    // AI Analysis Prompt with strict mathematical logic and audience customization
    const systemPrompt = `
Anda adalah seorang analis keputusan keuangan (financial decision analyst) pribadi yang sangat logis, matematis, tegas, jujur, dan blak-blakan (brutally honest). Panggil pengguna dengan sebutan yang akrab ("kamu").
Tugas utama Anda adalah **mengambil keputusan** dan menganalisis kelayakan rencana keuangan pengguna secara jujur, realistis, tajam, dan bertanggung jawab tanpa basa-basi. Jangan pernah menghibur pengguna dengan harapan palsu. Jika rencananya tidak masuk akal atau berisiko, katakan secara langsung dengan gaya bahasa yang menampar realitas (misalnya: "mustahil", "konyol secara finansial", "jebakan setan pinjol", "spekulasi konyol judol").
Secara khusus, bedahlah 'Keterangan Tambahan / Curhatan Pengguna' yang dituliskan pengguna (jika ada). Pahami alasan/cerita di balik curhatan mereka (misalnya jika mereka menggunakan paylater/utang demi urgensi tertentu atau memiliki pengeluaran membengkak) dan berikan saran serta kritik mendidik yang sangat relevan dengan kisah curhatan mereka.

Data Keuangan Nyata (Hari ini: ${currentDateStr}):
1. Budget Bulanan Kamu: Rp ${Number(monthlyBudget).toLocaleString("id-ID")}
2. Total Pengeluaran Diajukan: Rp ${totalExpenses.toLocaleString("id-ID")}
   Rincian Pengeluaran Kamu Saat Ini:
${expensesText}
3. Sisa Anggaran Bulanan (Sisa): Rp ${remainingBudget.toLocaleString("id-ID")}
4. Rencana Target Belanja: "${targetName}"
5. Kategori Target Belanja: "${jenisTarget || "Keinginan"}" (Kebutuhan vs Keinginan)
6. Nominal Target (Ekspektasi Kamu): Rp ${targetValNum.toLocaleString("id-ID")}
7. Batas Waktu Target (Deadline): ${targetDate ? new Date(targetDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }) : "Tidak ditentukan"}
8. Durasi Hingga Deadline: ${daysDiff} Hari (~ ${monthsDiff} Bulan)
9. Rencana Sumber Dana Pembelian: "${sumberDana || "Nabung Cash"}"
10. Kebutuhan Tabungan Bulanan Ideal (Target / Durasi Bulan): Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan
11. Rasio Kelayakan Tabungan (Sisa / Kebutuhan Tabungan Ideal): ${(feasibilityRatio * 100).toFixed(1)}%
12. Keterangan Tambahan / Curhatan Pengguna: "${keteranganTambahan || "(Tidak ada)"}"

---
PANDUAN BAHAYA FINANSIAL & PUTUSAN KEPUTUSAN (WAJIB DIIKUTI SECARA RIGID):
1. **Analisis Sumber Dana**:
   - Jika "Sumber Dana" adalah "Hasil Judi / Spekulasi", Anda **WAJIB** memberikan keputusan penolakan mutlak (verdict: "BLOCKED_DANGER"). Berikan teguran keras blak-blakan mengenai bahaya judi online (judol) yang pasti menghancurkan masa depan secara statistik (matematika bandar).
   - Jika "Sumber Dana" adalah "Pinjaman Online", Anda **WAJIB** memberikan keputusan penolakan mutlak (verdict: "BLOCKED_DANGER"). Berikan peringatan tajam mengenai bahaya jeratan pinjol ilegal/legal (bunga harian mencekik, teror penagihan, kehancuran skor kredit SLIK OJK).
   - Jika "Sumber Dana" adalah "Paylater/Kredit", beri keputusan bahaya/tunda (verdict: "BLOCKED_DANGER" jika sisa dana/budget bulanan negatif/mepet, atau "WARNING_REPLAN" jika mepet tapi masih positif). Berikan penjelasan detail mengenai kerugian membayar bunga paylater konsumtif.
   - Jika "Sumber Dana" adalah "Nabung Cash" atau "Dana Cadangan", berikan status "RECOMMENDED_CASH" dengan catatan rasio kelayakan tabungan >= 100%.

2. **Skor Kesehatan Keuangan**:
   - Jika rencana bersumber dari "Hasil Judi / Spekulasi" atau "Pinjaman Online", Skor Kesehatan Keuangan **WAJIB bernilai 0**.
   - Jika Sisa Anggaran Bulanan NEGATIF (Defisit), Skor Kesehatan Keuangan **WAJIB bernilai 0**.
   - Jika rasio kelayakan di bawah 100%, berikan skor di rentang 10 - 55 tergantung kelayakannya. Nyatakan keterlambatan waktu menabung nyata (Nominal Target / Sisa Anggaran).

3. **Simulasi Nabung vs Paylater (Biaya Utang)**:
   - Jika pengguna memilih "Paylater/Kredit" atau "Pinjaman Online" (atau jika rencana menabung cash sangat mepet sehingga berisiko tergiur utang), isi properti "paylaterSimulation" dengan perbandingan matematis berikut:
     - Biaya Admin: 5% dari Nominal Target.
     - Bunga 12 Bulan: 3.5% per bulan x 12 bulan = 42% dari Nominal Target.
     - Total Harga Paylater: Nominal Target + Biaya Admin + Bunga 12 Bulan.
     - Kerugian Finansial (Sia-sia): Biaya Admin + Bunga 12 Bulan.

---
PROFIL SASARAN PENGGUNA:
Analisislah tipe/profil pengguna secara dinamis dari konteks nama target dan daftar pengeluaran yang di-inputkan (misalnya: jika ada biaya kos maka dia anak kos, jika ada biaya tugas/kuliah maka dia mahasiswa, jika ada modal usaha maka dia UMKM, jika ada pos gaji bulanan tetap maka dia karyawan, freelancer, pekerja harian, pasangan muda, keluarga kecil, dll).
Gunakan gaya bahasa, analogi pengeluaran, dan saran keuangan yang sesuai dengan hasil deduksi profil tersebut secara natural.

---
RISET HARGA PASAR REAL (FAKTA):
Carilah informasi harga pasar riil (fakta nyata) terupdate dari barang yang ingin dibeli pengguna berdasarkan nama target ("targetName" seperti iPhone 17 Pro, Honda Civic, MacBook, dll.). Gunakan pengetahuan factual Anda untuk menyebutkan harga pasar asli barang tersebut dalam Rupiah di lapangan secara mendalam.
Sebutkan rentang harga pasar nyata terupdate berdasarkan spesifikasi dasar, rentang harga berbagai tipe/varian atau kapasitas penyimpanan (misalnya storage 128GB vs 256GB jika itu gawai), atau faktor kondisi baru/bekas jika relevan, agar data tersebut kredibel dan dapat dipertanggungjawabkan di lapangan.

---
EVALUASI EKSPEKTASI USER VS HARGA PASAR:
Bandingkan secara tegas nominal target ("targetValue") yang dimasukkan pengguna dengan hasil riset harga pasar riil Anda di atas.
If nominal target ("targetValue") yang dimasukkan pengguna jauh di bawah harga pasar aslinya (misalnya ingin beli iPhone 17 Pro tapi target nominal diisi hanya Rp 5.000.000, padahal harga aslinya diperkirakan Rp 25.000.000+), sebutkan secara tegas di "priceComparisonNote" bahwa estimasi target nominal yang diajukan pengguna terlalu rendah dan tidak realistis di bawah harga pasar asli. Nyatakan berapa gap kekurangannya berdasarkan ekspektasi mereka.

---
ALTERNATIF OPSI REALISTIS:
Jika nama target ("targetName") tidak spesifik (misalnya hanya diisi kata generik seperti "hp", "handphone", "laptop", "motor", "mobil", "rumah") ATAU jika rencana target spesifik tersebut dinilai mustahil/tidak logis dicapai sesuai deadline:
Anda wajib menyajikan 2-3 alternatif pilihan barang yang spesifik, nyata, dan konkret beserta perkiraan harganya di lapangan pada array "alternativeSuggestions" (misalnya: jika diisi targetName adalah "hp" dengan budget Rp 5.000.000 dan sisa anggaran tipis, sarankan model spesifik seperti "Samsung Galaxy A15 (Sekitar Rp 2.900.000)" atau "Redmi Note 13 (Sekitar Rp 2.500.000)" yang lebih realistis dan terjangkau dibeli tepat waktu berdasarkan kapasitas menabung nyata pengguna).

---
PANDUAN PENGURANGAN PENGELUARAN (SACRIFICE RULES):
- Dalam merekomendasikan pengurangan pengeluaran di "sacrificeTransparency", Anda **HANYA BOLEH** memilih item dari daftar nyata pengguna ("Rincian Pengeluaran Kamu Saat Ini").
- **Dilarang keras menggunakan persentase** saat menyarankan pengurangan! Gunakan **nilai nominal Rupiah yang logis dan aman**.
- **PENTING: Jangan menyarankan pemotongan ekstrim yang tidak sehat** (misalnya memotong biaya makan hingga 70% karena bisa menyebabkan gangguan kesehatan seperti asam lambung). Berikan saran pemangkasan kecil yang rasional (misalnya memotong Rp 200.000 - Rp 400.000 dari total pengeluaran makan Rp 2.000.000 dengan cara beralih ke masak sendiri atau mengurangi jajan luar, bukan meniadakan makan).
- Nilai pemangkasan wajib dimasukkan pada properti "nominalToCut" dalam bentuk angka Rupiah murni.

---
ATURAN PANJANG OUTPUT (WAJIB SINGKAT & CONCISE):
Pengguna malas membaca teks panjang. Tulis respon sesingkat mungkin!
- "impactOnTarget": Maksimal 2 kalimat pendek dan langsung ke poin keterlambatan/kelayakan secara matematis.
- "healthScoreExplanation": Maksimal 2 kalimat ringkas.
- Poin-poin "budgetEvolution": Maksimal 2 poin, masing-masing 1 baris pendek.
- "emergencyMode.strategy": Maksimal 2 kalimat taktis terpendek.
- Alasan "sacrificeTransparency": Maksimal 1 kalimat sangat pendek per poin alasan.
- "aiRecommendationText": Maksimal 1 kalimat kesimpulan/keputusan tegas.

Anda WAJIB memberikan respon dalam format JSON murni dengan skema berikut:
{
  "score": number, // Skor sesuai aturan di atas. Jika mustahil atau tidak logis sama sekali, berikan 0.
  "riskLevel": "Rendah" | "Sedang" | "Tinggi", // Tingkat risiko sesuai analisis di atas.
  "decisionVerdict": "RECOMMENDED_CASH" | "WARNING_REPLAN" | "BLOCKED_DANGER", // Putusan AI secara tegas
  "impactOnTarget": string, // Evaluasi kelayakan super ringkas dan jujur (maks 2 kalimat). Sebutkan durasi/persentase keterlambatan riil atau kata "mustahil".
  "healthScoreExplanation": string, // Penjelasan gap matematis yang realistis dan tegas (maks 2 kalimat).
  "financialTrapWarning": string, // Peringatan tegas judol/pinjol/paylater (maks 2 kalimat). Jika aman, isi "".
  "paylaterSimulation": {
    "cashPrice": number, // Nominal target asli
    "paylaterPrice": number, // cashPrice + adminFee + interestExpense
    "adminFee": number, // 5% dari cashPrice
    "interestExpense": number, // 42% dari cashPrice (3.5% x 12 bulan)
    "moneyWasted": number, // adminFee + interestExpense
    "comparisonNote": string // Catatan kerugian rupiah ini (maks 1 kalimat)
  },
  "realMarketPrice": string, // Perkiraan rincian/spesifikasi dan rentang harga pasar nyata/faktual terupdate dari targetName di lapangan.
  "priceComparisonNote": string, // Komparasi jujur dan tegas (maks 2 kalimat) antara nominal target user ("targetValue") dengan harga pasar nyata.
  "alternativeSuggestions": string[], // 2-3 rekomendasi pilihan barang spesifik & kisaran harganya yang LEBIH REALISTIS. Jika target sudah sangat spesifik dan realistis, biarkan array ini kosong [].
  "budgetEvolution": string[], // 2 poin perkembangan alokasi budget super pendek.
  "emergencyMode": {
    "isActive": boolean,
    "strategy": string // Taktik pemulihan ringkas (maks 2 kalimat).
  },
  "sacrificeTransparency": [ // Rekomendasi pos pengeluaran dari data input yang diajukan yang bisa dikurangi secara rasional.
    {
      "item": string, // Nama barang/pos pengeluaran (WAJIB persis dari data input pengeluaran)
      "nominalToCut": number, // Nominal Rupiah yang disarankan untuk dikurangi secara logis dan aman (misal: 300000). Jangan gunakan persentase.
      "reasons": string[] // Alasan & taktik pemangkasan logis
    }
  ],
  "aiRecommendationText": string // Keputusan akhir super singkat dan tegas (1 kalimat).
}

Pastikan respon Anda adalah JSON valid tanpa dibungkus markdown codeblock. Gunakan Bahasa Indonesia yang alami, tegas, jujur secara finansial tanpa basa-basi.
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
      let decisionVerdict = "RECOMMENDED_CASH";
      let financialTrapWarning = "";

      if (sumberDana === "Hasil Judi / Spekulasi") {
        decisionVerdict = "BLOCKED_DANGER";
        score = 0;
        riskLevel = "Tinggi";
        financialTrapWarning = "Bahaya Kritis! Judi online (judol) secara statistik diatur agar kamu selalu kalah (matematika bandar). Tindakan ini adalah jalan pintas merusak yang melanggar hukum dan pasti menghancurkan keuanganmu.";
      } else if (sumberDana === "Pinjaman Online") {
        decisionVerdict = "BLOCKED_DANGER";
        score = 0;
        riskLevel = "Tinggi";
        financialTrapWarning = "Bahaya Kredit! Meminjam dari Pinjol untuk belanja konsumtif adalah langkah pembunuhan karakter finansial. Bunga harian dan denda akumulatif akan menjerumuskan kamu dalam pusaran utang tanpa akhir.";
      } else if (sumberDana === "Paylater/Kredit") {
        decisionVerdict = "BLOCKED_DANGER";
        score = Math.min(score, 30);
        riskLevel = "Tinggi";
        financialTrapWarning = "Peringatan Cicilan! Membeli barang gaya hidup dengan Paylater akan membebani masa depanmu dengan cicilan berbunga. Kamu membayar jauh lebih mahal dibanding harga asli barang.";
      } else if (isDeficit) {
        score = 0;
        riskLevel = "Tinggi";
        decisionVerdict = "BLOCKED_DANGER";
      } else if (feasibilityRatio < 0.15) {
        score = 0;
        riskLevel = "Tinggi";
        decisionVerdict = "BLOCKED_DANGER";
      } else if (feasibilityRatio < 0.5) {
        score = 30;
        riskLevel = "Tinggi";
        decisionVerdict = "WARNING_REPLAN";
      } else if (isUnrealistic) {
        score = 55;
        riskLevel = "Sedang";
        decisionVerdict = "WARNING_REPLAN";
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

      // Calculate Paylater Simulation
      const adminFee = Math.round(targetValNum * 0.05);
      const interestExpense = Math.round(targetValNum * 0.42);
      const moneyWasted = adminFee + interestExpense;
      const paylaterPrice = targetValNum + moneyWasted;

      aiAnalysis = {
        score,
        riskLevel,
        decisionVerdict,
        financialTrapWarning,
        paylaterSimulation: {
          cashPrice: targetValNum,
          paylaterPrice,
          adminFee,
          interestExpense,
          moneyWasted,
          comparisonNote: `Menggunakan Paylater membuat kamu rugi sia-sia Rp ${moneyWasted.toLocaleString("id-ID")} untuk membayar bunga.`
        },
        impactOnTarget: isDeficit 
          ? `Rencana target "${targetName}" terhambat karena anggaran kamu defisit Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}.`
          : isUnrealistic
          ? `Rencana target "${targetName}" kurang realistis. Dengan sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan, kamu butuh ${calculatedMonthsNeeded} bulan dan akan terlambat ${delayMonths} bulan.`
          : `Target kamu realistis! Sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan cukup menutupi tabungan ideal bulananmu.`,
        healthScoreExplanation: isUnrealistic
          ? `Skor keuangan ${score} karena gap tabungan bulanan masih besar. Sisa uang Rp ${remainingBudget.toLocaleString("id-ID")} sedangkan butuh Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")}/bulan.`
          : `Skor keuangan ${score} karena pos pengeluaran aman dan menyisakan dana tabungan yang memadai.`,
        realMarketPrice: `Rp ${targetValNum.toLocaleString("id-ID")}`,
        priceComparisonNote: `Menggunakan nilai target Rp ${targetValNum.toLocaleString("id-ID")} sebagai estimasi harga dasar di fallback.`,
        alternativeSuggestions: targetName.toLowerCase() === "hp" || targetName.toLowerCase() === "handphone"
          ? ["Samsung Galaxy A15 (Rp 2.900.000)", "Redmi Note 13 (Rp 2.500.000)"]
          : targetName.toLowerCase() === "laptop"
          ? ["ASUS Vivobook Go 14 (Rp 5.800.000)", "Lenovo IdeaPad Slim 1 (Rp 4.900.000)"]
          : [],
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
        sacrificeTransparency: parsedExpenses.slice(0, 2).map((exp: any) => {
          const expAmt = Number(exp.amount || 0);
          // Suggest a safe nominal cut of 15% of the expense amount, rounded to nearest 10k
          const safeCut = Math.round((expAmt * 0.15) / 10000) * 10000 || 50000;
          return {
            item: exp.name,
            nominalToCut: Math.min(expAmt, safeCut),
            reasons: [
              "Bukan pengeluaran wajib harian utama kamu.",
              "Bisa dialokasikan untuk menambal kekurangan tabungan bulanan.",
              "Dapat dikurangi secara bertahap tanpa mengganggu kenyamanan pokok harian."
            ]
          };
        }),
        aiRecommendationText: isDeficit
          ? "Keputusan akhir: Tunda rencana belanja ini demi kesehatan dompet kamu."
          : isUnrealistic
          ? "Keputusan akhir: Revisi deadline target tabungan agar keuangan tidak tertekan."
          : "Keputusan akhir: Lanjutkan rencana belanja dan tetap menabung dengan disiplin!"
      };
    }

    if (aiAnalysis) {
      aiAnalysis.sumberDana = sumberDana;
      aiAnalysis.jenisTarget = jenisTarget;
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


