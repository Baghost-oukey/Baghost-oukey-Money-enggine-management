import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildSimulasiPrompt } from "../../prompt";

interface FinancingProvider {
  id: string;
  category: "KREDIT_BANK" | "PAYLATER" | "KREDIT_TOKO";
  name: string;
  monthlyInterestRate: number; // e.g. 2.95 (for 2.95%)
  adminFeeRate: number;        // e.g. 1.0 (for 1.0%)
  fixedAdminFee: number;       // e.g. 15000 (Rp 15.000)
  supportedTenors: number[];
}
const PROVIDERS_CONFIG: FinancingProvider[] = [
  // Kredit Bank
  {
    id: "bank-bca",
    category: "KREDIT_BANK",
    name: "Kredit Bank BCA",
    monthlyInterestRate: 0.95,
    adminFeeRate: 1.0,
    fixedAdminFee: 50000,
    supportedTenors: [6, 12]
  },
  // PayLater
  {
    id: "paylater-kredivo",
    category: "PAYLATER",
    name: "Kredivo PayLater",
    monthlyInterestRate: 2.95,
    adminFeeRate: 1.0,
    fixedAdminFee: 0,
    supportedTenors: [3, 6, 12]
  },
  {
    id: "paylater-shopee",
    category: "PAYLATER",
    name: "SPayLater",
    monthlyInterestRate: 2.95,
    adminFeeRate: 1.0,
    fixedAdminFee: 15000,
    supportedTenors: [3, 6, 12]
  },
  // Kredit Toko
  {
    id: "toko-homecredit",
    category: "KREDIT_TOKO",
    name: "Home Credit",
    monthlyInterestRate: 1.99,
    adminFeeRate: 2.0,
    fixedAdminFee: 199000,
    supportedTenors: [6, 12]
  }
];

interface SimulationResult {
  category: string;
  name: string;
  tenor: number;
  monthlyInstallment: number;
  totalPayment: number;
  totalInterest: number;
  totalExtraFees: number;
  costVariance: number;
  costVariancePct: number;
  installmentRatio: number;
  riskLevel: string;
  capacityClass: string;
  pros: string[];
  cons: string[];
}

