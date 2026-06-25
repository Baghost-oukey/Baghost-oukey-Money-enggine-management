import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildSimulasiPrompt } from "../../prompt";

function calculateDynamicSavingOptions(
  targetPrice: number,
  monthlyBudget: number,
  keterangan: string
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
    // Pelajar: targets are small, pocket-money scale
    dailySantai = 5000;
    dailyKonsisten = 10000;
    dailyAgresif = 20000;
  } else {
    // Worker: scale targets up based on monthly salary
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

  // Scale down if target price is very cheap
  if (targetValNum < dailyAgresif) {
    dailyAgresif = Math.min(dailyAgresif, targetValNum);
    dailyKonsisten = Math.min(dailyKonsisten, Math.round((targetValNum * 0.5) / 1000) * 1000 || 1000);
    dailySantai = Math.min(dailySantai, Math.round((targetValNum * 0.25) / 1000) * 1000 || 1000);

    if (dailyKonsisten >= dailyAgresif) {
      dailyKonsisten = Math.max(1000, Math.round(dailyAgresif * 0.6 / 1000) * 1000);
    }
    if (dailySantai >= dailyKonsisten) {
      dailySantai = Math.max(1000, Math.round(dailyKonsisten * 0.5 / 1000) * 1000);
    }
  }

  const options = [
    { label: isStudent ? "Opsi Santai (Uang Jajan)" : "Opsi Santai", dailySaving: dailySantai },
    { label: isStudent ? "Opsi Konsisten (Nabung Ortus)" : "Opsi Konsisten", dailySaving: dailyKonsisten },
    { label: isStudent ? "Opsi Agresif (Uang Saku Ketat)" : "Opsi Agresif", dailySaving: dailyAgresif },
  ];

  return options.map((opt) => {
    const daysNeeded = Math.ceil(targetValNum / opt.dailySaving);
    const monthsNeeded = Math.ceil(daysNeeded / 30);
    return {
      label: opt.label,
      dailySaving: opt.dailySaving,
      daysNeeded,
      monthsNeeded,
    };
  });
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
      if (!cachedSim.savingOptions) {
        // Backfill savingOptions dynamically for old cached records
        cachedSim.savingOptions = calculateDynamicSavingOptions(
          Number(decision.hargaTarget),
          Number(decision.keuanganmu),
          decision.keterangan || ""
        );
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

        // Validate or compute savingOptions if Gemini did not return it
        if (!Array.isArray(sim.savingOptions) || sim.savingOptions.length === 0) {
          sim.savingOptions = calculateDynamicSavingOptions(
            Number(decision.hargaTarget),
            Number(decision.keuanganmu),
            decision.keterangan || ""
          );
        } else {
          sim.savingOptions = sim.savingOptions.map((opt: any) => {
            if (opt) {
              if (typeof opt.dailySaving === "number") opt.dailySaving = Math.round(opt.dailySaving);
              if (typeof opt.daysNeeded === "number") opt.daysNeeded = Math.round(opt.daysNeeded);
              if (typeof opt.monthsNeeded === "number") opt.monthsNeeded = Math.round(opt.monthsNeeded);
            }
            return opt;
          });
        }
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

      const fallbackSavingOptions = calculateDynamicSavingOptions(
        cashPrice,
        Number(decision.keuanganmu),
        decision.keterangan || ""
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
          savingOptions: fallbackSavingOptions,
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
