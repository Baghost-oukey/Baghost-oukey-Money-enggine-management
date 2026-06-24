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
  } = options;

  const isDeficit = remainingBudget < 0;
  const isUnrealistic = feasibilityRatio < 1.0;
  const isExtremeTarget = targetValNum >= Number(monthlyBudget) * 0.8;

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
    financialTrapWarning = `Waduh Kak, harga target belanja "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} hampir menghabiskan seluruh budget bulananmu yang sebesar Rp ${Number(monthlyBudget).toLocaleString("id-ID")}. Jika nekat dibeli langsung sekarang, kamu tidak akan memiliki uang tersisa untuk kebutuhan pokok sehari-hari (seperti makanan, kost, dan transportasi). Mending tunda dulu rencana ini dan alokasikan tabungannya secara bertahap dalam jangka panjang yang aman (misal 6-12 bulan) agar hidupmu lebih tenang dan bebas dari utang!`;
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
    financialTrapWarning,
    realityCheck: {
      isRealistic: !isUnrealistic && !isDeficit && !isExtremeTarget,
      impactDescription: isExtremeTarget
        ? `Aduh Kak, harga "${targetName}" (Rp ${targetValNum.toLocaleString("id-ID")}) itu gede banget dibanding uang bulananmu Rp ${Number(monthlyBudget).toLocaleString("id-ID")}. Kalau dipaksa beli sekarang, nanti kamu nggak bisa makan jajan atau bayar keperluan penting sekolah/kos harian lho.`
        : (isKebutuhan
          ? (isDeficit
            ? `Karena "${targetName}" adalah kebutuhan pokok pentingmu Kak, uang bulananmu yang lagi defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")} saat ini jadi tantangan utama. Tapi tenang, kita cari celah bareng-bareng ya biar barang ini bisa kebeli.`
            : isUnrealistic
            ? `Beli kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} sebenernya bisa banget diwujudkan! Cuma dengan uang saku bulananmu, butuh sekitar ${calculatedMonthsNeeded} bulan buat nabung santai sampai kekumpul. Kita atur ulang target waktunya biar enteng ya.`
            : `Kabar gembira Kak! Kebutuhan "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} ini aman banget dibeli secara cash menggunakan uang bulananmu dalam waktu sekitar ${monthsDiff} bulan.`)
          : (isDeficit
            ? `Aduh, uang bulananmu saat ini lagi defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Memaksakan diri membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} saat ini bisa bikin dompetmu makin tipis dan bikin pusing sendiri.`
            : isUnrealistic
            ? `Membeli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dalam waktu dekat rasanya kurang realistis dengan uang saku bulananmu sekarang. Kamu butuh waktu menabung sekitar ${calculatedMonthsNeeded} bulan secara disiplin. Santai aja, nggak usah buru-buru daripada nanti malah terjerat utang.`
            : `Rencana belanjamu aman dan realistis! Dengan menyisihkan uang dari budget bulananmu, kamu bisa bawa pulang "${targetName}" dalam waktu sekitar ${monthsDiff} bulan secara cash.`))
    },
    verdictOpinion: {
      title: isExtremeTarget
        ? "Pendapat Sahabatmu: Tunda Dulu, Amankan Kebutuhan Pokok! ⚠️"
        : (isWantAndEnoughMoney
          ? "Pendapat Sahabatmu: Pertimbangkan Kembali Yuk! 🤔"
          : decisionVerdict === "BOLEH_BELI"
          ? "Pendapat Sahabatmu: Boleh Banget Beli! 🎉"
          : decisionVerdict === "BELI_DENGAN_MENABUNG"
          ? "Pendapat Sahabatmu: Nabung Dulu Yuk! 💪"
          : decisionVerdict === "TUNDA"
          ? "Pendapat Sahabatmu: Kita Tunda Dulu Ya 🥺"
          : "Pendapat Sahabatmu: Mending Jangan Beli Dulu Deh 🙏"),
      explanation: isExtremeTarget
        ? `Nekat beli "${targetName}" seharga Rp ${targetValNum.toLocaleString("id-ID")} dengan uang bulananmu Rp ${Number(monthlyBudget).toLocaleString("id-ID")} bisa bikin kamu nggak punya pegangan uang sama sekali. Saran terbaikku, amankan dulu uang saku harianmu untuk makanan, transport, atau tugas sekolah. Tunda dulu belanjaan besar ini ya.`
        : (isWantAndEnoughMoney
          ? `Uang sakumu sebenarnya cukup banget buat beli "${targetName}" secara cash langsung. Tapi berhubung ini barang keinginan/hobi, coba pikirin lagi ya, apakah beneran penting sekarang atau cuma laper mata aja.`
          : isKebutuhan
          ? (decisionVerdict === "JANGAN_BELI"
            ? `Aduh Kak, walaupun "${targetName}" adalah kebutuhan penting, kondisi keuanganmu lagi nggak bersahabat atau ada risiko utang/judi. Lebih baik beresin dulu keuanganmu ya Kak, biar belinya berkah.`
            : decisionVerdict === "TUNDA"
            ? `Saran hangat dari sahabatmu, kita tunda dulu beli "${targetName}" beberapa bulan ya. Lebih tenang kalau kamu punya uang cadangan dulu dibanding memaksakan beli sekarang.`
            : decisionVerdict === "BELI_DENGAN_MENABUNG"
            ? `Dukung banget rencana ini Kak! Cara terbaik adalah mencicil tabungan bulanan secara konsisten dari budget bulananmu. Menabung secara tunai adalah solusi paling berkah dan aman dibanding terjerat paylater.`
            : `Wah, mantap! Uang bulananmu sehat banget dan siap buat beli kebutuhan pentingmu ini secara tunai tanpa ganggu kebutuhan harian. Silakan beli ya!`)
          : (decisionVerdict === "JANGAN_BELI"
            ? `Aku ngerti banget kamu pengen "${targetName}", tapi kalau kondisi keuangan lagi minus atau pakai pinjol/judi, itu bahaya banget buat kamu. Mending uangnya dipakai untuk hal penting dulu ya Kak!`
            : decisionVerdict === "TUNDA"
            ? `Mending ditunda dulu ya Kak. Uang bulananmu masih tipis banget sekarang. Khawatir nanti pas ada keperluan mendadak malah bingung nyari pinjaman.`
            : decisionVerdict === "BELI_DENGAN_MENABUNG"
            ? `Kamu boleh banget beli barang ini, tapi syaratnya harus sabar menabung tunai secara bertahap ya! Uang bulananmu bisa kamu sisihkan secara disiplin tanpa perlu mencicil pakai paylater.`
            : `Kondisi uangmu lagi asyik banget nih! Kebutuhan harian aman dan masih ada sisa lebih. Boleh banget kalau mau beli barang impianmu ini sekarang secara tunai!`))
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
      consequencesNote: `Jika kamu nekat mencicil, cicilan bulanan sebesar Rp ${monthlyDebtPayment.toLocaleString("id-ID")} akan menyerap sekitar ${debtImpactPct}% dari budget bulananmu setiap bulan. Hal ini merusak fleksibilitas finansial harianmu secara signifikan.`
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
        ? `Karena ini kebutuhan pentingmu Kak, budget bulanan yang sedang defisit saat ini menjadi tantangan. Tapi kita bisa atur pemotongan pos belanja non-esensial agar tabungan kebutuhan ini bisa segera terkumpul.`
        : `Anggaran bulananmu sedang defisit sebesar Rp ${Math.abs(remainingBudget).toLocaleString("id-ID")}. Pembelian "${targetName}" bernilai Rp ${targetValNum.toLocaleString("id-ID")} saat ini mustahil dilakukan secara tunai tanpa merusak stabilitas pengeluaran dasar.`)
      : isExtremeTarget
      ? `Pembelian "${targetName}" bernilai Rp ${targetValNum.toLocaleString("id-ID")} sangat riskan karena nominalnya setara atau melebihi seluruh gaji/budget bulananmu. Rencana ini memiliki probabilitas realisasi yang sangat rendah tanpa penyesuaian deadline jangka panjang.`
      : isUnrealistic
      ? (isKebutuhan
        ? `Membeli kebutuhan "${targetName}" membutuhkan sedikit kesabaran. Dengan budget bulananmu, kamu butuh menabung selama sekitar ${calculatedMonthsNeeded} bulan agar target ini tercapai secara sehat.`
        : `Membeli "${targetName}" kurang realistis dengan deadline ${monthsDiff} bulan. Dengan budget bulanan Rp ${Number(monthlyBudget).toLocaleString("id-ID")}/bulan, kamu butuh waktu setidaknya ${calculatedMonthsNeeded} bulan untuk menabung secara penuh, mengakibatkan keterlambatan ${delayMonths} bulan dari target asal.`)
      : `Rencana target "${targetName}" sangat realistis! Budget bulananmu sebesar Rp ${Number(monthlyBudget).toLocaleString("id-ID")} berada di atas kebutuhan tabungan ideal bulanan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan.`,
    healthScoreExplanation: isDeficit
      ? (isKebutuhan
        ? `Skor kesehatan rencana bernilai 30/100 karena kas bulananmu defisit. Meskipun ini kebutuhan penting, kita harus menutup defisit kas dulu agar kamu bisa menabung secara aman.`
        : `Skor kesehatan rencana berada pada level kritis 0/100 karena kamu mengalami defisit bulanan. Tidak ada ruang sisa dana untuk menabung, sehingga segala rencana belanja barang mewah sebaiknya dibatalkan dulu ya.`)
      : isExtremeTarget
      ? `Skor kesehatan rencana bernilai ${score}/100 karena target harga barang menyedot habis seluruh kapasitas bulananmu. Kamu harus menunda dan menjadwal ulang target waktu menabung agar kebutuhan harianmu tidak terganggu.`
      : isUnrealistic
      ? (isKebutuhan
        ? `Skor kesehatan rencana bernilai ${score}/100. Kebutuhan penting ini bisa kamu cicil tabungannya secara sabar dan kita sesuaikan target waktunya agar cash flow harianmu tetap aman.`
        : `Skor kesehatan rencana bernilai ${score}/100 karena kesenjangan finansial yang lebar. Budget bulananmu hanya Rp ${Number(monthlyBudget).toLocaleString("id-ID")}, sementara kamu memerlukan Rp ${Math.round(requiredMonthlySavings).toLocaleString("id-ID")} per bulan demi target tepat waktu.`)
      : `Skor kesehatan rencana bernilai ${score}/100 karena postur anggaran bulananmu berada dalam kondisi sehat. Kamu memiliki alokasi surplus dana yang memadai untuk menabung tanpa mengorbankan kebutuhan wajib harian.`,
    realMarketPrice: `Rp ${targetValNum.toLocaleString("id-ID")}`,
    priceComparisonNote: `Menggunakan nilai target Rp ${targetValNum.toLocaleString("id-ID")} yang diajukan sebagai estimasi harga dasar barang di pasar saat ini.`,
    alternativeSuggestions: fallbackAlternatives,
    budgetEvolution: [
      `Pengeluaran bulanan menyerap sekitar ${Math.round((totalExpenses / monthlyBudget) * 100)}% dari total budget bulananmu.`,
      `Sisa dana bulanan hanya mampu menutupi ${Math.round(feasibilityRatio * 100)}% dari porsi tabungan ideal bulanan yang dibutuhkan.`
    ],
    emergencyMode: {
      isActive: isDeficit || isUnrealistic || isExtremeTarget,
      strategy: isDeficit
        ? `Taktik Pemulihan: Hentikan segala belanja tersier dengan segera. Fokus pada pemangkasan pengeluaran non-esensial dan carilah tambahan pendapatan untuk menyeimbangkan arus kas bulananmu.`
        : isExtremeTarget
        ? `Taktik Penyelamatan: Jangan gunakan seluruh budget bulanan untuk target ini. Tunda rencana belanja, amankan kebutuhan pokok (makanan, tempat tinggal, transportasi), dan mulailah menabung dalam porsi kecil yang tidak mengganggu cash flow.`
        : isUnrealistic
        ? `Taktik Penyesuaian: Perpanjang batas waktu pencapaian targetmu menjadi minimal ${Math.ceil(Number(calculatedMonthsNeeded))} bulan. Ini akan menurunkan target tabungan bulanan menjadi setara budget bulananmu.`
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