function calculateFinancingOptions(
  targetPrice: number,
  monthlyIncome: number,
  kategoriBarang: "KEBUTUHAN" | "KEINGINAN"
): SimulationResult[] {
  const results: SimulationResult[] = [];
  const income = monthlyIncome || 100000;

  for (const prov of PROVIDERS_CONFIG) {
    for (const tenor of prov.supportedTenors) {
      const interestRate = prov.monthlyInterestRate / 100;
      const adminRate = prov.adminFeeRate / 100;

      const adminPct = Math.round(targetPrice * adminRate);
      const totalExtraFees = adminPct + prov.fixedAdminFee;
      const monthlyInterest = Math.round(targetPrice * interestRate);
      const totalInterest = monthlyInterest * tenor;

      const totalPayment = targetPrice + totalInterest + totalExtraFees;
      const monthlyInstallment = Math.round(totalPayment / tenor);

      const installmentRatio = Math.round((monthlyInstallment / income) * 100);

      // Capacity class evaluation
      let capacityClass = "Aman";
      if (installmentRatio < 15) capacityClass = "Sangat Aman";
      else if (installmentRatio <= 30) capacityClass = "Aman";
      else if (installmentRatio <= 40) capacityClass = "Perlu Pertimbangan";
      else if (installmentRatio <= 50) capacityClass = "Berisiko";
      else capacityClass = "Tidak Direkomendasikan";

      // Risk Assessment
      let riskLevel = "Sedang";
      if (installmentRatio > 45) {
        riskLevel = "Tinggi";
      } else if (installmentRatio > 30) {
        if (kategoriBarang === "KEINGINAN") {
          riskLevel = "Tinggi";
        } else {
          riskLevel = "Sedang";
        }
      } else {
        if (tenor > 12) {
          riskLevel = "Sedang";
        } else {
          riskLevel = "Rendah";
        }
      }

      // Cost Variance
      const costVariance = totalPayment - targetPrice;
      const costVariancePct = Math.round((costVariance / targetPrice) * 100);

      // Pros & Cons
      const pros: string[] = [];
      const cons: string[] = [];

      pros.push("Barang impianmu bisa langsung kamu bawa pulang hari ini juga!");
      if (prov.category === "KREDIT_BANK") {
        pros.push("Bunganya jauh lebih adem dan bersahabat dibanding pakai PayLater.");
        cons.push("Syarat dan berkasnya lumayan ribet dan butuh waktu buat disetujui.");
      } else if (prov.category === "PAYLATER") {
        pros.push("Praktis banget! Pengajuan cepat tanpa jaminan dan langsung aktif.");
        cons.push("Bunga bulanan dan biaya layanannya lumayan tinggi, bisa bikin kantong boncos kalau gak hati-hati.");
      } else if (prov.category === "KREDIT_TOKO") {
        pros.push("Bisa langsung diurus bareng kasir pas kamu lagi belanja.");
        cons.push("Ada biaya admin awal yang lumayan berasa di dompet.");
      }

      cons.push(`Kamu harus siap menyisihkan Rp ${monthlyInstallment.toLocaleString("id-ID")}/bulan selama ${tenor} bulan ke depan.`);
      if (costVariancePct > 15) {
        cons.push(`Jadinya jauh lebih mahal dibanding beli cash (kena tambahan biaya sekitar Rp ${costVariance.toLocaleString("id-ID")} atau ${costVariancePct}% dari harga asli).`);
      }

      results.push({
        category: prov.category,
        name: prov.name,
        tenor,
        monthlyInstallment,
        totalPayment,
        totalInterest,
        totalExtraFees,
        costVariance,
        costVariancePct,
        installmentRatio,
        riskLevel,
        capacityClass,
        pros,
        cons
      });
    }
  }

  return results;
}

function roundToRupiah(value: number, unit: "daily" | "weekly" | "monthly"): number {
  if (value <= 0) return 0;
  if (unit === "daily") {
    if (value < 5000) {
      return Math.round(value / 100) * 100;
    } else if (value < 15000) {
      return Math.round(value / 500) * 500;
    } else {
      return Math.round(value / 1000) * 1000;
    }
  }
  return Math.round(value / 1000) * 1000;
}

