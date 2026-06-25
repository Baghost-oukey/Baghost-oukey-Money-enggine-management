import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildInsightPrompt } from "../../prompt";

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

    if (riwayat.psychological_insight) {
      return NextResponse.json({
        success: true,
        data: riwayat.psychological_insight
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildInsightPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (!aiData || !aiData.psychologicalInsight) {
        throw new Error("Invalid structure from Gemini");
      }
    } catch (e) {
      console.error("Gemini failed for psychological insight, using fallback:", e);
      aiData = {
        psychologicalInsight: {
          purchaseDriver: decision.kategori_belanja === "KEBUTUHAN" ? "Kebutuhan Nyata" : "FOMO/Gengsi",
          motivationText: "Fokuslah pada ketenangan finansial jangka panjang daripada kepuasan memiliki barang baru secara instan ya, Kak.",
          riskText: "Pembelian yang impulsif atau didasari motif gengsi dapat memicu kecemasan dan stres cicilan bulanan yang melelahkan."
        }
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        psychological_insight: aiData.psychologicalInsight
      }
    });

    return NextResponse.json({
      success: true,
      data: aiData.psychologicalInsight
    });
  } catch (error) {
    console.error("Error in insight according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
