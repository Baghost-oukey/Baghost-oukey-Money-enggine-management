export const roundToCleanNumber = (val: number): number => {
  if (val <= 0) return 1000;
  if (val < 5000) return Math.max(1000, Math.round(val / 1000) * 1000);
  if (val < 20000) return Math.round(val / 2000) * 2000;
  if (val < 100000) return Math.round(val / 5000) * 5000;
  return Math.round(val / 10000) * 10000;
};

export interface SavingOption {
  label: string;
  dailySaving: number;
  daysNeeded: number;
  monthsNeeded: number;
}

export function calculateSavingOptions(
  remainingBudget: number,
  targetValue: string
): SavingOption[] {
  const targetValNum = Number(targetValue || 0);
  const savingOptions: SavingOption[] = [];
  const maxDailyCapacity = remainingBudget > 0 ? remainingBudget / 30 : 0;

  if (maxDailyCapacity > 0) {
    // 1. Opsi Ringan (20% of capacity)
    const daily1 = roundToCleanNumber(maxDailyCapacity * 0.2);
    const days1 = Math.ceil(targetValNum / daily1);
    const months1 = Math.round((days1 / 30) * 10) / 10;
    savingOptions.push({
      label: "Opsi Ringan (Santai)",
      dailySaving: daily1,
      daysNeeded: days1,
      monthsNeeded: months1,
    });

    // 2. Opsi Sedang (50% of capacity)
    const daily2 = roundToCleanNumber(maxDailyCapacity * 0.5);
    const days2 = Math.ceil(targetValNum / daily2);
    const months2 = Math.round((days2 / 30) * 10) / 10;
    savingOptions.push({
      label: "Opsi Sedang (Konsisten)",
      dailySaving: daily2,
      daysNeeded: days2,
      monthsNeeded: months2,
    });

    // 3. Opsi Cepat (85% of capacity)
    const daily3 = roundToCleanNumber(maxDailyCapacity * 0.85);
    const days3 = Math.ceil(targetValNum / daily3);
    const months3 = Math.round((days3 / 30) * 10) / 10;
    savingOptions.push({
      label: "Opsi Cepat (Agresif)",
      dailySaving: daily3,
      daysNeeded: days3,
      monthsNeeded: months3,
    });
  } else {
    // Deficit / zero budget options (rely on small cuts)
    const fallbackOptions = [
      { label: "Opsi Hemat Boba/Kopi ☕", dailySaving: 10000 },
      { label: "Opsi Hemat Makan Siang 🍱", dailySaving: 20000 },
      { label: "Opsi Hemat Gaya Hidup 🛍️", dailySaving: 50000 },
    ];
    
    fallbackOptions.forEach((fOpt) => {
      const days = Math.ceil(targetValNum / fOpt.dailySaving);
      const months = Math.round((days / 30) * 10) / 10;
      savingOptions.push({
        label: fOpt.label,
        dailySaving: fOpt.dailySaving,
        daysNeeded: days,
        monthsNeeded: months,
      });
    });
  }

  return savingOptions;
}

export interface TimelineStep {
  label: string;
  subLabel?: string;
  amount: number;
  pct: number;
}

export function generateSavingsTimelines(
  targetValNum: number,
  suggestedDailySaving: number,
  suggestedMonthlySaving: number,
  suggestedMonthsNeeded: number,
  suggestedDaysNeeded: number
) {
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTimeline: TimelineStep[] = [];
  const monthStep = suggestedMonthsNeeded <= 6 ? 1 : 2;

  for (let m = monthStep; m <= suggestedMonthsNeeded; m += monthStep) {
    const accumSavings = Math.min(targetValNum, m * suggestedMonthlySaving);
    const pct = Math.round((accumSavings / targetValNum) * 100);
    
    const targetMonthIdx = (currentMonthIdx + m) % 12;
    const targetYear = currentYear + Math.floor((currentMonthIdx + m) / 12);
    const monthLabel = `${monthNames[targetMonthIdx]} ${targetYear}`;
    
    monthlyTimeline.push({
      label: monthLabel,
      subLabel: `Bulan ke-${m}`,
      amount: accumSavings,
      pct,
    });
  }

  if (monthlyTimeline.length === 0 || monthlyTimeline[monthlyTimeline.length - 1].amount < targetValNum) {
    const finalMonthIdx = (currentMonthIdx + suggestedMonthsNeeded) % 12;
    const finalYear = currentYear + Math.floor((currentMonthIdx + suggestedMonthsNeeded) / 12);
    const finalMonthLabel = `${monthNames[finalMonthIdx]} ${finalYear}`;
    monthlyTimeline.push({
      label: finalMonthLabel,
      subLabel: "Target Tercapai 🎉",
      amount: targetValNum,
      pct: 100,
    });
  }

  const dailyTimeline: TimelineStep[] = [];
  const dayStep = 60;

  for (let d = dayStep; d <= suggestedDaysNeeded; d += dayStep) {
    const accumSavings = Math.min(targetValNum, d * suggestedDailySaving);
    const pct = Math.round((accumSavings / targetValNum) * 100);
    
    dailyTimeline.push({
      label: `Hari ke-${d}`,
      amount: accumSavings,
      pct,
    });
  }

  if (dailyTimeline.length === 0 || dailyTimeline[dailyTimeline.length - 1].amount < targetValNum) {
    dailyTimeline.push({
      label: `Hari ke-${suggestedDaysNeeded}`,
      subLabel: "Target Tercapai 🎉",
      amount: targetValNum,
      pct: 100,
    });
  }

  return { monthlyTimeline, dailyTimeline, monthStep };
}

