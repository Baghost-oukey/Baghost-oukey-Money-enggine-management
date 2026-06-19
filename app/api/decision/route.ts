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
Anda adalah seorang Sahabat & Mentor Keuangan Pribadi (Warm & Friendly Financial Coach) yang sangat peduli, hangat, tulus, namun jujur, logis, dan kritis saat memberikan masukan keuangan. Panggil pengguna dengan sebutan hangat seperti "Sobat Finansial", "Kamu", atau "Kak". Gunakan gaya bahasa yang santun, bersahabat, penuh empati, dan tidak kaku, layaknya seorang kakak atau teman baik yang ingin pengguna sukses secara finansial.

Tugas utama Anda adalah **memberikan keputusan final yang jujur dan logis** terhadap rencana pembelian barang/target ("targetName") oleh pengguna berdasarkan data keuangan mereka. Anda harus menganalisis kelayakan pembelian ini secara bijak, tajam, dan matematis tanpa memberikan harapan palsu, namun menyampaikannya secara suportif dan hangat.

PENTING - PANDUAN BAHASA & NADA BICARA (WAJIB DIIKUTI SECARA KETAT):
- Gunakan bahasa Indonesia yang sangat natural, bersahabat, santun, dan hangat. Hindari kata-kata robotik, kaku, atau terlalu formal seperti "Evaluasi Kritis", "Keputusan Konsultan", "Arus kas Anda mengalami defisit", "Mengakibatkan keterlambatan X bulan".
- Sebagai gantinya, gunakan istilah yang lebih dekat dan bersahabat seperti:
  * "Catatan Jujur dari Sahabatmu" atau "Pendapat Jujurku" (untuk menggantikan Verdict/Komentar kaku)
  * "Cek Realita Dulu Yuk" atau "Yuk Cek Realita Keuanganmu" (untuk Reality Check)
  * "Sayang Banget Lho! (Opportunity Cost)" atau "Uangmu Bisa Jadi Apa Aja Sih?" (untuk Opportunity Cost)
  * "Insight Psikologis & Tips Emosional" (untuk Psychological Insight)
  * "Taktik Keuangan Biar Dompet Sehat" (untuk Emergency Mode / Strategy)
  * "Rekomendasi Pemangkasan Jajan / Pos Belanja" (untuk Sacrifice Transparency)
- **JANGAN PERNAH MENGGUNAKAN DESIMAL (koma seperti .0, .5)** dalam menentukan atau menampilkan jumlah bulan di seluruh teks analisis Anda. Selalu bulatkan jumlah bulan ke bilangan bulat terdekat (misalnya: tulis '10 bulan', bukan '10.0 bulan' atau '10.3 bulan').
- Dalam Cek Realita Keuangan, buatlah narasi yang menyentuh sisi psikologis pengguna (terutama jika rencana pembelian tidak masuk akal atau didorong oleh gengsi/FOMO) sebagai bahan pertimbangan yang mendalam bagi mereka. Gunakan pendekatan yang peduli, seperti: "Membeli barang ini dengan menyisihkan uang bulananmu saat ini butuh waktu sekitar Z bulan. Memaksakan diri memilikinya terlalu cepat hanya akan memicu kecemasan mental dan membuatmu tergiur utang instan yang merusak ketenangan pikiranmu."
- **PENTING - STRATEGI RESPONS BERDASARKAN KATEGORI TARGET ("jenisTarget"):**
  * **Jika Kategori Target Belanja ("jenisTarget") adalah "Kebutuhan" (Needs)**:
    - Anda WAJIB bertindak sebagai **Partner Pemecah Masalah (Solution-Oriented Partner)** yang fokus penuh mencari jalan keluar dan memberikan solusi konkret agar pengguna dapat memiliki barang kebutuhan penting ini secara sehat.
    - Jangan langsung melarang atau memvonis secara kaku seperti "Jangan Beli" tanpa memberikan solusi. Jika sisa anggaran mepet atau defisit, tetap berikan dorongan semangat, tunjukkan empati yang tinggi, dan sarankan langkah-langkah solutif nyata (misal: bagaimana memotong pos pengeluaran gaya hidup lain secara sukarela, menyarankan alternatif merk/tipe barang kebutuhan sejenis yang lebih terjangkau, atau merekomendasikan penundaan jangka waktu menabung secara aman).
    - Mulailah respons di Reality Check dan Verdict dengan nada yang sangat membesarkan hati, seperti: "Aku tahu ini kebutuhan penting buat produktivitas/hidupmu Kak. Yuk, mari kita atur strategi bareng-bareng biar barang ini bisa terbeli secara aman tanpa merusak keuangan harianmu!"
  * **Jika Kategori Target Belanja ("jenisTarget") adalah "Keinginan" (Wants)**:
    - Gunakan respons kritis yang mendidik dan protektif seperti yang sudah ada. Sadarkan pengguna jika rencana ini didorong oleh gengsi sosial, FOMO, atau sekadar keinginan sesaat.
    - Tekankan konsekuensi nyata dari cicilan paylater/kredit terhadap cash flow bulanan mereka agar mereka berpikir ulang dan memprioritaskan ketenangan pikiran daripada gengsi sosial semata.

