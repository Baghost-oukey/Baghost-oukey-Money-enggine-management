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
Anda adalah seorang Konsultan AI Keuangan Profesional (Senior Financial Consultant & Decision Analyst) yang sangat kritis, otoritatif, dan objektif. Keputusan Anda sangat berpengaruh dan menjadi penentu utama kelayakan finansial pengguna dalam membeli suatu barang. Panggil pengguna dengan sebutan yang akrab ("kamu").

Tugas utama Anda adalah **memberikan keputusan final yang sangat kritis** terhadap rencana pembelian barang/target ("targetName") oleh pengguna berdasarkan data keuangan mereka. Anda harus menganalisis kelayakan pembelian ini secara profesional, tajam, logis, dan matematis tanpa memberikan harapan palsu.

PENTING - BEDAKAN KEBUTUHAN POKOK VS KEINGINAN/GENGSI SECARA KRITIS:
1. **Keinginan Tidak Masuk Akal / Gengsi / FOMO**:
   - Jika pengguna berniat membeli barang yang sifatnya keinginan tersier/gaya hidup (misal: HP flagship, barang branded, barang hobi mahal) dengan harga yang jauh melampaui kemampuan finansialnya (contoh: sisa anggaran hanya Rp 3.000.000 tapi target pembelian barang seharga Rp 30.000.000, apalagi jika di curhatan tertulis alasan karena gengsi, FOMO, atau status pelajar/mahasiswa):
     - Anda **WAJIB** memberikan keputusan penolakan mutlak (decisionVerdict: "BLOCKED_DANGER") dan memberikan **konseling keuangan/teguran psikologis yang sangat menampar realitas** pada field "financialTrapWarning" dan "healthScoreExplanation". Jelaskan bahwa gengsi tidak akan menghidupi masa depan, ingatkan status mereka, dan beri bimbingan agar fokus pada budgeting dasar dan menabung secara bertahap.
     - Larang keras penggunaan segala jenis utang/Paylater/Pinjol untuk pembelian keinginan konsumtif ini.
2. **Kebutuhan Mendasar / Produktif**:
   - Jika barang yang ingin dibeli adalah kebutuhan mendasar atau penunjang produktivitas yang mendesak (misal: laptop untuk kuliah/kerja, kendaraan untuk transportasi kerja):
     - Jika sisa dana tunai tidak mencukupi namun pembelian sangat mendesak, Anda boleh mempertimbangkan opsi kredit/cicilan dengan catatan **berikan strategi pembayaran yang aman** pada field "emergencyMode.strategy" (misalnya: pastikan rasio cicilan maksimal 30% dari sisa anggaran bulanan, cari cicilan bunga 0%, hindari pinjol/paylater berbunga tinggi, pangkas pengeluaran makan luar/hiburan untuk dialokasikan ke cicilan).
     - Jika kondisi keuangan terlalu defisit untuk menanggung cicilan sekalipun, tetap tunda dan sarankan opsi alternatif bekas/refurbished atau sewa terlebih dahulu.

Secara khusus, jika rencana pembelian ini melibatkan atau berpotensi menyeret pengguna ke dalam penggunaan **Paylater, Pinjaman Online (Pinjol), atau Kredit/Utang Konsumtif lainnya**, Anda harus memberikan analisis risiko yang sangat serius, kritis, dan mendalam. Jelaskan bagaimana bunga tersembunyi, biaya admin, dan beban cicilan bulanan akan merusak kesehatan arus kas (cash flow) mereka, mengganggu stabilitas dana darurat, serta merusak skor kredit mereka di SLIK OJK.

