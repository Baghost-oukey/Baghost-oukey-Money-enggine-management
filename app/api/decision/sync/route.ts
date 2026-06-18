import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, decisionId, targetName, monthlySavingsRequired, sumberDana } = body;

    if (!userId || !decisionId || !targetName || !monthlySavingsRequired) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Get the user's latest budget plan
    const latestPlan = await prisma.budgetPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestPlan) {
      return NextResponse.json(
        { success: false, message: "Kamu belum memiliki anggaran bulanan di budgeting-system! Silakan buat anggaran bulanan terlebih dahulu." },
        { status: 404 }
      );
    }

    const monthlyBudget = Number(latestPlan.monthlyBudget);
    let recommendation: any = {};
    if (latestPlan.recommendation) {
      recommendation = typeof latestPlan.recommendation === "string"
        ? JSON.parse(latestPlan.recommendation)
        : latestPlan.recommendation;
    }

    const savingsRequired = Number(monthlySavingsRequired);

    // Determine target category type: debts (if Paylater/Pinjol) vs savings (otherwise)
    const isDebt = sumberDana === "Paylater/Kredit" || sumberDana === "Pinjaman Online";
    const categoryType = isDebt ? "debts" : "savings";
    const itemName = isDebt ? `Cicilan: ${targetName}` : `Target: ${targetName}`;

    // 1. Update the parent category structure (recommendation.savings or recommendation.debts)
    if (!recommendation[categoryType]) {
      recommendation[categoryType] = { percentage: 0, amount: 0, description: "", items: [] };
    }
    const categoryObj = recommendation[categoryType];
    categoryObj.items = Array.isArray(categoryObj.items) ? categoryObj.items : [];
    
    // Check if the item already exists in items to avoid duplicate syncs
    const exists = categoryObj.items.some((item: any) => item.name === itemName);
    if (exists) {
      return NextResponse.json(
        { success: false, message: `Target "${targetName}" sudah tersinkronisasi sebelumnya di anggaran bulanan.` },
        { status: 400 }
      );
    }

    // Add new item
    categoryObj.items.push({ name: itemName, amount: savingsRequired });
    categoryObj.amount = categoryObj.items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    categoryObj.percentage = monthlyBudget > 0 ? (categoryObj.amount / monthlyBudget) * 100 : 0;

    // 2. Update the categories array
    if (Array.isArray(recommendation.categories)) {
      const catIndex = recommendation.categories.findIndex((c: any) => c.type === categoryType);
      if (catIndex > -1) {
        const cat = recommendation.categories[catIndex];
        cat.items = Array.isArray(cat.items) ? cat.items : [];
        cat.items.push({ name: itemName, amount: savingsRequired });
        cat.amount = cat.items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
        cat.percentage = monthlyBudget > 0 ? (cat.amount / monthlyBudget) * 100 : 0;
      }
    }

    // Save the updated recommendation back to database
    await prisma.budgetPlan.update({
      where: { id: latestPlan.id },
      data: {
        recommendation: recommendation, // Prisma parses object to JSON automatically
      },
    });

    // Also update decision status to TERSINKRONISASI and save sync details
    await prisma.decisionAnalysis.update({
      where: { id: decisionId },
      data: {
        status: "TERSINKRONISASI",
        decisionName: targetName,
        decisionCost: savingsRequired,
        decisionReason: `Tersinkron ke budget bulanan sebagai ${isDebt ? "Cicilan Hutang" : "Tabungan Target"}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Berhasil mensinkronisasikan "${targetName}" sebesar Rp ${savingsRequired.toLocaleString("id-ID")}/bulan ke anggaran bulanan Anda.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error syncing decision to budget plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat mensinkronkan anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
