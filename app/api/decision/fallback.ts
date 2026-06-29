export interface FallbackOptions {
  targetName: string;
  targetValNum: number;
  monthlyBudget: number;
  remainingBudget: number;
  monthsDiff: number;
  daysDiff: number;
  requiredMonthlySavings: number;
  feasibilityRatio: number;
  jenisTarget: string;
  sumberDana: string;
  keteranganTambahan: string;
  totalExpenses: number;
  parsedExpenses: { name: string; amount: number }[];
  budgetPeriod?: string;
  dailyBudget?: number;
}

export function runLocalFallbackAnalysis(options: FallbackOptions): any {
  const {
    targetName,
    targetValNum,
    monthlyBudget,
    remainingBudget,
    monthsDiff,
    daysDiff,
    requiredMonthlySavings,
    feasibilityRatio,
    jenisTarget,
    sumberDana,
    keteranganTambahan,
    totalExpenses,
    parsedExpenses,
    budgetPeriod = "bulanan",
    dailyBudget,
  } = options;

  const isHarian = budgetPeriod === "harian";
  const dBudget = Number(dailyBudget || 0);
  const requiredDailySavings = daysDiff > 0 ? Math.round(targetValNum / daysDiff) : targetValNum;

  const isDeficit = remainingBudget < 0;
  const isUnrealistic = feasibilityRatio < 1.0;
  const isExtremeTarget = isHarian
    ? targetValNum >= dBudget * 20
    : targetValNum >= Number(monthlyBudget) * 0.8;
  const isSignificantImpact = isHarian
    ? requiredDailySavings > (dBudget * 0.3) || isExtremeTarget || isDeficit
    : requiredMonthlySavings > (Number(monthlyBudget) * 0.3) || isExtremeTarget || isDeficit;

  const isKebutuhan = jenisTarget === "Kebutuhan";
  const isWantAndEnoughMoney = jenisTarget === "Keinginan" && remainingBudget >= targetValNum;
  let score = 95;
  let riskLevel = "Rendah";
  let decisionVerdict: "BOLEH_BELI" | "BELI_DENGAN_MENABUNG" | "TUNDA" | "JANGAN_BELI" = "BOLEH_BELI";
  let financialTrapWarning = "";

  if (sumberDana === "Hasil Judi / Spekulasi") {
    decisionVerdict = "JANGAN_BELI";
    score = 0;
    riskLevel = "Tinggi";
    financialTrapWarning = "Aduh, gawat banget! Jangan sekali-kali pakai uang judi buat belanja ya. Bukannya untung, judi online malah bikin uang sakumu habis dan bikin pusing sekeluarga. Yuk, langsung stop spekulasi ini sekarang juga!";
  } else if (sumberDana === "Pinjaman Online") {
    if (isKebutuhan) {
      decisionVerdict = "TUNDA";
      score = 30;
      riskLevel = "Tinggi";
      financialTrapWarning = "Waduh Kak, aku tahu ini penting buat kamu. Tapi tolong jangan pakai pinjol ya, bunganya gede banget dan risikonya berbahaya. Mending tunda dulu rencana belanjamu ini.";
    } else {
      decisionVerdict = "JANGAN_BELI";
      score = 0;
      riskLevel = "Tinggi";
      financialTrapWarning = "Hati-hati ya! Pakai pinjaman online (pinjol) untuk beli barang gaya hidup itu bahaya banget. Bunganya besar, bisa diteror denda, dan merusak nama baik SLIK OJK-mu. Jangan dipaksakan ya!";
    }
  } else if (sumberDana === "Paylater/Kredit") {
    if (isKebutuhan) {
      decisionVerdict = "BELI_DENGAN_MENABUNG";
      score = 50;
      riskLevel = "Sedang";
      financialTrapWarning = "Karena barang ini kebutuhan penting, nyicil pakai paylater boleh dipertimbangkan asal kamu disiplin bayar. Pilih tenor paling pendek biar bunganya kecil, dan pangkas pos jajan bulananmu ya.";
    } else {
      decisionVerdict = "JANGAN_BELI";
      score = Math.min(score, 30);
      riskLevel = "Tinggi";
      financialTrapWarning = "Pengingat dari sahabatmu: beli barang jajan/keinginan pakai paylater sering kali jadi jebakan. Bunga dan biaya adminnya bakal bikin uang sakumu kepotong terus tiap bulan.";
    }
  } else if (isExtremeTarget) {
    decisionVerdict = isKebutuhan ? "TUNDA" : "JANGAN_BELI";
    score = isKebutuhan ? 35 : 15;
    riskLevel = "Tinggi";
    financialTrapWarning = isHarian
      ? `Waduh Kak, harga target belanja "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} terlalu besar jika dibanding uang jajan/penghasilan harianmu yang sebesar Rp ${dBudget.toLocaleString("id-ID")}/hari. Jika nekat dibeli langsung sekarang, kamu tidak akan memiliki uang jajan tersisa untuk kebutuhan pokok sehari-hari. Mending tunda dulu rencana ini dan alokasikan tabungannya secara bertahap agar jajan harianmu tetap aman!`
      : `Waduh Kak, harga target belanja "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} hampir menghabiskan seluruh budget bulananmu yang sebesar Rp ${Number(monthlyBudget).toLocaleString("id-ID")}. Jika nekat dibeli langsung sekarang, kamu tidak akan memiliki uang tersisa untuk kebutuhan pokok sehari-hari (seperti makanan, kost, dan transportasi). Mending tunda dulu rencana ini dan alokasikan tabungannya secara bertahap dalam jangka panjang yang aman (misal 6-12 bulan) agar hidupmu lebih tenang dan bebas dari utang!`;
  } else if (isDeficit) {
    if (isKebutuhan) {
      score = 30;
      riskLevel = "Tinggi";
      decisionVerdict = "TUNDA";
      financialTrapWarning = isHarian
        ? "Sobat Finansial, karena ini kebutuhan pentingmu, saran terbaikku adalah menundanya sebentar sambil kita menyehatkan keuangan harianmu. Kita bisa coba memotong pengeluaran harian non-pokok agar terkumpul tabungan untuk membeli barang ini secara tunai."
        : "Sobat Finansial, karena ini kebutuhan pentingmu, saran terbaikku adalah menundanya sebentar sambil kita menyehatkan anggaran bulananmu. Kita bisa coba memotong pengeluaran non-pokok agar terkumpul surplus dana untuk membeli barang ini secara tunai.";
    } else {
      score = 0;
      riskLevel = "Tinggi";
      decisionVerdict = "JANGAN_BELI";
      financialTrapWarning = isHarian
        ? "Waduh, sepertinya keuangan harian kamu saat ini lagi defisit (minus). Memaksakan membeli barang non-pokok saat ini bisa bikin kamu tambah pusing karena kehabisan ongkos harian. Yuk, fokus sehatin cash flow harianmu dulu."
        : "Waduh, sepertinya anggaran bulanan kamu saat ini lagi defisit (minus). Memaksakan membeli barang non-pokok saat ini bisa bikin kamu tambah stres dan terpaksa cari pinjaman lain yang berbunga tinggi. Yuk, fokus sehatin cash flow dulu.";
    }
  } else if (feasibilityRatio < 0.15) {
    if (isKebutuhan) {
      score = 40;
      riskLevel = "Tinggi";
      decisionVerdict = "BELI_DENGAN_MENABUNG";
      financialTrapWarning = isHarian
        ? "Barang ini adalah kebutuhan pentingmu Kak, tapi kapasitas sisa uang harianmu saat ini masih sangat kecil dibanding harga target. Jangan berkecil hati ya! Solusinya, kita perpanjang jangka waktu menabungnya agar tabungan hariannya terasa lebih ringan di dompetmu."
        : "Barang ini adalah kebutuhan pentingmu Kak, tapi kapasitas sisa dana bulananmu saat ini masih sangat kecil dibanding harga target. Jangan berkecil hati ya! Solusinya, kita perpanjang jangka waktu menabungnya agar cicilan tabungannya terasa lebih ringan di dompetmu.";
    } else {
      score = 10;
      riskLevel = "Tinggi";
      decisionVerdict = "JANGAN_BELI";
      financialTrapWarning = isHarian
        ? "Sobat Finansial, sisa uang harianmu saat ini masih terlalu kecil dibanding target harga barangnya. Memaksakan diri membelinya sekarang rasanya sangat berisiko buat kelangsungan hidup harianmu."
        : "Sobat Finansial, sisa dana bulananmu saat ini masih terlalu kecil dibanding target harga barangnya. Memaksakan diri membelinya sekarang rasanya sangat berisiko buat kelangsungan hidup harianmu.";
    }
  } else if (feasibilityRatio < 0.5) {
    if (isKebutuhan) {
      score = 60;
      riskLevel = "Sedang";
      decisionVerdict = "BELI_DENGAN_MENABUNG";
      financialTrapWarning = isHarian
        ? "Kamu pasti butuh barang ini segera, tapi mari kita menabung secara bertahap dulu ya. Untuk mempercepat pencapaian target, kita bisa pangkas sedikit pengeluaran nongkrong/jajan harianmu agar dana belanjanya lekas terkumpul penuh."
        : "Kamu pasti butuh barang ini segera, tapi mari kita menabung secara bertahap dulu ya. Untuk mempercepat pencapaian target, kita bisa pangkas sedikit pengeluaran hiburan harianmu agar dana belanjanya lekas terkumpul penuh.";
    } else {
      score = 30;
      riskLevel = "Tinggi";
      decisionVerdict = "TUNDA";
      financialTrapWarning = isHarian
        ? "Kapasitas menabungmu saat ini masih di bawah 50% dari kebutuhan tabungan harian ideal. Mending ditunda sebentar ya, biar keuangan harianmu nggak kaget dan tetap punya pegangan uang darurat."
        : "Kapasitas menabungmu saat ini masih di bawah 50% dari kebutuhan tabungan bulanan ideal. Mending ditunda sebentar ya, biar keuanganmu nggak kaget dan tetap punya pegangan dana darurat.";
    }
  } else if (isSignificantImpact) {
    if (isKebutuhan) {
      score = 55;
      riskLevel = "Sedang";
      decisionVerdict = "BELI_DENGAN_MENABUNG";
      financialTrapWarning = isHarian
        ? `Pembelian ini berdampak signifikan terhadap keuangan harianmu karena tabungan harian yang diperlukan (Rp ${Math.round(requiredDailySavings).toLocaleString("id-ID")}/hari) melebihi 30% dari uang harianmu (Rp ${dBudget.toLocaleString("id-ID")}/hari). Namun karena ini kebutuhan penting, kamu boleh membelinya asal menabung dengan disiplin atau mempertimbangkan alternatif yang lebih terjangkau.`
        : `Pembelian ini berdampak signifikan terhadap keuangan bulananmu karena tabungan bulanan yang diperlukan (Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")}) melebihi 30% dari uang bulananmu (Rp ${Number(monthlyBudget).toLocaleString("id-ID")}). Namun karena ini kebutuhan penting, kamu boleh membelinya asal menabung dengan disiplin atau mempertimbangkan alternatif yang lebih terjangkau.`;
    } else {
      score = 35;
      riskLevel = "Tinggi";
      decisionVerdict = "TUNDA";
      financialTrapWarning = isHarian
        ? `Rencana ini ditunda dulu ya. Pembelian barang keinginan ini berdampak signifikan terhadap keuangan harianmu karena tabungan harian yang diperlukan (Rp ${Math.round(requiredDailySavings).toLocaleString("id-ID")}/hari) melebihi 30% dari uang harianmu (Rp ${dBudget.toLocaleString("id-ID")}/hari). Coba pertimbangkan alternatif barang sejenis yang harganya sekitar 50% dari harga asli.`
        : `Rencana ini ditunda dulu ya. Pembelian barang keinginan ini berdampak signifikan terhadap keuangan bulananmu karena tabungan bulanan yang diperlukan (Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")}) melebihi 30% dari uang bulananmu (Rp ${Number(monthlyBudget).toLocaleString("id-ID")}). Coba pertimbangkan alternatif barang sejenis yang harganya sekitar 50% dari harga asli.`;
    }
  } else if (isUnrealistic) {
    score = 55;
    riskLevel = "Sedang";
    decisionVerdict = "BELI_DENGAN_MENABUNG";
    financialTrapWarning = isHarian
      ? "Rencana tabungan kamu sebenarnya bagus, tapi target waktu yang ditentukan terlalu cepat buat sisa uang harianmu saat ini. Sedikit penyesuaian deadline akan bikin rencana ini berjalan jauh lebih santai dan sehat."
      : "Rencana tabungan kamu sebenarnya bagus, tapi target waktu yang ditentukan terlalu cepat buat sisa budgetmu saat ini. Sedikit penyesuaian deadline akan bikin rencana ini berjalan jauh lebih santai dan sehat.";
  } else {
    decisionVerdict = "BOLEH_BELI";
  }

  const calculatedMonthsNeeded = remainingBudget > 0 ? Math.round(targetValNum / remainingBudget) : "selamanya";
  const delayMonths = remainingBudget > 0 ? Math.max(0, Number(calculatedMonthsNeeded) - monthsDiff) : "tidak terhingga";

  // Tailored fallback terms
  const curhatLower = (keteranganTambahan || "").toLowerCase();
  const isMahasiswa = curhatLower.includes("mahasiswa") || curhatLower.includes("kuliah") || curhatLower.includes("kos") || curhatLower.includes("sekolah");
  const isUMKM = curhatLower.includes("umkm") || curhatLower.includes("usaha") || curhatLower.includes("bisnis") || curhatLower.includes("toko");
  const isFreelancer = curhatLower.includes("freelance") || curhatLower.includes("proyek") || curhatLower.includes("harian");

  let profileNote = "keuangan kamu";
  let tipsNote = "pangkas pengeluaran non-esensial";
  if (isMahasiswa) {
    profileNote = "anggaran mahasiswa/kos kamu";
    tipsNote = "kurangi jajan luar, kurangi kopi susu nongkrong, dan masak sendiri";
  } else if (isUMKM) {
    profileNote = "kas bisnis UMKM kamu";
    tipsNote = "pisahkan kas pribadi dan kas usaha agar arus modal tidak bocor";
  } else if (isFreelancer) {
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

  const futureInvestedVal = Math.round(targetValNum * 1.46);
  const savingsMonthsCovered = totalExpenses > 0 ? Math.round(targetValNum / totalExpenses) : 6;
  const monthlyDebtPayment = Math.round(paylaterPrice / 12);
  const debtImpactPct = remainingBudget > 0 ? Math.round((monthlyDebtPayment / remainingBudget) * 100) : 100;

  const isPrestige = targetName.toLowerCase().includes("iphone") || 
                     targetName.toLowerCase().includes("flagship") || 
                     curhatLower.includes("gengsi") || 
                     curhatLower.includes("fomo") ||
                     isMahasiswa;

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

  const targetLower = targetName.toLowerCase();
  let fallbackAlternatives: string[] = [];

  if (targetLower.includes("hp") || targetLower.includes("phone") || targetLower.includes("samsung") || targetLower.includes("iphone") || targetLower.includes("android") || targetLower.includes("xiaomi") || targetLower.includes("oppo")) {
    fallbackAlternatives = [
      "Samsung Galaxy A15 (Rp 2.900.000) - Opsi HP Android stabil & terjangkau",
      "Redmi Note 13 (Rp 2.500.000) - Spesifikasi unggul dengan harga bersahabat",
      "Samsung Galaxy A05 (Rp 1.500.000) - Alternatif paling ekonomis untuk kebutuhan pokok"
    ];
  } else if (targetLower.includes("laptop") || targetLower.includes("komputer") || targetLower.includes("pc") || targetLower.includes("macbook") || targetLower.includes("asus") || targetLower.includes("lenovo")) {
    fallbackAlternatives = [
      "ASUS Vivobook Go 14 (Rp 5.800.000) - Ringan, andal, cocok untuk produktivitas",
      "Lenovo IdeaPad Slim 1 (Rp 4.900.000) - Performa mumpuni dengan harga bersahabat",
      "Acer Aspire Lite 14 (Rp 4.500.000) - Pilihan ekonomis untuk tugas harian"
    ];
  } else if (targetLower.includes("motor") || targetLower.includes("honda") || targetLower.includes("yamaha") || targetLower.includes("kendaraan")) {
    fallbackAlternatives = [
      "Honda Beat Second (Rp 8.000.000 - Rp 10.000.000) - Irit bahan bakar dan mudah perawatannya",
      "Yamaha Mio Second (Rp 6.000.000 - Rp 8.000.000) - Pilihan murah meriah untuk harian"
    ];
  } else {
    if (targetValNum > 10000000) {
      fallbackAlternatives = [
        `Cari barang sejenis versi bekas berkualitas dengan rentang harga Rp ${Math.round(targetValNum * 0.5).toLocaleString("id-ID")} - Rp ${Math.round(targetValNum * 0.6).toLocaleString("id-ID")}`,
        `Pertimbangkan opsi rental/sewa jika frekuensi pemakaian barang ini rendah`
      ];
    } else if (targetValNum > 2000000) {
      fallbackAlternatives = [
        `Cari alternatif merk lokal atau seri tahun lalu yang menawarkan fungsi serupa dengan harga Rp ${Math.round(targetValNum * 0.6).toLocaleString("id-ID")} - Rp ${Math.round(targetValNum * 0.7).toLocaleString("id-ID")}`,
        `Beli versi second-hand/bekas layak pakai untuk menghemat hingga 40% budget`
      ];
    } else {
      fallbackAlternatives = [
        `Tunda pembelian selama 1 bulan untuk membedakan kebutuhan esensial dari keinginan impulsif`,
        `Cari promo diskon belanja atau beli saat event promo e-commerce untuk mendapatkan harga terbaik`
      ];
    }
  }

  return {
    score,
    riskLevel,
    decisionVerdict,
    financialTrapWarning: isHarian && decisionVerdict === "TUNDA" && !isKebutuhan
      ? `Rencana ini ditunda dulu ya. Pembelian barang keinginan ini berdampak signifikan terhadap keuangan harianmu karena tabungan harian yang diperlukan sebesar Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari melebihi 30% dari uang jajan harianmu (Rp ${dBudget.toLocaleString("id-ID")}/hari). Coba pertimbangkan alternatif barang sejenis yang harganya sekitar 50% dari harga asli.`
      : financialTrapWarning,
    realityCheck: {
      isRealistic: !isUnrealistic && !isDeficit && !isExtremeTarget,
      impactDescription: isHarian
        ? (isExtremeTarget
          ? `Duh Kak, barang impianmu "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini harganya terlalu tinggi buat disandingkan dengan uang jajan harianmu yang sebesar Rp ${dBudget.toLocaleString("id-ID")}/hari. Kalau dipaksakan dibeli sekarang, kamu bakal kehabisan seluruh uang saku harianmu dan nggak bisa jajan sehat di sekolah atau kampus. Kita tunda dulu yuk!`
          : (isKebutuhan
            ? (isDeficit
              ? `Sebagai pelajar/mahasiswa, aku tahu banget pentingnya "${targetName}" buat menunjang belajarmu Kak. Tapi kondisi uang jajan harianmu yang lagi defisit (minus) saat ini jadi tantangan nyata. Tenang ya, kita cari celah bareng-bareng untuk memotong pengeluaran non-pokok seperti nongkrong akhir pekan biar barang penting ini bisa segera kebeli secara sehat.`
              : isUnrealistic
              ? `Membeli kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sebenernya bisa banget terwujud! Cuma, kalau target waktunya ${daysDiff} hari, kamu harus menyisihkan Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari dari uang jajan harianmu Rp ${dBudget.toLocaleString("id-ID")}/hari. Angka itu agak mepet dan bisa bikin kamu kurang jajan pokok di kantin. Lebih baik perpanjang sedikit jangka waktu menabungnya agar terasa lebih enteng dan aman ya!`
              : `Kabar gembira Kak! Pembelian kebutuhan penting "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini sangat aman dan realistis dibeli secara cash. Kamu cukup menyisihkan Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari dari uang jajan harianmu selama ${daysDiff} hari. Keuangan harianmu dijamin bakal tetap stabil dan aman!`)
            : (isDeficit
              ? `Uang jajan harianmu saat ini lagi mepet atau minus Kak. Memaksakan membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} untuk sekadar keinginan/gaya hidup saat ini sangat berisiko membuat kamu kehabisan ongkos jajan pokok di sekolah/kampus. Fokus sehatin uang jajarmu dulu ya!`
              : isUnrealistic
              ? `Membeli keinginan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dalam waktu dekat rasanya masih agak berat buat kapasitas jajan harianmu sekarang Kak. Kamu harus menyisihkan Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari dari uang jajan Rp ${dBudget.toLocaleString("id-ID")}/hari. Biar nongkrongmu dengan teman tetap asyik, coba deh perpanjang waktu nabungnya atau cari barang alternatif sejenis yang harganya sekitar 50% lebih murah!`
              : `Rencana belanjamu aman dan sangat realistis Kak! Dengan menyisihkan Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari dari uang jajan harianmu secara disiplin, kamu sudah bisa membawa pulang "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} secara cash dalam waktu ${daysDiff} hari. Keuangan harianmu tetap seimbang!`)))
        : (isExtremeTarget
          ? `Aduh Kak, harga "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini cukup besar kalau dibanding uang bulananmu yang Rp ${Number(monthlyBudget).toLocaleString("id-ID")}. Kalau langsung dibelanjakan sekarang, khawatir nanti kamu kekurangan untuk ongkos harian, makan, atau tugas sekolah. Yuk, kita atur strategi nabung yang lebih aman saja.`
          : (isKebutuhan
            ? (isDeficit
              ? `Karena "${targetName}" adalah kebutuhan pokok pentingmu Kak, uang bulananmu yang lagi mepet (minus) sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")} saat ini jadi tantangan. Tapi tenang, kita cari celah bareng-bareng ya biar barang ini bisa kebeli.`
              : isUnrealistic
              ? `Beli kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sebenernya bisa banget diwujudkan! Cuma dengan uang saku bulananmu, butuh waktu sekitar ${calculatedMonthsNeeded} bulan buat nabung santai sampai kekumpul. Kita atur ulang target waktunya biar enteng ya.`
              : `Kabar gembira Kak! Kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini aman banget dibeli secara cash menggunakan uang bulananmu dalam waktu sekitar ${monthsDiff} bulan.`)
            : (isDeficit
              ? `Aduh, uang bulananmu saat ini lagi mepet/defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Memaksakan membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} saat ini bisa bikin dompetmu makin tipis dan bikin pusing sendiri.`
              : isUnrealistic
              ? `Membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dalam waktu dekat rasanya masih agak berat buat budget bulananmu sekarang, Kak. Kamu butuh waktu menabung sekitar ${calculatedMonthsNeeded} bulan secara disiplin. Santai aja, nggak usah buru-buru daripada nanti malah terjerat utang.`
              : `Rencana belanjamu aman dan realistis! Dengan menyisihkan uang dari budget bulananmu, kamu bisa bawa pulang "${targetName}" dalam waktu sekitar ${monthsDiff} bulan secara cash.`)))
    },
    verdictOpinion: {
      title: isHarian
        ? (isExtremeTarget
          ? "Pendapat Sahabatmu: Uang Harian Mepet, Tunda Dulu! ⚠️"
          : decisionVerdict === "BOLEH_BELI"
          ? "Pendapat Sahabatmu: Masuk Akal, Bisa Direncanakan! 🎉"
          : decisionVerdict === "BELI_DENGAN_MENABUNG"
          ? "Pendapat Sahabatmu: Nabung Harian Aja, Pasti Bisa! 🎯"
          : "Pendapat Sahabatmu: Mending Tunda Dulu atau Cari Alternatif! 🥺")
        : (isExtremeTarget
          ? "Pendapat Sahabatmu: Tunda Dulu, Amankan Uang Saku! ⚠️"
          : (isWantAndEnoughMoney
            ? "Pendapat Sahabatmu: Pertimbangkan Lagi Yuk, Kak! 🤔"
            : decisionVerdict === "BOLEH_BELI"
            ? "Pendapat Sahabatmu: Boleh Banget Beli Langsung! 🎉"
            : decisionVerdict === "BELI_DENGAN_MENABUNG"
            ? "Pendapat Sahabatmu: Nabung Dulu Yuk, Pasti Bisa! 💪"
            : decisionVerdict === "TUNDA"
            ? "Pendapat Sahabatmu: Tunda Dulu Ya, Kak 🥺"
            : "Pendapat Sahabatmu: Mending Jangan Beli Dulu Deh 🙏")),
      explanation: isHarian
        ? (isExtremeTarget
          ? `Duh Kak, aku paham banget kamu kepengin banget punya "${targetName}" baru. Tapi kalau kita hitung secara jernih, uang jajan harianmu yang Rp ${dBudget.toLocaleString("id-ID")}/hari bakal kewalahan banget buat ngejar target Rp ${targetValNum.toLocaleString("id-ID")}. Jika nekat dibeli langsung sekarang, nanti kamu nggak punya sisa uang jajan buat makan siang di sekolah/kampus, jajan es boba, atau bayar tugas print. Yuk, santai dulu, kita tunda sebentar dan cari alternatif barang sejenis yang harganya setengahnya biar kamu tetep jajan enak setiap hari!`
          : (isWantAndEnoughMoney
            ? `Wah, hebat banget! Uang jajan harianmu sebenarnya lebih dari cukup buat nabung beli "${targetName}". Tapi karena ini masuk kategori keinginan/hobi, yuk tanyakan ke dirimu sendiri dulu: apakah barang ini beneran kamu butuhin buat sekolah/kuliah sekarang, atau jangan-jangan cuma laper mata karena lihat temen pakai? Sebagai sahabatmu, saran terbaikku adalah simpan dulu uangnya beberapa hari, kalau masih kepengin banget baru deh dibeli secara cash!`
            : isKebutuhan
            ? (decisionVerdict === "JANGAN_BELI"
              ? `Aku ngerti banget kalau "${targetName}" ini penting banget buat menunjang sekolah atau kuliahmu, Kak. Tapi dengan sisa uang jajan harianmu saat ini, memaksakan membeli sekarang bisa bikin kamu kelabakan memenuhi ongkos jalan harian. Yuk, kita atur ulang timeline menabungnya biar lebih panjang dan santai, atau coba pertimbangkan opsi second-hand berkualitas agar dompetmu nggak nangis!`
              : decisionVerdict === "TUNDA"
              ? `Saran hangat dari sahabat keuanganmu: tunda dulu beli "${targetName}" ini selama beberapa minggu ya Kak. Sebagai mahasiswa/pelajar, lebih tenang kalau kamu punya uang saku harian yang aman dulu untuk jajan pokok di kantin dibanding memaksakan beli sekarang tapi nanti harus ngutang ke temen atau malah terjebak paylater.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Dukung 100% Kak! Ini kan kebutuhan penting buat mendukung produktivitas belajarmu. Cara terbaiknya adalah mulai menyisihkan Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari dari uang jajanmu ke celengan khusus secara konsisten. Dijamin rasanya bakal puas banget pas beli cash dari hasil jerih payahmu menabung sendiri!`
              : `Wih mantap! Uang jajan harianmu sehat sekali dan alokasinya sangat aman buat beli kebutuhan pentingmu ini secara tunai tanpa mengganggu jajan pokok harianmu. Sukses terus ya buat belajarnya, langsung dibeli aja Kak!`)
            : (decisionVerdict === "JANGAN_BELI"
              ? `Aku ngerti kamu pengen banget punya "${targetName}" ini biar makin hits di tongkrongan sekolah/kampus. Tapi karena pos uang jajan harianmu lagi ngepas banget, mending dihindari dulu ya Kak daripada nanti jajan harianmu jadi minus atau malah tergoda paylater/kredit. Yuk, kita utamakan dulu ongkos sekolah dan makan siangmu!`
              : decisionVerdict === "TUNDA"
              ? `Mending ditunda dulu ya Kak. Uang jajan harianmu saat ini masih tipis banget untuk beli barang keinginan ini. Lebih aman kalau kamu fokus jajan sehat dulu di sekolah/kampus daripada memaksakan nabung ekstrem tapi nanti di kelas malah kelaparan.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Kamu boleh banget beli barang ini, tapi syaratnya harus sabar menabung harian sebesar Rp ${requiredDailySavings.toLocaleString("id-ID")}/hari secara konsisten selama ${daysDiff} hari ya! Menabung tunai ke celengan harian jauh lebih aman dan melatih kedisiplinan finansialmu sejak muda daripada beli pakai paylater.`
              : `Kondisi uang jajan harianmu lagi asyik banget nih! Kebutuhan jajan harian aman dan masih ada sisa lebih. Boleh banget kalau mau beli barang impianmu ini sekarang secara cash tanpa rasa bersalah. Selamat menikmati hasil tabunganmu Kak!`)))
        : (isExtremeTarget
          ? `Membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dengan budget bulananmu yang sebesar Rp ${Number(monthlyBudget).toLocaleString("id-ID")} rasanya bakal berat banget buat kamu saat ini, Kak. Takutnya nanti kamu tidak punya uang pegangan harian untuk makan, ongkos jalan, atau tugas sekolah. Lebih baik rencana ini kita tunda dulu pelan-pelan ya.`
          : (isWantAndEnoughMoney
            ? `Uang sakumu sebenarnya cukup banget buat beli "${targetName}" secara cash langsung. Tapi berhubung ini barang keinginan/hobi, coba pikirin lagi ya, apakah beneran penting sekarang atau cuma laper mata aja.`
            : isKebutuhan
            ? (decisionVerdict === "JANGAN_BELI"
              ? `Aku paham banget ini kebutuhan penting buat kamu, Kak. Tapi karena kondisi keuangan saat ini sedang tidak bersahabat atau ada risiko utang, lebih baik kita rapikan dulu pos-pos keuangan harianmu agar nantinya bisa beli dengan lebih tenang dan berkah ya.`
              : decisionVerdict === "TUNDA"
              ? `Saran hangat dari sahabatmu, kita tunda dulu beli "${targetName}" beberapa bulan ya. Lebih tenang kalau kamu punya uang cadangan dulu dibanding memaksakan beli sekarang.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Dukung banget rencana ini Kak! Cara terbaik adalah mencicil tabungan bulanan secara konsisten dari budget bulananmu. Menabung secara tunai adalah solusi paling berkah dan aman dibanding terjerat paylater.`
              : `Wah, mantap! Uang bulananmu sehat banget dan siap buat beli kebutuhan pentingmu ini secara tunai tanpa ganggu kebutuhan harian. Silakan beli ya!`)
            : (decisionVerdict === "JANGAN_BELI"
              ? `Aku ngerti banget kamu kepengin punya "${targetName}" ini, Kak. Tapi karena pos keuanganmu sedang mepet/minus atau ada rencana pakai sumber dana yang berisiko (seperti pinjol/judi), demi kebaikanmu sendiri, sangat disarankan untuk menghindarinya ya. Yuk, kita fokus ke kebutuhan pokok yang lebih penting dulu.`
              : decisionVerdict === "TUNDA"
              ? `Mending ditunda dulu ya Kak. Uang bulananmu masih tipis banget sekarang. Khawatir nanti pas ada keperluan mendadak malah bingung nyari pinjaman.`
              : decisionVerdict === "BELI_DENGAN_MENABUNG"
              ? `Kamu boleh banget beli barang ini, tapi syaratnya harus sabar menabung tunai secara bertahap ya! Uang bulananmu bisa kamu sisihkan secara disiplin tanpa perlu mencicil pakai paylater.`
              : `Kondisi uangmu lagi asyik banget nih! Kebutuhan harian aman dan masih ada sisa lebih. Boleh banget kalau mau beli barang impianmu ini sekarang secara tunai!`)))
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
      consequencesNote: `Kalau kamu memaksakan mencicil pakai paylater, tagihan bulanan sebesar Rp ${monthlyDebtPayment.toLocaleString("id-ID")} bakal mengambil sekitar ${debtImpactPct}% dari seluruh uang bulananmu setiap bulan. Hal ini bisa bikin kamu kerepotan jajan harian lho!`
    },
    opportunityCost: {
      investmentAlternative: isExtremeTarget
        ? `Lebih baik pakai uang Rp ${targetValNum.toLocaleString("id-ID")} ini buat jajan harian, ongkos transport, atau ditabung di celengan biar aman.`
        : (isWantAndEnoughMoney
          ? `Uang Rp ${targetValNum.toLocaleString("id-ID")} kamu udah cukup buat beli langsung. Tapi kalau ditabung di celengan atau reksa dana, uangnya bisa bertambah banyak lho.`
          : `Uang Rp ${targetValNum.toLocaleString("id-ID")} ini bisa kamu capai dalam ${fallbackMonthsNeeded} bulan dengan cara menyisihkan Rp ${fallbackMonthlySaving.toLocaleString("id-ID")} tiap bulan dari uang sakumu.`),
      savingAlternative: isExtremeTarget
        ? `Cari barang yang mirip tapi lebih murah (merk lokal atau barang second berkualitas) biar uang sakumu nggak habis total.`
        : (isWantAndEnoughMoney
          ? "Sebelum dibeli, pikirin lagi apakah barang ini beneran bikin kamu seneng dalam jangka panjang atau cuma pengen sesaat aja."
          : `Biar konsisten nabung, coba pisahkan uang Rp ${fallbackMonthlySaving.toLocaleString("id-ID")} ini di awal bulan ke celengan khusus sebelum dipakai jajan yang lain.`)
    },
    psychologicalInsight: {
      purchaseDriver: isKebutuhan ? "Kebutuhan Nyata" : (isPrestige ? "FOMO/Gengsi" : isDeficit ? "Impulsive Buying" : "Kebutuhan Nyata"),
      motivationText: isKebutuhan
        ? "Memenuhi kebutuhan pentingmu adalah langkah yang sangat bagus untuk mendukung aktivitas belajarmu, Kak. Tetap semangat ya, mari kita atur anggarannya agar semuanya bisa terpenuhi secara aman!"
        : (isPrestige
          ? "Membeli barang karena ikut-ikutan tren atau gengsi sosial biasanya cuma bikin senang di awal saja, Kak. Begitu cicilannya datang tiap bulan, kamu bisa stres sendiri. Ingat ya, kamu tetap hebat kok apa pun barang yang kamu pakai!"
          : "Yuk, kita fokus ke masa depanmu yang cerah, Kak. Punya tabungan yang aman di celengan jauh lebih bikin hati tenang daripada terburu-buru beli barang baru yang sebenarnya belum terlalu mendesak."),
      riskText: isKebutuhan
        ? "Kalau kebutuhan ini ditunda terlalu lama, takutnya malah mengganggu aktivitas sekolah atau kegiatan produktif harianmu, Kak. Tapi ingat ya, hindari membelinya terburu-buru pakai utang berbunga tinggi."
        : (isPrestige
          ? "Risiko memaksakan beli hanya demi status sosial adalah kamu bisa pusing tiap akhir bulan karena tagihan yang menumpuk. Jangan sampai uang sakumu habis hanya untuk memuaskan pandangan orang lain ya."
          : "Kalau terlalu sering impulsif, tabungan daruratmu bisa habis tak bersisa. Nanti kalau tiba-tiba ada keperluan mendadak (seperti buku sekolah hilang atau ban bocor), kamu bisa bingung sendiri karena tidak punya uang tunai.")
    },
    impactOnTarget: isDeficit 
      ? (isKebutuhan
        ? `Karena ini kebutuhan penting buat kamu Kak, uang bulananmu yang lagi mepet (minus) jadi tantangan tersendiri. Tapi jangan khawatir, kita bisa kurangi jajan boba atau kopi dulu biar tabungan untuk barang ini cepat terkumpul!`
        : `Anggaran bulananmu saat ini lagi minus Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Jadi, rencana membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sebaiknya ditunda dulu agar uang makan dan kebutuhan sekolah harianmu tidak terganggu.`)
      : isExtremeTarget
      ? `Membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sangat berisiko karena harganya hampir sama atau bahkan melebihi seluruh uang bulananmu. Rencana ini agak sulit diwujudkan jika kamu ingin membelinya langsung bulan ini tanpa menabung dalam jangka waktu panjang.`
      : isUnrealistic
      ? (isKebutuhan
        ? `Membeli kebutuhan "${targetName}" ini butuh sedikit kesabaran, Kak. Dengan kondisi sisa uang bulananmu sekarang, kamu perlu menabung sekitar ${calculatedMonthsNeeded} bulan biar transaksinya berjalan dengan aman dan sehat.`
        : `Membeli "${targetName}" dengan target waktu secepat itu rasanya agak berat bagi dompetmu sekarang, Kak. Dengan uang bulananmu, lebih disarankan untuk menabung santai selama ${calculatedMonthsNeeded} bulan agar keuangan harianmu tetap aman terjaga.`)
      : `Rencana belanjamu realistis banget, Kak! Uang bulananmu Rp ${Number(monthlyBudget).toLocaleString("id-ID")} sangat cukup untuk disisihkan sebesar Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan demi mencapai target belanjamu.`,
    healthScoreExplanation: isDeficit
      ? (isKebutuhan
        ? `Skor rencanamu bernilai 30/100 karena kas bulananmu sedang mepet. Meskipun ini kebutuhan penting, yuk kita atur kembali pos jajanmu agar kas bulananmu kembali sehat dan kamu bisa mulai menabung dengan tenang.`
        : `Skor rencanamu bernilai 0/100 karena posisi keuanganmu saat ini sedang mepet (minus). Berhubung tidak ada sisa uang untuk ditabung, alangkah baiknya jika rencana belanja keinginan ini ditunda dulu sampai dompetmu kembali sehat ya.`)
      : isExtremeTarget
      ? `Skor rencanamu berada di angka ${score}/100 karena harga barang yang kamu inginkan hampir setara dengan seluruh uang bulananmu. Mari kita perpanjang waktu menabungnya agar uang harianmu tetap aman.`
      : isUnrealistic
      ? (isKebutuhan
        ? `Skor rencanamu bernilai ${score}/100. Kebutuhan penting ini tetap bisa kamu miliki kok! Kuncinya adalah sabar menabung secara konsisten dan sesuaikan jangka waktunya agar uang jajan harianmu tidak terganggu.`
        : `Skor rencanamu bernilai ${score}/100 karena target waktu yang kamu pasang terlalu cepat. Sisa uang bulananmu belum sanggup mengimbangi target tabungan secepat itu. Yuk, kita menabung dengan santai saja!`)
      : `Skor rencanamu bernilai ${score}/100 karena kondisi dompetmu sangat sehat! Kamu punya sisa uang yang cukup tebal untuk ditabung tanpa perlu khawatir kekurangan uang jajan harian.`,
    realMarketPrice: `Rp ${targetValNum.toLocaleString("id-ID")}`,
    priceComparisonNote: `Harga Rp ${targetValNum.toLocaleString("id-ID")} ini merupakan nominal yang kamu masukkan sebagai target belanjamu.`,
    alternativeSuggestions: fallbackAlternatives,
    budgetEvolution: [
      `Uang saku bulananmu terpakai sekitar ${Math.round((totalExpenses / monthlyBudget) * 100)}% untuk pengeluaran rutin harianmu.`,
      `Uang bulananmu saat ini baru bisa menutupi sekitar ${Math.round(feasibilityRatio * 100)}% dari porsi tabungan ideal bulanan yang dibutuhkan.`
    ],
    emergencyMode: {
      isActive: isDeficit || isUnrealistic || isExtremeTarget,
      strategy: isDeficit
        ? `Taktik Pemulihan: Yuk, kita kurangi dulu jajan yang kurang penting. Fokus potong pengeluaran non-pokok agar dompetmu kembali seimbang dan sehat.`
        : isExtremeTarget
        ? `Taktik Penyelamatan: Jangan sampai seluruh uang bulanan habis demi barang ini ya, Kak. Amankan dulu uang makan, ongkos, dan kost harian, lalu cobalah menabung santai dalam nominal kecil biar hidup tetap tenang.`
        : isUnrealistic
        ? `Taktik Penyesuaian: Perpanjang batas waktu menabungmu jadi minimal ${Math.ceil(Number(calculatedMonthsNeeded))} bulan ya. Ini bakal bikin tabungan bulananmu jauh lebih ringan dan aman di dompet.`
        : "Taktik Pemeliharaan: Keren, anggaranmu stabil banget! Tetap disiplin menabung ya, dan jangan lupa sisihkan sedikit untuk dana darurat agar masa depanmu makin aman."
    },
    sacrificeTransparency: parsedExpenses.slice(0, 2).map((exp: any) => {
      const expAmt = Number(exp.amount || 0);
      const safeCut = Math.round((expAmt * 0.15) / 10000) * 10000 || 50000;
      return {
        item: exp.name,
        nominalToCut: Math.min(expAmt, safeCut),
        reasons: [
          `Pos "${exp.name}" ini rasanya masih bisa kita kurangi sedikit jatahnya agar uang bulananmu tidak tertekan.`,
          `Dengan memotong Rp ${Math.min(expAmt, safeCut).toLocaleString("id-ID")} dari pos ini, tabungan barang impianmu bisa lekas terkumpul dengan aman.`
        ]
      };
    }),
    aiRecommendationText: isExtremeTarget
      ? `Saran dari sahabatmu: tunda dulu ya Kak. Utamakan uang sakumu untuk makan jajan sehari-hari dan tugas sekolah dulu biar hidup tenang bebas stres.`
      : isWantAndEnoughMoney
      ? `Uangmu sudah cukup buat beli cash. Tapi coba pikirkan kembali apakah barang hobi/keinginan ini beneran penting dibeli sekarang.`
      : isDeficit
      ? "Saran dari sahabatmu: stop dulu rencana beli ini. Yuk fokus beresin keuangan bulananmu biar nggak pusing karena dompet minus."
      : isUnrealistic
      ? "Saran dari sahabatmu: tunda dulu ya Kak, atur ulang waktu menabungnya agar lebih panjang dan nggak membebani uang saku harianmu."
      : "Saran dari sahabatmu: lanjut beli Kak! Keuanganmu sehat dan aman buat bawa pulang barang ini sekarang."
  };
}