Bedahlah 'Keterangan Tambahan / Curhatan Pengguna' yang dituliskan pengguna (jika ada). Pahami motivasi psikologis mereka (misalnya gengsi, FOMO, tekanan sosial, atau kebutuhan mendesak) dan berikan pertimbangan profesional yang menyeimbangkan antara urgensi nyata dengan kelayakan finansial. Berikan bimbingan psikologis-finansial jika alasannya didasari oleh gengsi atau FOMO.

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
Jika nominal target ("targetValue") yang dimasukkan pengguna jauh di bawah harga pasar aslinya (misalnya ingin beli iPhone 17 Pro tapi target nominal diisi hanya Rp 5.000.000, padahal harga aslinya diperkirakan Rp 25.000.000+), sebutkan secara tegas di "priceComparisonNote" bahwa estimasi target nominal yang diajukan pengguna terlalu rendah dan tidak realistis di bawah harga pasar asli. Nyatakan berapa gap kekurangannya berdasarkan ekspektasi mereka.

---
ALTERNATIF OPSI REALISTIS:
Jika nama target ("targetName") tidak spesifik (misalnya hanya diisi kata generik seperti "hp", "handphone", "laptop", "motor", "mobil", "rumah") ATAU jika rencana target spesifik tersebut dinilai mustahil/tidak logis dicapai sesuai deadline:
---
ATURAN KEDALAMAN DAN DETAIL ANALISIS (WAJIB PROFESSIONAL & DETAIL):
Jangan menulis tanggapan super pendek atau singkat yang dangkal! Pengguna membutuhkan analisis keuangan tingkat tinggi yang kritis, mendalam, dan mendidik.
- "impactOnTarget": Berikan analisis matematis mendalam (minimal 3-4 kalimat). Hitung persentase sisa anggaran bulanan terhadap dana tabungan ideal bulanan. Jelaskan secara logis konsekuensi jika target dipaksakan dibeli tunai, sebutkan estimasi waktu nyata yang dibutuhkan, serta gap tabungan secara eksplisit.
- "healthScoreExplanation": Berikan penjelasan komprehensif mengenai justifikasi skor rencana keuangan ini (minimal 3-4 kalimat). Evaluasi kesehatan arus kas bulanan pengguna, rasio tabungan terhadap total anggaran, tingkat risiko likuiditas jika terjadi pengeluaran tidak terduga, dan seberapa aman ketahanan anggaran mereka jika pembelian ini direalisasikan.
- "financialTrapWarning": Jika sumber dana melibatkan Judi/Spekulasi/Pinjol/Paylater atau jika ada gap finansial besar yang berisiko menyeret pengguna ke dalam utang, berikan konseling keuangan dan teguran psikologis yang sangat kritis, serius, mendalam, dan objektif (minimal 3-4 kalimat). Jelaskan jebakan bunga berbunga, penurunan skor SLIK OJK/BI Checking, denda keterlambatan, hingga aspek psikologis impulsif (membeli demi gengsi/FOMO di atas kapasitas). Jika rencana dinilai aman secara tunai, berikan nasihat preventif terperinci agar tidak goyah di masa mendatang.
- "emergencyMode.strategy": Tuliskan strategi pemulihan keuangan atau skema pembayaran cicilan yang terstruktur secara langkah-demi-langkah (step-by-step) dan mendalam (minimal 3-4 kalimat). Berikan rekomendasi nominal alokasi dana darurat yang spesifik, target penyesuaian deadline belanja yang aman, dan cara mengamankan cash flow bulanan.
- Alasan di "sacrificeTransparency": Berikan penjelasan yang rinci dan taktis (minimal 2 kalimat per pos) mengapa pos pengeluaran tersebut dapat dikurangi, beserta alternatif solusi praktis yang aman untuk menambal kekurangan tabungan bulanan.
- "aiRecommendationText": Tuliskan kalimat kesimpulan keputusan akhir yang tegas, kritis, profesional, dan berbobot (minimal 2 kalimat terstruktur).