export interface PaylaterPlan {
  tenor: number;
  monthlyInstallment: number;
  totalPrice: number;
  interestAmount: number;
  adminFee: number;
  moneyWasted: number;
}

export function calculatePaylaterPlans(
  targetValue: string,
  aiData: any
): PaylaterPlan[] {
  return aiData?.paylaterSimulation?.plans || [3, 6, 12].map((tenor: number) => {
    const cashPrice = aiData?.paylaterSimulation?.cashPrice || Number(targetValue || 0);
    const adminRatePct = aiData?.paylaterSimulation?.adminRatePct || 1.0;
    const interestRatePct = aiData?.paylaterSimulation?.interestRatePct || 2.95;
    
    const planAdminFee = Math.round(cashPrice * (adminRatePct / 100));
    const planInterest = Math.round(cashPrice * (interestRatePct / 100) * tenor);
    const planWasted = planAdminFee + planInterest;
    const totalPrice = cashPrice + planWasted;
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
}

export function getFallbackAIData(
  remainingBudget: number,
  targetValue: string,
  target: string,
  targetDate: string,
  monthsDiff: number,
  totalExpenses?: number,
  jenisTarget?: string,
  keteranganTambahan?: string,
  score?: number,
  riskLevel?: string,
  recommendation?: string
): any {
  const isDeficit = remainingBudget < 0;
  const isUnrealistic = targetDate ? (remainingBudget < (Number(targetValue) / monthsDiff)) : true;
  const decisionVerdict = isDeficit ? "JANGAN_BELI" : isUnrealistic ? "BELI_DENGAN_MENABUNG" : "BOLEH_BELI";
  
  const cashPrice = Number(targetValue || 0);
  const adminFee = Math.round(cashPrice * 0.05);
  const interestExpense = Math.round(cashPrice * 0.42);
  const moneyWasted = adminFee + interestExpense;
  const paylaterPrice = cashPrice + moneyWasted;
  const monthlyDebtPayment = Math.round(paylaterPrice / 12);
  const debtImpactPct = remainingBudget > 0 ? Math.round((monthlyDebtPayment / remainingBudget) * 100) : 100;
  
  const futureInvestedVal = Math.round(cashPrice * 1.46);
  const savingsMonthsCovered = totalExpenses && totalExpenses > 0 ? Math.round(cashPrice / totalExpenses) : 6;

  const targetLower = (target || "").toLowerCase();
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
    if (cashPrice > 10000000) {
      fallbackAlternatives = [
        `Cari barang sejenis versi bekas berkualitas dengan rentang harga Rp ${Math.round(cashPrice * 0.5).toLocaleString("id-ID")} - Rp ${Math.round(cashPrice * 0.6).toLocaleString("id-ID")}`,
        `Pertimbangkan opsi rental/sewa jika frekuensi pemakaian barang ini rendah`
      ];
    } else if (cashPrice > 2000000) {
      fallbackAlternatives = [
        `Cari alternatif merk lokal atau seri tahun lalu yang menawarkan fungsi serupa dengan harga Rp ${Math.round(cashPrice * 0.6).toLocaleString("id-ID")} - Rp ${Math.round(cashPrice * 0.7).toLocaleString("id-ID")}`,
        `Beli versi second-hand/bekas layak pakai untuk menghemat hingga 40% budget`
      ];
    } else {
      fallbackAlternatives = [
        `Tunda pembelian selama 1 bulan untuk membedakan kebutuhan esensial dari keinginan impulsif`,
        `Cari promo diskon belanja atau beli saat event promo e-commerce untuk mendapatkan harga terbaik`
      ];
    }
  }

  const isKebutuhan = jenisTarget === "Kebutuhan";
  const isPrestige = targetLower.includes("iphone") || 
                     targetLower.includes("flagship") || 
                     (keteranganTambahan || "").toLowerCase().includes("gengsi") || 
                     (keteranganTambahan || "").toLowerCase().includes("fomo");
  const purchaseDriver = isKebutuhan ? "Kebutuhan Nyata" : (isPrestige ? "FOMO/Gengsi" : isDeficit ? "Impulsive Buying" : "Kebutuhan Nyata");

  return {
    score: score || 70,
    riskLevel: riskLevel || "Sedang",
    decisionVerdict: decisionVerdict,
    realityCheck: {
      isRealistic: !isUnrealistic && !isDeficit,
      impactDescription: isDeficit
        ? "Arus kas bulanan Anda saat ini mengalami defisit. Membeli target ini sekarang sangat tidak realistis dan berisiko membahayakan kestabilan hidup harian Anda."
        : isUnrealistic
        ? "Pembelian target ini kurang realistis dengan sisa uang menabung bulanan Anda saat ini. Rencana Anda berpotensi mengalami penundaan dari deadline awal."
        : "Rencana target belanja Anda cukup realistis dan masih aman dijangkau dengan kapasitas anggaran bulanan Anda."
    },
    verdictOpinion: {
      title: decisionVerdict === "BOLEH_BELI" ? "Keputusan: Boleh Beli" : decisionVerdict === "BELI_DENGAN_MENABUNG" ? "Keputusan: Beli Dengan Menabung" : "Keputusan: Tunda/Jangan Beli",
      explanation: isDeficit
        ? "Sebagai konsultan keuangan, kami melarang keras pembelian ini karena anggaran Anda defisit. Memaksakan membeli barang mewah di kala anggaran negatif akan merusak arus kas bulanan Anda."
        : isUnrealistic
        ? "Kami merekomendasikan membeli barang ini hanya dengan cara menabung tunai secara bertahap. Hindari utang konsumtif/paylater dan sesuaikan target deadline agar lebih realistis."
        : "Pembelian disetujui penuh secara tunai. Keuangan Anda sehat dan menyisakan kapasitas menabung yang ideal untuk membeli target ini tanpa mengorbankan pos pengeluaran dasar."
    },
    paylaterSimulation: {
      cashPrice,
      paylaterPrice,
      adminFee,
      interestExpense,
      moneyWasted,
      consequencesNote: `Jika kamu nekat menggunakan cicilan, beban bulanan Rp ${monthlyDebtPayment.toLocaleString("id-ID")} akan mengambil sekitar ${debtImpactPct}% dari budget bulananmu.`
    },
    opportunityCost: {
      investmentAlternative: `Jika dialokasikan ke reksa dana dengan return 8% per tahun, dalam 5 tahun uang ini akan bertumbuh menjadi sekitar Rp ${futureInvestedVal.toLocaleString("id-ID")}.`,
      savingAlternative: `Nominal ini setara dengan jaring pengaman dana darurat yang mampu menanggung pengeluaran wajib harianmu selama ${savingsMonthsCovered} bulan.`
    },
    psychologicalInsight: {
      purchaseDriver: purchaseDriver,
      motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan. Memiliki dana darurat yang aman jauh lebih membahagiakan.",
      riskText: "Membeli barang tersier secara terburu-buru atau karena dorongan impulsif dapat merusak cash flow bulanan dan memicu stres finansial akibat tagihan cicilan."
    },
    impactOnTarget: isDeficit
      ? "Keputusan ini mengurangi peluang pencapaian target tabungan secara signifikan karena kondisi anggaran Anda saat ini defisit."
      : "Keputusan ini cukup stabil namun membutuhkan alokasi yang lebih disiplin untuk mencapai target.",
    healthScoreExplanation: recommendation || "Penilaian kesehatan keuangan bulanan Anda berdasarkan budget bulanan saat ini.",
    financialTrapWarning: isDeficit ? "Anggaran Anda saat ini mengalami defisit. Memaksakan diri membelinya sekarang dapat menjerumuskan Anda pada pinjaman cepat atau paylater." : "",
    realMarketPrice: targetValue ? `Rp ${Number(targetValue).toLocaleString("id-ID")}` : undefined,
    priceComparisonNote: "Menggunakan nominal target sebagai patokan harga dasar di fallback.",
    alternativeSuggestions: fallbackAlternatives,
    budgetEvolution: [
      "Budget bulanan bernilai positif.",
      "Butuh monitoring rutin terhadap pengeluaran harian."
    ],
    emergencyMode: {
      isActive: isDeficit,
      strategy: isDeficit
        ? "Anggaran Anda mengalami defisit! Segera pangkas pengeluaran non-esensial dan tunda rencana belanja tersier."
        : "Anggaran masih aman. Jaga rasio tabungan minimal 20% dari total pendapatan."
    },
    sacrificeTransparency: [],
    aiRecommendationText: "Kelola budget Anda secara bijak.",
    sumberDana: undefined,
    jenisTarget: undefined
  };
}

export interface DailyAnalysis {
  status: string;
  badgeClass: string;
  message: string;
  lifestyleCut: string;
  reason: string;
  options: string[];
}

export interface MonthlyAnalysis {
  status: string;
  badgeClass: string;
  message: string;
  reason: string;
  options: string[];
}

export function analyzeDailySavings(
  surplus: number,
  suggestedDailySaving: number,
  suggestedDaysNeeded: number,
  targetValNum: number,
  jenisTarget: string
): DailyAnalysis {
  const dailyMonthlyEquiv = suggestedDailySaving * 30;
  let status = "Aman Banget";
  let badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  let message = "";

  if (surplus <= 0) {
    status = "Dompet Lagi Minus";
    badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    message = `Kondisi uang bulananmu sekarang lagi seret/minus nih. Kalau dipaksa nyisihin Rp ${suggestedDailySaving.toLocaleString("id-ID")}/hari, yang ada dompetmu malah tekor Rp ${dailyMonthlyEquiv.toLocaleString("id-ID")} sebulan. Kamu terpaksa harus ngurangin belanjaan penting biar nggak makin pusing.`;
  } else {
    const dailyPct = Math.round((dailyMonthlyEquiv / surplus) * 100);
    if (dailyPct <= 30) {
      status = "Aman Banget";
      badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      message = `Tenang, ini aman banget buat dompetmu! Uang harian segini cuma kepakai sekitar ${dailyPct}% dari sisa uang bulananmu. Kamu masih punya sisa uang cadangan tebal Rp ${(surplus - dailyMonthlyEquiv).toLocaleString("id-ID")} buat pegangan bulan ini.`;
    } else if (dailyPct <= 75) {
      status = "Masih Aman (Pas-pasan)";
      badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      message = `Masih aman kok, tapi kamu harus agak nahan diri ya. Tabungan harian ini bakal makan sekitar ${dailyPct}% dari sisa uang bulananmu. Sisa uang peganganmu tinggal Rp ${(surplus - dailyMonthlyEquiv).toLocaleString("id-ID")}, jadi jangan boros-boros ya!`;
    } else if (dailyPct <= 100) {
      status = "Mepet Banget";
      badgeClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      message = `Duh, ini mepet lho buat dompetmu! Nyisihin jatah harian segini bakal ngabisin hampir semua sisa uang bulananmu (${dailyPct}%). Uang pegangan daruratmu tinggal Rp ${(surplus - dailyMonthlyEquiv).toLocaleString("id-ID")} doang.`;
    } else {
      status = "Bisa Tekor/Defisit";
      badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      message = `Gawat, tabungan harian segini kegedean buat dompetmu (${dailyPct}% dari sisa uangmu). Keuanganmu bakal nomok/minus Rp ${(dailyMonthlyEquiv - surplus).toLocaleString("id-ID")} sebulan kalau belanjaan rutin nggak dipotong.`;
    }
  }

  let lifestyleCut = "";
  if (suggestedDailySaving < 15000) {
    lifestyleCut = "Jatah harian segini setara dengan ngurangin jajan es teh manis, camilan sore, atau uang parkir";
  } else if (suggestedDailySaving < 40000) {
    lifestyleCut = "Jatah harian segini setara dengan bawa bekal makan siang dari rumah dan nahan diri nggak beli es kopi susu kekinian dulu";
  } else {
    lifestyleCut = "Jatah harian segini setara dengan nunda beli barang hobi, jalan-jalan weekend, atau biaya langganan aplikasi/streaming bulanan";
  }

  const reason = `Nabung Rp ${suggestedDailySaving.toLocaleString("id-ID")} sehari itu masuk akal biar barang impianmu seharga Rp ${targetValNum.toLocaleString("id-ID")} bisa kebeli secara sehat. Apalagi ini kan masuk kategori "${jenisTarget}", nabung harian gini bagus banget buat ngetes apakah kamu beneran butuh barangnya atau cuma laper mata (impulsif) doang, biar nggak gampang ngutang.`;

  const options = [
    `Mau Lebih Cepat? Kamu bisa nabung lebih agresif jadi Rp ${(Math.round((suggestedDailySaving * 1.5) / 1000) * 1000).toLocaleString("id-ID")}/hari biar barangnya kebeli dalam ~${Math.round(suggestedDaysNeeded / 1.5)} hari aja.`,
    `Mau Lebih Santai? Turunin aja jadi Rp ${(Math.round((suggestedDailySaving * 0.7) / 1000) * 1000 || 5000).toLocaleString("id-ID")}/hari biar dompet nggak seret, tapi barangnya baru kebeli dalam ~${Math.round(suggestedDaysNeeded / 0.7)} hari ya.`,
    `Biar nggak gampang kepakai, masukin uang harianmu ke celengan fisik atau fitur kunci saldo di dompet digitalmu tiap malam.`
  ];

  return { status, badgeClass, message, lifestyleCut, reason, options };
}

export function analyzeMonthlySavings(
  surplus: number,
  suggestedMonthlySaving: number,
  suggestedMonthsNeeded: number,
  targetValNum: number,
  income: number
): MonthlyAnalysis {
  let status = "Pilihan Paling Pas";
  let badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  let message = "";

  if (surplus <= 0) {
    status = "Dompet Lagi Minus";
    badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    message = `Uang bulananmu lagi minus nih. Kalau kamu nekat nyisihin Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} sebulan, dompetmu bakal makin tekor. Mending tunda dulu atau kurang-kurangi pengeluaran yang nggak penting ya.`;
  } else {
    const monthlyPct = Math.round((suggestedMonthlySaving / surplus) * 100);
    if (monthlyPct <= 30) {
      status = "Pilihan Paling Pas";
      badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      message = `Ini pilihan paling direkomendasiin! Nabung Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} sebulan cuma kepakai dikit kok dari sisa uang bulananmu (sekitar ${monthlyPct}%). Sisa uang peganganmu masih tebal, ada Rp ${(surplus - suggestedMonthlySaving).toLocaleString("id-ID")}, jadi hidup tetap tenang.`;
    } else if (monthlyPct <= 75) {
      status = "Cukup Aman";
      badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      message = `Dompetmu masih aman kok! Nabung bulanan segini bakal makan sekitar ${monthlyPct}% dari sisa uang bulananmu. Tapi ingat, sisa uang cadanganmu tinggal Rp ${(surplus - suggestedMonthlySaving).toLocaleString("id-ID")}, jadi harus pintar-pintar atur pengeluaran jajan ya.`;
    } else if (monthlyPct <= 100) {
      status = "Mepet/Risiko Tinggi";
      badgeClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      message = `Waduh, dompetmu bakal kerasa seret dan mepet banget karena tabungan ini makan ${monthlyPct}% dari sisa uang bulananmu. Sisa uang buat pegangan darurat tinggal Rp ${(surplus - suggestedMonthlySaving).toLocaleString("id-ID")} doang.`;
    } else {
      status = "Beban Berlebih (Minus)";
      badgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      message = `Aduh, nabung Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} sebulan itu kegedean buat dompetmu sekarang (lebih sekitar ${monthlyPct}%). Kamu bakal nomok/minus Rp ${(suggestedMonthlySaving - surplus).toLocaleString("id-ID")} tiap bulan. Daripada nanti pusing utang ke mana-mana, mending potong uang jajanmu dulu ya.`;
    }
  }

  const monthlyPctIncome = income > 0 ? Math.round((suggestedMonthlySaving / income) * 100) : 10;
  const reason = `Nabung Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} sebulan itu setara ${monthlyPctIncome}% dari total pendapatanmu. Angka ini pas banget biar kamu bisa beli barang seharga Rp ${targetValNum.toLocaleString("id-ID")} secara tunai tanpa perlu pusing mikirin cicilan paylater yang bunganya mencekik.`;

  const options = [
    `Pakai Fitur Auto-Debet: Langsung potong Rp ${suggestedMonthlySaving.toLocaleString("id-ID")} otomatis dari rekening gajianmu di awal bulan biar uangnya nggak telanjur habis buat jajan.`,
    `Pakai Uang Kaget: Kalau dapat THR, bonus kerja, atau komisi proyek, langsung masukin sebagian besar ke tabungan ini biar barangnya bisa dibeli lebih cepat.`,
    `Lihat Opsi Lain: Kalau nunggu ~${suggestedMonthsNeeded} bulan kelamaan, cek opsi barang alternatif di bawah yang harganya lebih ramah kantong.`
  ];

  return { status, badgeClass, message, reason, options };
}