PENTING - TENTUKAN KEPUTUSAN FINAL DARI 4 PILIHAN BERIKUT (decisionVerdict):
1. **BOLEH_BELI**: Rencana pembelian sangat realistis, dibayar tunai (cash) dari tabungan/surplus anggaran bulanan, rasio kelayakan tabungan >= 100%, arus kas bulanan surplus stabil, dan tidak mengganggu dana darurat atau kebutuhan pokok harian.
2. **BELI_DENGAN_MENABUNG**: Rencana pembelian dinilai realistis dan sehat untuk dibeli tunai, namun dana sisa bulanan saat ini belum mencukupi secara instan (rasio kelayakan < 100% tapi sisa anggaran bernilai positif). Pengguna harus disiplin menyisihkan tabungan bulanan secara berkala sampai dana target terkumpul penuh.
3. **TUNDA**: Arus kas bulanan terlalu ketat, target waktu terlampau dekat, cadangan dana darurat masih minim, atau pembelian menggunakan Paylater/Kredit konsumtif yang berisiko menekan pengeluaran pokok bulanan. Pembelian harus ditunda beberapa bulan untuk pemulihan kas.
4. **JANGAN_BELI**: Anggaran bulanan mengalami defisit parah, target pembelian barang gaya hidup tidak masuk akal secara finansial (misal: budget bulanan Rp 3 juta tapi nekat membeli HP Rp 30 juta demi gengsi/FOMO, terutama jika curhatan menyebutkan status pelajar/mahasiswa), atau sumber dana didapat dari spekulasi/judi (judol) maupun pinjaman online (pinjol) yang pasti merusak masa depan keuangan.

PROFIL SASARAN PENGGUNA:
Analisislah tipe/profil pengguna secara dinamis dari konteks nama target dan daftar pengeluaran yang di-inputkan (misalnya: jika ada biaya kos maka dia anak kos, jika ada biaya tugas/kuliah maka dia mahasiswa, jika ada modal usaha maka dia UMKM, jika ada pos gaji bulanan tetap maka dia karyawan, freelancer, pekerja harian, pasangan muda, keluarga kecil, dll). Gunakan gaya bahasa, analogi pengeluaran, dan saran keuangan yang sesuai dengan hasil deduksi profil tersebut secara natural dan hangat.

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
STRUKTUR HASIL OUTPUT YANG WAJIB DISEDIAKAN (DETAIL & BERSAHABAT):
1. **Reality Check (Cek Realita)**:
   Analisis realita secara jujur tapi suportif. Apakah dengan budget dan sisa uang segini untuk membeli target barang seharga itu realistis? Apa dampak langsungnya terhadap kehidupan sehari-hari (misal: tidak bisa makan enak, tabungan habis total, tabungan jangka panjang mandek)?
2. **AI Verdict Opinion (Pendapat Jujur Sahabat Finansialmu)**:
   Berikan pendapat profesional dengan gaya bersahabat. Mengapa Kamu memberikan keputusan boleh beli, menabung dulu, tunda, atau jangan beli? Berikan alasan detail yang logis dan matematis (jika dilarang/diperingatkan, apa alasannya; jika boleh, apa prasyaratnya).
3. **Simulasi Dampak & Konsekuensi Nyata (Paylater/Cicilan)**:
   Bandingkan secara detail dan nyata jika pengguna memilih Paylater/Kredit (Kredivo/SPayLater dengan bunga riil 2.95% per bulan dan biaya penanganan/admin transaksi 1%) dengan Nabung Mandiri (bunga 0%, admin 0%). Anda harus menghitung dan menyediakan data cicilan untuk tenor 3 bulan, 6 bulan, dan 12 bulan di dalam array plans. Berikan catatan konsekuensi nyata dari cicilan tersebut terhadap sisa budget bulanan mereka dengan nada bersahabat.
4. **Saran Strategi Mengelola Uang**:
   Berikan saran bagaimana target nominal tersebut secara masuk akal bisa dicapai dalam berapa bulan dengan menyisihkan nominal tabungan tertentu yang realistis dari sisa anggaran bulanan mereka. Jangan terpaku pada durasi target dari user jika itu tidak realistis (misal target user 1 bulan padahal harga barang terlalu mahal dibanding gajinya, maka hitunglah durasi bulan yang masuk akal dan sehat).
   - Rencana Target Nabung Masuk Akal: Hitung durasi bulan yang masuk akal dan alokasi tabungan per bulan untuk mencapai target tersebut dengan sisa anggaran mereka, lalu uraikan rencana tersebut.
   - Langkah Taktis Pengelolaan Uang: Berikan tips konkret mengelola keuangan bulanan (seperti auto-debet tabungan di awal bulan, dll) agar target aman tercapai.
5. **Insight Psikologis & Emosional**:
   Identifikasi motivasi pembelian (apakah kebutuhan nyata, atau karena FOMO, gengsi, gengsi akademis, tekanan sosial, atau sekadar nafsu belanja sesaat). Berikan motivasi finansial yang bijak dan ingatkan risiko kesehatan mental (stres cicilan, lingkaran setan utang) jika nekat membelinya demi gengsi.