function runSavingStrategyEngine(
  targetPrice: number,
  monthlyBudget: number,
  targetDate: Date | null,
  kategori: "KEBUTUHAN" | "KEINGINAN",
  createdAt: Date
) {
  const targetValNum = targetPrice || 0;
  const monthlyIncome = monthlyBudget || 100000; // avoid 0

  // 1. Deadline Analyzer
  let daysRemaining = 180; // default 6 months
  if (targetDate) {
    const start = new Date(createdAt);
    const end = new Date(targetDate);
    const diffTime = end.getTime() - start.getTime();
    daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30.44));

  // 2. Capacity & Feasibility for original target (Agresif)
  const originalMonthlySaving = Math.round(targetValNum / monthsRemaining);
  const originalSavingsRatio = Math.round((originalMonthlySaving / monthlyIncome) * 100);

  let capacityClass = "Ideal";
  if (originalSavingsRatio <= 15) capacityClass = "Sangat Aman";
  else if (originalSavingsRatio <= 25) capacityClass = "Ideal";
  else if (originalSavingsRatio <= 35) capacityClass = "Layak";
  else if (originalSavingsRatio <= 50) capacityClass = "Agresif";
  else capacityClass = "Tidak Direkomendasikan";

  let feasibilityStatus = "Layak";
  let explanationAgresif = "";
  if (originalSavingsRatio <= 25) {
    if (kategori === "KEBUTUHAN") {
      feasibilityStatus = "Sangat Layak";
      explanationAgresif = "Aman banget kok buat disisihkan dari uang bulananmu!";
    } else {
      feasibilityStatus = "Layak";
      explanationAgresif = "Beban tabungannya tergolong aman buat barang keinginanmu.";
    }
  } else if (originalSavingsRatio <= 35) {
    if (kategori === "KEBUTUHAN") {
      feasibilityStatus = "Layak";
      explanationAgresif = "Barang ini memang penting untuk kebutuhanmu, tapi kamu harus sedikit berhemat ya.";
    } else {
      feasibilityStatus = "Perlu Penyesuaian";
      explanationAgresif = "Ini bakal lumayan memotong uang bulananmu, coba deh pertimbangkan buat perpanjang waktu nabungnya.";
    }
  } else if (originalSavingsRatio <= 50) {
    if (kategori === "KEBUTUHAN") {
      feasibilityStatus = "Perlu Penyesuaian";
      explanationAgresif = "Bebannya terasa lumayan berat buat uang bulananmu, padahal ini barang kebutuhan.";
    } else {
      feasibilityStatus = "Sulit Dicapai";
      explanationAgresif = "Nabung sebesar ini bakalan menyiksa keuangan jajan harianmu lho!";
    }
  } else {
    feasibilityStatus = "Tidak Direkomendasikan";
    explanationAgresif = "Nabungnya udah lewat dari setengah uang bulananmu, bahaya banget buat makan dan ongkos harian!";
  }

  // 3. Strategi Normal (Sesuai Target)
  const monthsSeimbang = monthsRemaining;
  const daysSeimbang = daysRemaining;
  const weeksSeimbang = weeksRemaining;

  const monthlySavingSeimbang = roundToRupiah(targetValNum / monthsSeimbang, "monthly");
  const weeklySavingSeimbang = roundToRupiah(targetValNum / weeksSeimbang, "weekly");
  const dailySavingSeimbang = roundToRupiah(targetValNum / daysSeimbang, "daily");
  const savingsRatioSeimbang = Math.round((monthlySavingSeimbang / monthlyIncome) * 100);

  // 4. Strategi Santai (Minim Risiko - Tenggat waktu dilonggarkan 50%)
  let monthsAman = Math.max(monthsRemaining + 2, Math.ceil(monthsRemaining * 1.5));
  monthsAman = Math.min(60, monthsAman); // cap at 5 years
  const daysAman = Math.max(daysRemaining + 60, Math.round(monthsAman * 30.44));
  const weeksAman = Math.max(weeksRemaining + 8, Math.ceil(daysAman / 7));

  const monthlySavingAman = roundToRupiah(targetValNum / monthsAman, "monthly");
  const weeklySavingAman = roundToRupiah(targetValNum / weeksAman, "weekly");
  const dailySavingAman = roundToRupiah(targetValNum / daysAman, "daily");
  const savingsRatioAman = Math.round((monthlySavingAman / monthlyIncome) * 100);

  // 5. Strategi Agresif (Target Cepat - Waktu dipotong setengahnya)
  const monthsAgresif = Math.max(1, Math.floor(monthsRemaining * 0.5));
  const daysAgresif = Math.max(15, Math.floor(daysRemaining * 0.5));
  const weeksAgresif = Math.max(2, Math.floor(weeksRemaining * 0.5));

  const monthlySavingAgresif = roundToRupiah(targetValNum / monthsAgresif, "monthly");
  const weeklySavingAgresif = roundToRupiah(targetValNum / weeksAgresif, "weekly");
  const dailySavingAgresif = roundToRupiah(targetValNum / daysAgresif, "daily");
  const savingsRatioAgresif = Math.round((monthlySavingAgresif / monthlyIncome) * 100);

  // 6. Determine recommended strategy
  let recommendedStrategy = "seimbang";
  let reasoning = "";
  if (originalSavingsRatio <= 25) {
    recommendedStrategy = "seimbang";
    reasoning = "Keuanganmu aman banget buat target ini! Kamu bisa pakai Strategi Normal (Sesuai Target) untuk mencapai target tepat waktu tanpa membebani jajan harian/bulananmu.";
  } else if (originalSavingsRatio <= 45) {
    recommendedStrategy = "seimbang";
    reasoning = "Uang tabungan harian/bulanan untuk mencapai target tepat waktu agak ketat. Strategi Normal (Sesuai Target) bisa dicoba dengan sedikit penghematan, atau beralih ke Strategi Santai agar lebih rileks.";
  } else {
    recommendedStrategy = "aman";
    reasoning = "Waduh Kak, target menabung tepat waktu terlalu berat buat kondisi uangmu saat ini. Sangat disarankan pakai Strategi Santai agar kebutuhan pokok/jajan harianmu tetap aman.";
  }

  return {
    savingStrategies: {
      aman: {
        key: "aman",
        label: "Strategi Santai (Minim Risiko)",
        targetMonths: monthsAman,
        targetDays: daysAman,
        dailySaving: dailySavingAman,
        weeklySaving: weeklySavingAman,
        monthlySaving: monthlySavingAman,
        savingsRatio: savingsRatioAman,
        difficulty: "Rendah",
        feasibility: "Sangat Layak",
        explanation: "Paling direkomendasikan untuk kestabilan keuangan jangka panjang. Waktu menabung dilonggarkan agar setoran harian/bulanan sangat ringan."
      },
      seimbang: {
        key: "seimbang",
        label: "Strategi Normal (Sesuai Target)",
        targetMonths: monthsSeimbang,
        targetDays: daysSeimbang,
        dailySaving: dailySavingSeimbang,
        weeklySaving: weeklySavingSeimbang,
        monthlySaving: monthlySavingSeimbang,
        savingsRatio: savingsRatioSeimbang,
        difficulty: originalSavingsRatio > 40 ? "Tinggi" : originalSavingsRatio > 25 ? "Sedang" : "Rendah",
        feasibility: originalSavingsRatio > 50 ? "Perlu Penyesuaian" : "Layak",
        explanation: "Menabung sesuai tenggat waktu target pilihanmu. Sangat cocok jika ingin mencapai barang impian tepat waktu."
      },
      agresif: {
        key: "agresif",
        label: "Strategi Agresif (Target Cepat)",
        targetMonths: monthsAgresif,
        targetDays: daysAgresif,
        dailySaving: dailySavingAgresif,
        weeklySaving: weeklySavingAgresif,
        monthlySaving: monthlySavingAgresif,
        savingsRatio: savingsRatioAgresif,
        difficulty: savingsRatioAgresif > 50 ? "Sangat Tinggi" : "Tinggi",
        feasibility: savingsRatioAgresif > 50 ? "Sangat Berat" : "Perlu Penyesuaian",
        explanation: "Menabung ekstra cepat dengan memotong waktu target menjadi setengahnya. Membutuhkan kedisiplinan dan penghematan ketat."
      }
    },
    recommendation: {
      recommendedStrategy,
      reasoning
    }
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const decisionId = searchParams.get("decisionId");
    if (!decisionId) {
      return NextResponse.json({ success: false, message: "decisionId is required" }, { status: 400 });
    }

    const decision = await prisma.keputusanBudget.findUnique({
      where: { id_keputusan: decisionId },
      include: {
        expenses: true,
        riwayat: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!decision || !decision.riwayat[0]) {
      return NextResponse.json({ success: false, message: "Decision not found" }, { status: 404 });
    }

    const riwayat = decision.riwayat[0];

    // Check DB cache
    if (riwayat.paylater_simulation) {
      const cachedSim = riwayat.paylater_simulation as any;
      if (!cachedSim.savingStrategies || !cachedSim.recommendation || !cachedSim.financingOptions) {
        // Backfill dynamic saving strategies & financing options for old cached records
        const computedSavings = runSavingStrategyEngine(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.tanggal_target,
          decision.kategori_belanja || "KEINGINAN",
          decision.createdAt
        );
        cachedSim.savingStrategies = computedSavings.savingStrategies;
        cachedSim.recommendation = computedSavings.recommendation;

        const computedFinancing = calculateFinancingOptions(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.kategori_belanja || "KEINGINAN"
        );
        cachedSim.financingOptions = computedFinancing;

        // Update DB cache
        await prisma.riwayatKeputusan.update({
          where: { id: riwayat.id },
          data: {
            paylater_simulation: cachedSim
          }
        });
      }
      return NextResponse.json({
        success: true,
        data: cachedSim
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildSimulasiPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (aiData && aiData.paylaterSimulation) {
        const sim = aiData.paylaterSimulation;
        if (typeof sim.cashPrice === "number") sim.cashPrice = Math.round(sim.cashPrice);
        if (typeof sim.paylaterPrice === "number") sim.paylaterPrice = Math.round(sim.paylaterPrice);
        if (typeof sim.adminFee === "number") sim.adminFee = Math.round(sim.adminFee);
        if (typeof sim.interestExpense === "number") sim.interestExpense = Math.round(sim.interestExpense);
        if (typeof sim.moneyWasted === "number") sim.moneyWasted = Math.round(sim.moneyWasted);
        if (Array.isArray(sim.plans)) {
          sim.plans = sim.plans.map((plan: any) => {
            if (plan) {
              if (typeof plan.monthlyInstallment === "number") plan.monthlyInstallment = Math.round(plan.monthlyInstallment);
              if (typeof plan.totalPrice === "number") plan.totalPrice = Math.round(plan.totalPrice);
              if (typeof plan.interestAmount === "number") plan.interestAmount = Math.round(plan.interestAmount);
              if (typeof plan.adminFee === "number") plan.adminFee = Math.round(plan.adminFee);
              if (typeof plan.moneyWasted === "number") plan.moneyWasted = Math.round(plan.moneyWasted);
            }
            return plan;
          });
        }

        // Programmatically compute dynamic saving options and financing options
        const computedSavings = runSavingStrategyEngine(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.tanggal_target,
          decision.kategori_belanja || "KEINGINAN",
          decision.createdAt
        );
        sim.savingStrategies = computedSavings.savingStrategies;
        sim.recommendation = computedSavings.recommendation;

        const computedFinancing = calculateFinancingOptions(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.kategori_belanja || "KEINGINAN"
        );
        sim.financingOptions = computedFinancing;
      } else {
        throw new Error("Invalid structure from Gemini");
      }
    } catch (e) {
      console.error("Gemini failed for paylater simulation, using fallback:", e);
      const cashPrice = Number(decision.hargaTarget);
      const adminRatePct = 1.0;
      const interestRatePct = 2.95;
      const adminFee = Math.round(cashPrice * (adminRatePct / 100));
      const interestExpense = Math.round(cashPrice * (interestRatePct / 100) * 12);
      const moneyWasted = adminFee + interestExpense;
      const paylaterPrice = cashPrice + moneyWasted;
      
      const plans = [3, 6, 12].map((tenor) => {
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
          moneyWasted: planWasted
        };
      });

      const computedSavings = runSavingStrategyEngine(
        cashPrice,
        Number(decision.keuanganmu),
        decision.tanggal_target,
        decision.kategori_belanja || "KEINGINAN",
        decision.createdAt
      );

      const computedFinancing = calculateFinancingOptions(
        cashPrice,
        Number(decision.keuanganmu),
        decision.kategori_belanja || "KEINGINAN"
      );

      aiData = {
        paylaterSimulation: {
          cashPrice,
          paylaterPrice,
          adminFee,
          interestExpense,
          moneyWasted,
          adminRatePct,
          interestRatePct,
          plans,
          savingStrategies: computedSavings.savingStrategies,
          recommendation: computedSavings.recommendation,
          financingOptions: computedFinancing,
          consequencesNote: `Beli pakai cicilan paylater buat "${decision.tujuan_membeli}" ini bakal ngurangin uang jajan/bulananmu secara konsisten tiap bulan. Pikir-pikir lagi ya, jangan sampai nyesel belakangan!`
        }
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        paylater_simulation: aiData.paylaterSimulation
      }
    });

    return NextResponse.json({
      success: true,
      data: aiData.paylaterSimulation
    });
  } catch (error) {
    console.error("Error in simulasi according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
