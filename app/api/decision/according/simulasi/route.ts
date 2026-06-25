import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildSimulasiPrompt } from "../../prompt";

function getRecommendedAlternativePrice(
  targetName: string,
  monthlyBudget: number,
  isStudent: boolean,
  originalPrice: number
): { price: number; category: string } {
  const nameLower = (targetName || "").toLowerCase();
  let category = "barang alternatif";
  let price = monthlyBudget * 3;

  if (
    nameLower.includes("laptop") ||
    nameLower.includes("komputer") ||
    nameLower.includes("pc") ||
    nameLower.includes("macbook") ||
    nameLower.includes("asus") ||
    nameLower.includes("lenovo")
  ) {
    category = "laptop";
    price = isStudent ? 5000000 : 8000000;
  } else if (
    nameLower.includes("hp") ||
    nameLower.includes("phone") ||
    nameLower.includes("samsung") ||
    nameLower.includes("iphone") ||
    nameLower.includes("android") ||
    nameLower.includes("xiaomi") ||
    nameLower.includes("oppo")
  ) {
    category = "HP/smartphone";
    price = isStudent ? 2500000 : 4000000;
  } else if (
    nameLower.includes("motor") ||
    nameLower.includes("honda") ||
    nameLower.includes("yamaha") ||
    nameLower.includes("kendaraan") ||
    nameLower.includes("vespa")
  ) {
    category = "sepeda motor";
    price = isStudent ? 8000000 : 15000000;
  }

  // Ensure alternative price is indeed cheaper than original price
  if (price >= originalPrice) {
    price = Math.round((originalPrice * 0.4) / 100000) * 100000 || 1000000;
  }

  return { price, category };
}