---
ATURAN KEDALAMAN DAN DETAIL ANALISIS (WAJIB PROFESSIONAL, DETAIL, & BERSAHABAT):
Jangan menulis tanggapan super pendek atau singkat yang dangkal! Pengguna membutuhkan analisis keuangan yang hangat, mendalam, dan mendidik.
- "realityCheck.impactDescription": Analisis realita dan dampaknya secara mendalam (minimal 3 kalimat).
- "verdictOpinion.explanation": Penjelasan kritis namun bersahabat di balik keputusan (minimal 3 kalimat).
- "paylaterSimulation.consequencesNote": Uraian konsekuensi nyata cicilan pada cash flow bulanan dengan nada hangat (minimal 2 kalimat).
- "opportunityCost.investmentAlternative": Uraian rencana tabungan terperinci (berapa bulan secara masuk akal & nominal tabungan/bulan) untuk mencapai target tersebut (minimal 2 kalimat) dengan nada bersahabat.
- "opportunityCost.savingAlternative": Uraian langkah taktis pengelolaan uang bulanan agar target tersebut aman tercapai (minimal 2 kalimat) dengan nada bersahabat.
- "psychologicalInsight.motivationText": Kata-kata penasehat yang bijak dan menguatkan disiplin (minimal 2 kalimat).
- "psychologicalInsight.riskText": Risiko psikologis dan stres akibat salah kelola uang (minimal 2 kalimat).
- "emergencyMode.strategy": Tuliskan strategi pemulihan keuangan langkah-demi-langkah (minimal 3-4 kalimat).
- Alasan di "sacrificeTransparency": Uraian alasan taktis pemangkasan pos belanja (minimal 2 kalimat per pos).
- "aiRecommendationText": Kesimpulan keputusan akhir berupa saran hangat dari sahabatmu (minimal 2 kalimat).

Anda WAJIB memberikan respon dalam format JSON murni dengan skema berikut:
{
  "score": number, // Skor kesehatan rencana (0 - 100)
  "riskLevel": "Rendah" | "Sedang" | "Tinggi",
  "decisionVerdict": "BOLEH_BELI" | "BELI_DENGAN_MENABUNG" | "TUNDA" | "JANGAN_BELI",
  "realityCheck": {
    "isRealistic": boolean,
    "impactDescription": string // Keterangan detail dampak nyata target terhadap sisa budget dan tabungan (nada bersahabat).
  },
  "verdictOpinion": {
    "title": string, // Judul pendapat bersahabat (misal: "Pendapat Jujurku: Nabung Dulu Yuk!" / "Keputusan Sahabat Keuanganmu: Jangan Dipaksain Ya")
    "explanation": string // Penjelasan kritis dan bersahabat di balik keputusan.
  },
  "paylaterSimulation": {
    "cashPrice": number, // Nominal target asli
    "paylaterPrice": number, // cashPrice + adminFee + interestExpense untuk tenor 12 bulan (legacy)
    "adminFee": number, // 1% dari cashPrice (tarif riil SPayLater/Kredivo) untuk tenor 12 bulan (legacy)
    "interestExpense": number, // 35.4% dari cashPrice (2.95% x 12 bulan) untuk tenor 12 bulan (legacy)
    "moneyWasted": number, // adminFee + interestExpense untuk tenor 12 bulan (legacy)
    "adminRatePct": number, // Biaya admin riil (1 untuk 1%)
    "interestRatePct": number, // Bunga bulanan riil (2.95 untuk 2.95%)
    "plans": [
      {
        "tenor": number, // 3, 6, atau 12
        "monthlyInstallment": number, // Cicilan bulanan bulatan terdekat
        "totalPrice": number, // cashPrice + interestAmount + adminFee
        "interestAmount": number, // cashPrice * (interestRatePct/100) * tenor
        "adminFee": number, // cashPrice * (adminRatePct/100)
        "moneyWasted": number // interestAmount + adminFee
      }
    ],
    "consequencesNote": string // Dampak nyata/konsekuensi cicilan terhadap sisa uang belanja bulanan (min 2 kalimat) dengan nada bersahabat.
  },
  "opportunityCost": {
    "investmentAlternative": string, // Rencana menabung terperinci (berapa bulan secara masuk akal & nominal tabungan/bulan) dengan nada bersahabat
    "savingAlternative": string // Langkah taktis pengelolaan uang bulanan agar target aman tercapai dengan nada bersahabat
  },
  "psychologicalInsight": {
    "purchaseDriver": "Kebutuhan Nyata" | "FOMO/Gengsi" | "Impulsive Buying",
    "motivationText": string, // Motivasi psikologis keuangan bijak dan hangat.
    "riskText": string // Risiko mental dan finansial nekat demi gengsi.
  },
  "realMarketPrice": string, // Perkiraan rincian spesifikasi dan rentang harga pasar nyata terupdate dari targetName di lapangan secara lengkap.
  "priceComparisonNote": string, // Komparasi jujur, rinci, dan tegas antara nominal target user ("targetValue") dengan harga pasar nyata.
  "alternativeSuggestions": string[], // 2-3 rekomendasi pilihan barang spesifik & kisaran harganya yang LEBIH REALISTIS dan SEHAT untuk dibeli sesuai dengan kapasitas budget bulanan/tabungan nyata pengguna (misalnya, jika budget mepet dan sisa uang sedikit sedangkan targetnya iPhone seharga Rp 15.000.000, berikan rekomendasi tipe HP Android range Rp 2.000.000 - Rp 3.000.000 yang bisa dibeli cash dengan cepat).
  "budgetEvolution": string[], // 2 poin perkembangan alokasi budget detail.
  "emergencyMode": {
    "isActive": boolean,
    "strategy": string // Taktik pemulihan atau pembayaran kredit terperinci secara bersahabat (minimal 3 kalimat).
  },
  "sacrificeTransparency": [ // Rekomendasi pos pengeluaran dari data input yang diajukan yang bisa dikurangi secara rasional.
    {
      "item": string, // Nama barang/pos pengeluaran (WAJIB persis dari data input pengeluaran)
      "nominalToCut": number, // Nominal Rupiah yang disarankan untuk dikurangi secara logis dan aman. Jangan gunakan persentase.
      "reasons": string[] // Alasan & taktik pemangkasan logis secara rinci dan bersahabat.
    }
  ],
  "aiRecommendationText": string // Keputusan akhir berupa rekomendasi konsultan yang berbobot dan tegas tapi bersahabat (minimal 2 kalimat).
}

