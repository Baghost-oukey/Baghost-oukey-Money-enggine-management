import { NextResponse } from "next/server";
import { createGoalAndSyncExpenses, getUserGoals, getLatestUserDecision } from "./service";
import { prisma } from "@/lib/prisma";

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

    const goals = await getUserGoals(userId);
    const latestDecision = await getLatestUserDecision(userId);

    // Format Decimal types as numbers to be clean
    const formattedGoals = goals.map((g) => {
      let parsedPlan = null;
      if (g.description) {
        try {
          parsedPlan = JSON.parse(g.description);
        } catch (e) {
          console.error("Failed to parse plan description:", e);
        }
      }
      return {
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        plan: parsedPlan,
      };
    });

    let formattedDecision = null;
    if (latestDecision) {
      formattedDecision = {
        id: latestDecision.id_keputusan,
        monthlyBudget: Number(latestDecision.keuanganmu),
        targetName: latestDecision.tujuan_membeli,
        targetValue: Number(latestDecision.hargaTarget),
        targetDate: latestDecision.tanggal_target,
        targetBudget: Number(latestDecision.target_budget),
        expenses: latestDecision.expenses.map((e) => ({
          id: e.id,
          name: e.name,
          amount: Number(e.amount),
        })),
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        goals: formattedGoals,
        latestDecision: formattedDecision,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/goal-analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat mengambil data.",
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
      decisionId,
      targetName,
      targetValue,
      monthlyBudget,
      expenses,
      targetDate,
      requiredMonthlySavings,
    } = body;

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }
    if (!decisionId) {
      return NextResponse.json(
        { success: false, message: "Decision ID is required." },
        { status: 400 }
      );
    }

    // DB Fallback if optional properties are missing from the client call
    let finalTargetName = targetName;
    let finalTargetValue = targetValue;
    let finalMonthlyBudget = monthlyBudget;
    let finalExpenses = expenses;
    let finalTargetDate = targetDate;

    if (!finalTargetName || finalTargetValue === undefined || finalMonthlyBudget === undefined) {
      const decision = await prisma.keputusanBudget.findUnique({
        where: { id_keputusan: decisionId },
        include: { expenses: true },
      });

      if (!decision) {
        return NextResponse.json(
          { success: false, message: "Decision/KeputusanBudget not found in database." },
          { status: 404 }
        );
      }

      finalTargetName = finalTargetName || decision.tujuan_membeli;
      finalTargetValue = finalTargetValue !== undefined ? finalTargetValue : Number(decision.hargaTarget);
      finalMonthlyBudget = finalMonthlyBudget !== undefined ? finalMonthlyBudget : Number(decision.keuanganmu);
      finalExpenses = finalExpenses || decision.expenses.map(e => ({ name: e.name, amount: Number(e.amount) }));
      finalTargetDate = finalTargetDate || (decision.tanggal_target ? decision.tanggal_target.toISOString() : undefined);
    }

    // Secondary validation on fallback resolved values
    if (!finalTargetName || !finalTargetName.trim()) {
      return NextResponse.json(
        { success: false, message: "Target Goal name is required." },
        { status: 400 }
      );
    }
    if (finalTargetValue === undefined || isNaN(Number(finalTargetValue))) {
      return NextResponse.json(
        { success: false, message: "Valid Target value is required." },
        { status: 400 }
      );
    }
    if (finalMonthlyBudget === undefined || isNaN(Number(finalMonthlyBudget))) {
      return NextResponse.json(
        { success: false, message: "Valid Monthly budget is required." },
        { status: 400 }
      );
    }

    const goal = await createGoalAndSyncExpenses({
      userId,
      decisionId,
      targetName: finalTargetName.trim(),
      targetValue: Number(finalTargetValue),
      monthlyBudget: Number(finalMonthlyBudget),
      expenses: Array.isArray(finalExpenses) ? finalExpenses : [],
      targetDate: finalTargetDate,
      requiredMonthlySavings: requiredMonthlySavings !== undefined ? Number(requiredMonthlySavings) : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rencana target dan anggaran berhasil disimpan.",
        data: {
          ...goal,
          targetAmount: Number(goal.targetAmount),
          currentAmount: Number(goal.currentAmount),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/goal-analysis:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat menyimpan rencana.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
