import { NextResponse } from "next/server";
import { createGoalAndSyncExpenses, getUserGoals, getLatestUserDecision } from "./service";

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
    if (!targetName || !targetName.trim()) {
      return NextResponse.json(
        { success: false, message: "Target Goal name is required." },
        { status: 400 }
      );
    }
    if (targetValue === undefined || isNaN(Number(targetValue))) {
      return NextResponse.json(
        { success: false, message: "Valid Target value is required." },
        { status: 400 }
      );
    }
    if (monthlyBudget === undefined || isNaN(Number(monthlyBudget))) {
      return NextResponse.json(
        { success: false, message: "Valid Monthly budget is required." },
        { status: 400 }
      );
    }

    const goal = await createGoalAndSyncExpenses({
      userId,
      decisionId,
      targetName: targetName.trim(),
      targetValue: Number(targetValue),
      monthlyBudget: Number(monthlyBudget),
      expenses: Array.isArray(expenses) ? expenses : [],
      targetDate,
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