Pastikan respon Anda adalah JSON valid tanpa dibungkus markdown codeblock. Gunakan Bahasa Indonesia yang alami, bersahabat, jujur secara finansial.
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
      
      const isKebutuhan = jenisTarget === "Kebutuhan";
      let score = 95;
      let riskLevel = "Rendah";
      let decisionVerdict: "BOLEH_BELI" | "BELI_DENGAN_MENABUNG" | "TUNDA" | "JANGAN_BELI" = "BOLEH_BELI";
      let financialTrapWarning = "";

      if (sumberDana === "Hasil Judi / Spekulasi") {
        decisionVerdict = "JANGAN_BELI";
        score = 0;
        riskLevel = "Tinggi";
        financialTrapWarning = "Aduh, gawat banget! Menggunakan uang hasil judi online untuk membeli target belanja itu cuma ilusi finansial belaka. Matematika bandar sudah pasti bikin kamu rugi dan terjebak kemiskinan. Yuk, stop spekulasi ini sekarang juga demi kebaikan masa depanmu!";
      } else if (sumberDana === "Pinjaman Online") {
        if (isKebutuhan) {
          decisionVerdict = "TUNDA";
          score = 30;
          riskLevel = "Tinggi";
          financialTrapWarning = "Waduh Kak, aku tahu ini kebutuhan penting buat kamu. Tapi tolong hindari penggunaan Pinjaman Online ya, karena bunga tinggi dan risikonya bisa menjeratmu. Solusi terbaik, yuk kita tunda sebentar dan cari alternatif dana tunai atau pemangkasan pos lain agar bisa membelinya secara aman!";
        } else {
          decisionVerdict = "JANGAN_BELI";
          score = 0;
          riskLevel = "Tinggi";
          financialTrapWarning = "Jangan dipaksakan ya! Menggunakan pinjol untuk membeli barang konsumtif itu langkah yang berisiko besar. Bunga yang mencekik dan risiko teror denda bisa merusak nama baik SLIK OJK kamu. Masih banyak cara sehat lainnya, lho!";
        }
      } else if (sumberDana === "Paylater/Kredit") {
        if (isKebutuhan) {
          decisionVerdict = "BELI_DENGAN_MENABUNG";
          score = 50;
          riskLevel = "Sedang";
          financialTrapWarning = "Karena barang ini adalah kebutuhan pokok Kakak, mencicil pakai Paylater boleh dipertimbangkan dengan syarat disiplin. Taktik terbaik: pilih tenor terpendek (misal 3 bulan) untuk memperkecil bunga, dan segera pangkas pos jajan bulanan sebesar Rp 100.000 agar cash flow kamu tetap aman.";
        } else {
          decisionVerdict = "JANGAN_BELI";
          score = Math.min(score, 30);
          riskLevel = "Tinggi";
          financialTrapWarning = "Peringatan kecil dari sahabatmu: membeli barang gaya hidup pakai Paylater bisa jadi jebakan tersembunyi. Bunga bulanan, biaya admin, dan denda keterlambatan bakal membebani keuangan harianmu dan mengganggu pos tabungan penting lainnya.";
        }
      } else if (isDeficit) {
        if (isKebutuhan) {
          score = 30;
          riskLevel = "Tinggi";
          decisionVerdict = "TUNDA";
          financialTrapWarning = "Sobat Finansial, karena ini kebutuhan pentingmu, saran terbaikku adalah menundanya sebentar sambil kita menyehatkan anggaran bulananmu. Kita bisa coba memotong pengeluaran non-pokok agar terkumpul surplus dana untuk membeli barang ini secara tunai.";
        } else {
          score = 0;
          riskLevel = "Tinggi";
          decisionVerdict = "JANGAN_BELI";
          financialTrapWarning = "Waduh, sepertinya anggaran bulanan kamu saat ini lagi defisit (minus). Memaksakan membeli barang non-pokok saat ini bisa bikin kamu tambah stres dan terpaksa cari pinjaman lain yang berbunga tinggi. Yuk, fokus sehatin cash flow dulu.";
        }
      } else if (feasibilityRatio < 0.15) {
        if (isKebutuhan) {
          score = 40;
          riskLevel = "Tinggi";
          decisionVerdict = "BELI_DENGAN_MENABUNG";
          financialTrapWarning = "Barang ini adalah kebutuhan pentingmu Kak, tapi kapasitas sisa dana bulananmu saat ini masih sangat kecil dibanding harga target. Jangan berkecil hati ya! Solusinya, kita perpanjang jangka waktu menabungnya agar cicilan tabungannya terasa lebih ringan di dompetmu.";
        } else {
          score = 10;
          riskLevel = "Tinggi";
          decisionVerdict = "JANGAN_BELI";
          financialTrapWarning = "Sobat Finansial, sisa dana bulananmu saat ini masih terlalu kecil dibanding target harga barangnya. Memaksakan diri membelinya sekarang rasanya sangat berisiko buat kelangsungan hidup harianmu.";
        }
      } else if (feasibilityRatio < 0.5) {
        if (isKebutuhan) {
          score = 60;
          riskLevel = "Sedang";
          decisionVerdict = "BELI_DENGAN_MENABUNG";
          financialTrapWarning = "Kamu pasti butuh barang ini segera, tapi mari kita menabung secara bertahap dulu ya. Untuk mempercepat pencapaian target, kita bisa pangkas sedikit pengeluaran hiburan harianmu agar dana belanjanya lekas terkumpul penuh.";
        } else {
          score = 30;
          riskLevel = "Tinggi";
          decisionVerdict = "TUNDA";
          financialTrapWarning = "Kapasitas menabungmu saat ini masih di bawah 50% dari kebutuhan tabungan bulanan ideal. Mending ditunda sebentar ya, biar keuanganmu nggak kaget dan tetap punya pegangan dana darurat.";
        }
      } else if (isUnrealistic) {
        score = 55;
        riskLevel = "Sedang";
        decisionVerdict = "BELI_DENGAN_MENABUNG";
        financialTrapWarning = "Rencana tabungan kamu sebenarnya bagus, tapi target waktu yang ditentukan terlalu cepat buat sisa budgetmu saat ini. Sedikit penyesuaian deadline akan bikin rencana ini berjalan jauh lebih santai dan sehat.";
      } else {
        decisionVerdict = "BOLEH_BELI";
      }

      const calculatedMonthsNeeded = remainingBudget > 0 ? Math.round(targetValNum / remainingBudget) : "selamanya";
      const delayMonths = remainingBudget > 0 ? Math.max(0, Number(calculatedMonthsNeeded) - monthsDiff) : "tidak terhingga";

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

      // Calculate Paylater Simulation (Standard SPayLater/Kredivo: admin fee 1%, interest 2.95%/mo)
      const adminRatePct = 1.0;
      const interestRatePct = 2.95;
      const adminFee = Math.round(targetValNum * (adminRatePct / 100));
      const interestExpense = Math.round(targetValNum * (interestRatePct / 100) * 12);
      const moneyWasted = adminFee + interestExpense;
      const paylaterPrice = targetValNum + moneyWasted;

      const plans = [3, 6, 12].map((tenor) => {
        const planAdminFee = Math.round(targetValNum * (adminRatePct / 100));
        const planInterest = Math.round(targetValNum * (interestRatePct / 100) * tenor);
        const planWasted = planAdminFee + planInterest;
        const totalPrice = targetValNum + planWasted;
        const monthlyInstallment = Math.round(totalPrice / tenor);
        return {
          tenor,
          monthlyInstallment,
          totalPrice,
          interestAmount: planInterest,
          adminFee: planAdminFee,
          moneyWasted: planWasted,
        };
      });

      // Compound calculation fallback
      const futureInvestedVal = Math.round(targetValNum * 1.46);
      const savingsMonthsCovered = totalExpenses > 0 ? Math.round(targetValNum / totalExpenses) : 6;
      const monthlyDebtPayment = Math.round(paylaterPrice / 12);
      const debtImpactPct = remainingBudget > 0 ? Math.round((monthlyDebtPayment / remainingBudget) * 100) : 100;

      const isPrestige = targetName.toLowerCase().includes("iphone") || 
                         targetName.toLowerCase().includes("flagship") || 
                         keteranganTambahan.toLowerCase().includes("gengsi") || 
                         keteranganTambahan.toLowerCase().includes("fomo") ||
                         userProfile === "Mahasiswa" || 
                         userProfile === "Anak kos";

      let fallbackMonthlySaving = 0;
      let fallbackMonthsNeeded = 12;
      if (remainingBudget > 0) {
        fallbackMonthlySaving = Math.round(remainingBudget * 0.6);
        if (fallbackMonthlySaving > 0) {
          fallbackMonthsNeeded = Math.ceil(targetValNum / fallbackMonthlySaving);
        }
        if (fallbackMonthsNeeded <= 0) fallbackMonthsNeeded = 1;
      } else {
        fallbackMonthlySaving = 300000;
        fallbackMonthsNeeded = Math.ceil(targetValNum / fallbackMonthlySaving);
      }

      aiAnalysis = {
        score,
        riskLevel,
        decisionVerdict,
        financialTrapWarning,
        realityCheck: {
          isRealistic: !isUnrealistic && !isDeficit,
          impactDescription: isKebutuhan
            ? (isDeficit
              ? `Karena "${targetName}" adalah kebutuhan pentingmu Kak, sisa anggaran bulananmu yang sedang defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")} saat ini menjadi tantangan utama. Tapi jangan khawatir, kita bisa cari solusi bersama dengan menyusun ulang prioritas pengeluaran bulananmu agar kebutuhan vital ini lekas terpenuhi.`
              : isUnrealistic
              ? `Membeli kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sangat bisa diwujudkan! Hanya saja, sisa budgetmu Rp ${remainingBudget.toLocaleString("id-ID")}/bulan butuh waktu sekitar ${calculatedMonthsNeeded} bulan untuk menabung secara penuh. Mari kita sesuaikan target waktunya agar rencana belanja ini terasa lebih ringan dan realistis.`
              : `Kabar baik Kak! Kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini sangat realistis untuk dipenuhi secara tunai dengan sisa uang bulananmu Rp ${remainingBudget.toLocaleString("id-ID")}/bulan dalam waktu sekitar ${monthsDiff} bulan.`)
            : (isDeficit
              ? `Arus kas bulananmu saat ini sedang defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Memaksakan diri membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} saat ini hanya akan memicu kecemasan finansial dan mengancam kestabilan kebutuhan pokokmu sehari-hari.`
              : isUnrealistic
              ? `Membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dalam waktu dekat rasanya kurang realistis dengan sisa budgetmu yang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan. Kamu butuh waktu menabung sekitar ${calculatedMonthsNeeded} bulan secara disiplin. Mengharapkan barang ini terkumpul terlalu cepat hanya akan membuatmu tertekan secara batin dan rentan terjebak utang instan.`
              : `Rencana belanjamu cukup aman dan realistis! Dengan menyisihkan sisa uang bulanan Rp ${remainingBudget.toLocaleString("id-ID")}/bulan, kamu bisa membawa pulang "${targetName}" dalam waktu sekitar ${monthsDiff} bulan secara tunai.`)
        },
        verdictOpinion: {
          title: decisionVerdict === "BOLEH_BELI"
            ? "Pendapat Sahabatmu: Boleh Banget Beli! 🎉"
            : decisionVerdict === "BELI_DENGAN_MENABUNG"
            ? "Pendapat Sahabatmu: Nabung Dulu Yuk! 💪"
            : decisionVerdict === "TUNDA"
            ? "Pendapat Sahabatmu: Kita Tunda Dulu Ya 🥺"
            : "Pendapat Sahabatmu: Mending Jangan Beli Dulu Deh 🙏",
          explanation: isKebutuhan
            ? (decisionVerdict === "JANGAN_BELI"
              ? `Aduh Kak, walaupun "${targetName}" adalah kebutuhan dasar, kondisi dana bulananmu yang minus atau penggunaan judol membuat rencana ini harus dihentikan dulu. Solusi utamaku: mari kita sehatkan dulu keuanganmu agar bisa membelinya dengan dana yang berkah.`
              : decisionVerdict === "TUNDA"
              ? `Saran hangatku, mari kita tunda rencana pembelian ini selama beberapa bulan. Jaga kestabilan kas dasarmu dulu agar ketika barang kebutuhan ini dibeli, kamu tidak berada dalam kondisi rentan secara finansial.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Aku dukung penuh rencana ini Kak! Cara terbaik adalah mencicil tabungan bulanan secara konsisten dari sisa budget bulananmu Rp ${remainingBudget.toLocaleString("id-ID")}. Menabung secara tunai adalah solusi paling berkah dan aman dibanding terjerat paylater.`
              : `Luar biasa Kak! Postur keuanganmu sangat prima dan siap mendukung pembelian kebutuhan penting ini secara tunai tanpa kendala. Silakan dibeli secara langsung ya!`)
            : (decisionVerdict === "JANGAN_BELI"
              ? `Aku ngerti banget kamu pengen banget punya "${targetName}", tapi kalau melihat kas bulananmu yang lagi defisit atau terpaksa pakai pinjol/judi, rasanya ini bahaya banget buat masa depanmu. Yuk, fokus sehatin keuanganmu dulu ya, Kak!`
              : decisionVerdict === "TUNDA"
              ? `Saran aku, mending rencana ini ditunda dulu ya. Sisa uang bulananmu masih mepet banget, kasihan kalau dipakai beli barang tersier saat ini nanti kamu nggak punya pegangan cadangan kalau ada keperluan mendadak.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Kamu boleh banget beli barang ini, tapi syaratnya harus sabar menabung tunai secara bertahap ya! Sisa budget bulananmu sebesar Rp ${remainingBudget.toLocaleString("id-ID")} bisa kamu sisihkan secara disiplin tanpa perlu mencicil pakai paylater.`
              : `Wah, kondisi keuanganmu lagi sehat banget nih! Kamu punya sisa budget bulanan yang aman dan nggak mengganggu kebutuhan pokok harianmu. Silakan dibeli secara cash ya!`)
        },
        paylaterSimulation: {
          cashPrice: targetValNum,
          paylaterPrice,
          adminFee,
          interestExpense,
          moneyWasted,
          adminRatePct,
          interestRatePct,
          plans,
          consequencesNote: `Jika kamu nekat mencicil, cicilan bulanan sebesar Rp ${monthlyDebtPayment.toLocaleString("id-ID")} akan menyerap sekitar ${debtImpactPct}% dari sisa anggaran belanjamu setiap bulan. Hal ini merusak fleksibilitas finansial harianmu secara signifikan.`
        },
        opportunityCost: {
          investmentAlternative: `Target belanja sebesar Rp ${targetValNum.toLocaleString("id-ID")} secara masuk akal bisa kamu capai dalam waktu sekitar ${fallbackMonthsNeeded} bulan dengan disiplin menabung sebesar Rp ${fallbackMonthlySaving.toLocaleString("id-ID")} per bulan dari sisa anggaran belanjamu.`,
          savingAlternative: `Untuk mempermudah rencana ini, kamu bisa menggunakan sistem auto-debet otomatis sebesar Rp ${fallbackMonthlySaving.toLocaleString("id-ID")} ke rekening terpisah sesaat setelah gajian, serta menghentikan sementara pengeluaran tersier yang kurang mendesak.`
        },
        psychologicalInsight: {
          purchaseDriver: isPrestige ? "FOMO/Gengsi" : isDeficit ? "Impulsive Buying" : "Kebutuhan Nyata",
          motivationText: isKebutuhan
            ? "Memenuhi kebutuhan utama adalah bentuk tanggung jawab dan investasi diri yang sangat baik. Tetap semangat mengelola anggaran agar segala kebutuhan dasarmu terpenuhi secara aman."
            : (isPrestige
              ? "Membeli barang untuk memuaskan gengsi sosial hanya memberikan kebahagiaan semu yang berlangsung beberapa hari, tetapi beban cicilannya akan menghantui kamu selama berbulan-bulan. Nilai dirimu tidak ditentukan oleh merk barang yang kamu gunakan."
              : "Tetaplah fokus pada prioritas jangka panjangmu. Membangun kestabilan finansial dan memiliki tabungan yang kokoh jauh lebih memberikan rasa tenang (peace of mind) dibanding kepemilikan barang baru secara instan."),
          riskText: isKebutuhan
            ? "Risiko utama jika mengabaikan kebutuhan ini adalah terganggunya produktivitas atau kenyamanan hidup dasar Kakak. Namun, membelinya dengan cara terburu-buru menggunakan utang berbunga tinggi tetap harus diwaspadai."
            : (isPrestige
              ? "Risiko nekat membeli demi status sosial adalah kamu akan terjebak dalam siklus kecemasan finansial bulanan, tertekan saat tanggal jatuh tempo cicilan tiba, dan mengorbankan masa depan demi penilaian orang lain."
              : "Risiko impulsif ini akan menipiskan cadangan likuiditas kamu, sehingga jika terjadi keadaan darurat medis atau pekerjaan, kamu tidak memiliki uang tunai sama sekali dan terpaksa meminjam.")
        },
        impactOnTarget: isDeficit 
          ? (isKebutuhan
            ? `Karena ini kebutuhan pentingmu Kak, sisa anggaran yang defisit saat ini menjadi tantangan. Tapi kita bisa atur pemotongan pos belanja non-esensial agar tabungan kebutuhan ini bisa segera terkumpul.`
            : `Anggaran bulananmu sedang defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Pembelian "${targetName}" bernilai Rp ${targetValNum.toLocaleString("id-ID")} saat ini mustahil dilakukan secara tunai tanpa merusak stabilitas pengeluaran dasar.`)
          : isUnrealistic
          ? (isKebutuhan
            ? `Membeli kebutuhan "${targetName}" membutuhkan sedikit kesabaran. Dengan sisa budget bulananmu, kamu butuh menabung selama sekitar ${calculatedMonthsNeeded} bulan agar target ini tercapai secara sehat.`
            : `Membeli "${targetName}" kurang realistis dengan deadline ${monthsDiff} bulan. Dengan sisa uang Rp ${remainingBudget.toLocaleString("id-ID")}/bulan, kamu butuh waktu setidaknya ${calculatedMonthsNeeded} bulan untuk menabung secara penuh, mengakibatkan keterlambatan ${delayMonths} bulan dari target asal.`)
          : `Rencana target "${targetName}" sangat realistis! Sisa uang bulananmu sebesar Rp ${remainingBudget.toLocaleString("id-ID")} berada di atas kebutuhan tabungan ideal bulanan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan.`,
        healthScoreExplanation: isDeficit
          ? (isKebutuhan
            ? `Skor kesehatan rencana bernilai 30/100 karena kas bulananmu defisit. Meskipun ini kebutuhan penting, kita harus menutup defisit kas dulu agar kamu bisa menabung secara aman.`
            : `Skor kesehatan rencana berada pada level kritis 0/100 karena kamu mengalami defisit bulanan. Tidak ada ruang sisa dana untuk menabung, sehingga segala rencana belanja barang mewah sebaiknya dibatalkan dulu ya.`)
          : isUnrealistic
          ? (isKebutuhan
            ? `Skor kesehatan rencana bernilai ${score}/100. Kebutuhan penting ini bisa kamu cicil tabungannya secara sabar dan kita sesuaikan target waktunya agar cash flow harianmu tetap aman.`
            : `Skor kesehatan rencana bernilai ${score}/100 karena kesenjangan finansial yang lebar. Sisa anggaranmu hanya Rp ${remainingBudget.toLocaleString("id-ID")}, sementara kamu memerlukan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan demi target tepat waktu.`)
          : `Skor kesehatan rencana bernilai ${score}/100 karena postur anggaran bulananmu berada dalam kondisi sehat. Kamu memiliki alokasi surplus dana yang memadai untuk menabung tanpa mengorbankan kebutuhan wajib harian.`,
        realMarketPrice: `Rp ${targetValNum.toLocaleString("id-ID")}`,
        priceComparisonNote: `Kami menggunakan nilai target Rp ${targetValNum.toLocaleString("id-ID")} yang diajukan sebagai estimasi harga dasar barang di pasar saat ini.`,
        alternativeSuggestions: targetName.toLowerCase() === "hp" || targetName.toLowerCase() === "handphone"
          ? ["Samsung Galaxy A15 (Rp 2.900.000)", "Redmi Note 13 (Rp 2.500.000)"]
          : targetName.toLowerCase() === "laptop"
          ? ["ASUS Vivobook Go 14 (Rp 5.800.000)", "Lenovo IdeaPad Slim 1 (Rp 4.900.000)"]
          : [],
        budgetEvolution: [
          `Pengeluaran bulanan menyerap sekitar ${((totalExpenses / monthlyBudget) * 100).toFixed(1)}% dari total budget bulananmu.`,
          `Sisa dana bulanan hanya mampu menutupi ${(feasibilityRatio * 100).toFixed(1)}% dari porsi tabungan ideal bulanan yang dibutuhkan.`
        ],
        emergencyMode: {
          isActive: isDeficit || isUnrealistic,
          strategy: isDeficit
            ? `Taktik Pemulihan: Hentikan segala belanja tersier dengan segera. Fokus pada pemangkasan pengeluaran non-esensial dan carilah tambahan pendapatan untuk menyeimbangkan arus kas bulananmu.`
            : isUnrealistic
            ? `Taktik Penyesuaian: Perpanjang batas waktu pencapaian targetmu menjadi minimal ${Math.ceil(Number(calculatedMonthsNeeded))} bulan. Ini akan menurunkan target tabungan bulanan menjadi setara sisa anggaranmu.`
            : "Taktik Pemeliharaan: Anggaran stabil. Teruskan disiplin menabung dan pertahankan cadangan dana darurat minimal setara 3 bulan pengeluaran wajibmu."
        },
        sacrificeTransparency: parsedExpenses.slice(0, 2).map((exp: any) => {
          const expAmt = Number(exp.amount || 0);
          const safeCut = Math.round((expAmt * 0.15) / 10000) * 10000 || 50000;
          return {
            item: exp.name,
            nominalToCut: Math.min(expAmt, safeCut),
            reasons: [
              `Pos pengeluaran ${exp.name} bukan merupakan kebutuhan pokok yang vital bagi kelangsungan hidup harianmu.`,
              `Dengan sedikit memangkas Rp ${Math.min(expAmt, safeCut).toLocaleString("id-ID")} dari pos ini, kamu bisa mengalokasikannya langsung untuk mempercepat tabungan belanjamu.`
            ]
          };
        }),
        aiRecommendationText: isDeficit
          ? "Saran hangatku: batalkan rencana pembelian ini dengan segera. Yuk, fokuskan seluruh sisa tenaga finansialmu untuk menyehatkan kas bulanan dari defisit terlebih dahulu."
          : isUnrealistic
          ? "Saran hangatku: tunda pembelian dan lakukan penyesuaian target waktu menabung atau carilah alternatif barang lain yang lebih ramah buat kapasitas tabungan nyata kamu."
          : "Saran hangatku: lanjutkan rencana pembelian ini! Tetap pertahankan disiplin alokasi anggaran bulananmu agar target ini bisa tercapai secara sehat."
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