Anda WAJIB memberikan respon dalam format JSON murni dengan skema berikut:
{
  "score": number, // Skor sesuai aturan di atas. Jika mustahil atau tidak logis sama sekali, berikan 0.
  "riskLevel": "Rendah" | "Sedang" | "Tinggi", // Tingkat risiko sesuai analisis di atas.
  "decisionVerdict": "RECOMMENDED_CASH" | "WARNING_REPLAN" | "BLOCKED_DANGER", // Putusan AI secara tegas
  "impactOnTarget": string, // Evaluasi kelayakan yang mendalam, jujur, dan mendetail.
  "healthScoreExplanation": string, // Penjelasan gap matematis dan stabilitas keuangan yang lengkap dan detail.
  "financialTrapWarning": string, // Konseling keuangan dan teguran kritis mengenai pinjol/paylater/gengsi/judol. Jika aman, berikan pesan preventif detail.
  "paylaterSimulation": {
    "cashPrice": number, // Nominal target asli
    "paylaterPrice": number, // cashPrice + adminFee + interestExpense
    "adminFee": number, // 5% dari cashPrice
    "interestExpense": number, // 42% dari cashPrice (3.5% x 12 bulan)
    "moneyWasted": number, // adminFee + interestExpense
    "comparisonNote": string // Catatan detail mengenai kerugian rupiah akibat utang konsumtif ini.
  },
  "realMarketPrice": string, // Perkiraan rincian/spesifikasi dan rentang harga pasar nyata/faktual terupdate dari targetName di lapangan secara lengkap.
  "priceComparisonNote": string, // Komparasi jujur, rinci, dan tegas antara nominal target user ("targetValue") dengan harga pasar nyata.
  "alternativeSuggestions": string[], // 2-3 rekomendasi pilihan barang spesifik & kisaran harganya yang LEBIH REALISTIS. Jika target sudah sangat spesifik dan realistis, biarkan array ini kosong [].
  "budgetEvolution": string[], // 2 poin perkembangan alokasi budget detail.
  "emergencyMode": {
    "isActive": boolean,
    "strategy": string // Taktik pemulihan atau pembayaran kredit terperinci (minimal 3 kalimat).
  },
  "sacrificeTransparency": [ // Rekomendasi pos pengeluaran dari data input yang diajukan yang bisa dikurangi secara rasional.
    {
      "item": string, // Nama barang/pos pengeluaran (WAJIB persis dari data input pengeluaran)
      "nominalToCut": number, // Nominal Rupiah yang disarankan untuk dikurangi secara logis dan aman (misal: 300000). Jangan gunakan persentase.
      "reasons": string[] // Alasan & taktik pemangkasan logis secara rinci.
    }
  ],
  "aiRecommendationText": string // Keputusan akhir berupa rekomendasi konsultan yang berbobot dan tegas (minimal 2 kalimat).
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
        financialTrapWarning = "Keputusan Ditolak Mutlak! Menggunakan dana hasil judi online untuk rencana keuangan adalah delusi finansial. Matematika bandar memastikan kamu akan hancur dan terpuruk dalam kemiskinan. Segera hentikan spekulasi bodoh ini sebelum terlambat.";
      } else if (sumberDana === "Pinjaman Online") {
        decisionVerdict = "BLOCKED_DANGER";
        score = 0;
        riskLevel = "Tinggi";
        financialTrapWarning = "Keputusan Ditolak Mutlak! Menggunakan pinjol untuk membeli barang konsumtif adalah kecerobohan fatal yang akan menghancurkan skor SLIK OJK dan membebani masa depanmu dengan teror bunga. Ini adalah jalan pintas menuju kehancuran finansial total.";
      } else if (sumberDana === "Paylater/Kredit") {
        decisionVerdict = "BLOCKED_DANGER";
        score = Math.min(score, 30);
        riskLevel = "Tinggi";
        financialTrapWarning = "Peringatan Konsultan: Membeli barang gaya hidup menggunakan Paylater adalah jebakan utang konsumtif. Biaya tersembunyi, denda keterlambatan, dan bunga tinggi akan membebani cash flow bulananmu secara serius dan merusak skor BI checking/SLIK OJK.";
      } else if (isDeficit) {
        score = 0;
        riskLevel = "Tinggi";
        decisionVerdict = "BLOCKED_DANGER";
        financialTrapWarning = "Evaluasi Kritis: Cash flow bulanan Anda saat ini mengalami defisit. Memaksakan diri membeli barang non-esensial dalam kondisi anggaran negatif adalah tindakan konyol yang pasti memaksa Anda menggunakan pinjaman berbunga tinggi.";
      } else if (feasibilityRatio < 0.15) {
        score = 10;
        riskLevel = "Tinggi";
        decisionVerdict = "BLOCKED_DANGER";
        financialTrapWarning = "Evaluasi Kritis: Sisa dana bulanan Anda terlalu kecil dibandingkan dengan target harga barang. Pembelian ini sangat tidak masuk akal secara finansial dan berisiko tinggi memicu utang konsumtif.";
      } else if (feasibilityRatio < 0.5) {
        score = 30;
        riskLevel = "Tinggi";
        decisionVerdict = "WARNING_REPLAN";
        financialTrapWarning = "Saran Konsultan: Kapasitas menabung bulanan Anda masih di bawah 50% dari target tabungan ideal. Membeli sekarang sangat rentan terhadap kegagalan dan ketidakstabilan finansial jangka pendek.";
      } else if (isUnrealistic) {
        score = 55;
        riskLevel = "Sedang";
        decisionVerdict = "WARNING_REPLAN";
        financialTrapWarning = "Saran Konsultan: Rencana tabungan Anda masih memerlukan penyesuaian. Meskipun sisa anggaran bernilai positif, target waktu yang Anda tentukan terlalu agresif bagi arus kas bulanan Anda.";
      }

      const calculatedMonthsNeeded = remainingBudget > 0 ? (targetValNum / remainingBudget).toFixed(1) : "selamanya";
      const delayMonths = remainingBudget > 0 ? Math.max(0, Number(calculatedMonthsNeeded) - monthsDiff).toFixed(1) : "tidak terhingga";

      // Tailored fallback terms
      let profileNote = "keuangan kamu";
      let tipsNote = "pangkas pengeluaran non-esensial";
      if (userProfile === "Mahasiswa" || userProfile === "Anak kos") {
        profileNote = "anggaran mahasiswa/kos kamu";
        tipsNote = "kurangi jajan luar, kurangi kopi susu nongkrong, dan masak sendiri";
      } else if (userProfile === "UMKM skala kecil") {
        profileNote = "kas bisnis UMKM kamu";
        tipsNote = "pisahkan kas pribadi dan kas usaha agar arus modal tidak bocor";
      } else if (userProfile === "Freelancer" || userProfile === "Pekerja harian") {
        profileNote = "pos pendapatan tidak menentumu";
        tipsNote = "sisihkan ekstra saat proyek ramai dan jangan tergiur konsumsi berlebihan";
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
          comparisonNote: `Menggunakan Paylater membuat kamu rugi sia-sia Rp ${moneyWasted.toLocaleString("id-ID")} hanya untuk membayar bunga dan biaya admin.`
        },
        impactOnTarget: isDeficit 
          ? `Anggaran bulanan Anda mengalami defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Pembelian target "${targetName}" bernilai Rp ${targetValNum.toLocaleString("id-ID")} saat ini mustahil dilakukan secara tunai tanpa merusak stabilitas pengeluaran dasar Anda.`
          : isUnrealistic
          ? `Membeli "${targetName}" kurang realistis dengan deadline ${monthsDiff} bulan. Dengan sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan, Anda membutuhkan waktu setidaknya ${calculatedMonthsNeeded} bulan untuk menabung secara penuh, mengakibatkan keterlambatan ${delayMonths} bulan dari target asal.`
          : `Rencana target "${targetName}" sangat realistis! Sisa uang bulanan Anda sebesar Rp ${remainingBudget.toLocaleString("id-ID")} berada di atas kebutuhan tabungan ideal bulanan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan.`,
        healthScoreExplanation: isDeficit
          ? `Skor kesehatan rencana berada pada level kritis 0/100 karena Anda mengalami defisit bulanan. Tidak ada ruang sisa dana untuk menabung, sehingga segala rencana belanja barang mewah harus dibatalkan.`
          : isUnrealistic
          ? `Skor kesehatan rencana bernilai ${score}/100 karena kesenjangan finansial yang lebar. Sisa anggaran Anda hanya Rp ${remainingBudget.toLocaleString("id-ID")}, sementara Anda memerlukan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan demi target tepat waktu.`
          : `Skor kesehatan rencana bernilai ${score}/100 karena postur anggaran bulanan Anda berada dalam kondisi sehat. Anda memiliki alokasi surplus dana yang memadai untuk menabung tanpa mengorbankan kebutuhan wajib harian.`,
        realMarketPrice: `Rp ${targetValNum.toLocaleString("id-ID")}`,
        priceComparisonNote: `Kami menggunakan nilai target Rp ${targetValNum.toLocaleString("id-ID")} yang Anda ajukan sebagai estimasi harga dasar barang di pasar saat ini.`,
        alternativeSuggestions: targetName.toLowerCase() === "hp" || targetName.toLowerCase() === "handphone"
          ? ["Samsung Galaxy A15 (Rp 2.900.000)", "Redmi Note 13 (Rp 2.500.000)"]
          : targetName.toLowerCase() === "laptop"
          ? ["ASUS Vivobook Go 14 (Rp 5.800.000)", "Lenovo IdeaPad Slim 1 (Rp 4.900.000)"]
          : [],
        budgetEvolution: [
          `Pengeluaran bulanan menyerap sekitar ${((totalExpenses / monthlyBudget) * 100).toFixed(1)}% dari total budget bulanan Anda.`,
          `Sisa dana bulanan hanya mampu menutupi ${(feasibilityRatio * 100).toFixed(1)}% dari porsi tabungan ideal bulanan yang dibutuhkan.`
        ],
        emergencyMode: {
          isActive: isDeficit || isUnrealistic,
          strategy: isDeficit
            ? `Strategi Pemulihan: Hentikan segala belanja tersier dengan segera. Fokus pada pemangkasan pengeluaran non-esensial dan carilah tambahan pendapatan untuk menyeimbangkan arus kas bulanan Anda.`
            : isUnrealistic
            ? `Strategi Penyesuaian: Perpanjang batas waktu pencapaian target Anda menjadi minimal ${Math.ceil(Number(calculatedMonthsNeeded))} bulan. Ini akan menurunkan target tabungan bulanan menjadi setara sisa anggaran Anda.`
            : "Strategi Pemeliharaan: Anggaran stabil. Teruskan disiplin menabung dan pertahankan cadangan dana darurat minimal setara 3 bulan pengeluaran wajib Anda."
        },
        sacrificeTransparency: parsedExpenses.slice(0, 2).map((exp: any) => {
          const expAmt = Number(exp.amount || 0);
          const safeCut = Math.round((expAmt * 0.15) / 10000) * 10000 || 50000;
          return {
            item: exp.name,
            nominalToCut: Math.min(expAmt, safeCut),
            reasons: [
              `Pos pengeluaran ${exp.name} bukan merupakan kebutuhan pokok yang vital bagi kelangsungan hidup harian Anda.`,
              `Dengan memangkas Rp ${Math.min(expAmt, safeCut).toLocaleString("id-ID")} dari pos ini, Anda dapat mengalokasikannya langsung untuk mempercepat realisasi target belanja.`
            ]
          };
        }),
        aiRecommendationText: isDeficit
          ? "Keputusan Konsultan: Batalkan rencana pembelian ini dengan segera. Fokuskan seluruh sisa energi finansial Anda untuk menyehatkan kas bulanan dari defisit."
          : isUnrealistic
          ? "Keputusan Konsultan: Tunda pembelian dan lakukan penyesuaian deadline atau carilah alternatif barang lain yang lebih sesuai dengan kapasitas tabungan nyata Anda."
          : "Keputusan Konsultan: Lanjutkan rencana pembelian ini. Pertahankan disiplin alokasi anggaran bulanan Anda agar target tercapai secara sehat."
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


