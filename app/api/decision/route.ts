import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, monthlyBudget, targetName, targetValue, targetDate, expenses } = body;

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

    // Compute basic evaluation metrics for user decision analysis
    let score = 100;
    let riskLevel = "Rendah";
    let recommendation =
      "Rencana anggaran Anda sangat sehat. Selisih budget masih mencukupi target tabungan.";

    if (remainingBudget < 0) {
      score = 35;
      riskLevel = "Tinggi";
      recommendation =
        "Peringatan: Pengeluaran rutin Anda melebihi total budget bulanan. Disarankan untuk mengurangi pengeluaran non-esensial sesegera mungkin.";
    } else if (remainingBudget < Number(targetValue)) {
      score = 65;
      riskLevel = "Sedang";
      recommendation =
        "Rencana anggaran Anda cukup baik, namun sisa budget bulanan belum menutupi target finansial secara penuh. Butuh waktu lebih lama untuk mencapai target.";
    }

    // Save decision analysis and its nested expenses inside a transaction
    const decision = await prisma.decisionAnalysis.create({
      data: {
        userId,
        monthlyBudget: Number(monthlyBudget),
        targetName,
        targetValue: Number(targetValue || 0),
        targetDate: targetDate ? new Date(targetDate) : null,
        score,
        riskLevel,
        recommendation,
        status: "SELESAI",
        expenses: {
          create: parsedExpenses.map((exp: any) => ({
            name: exp.name,
            amount: Number(exp.amount),
          })),
        },
      },
      include: {
        expenses: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Analisis keputusan keuangan berhasil disimpan.",
        data: decision,
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
