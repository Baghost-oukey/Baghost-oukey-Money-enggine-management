import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  detectSumberDana,
  recursiveSanitizeStrings,
  formatDecisionResponse,
} from "./utils";
import { buildSystemPrompt } from "./prompt";
import { runLocalFallbackAnalysis } from "./fallback";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    // Get the user's latest budget plan to pre-fill the form inputs
    const latestPlan = await prisma.rencanaBudget.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        riwayat: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            categories: {
              include: {
                items: true,
              },
            },
          },
        },
      },
    });

    if (!latestPlan) {
      return NextResponse.json({
        success: true,
        data: {
          monthlyBudget: 0,
          expenses: [],
        },
      });
    }

    const expenses: { name: string; amount: number }[] = [];
    const latestRiwayat = latestPlan.riwayat?.[0] || null;

    if (latestRiwayat) {
      for (const cat of latestRiwayat.categories) {
        for (const item of cat.items) {
          const nameLower = item.name.toLowerCase();
          // Filter out synced targets/cicilan to avoid duplicate double-counting in decision analysis
          if (!nameLower.startsWith("target:") && !nameLower.startsWith("cicilan:")) {
            expenses.push({
              name: item.name,
              amount: Number(item.amount),
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        monthlyBudget: Number(latestPlan.bulanan),
        expenses,
      },
    });
  } catch (error) {
    console.error("Error fetching budget for decision analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat memuat data anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      monthlyBudget,
      targetName,
      targetValue,
      targetDate,
      jenisTarget,
      keteranganTambahan,
      expenses,
    } = body;
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
    const requiredMonthlySavings =
      monthsDiff > 0 ? targetValNum / monthsDiff : targetValNum;
    const feasibilityRatio =
      requiredMonthlySavings > 0 ? remainingBudget / requiredMonthlySavings : 1.0;

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable is not defined");
      return NextResponse.json(
        {
          success: false,
          message: "Konfigurasi API AI tidak ditemukan. Silakan hubungi admin.",
        },
        { status: 500 }
      );
    }

    // Build the AI Prompt modularly
    const systemPrompt = buildSystemPrompt({
      currentDateStr,
      monthlyBudget: Number(monthlyBudget),
      targetName,
      jenisTarget: jenisTarget || "Keinginan",
      targetValNum,
      targetDate,
      daysDiff,
      monthsDiff,
      sumberDana,
      requiredMonthlySavings,
      remainingBudget,
      feasibilityRatio,
      keteranganTambahan: keteranganTambahan || "",
      totalExpenses,
      parsedExpenses,
    });

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

      // Clean up decimals in AI response
      if (aiAnalysis) {
        if (typeof aiAnalysis.score === "number") {
          aiAnalysis.score = Math.round(aiAnalysis.score);
        }
        if (aiAnalysis.paylaterSimulation) {
          const sim = aiAnalysis.paylaterSimulation;
          if (typeof sim.cashPrice === "number") sim.cashPrice = Math.round(sim.cashPrice);
          if (typeof sim.paylaterPrice === "number")
            sim.paylaterPrice = Math.round(sim.paylaterPrice);
          if (typeof sim.adminFee === "number") sim.adminFee = Math.round(sim.adminFee);
          if (typeof sim.interestExpense === "number")
            sim.interestExpense = Math.round(sim.interestExpense);
          if (typeof sim.moneyWasted === "number") sim.moneyWasted = Math.round(sim.moneyWasted);
          if (Array.isArray(sim.plans)) {
            sim.plans = sim.plans.map((plan: any) => {
              if (plan) {
                if (typeof plan.monthlyInstallment === "number")
                  plan.monthlyInstallment = Math.round(plan.monthlyInstallment);
                if (typeof plan.totalPrice === "number")
                  plan.totalPrice = Math.round(plan.totalPrice);
                if (typeof plan.interestAmount === "number")
                  plan.interestAmount = Math.round(plan.interestAmount);
                if (typeof plan.adminFee === "number") plan.adminFee = Math.round(plan.adminFee);
                if (typeof plan.moneyWasted === "number")
                  plan.moneyWasted = Math.round(plan.moneyWasted);
              }
              return plan;
            });
          }
        }
        if (Array.isArray(aiAnalysis.sacrificeTransparency)) {
          aiAnalysis.sacrificeTransparency = aiAnalysis.sacrificeTransparency.map(
            (item: any) => {
              if (item && typeof item.nominalToCut === "number") {
                item.nominalToCut = Math.round(item.nominalToCut);
              }
              return item;
            }
          );
        }
      }
    } catch (apiError) {
      console.error("Gemini API error, falling back to local analysis:", apiError);

      aiAnalysis = runLocalFallbackAnalysis({
        targetName,
        targetValNum,
        monthlyBudget: Number(monthlyBudget),
        remainingBudget,
        monthsDiff,
        daysDiff,
        requiredMonthlySavings,
        feasibilityRatio,
        jenisTarget: jenisTarget || "Keinginan",
        sumberDana,
        keteranganTambahan: keteranganTambahan || "",
        totalExpenses,
        parsedExpenses,
      });
    }

    if (aiAnalysis) {
      aiAnalysis.sumberDana = sumberDana;
      aiAnalysis.jenisTarget = jenisTarget;
      aiAnalysis = recursiveSanitizeStrings(aiAnalysis);
    }

    // Save decision analysis and its nested expenses inside a transaction using the new relational schema
    const decision = await prisma.keputusanBudget.create({
      data: {
        userId,
        keuanganmu: Number(monthlyBudget),
        tujuan_membeli: targetName,
        hargaTarget: Number(targetValue || 0),
        kategori_belanja: jenisTarget === "Kebutuhan" ? "KEBUTUHAN" : "KEINGINAN",
        target_budget: aiAnalysis.targetSavingsPerMonth
          ? Number(aiAnalysis.targetSavingsPerMonth)
          : 0,
        tanggal_target: targetDate ? new Date(targetDate) : null,
        keterangan: keteranganTambahan || "",
        expenses: {
          create: parsedExpenses.map((exp: any) => ({
            name: exp.name,
            amount: Number(exp.amount),
          })),
        },
        riwayat: {
          create: {
            status: "SELESAI",
            score: aiAnalysis.score,
            risk_level: aiAnalysis.riskLevel,
            decision_verdict: aiAnalysis.decisionVerdict,
            reality_check_is_realistic: aiAnalysis.realityCheck?.isRealistic,
            reality_check_impact: aiAnalysis.realityCheck?.impactDescription,
            verdict_opinion_title: aiAnalysis.verdictOpinion?.title,
            verdict_opinion_explanation: aiAnalysis.verdictOpinion?.explanation,
            financial_trap_warning: aiAnalysis.financialTrapWarning,
            paylater_simulation: aiAnalysis.paylaterSimulation || null,
            opportunity_cost_investment: aiAnalysis.opportunityCost?.investmentAlternative,
            opportunity_cost_saving: aiAnalysis.opportunityCost?.savingAlternative,
            psychological_insight: aiAnalysis.psychologicalInsight || null,
            real_market_price: aiAnalysis.realMarketPrice,
            price_comparison_note: aiAnalysis.priceComparisonNote,
            alternative_suggestions: aiAnalysis.alternativeSuggestions || null,
            budget_evolution: aiAnalysis.budgetEvolution || null,
            emergency_mode_active: aiAnalysis.emergencyMode?.isActive,
            emergency_mode_strategy: aiAnalysis.emergencyMode?.strategy,
            sacrifice_transparency: aiAnalysis.sacrificeTransparency || null,
            ai_recommendation_text: aiAnalysis.aiRecommendationText,
            sumber_dana: aiAnalysis.sumberDana || sumberDana,
            jenis_target: aiAnalysis.jenisTarget || jenisTarget,
          },
        },
      },
      include: {
        expenses: true,
        riwayat: true,
      },
    });

    const responseData = formatDecisionResponse(decision);

    return NextResponse.json(
      {
        success: true,
        message: "Analisis keputusan keuangan berhasil disimpan.",
        data: responseData,
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