function calculateDynamicSavingOptions(
  targetPrice: number,
  monthlyBudget: number,
  keterangan: string,
  targetName: string
) {
  const targetValNum = targetPrice;
  const noteLower = (keterangan || "").toLowerCase();

  // Detect if student or low income
  const isStudent =
    noteLower.includes("sekolah") ||
    noteLower.includes("pelajar") ||
    noteLower.includes("ortu") ||
    noteLower.includes("orang tua") ||
    noteLower.includes("kuliah") ||
    noteLower.includes("mahasiswa") ||
    noteLower.includes("jajan") ||
    noteLower.includes("saku") ||
    monthlyBudget < 1500000;

  let dailySantai = 15000;
  let dailyKonsisten = 30000;
  let dailyAgresif = 60000;

  if (isStudent) {
    dailySantai = 5000;
    dailyKonsisten = 10000;
    dailyAgresif = 20000;
  } else {
    if (monthlyBudget >= 10000000) {
      dailySantai = 30000;
      dailyKonsisten = 60000;
      dailyAgresif = 120000;
    } else if (monthlyBudget >= 5000000) {
      dailySantai = 20000;
      dailyKonsisten = 40000;
      dailyAgresif = 80000;
    }
  }

  // Check if original saving plan is unrealistic (exceeds 24 months under Opsi Agresif)
  const originalMonthsAgresif = Math.ceil(Math.ceil(targetValNum / dailyAgresif) / 30);
  const isTargetUnrealistic = originalMonthsAgresif > 24;

  let finalTargetPrice = targetValNum;
  let alternativeTargetPrice = 0;
  let alternativeCategory = "barang";
  let alternativeReason = "";

  if (isTargetUnrealistic) {
    const alt = getRecommendedAlternativePrice(targetName, monthlyBudget, isStudent, targetValNum);
    alternativeTargetPrice = alt.price;
    alternativeCategory = alt.category;
    finalTargetPrice = alt.price;
    alternativeReason = `Menabung untuk barang seharga Rp ${targetValNum.toLocaleString("id-ID")} dengan budget-mu saat ini memerlukan waktu menabung yang tidak realistis (lebih dari 2 tahun). Lebih baik lirik alternatif ${alt.category} seharga Rp ${alt.price.toLocaleString("id-ID")} yang bisa kamu capai dalam waktu wajar.`;
  }

  // Scale down if final target price is very cheap
  if (finalTargetPrice < dailyAgresif) {
    dailyAgresif = Math.min(dailyAgresif, finalTargetPrice);
    dailyKonsisten = Math.min(dailyKonsisten, Math.round((finalTargetPrice * 0.5) / 1000) * 1000 || 1000);
    dailySantai = Math.min(dailySantai, Math.round((finalTargetPrice * 0.25) / 1000) * 1000 || 1000);

    if (dailyKonsisten >= dailyAgresif) {
      dailyKonsisten = Math.max(1000, Math.round(dailyAgresif * 0.6 / 1000) * 1000);
    }
    if (dailySantai >= dailyKonsisten) {
      dailySantai = Math.max(1000, Math.round(dailyKonsisten * 0.5 / 1000) * 1000);
    }
  }

  const options = [
    { label: isStudent ? "Opsi Santai (Uang Jajan)" : "Opsi Santai", dailySaving: dailySantai },
    { label: isStudent ? "Opsi Konsisten (Nabung Biasa)" : "Opsi Konsisten", dailySaving: dailyKonsisten },
    { label: isStudent ? "Opsi Agresif (Uang Saku Ketat)" : "Opsi Agresif", dailySaving: dailyAgresif },
  ];

  const savingOptions = options.map((opt) => {
    const daysNeeded = Math.ceil(finalTargetPrice / opt.dailySaving);
    const monthsNeeded = Math.ceil(daysNeeded / 30);
    return {
      label: opt.label,
      dailySaving: opt.dailySaving,
      daysNeeded,
      monthsNeeded,
    };
  });

  return {
    savingOptions,
    isTargetUnrealistic,
    alternativeTargetPrice,
    alternativeCategory,
    alternativeReason
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
      if (!cachedSim.savingOptions || cachedSim.isTargetUnrealistic === undefined) {
        // Backfill dynamic savingOptions & alternative options for old cached records
        const computedSavings = calculateDynamicSavingOptions(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.keterangan || "",
          decision.tujuan_membeli || ""
        );
        cachedSim.savingOptions = computedSavings.savingOptions;
        cachedSim.isTargetUnrealistic = computedSavings.isTargetUnrealistic;
        cachedSim.alternativeTargetPrice = computedSavings.alternativeTargetPrice;
        cachedSim.alternativeCategory = computedSavings.alternativeCategory;
        cachedSim.alternativeReason = computedSavings.alternativeReason;

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

        // Programmatically compute dynamic saving options to guarantee mathematical accuracy & custom limits
        const computedSavings = calculateDynamicSavingOptions(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.keterangan || "",
          decision.tujuan_membeli || ""
        );
        sim.savingOptions = computedSavings.savingOptions;
        sim.isTargetUnrealistic = computedSavings.isTargetUnrealistic;
        sim.alternativeTargetPrice = computedSavings.alternativeTargetPrice;
        sim.alternativeCategory = computedSavings.alternativeCategory;
        sim.alternativeReason = computedSavings.alternativeReason;
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

      const computedSavings = calculateDynamicSavingOptions(
        cashPrice,
        Number(decision.keuanganmu),
        decision.keterangan || "",
        decision.tujuan_membeli || ""
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
          savingOptions: computedSavings.savingOptions,
          isTargetUnrealistic: computedSavings.isTargetUnrealistic,
          alternativeTargetPrice: computedSavings.alternativeTargetPrice,
          alternativeCategory: computedSavings.alternativeCategory,
          alternativeReason: computedSavings.alternativeReason,
          consequencesNote: `Membeli cicilan paylater "${decision.tujuan_membeli}" ini bakal menyedot sebagian dari budget bulananmu secara konsisten, jadi pertimbangkan baik-baik ya!`
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
