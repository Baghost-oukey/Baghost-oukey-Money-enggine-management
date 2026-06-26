import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildSaranPrompt } from "../../prompt";

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

    if (riwayat.ai_recommendation_text) {
      return NextResponse.json({
        success: true,
        data: {
          aiRecommendationText: riwayat.ai_recommendation_text
        }
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildSaranPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (!aiData || typeof aiData.aiRecommendationText !== "string") {
        throw new Error("Invalid structure from Gemini");
      }
    } catch (e) {
      console.error("Gemini failed for final recommendation text, using fallback:", e);
      let text = "";
      if (riwayat.decision_verdict === "BOLEH_BELI") {
        text = `Wah, selamat ya! Keuanganmu lagi sehat banget buat beli "${decision.tujuan_membeli}". Langsung dibeli cash aja, nikmati hasil kerja kerasmu dengan tenang!`;
      } else if (riwayat.decision_verdict === "BELI_DENGAN_MENABUNG") {
        text = `Tenang, kamu pasti bisa kok dapetin "${decision.tujuan_membeli}" ini dengan aman! Yuk, mulai nabung tipis-tipis secara konsisten. Semangat ya, dikit-dikit lama-lama jadi bukit!`;
      } else {
        text = `Mendingan kita tunda dulu ya rencana beli "${decision.tujuan_membeli}" ini. Yuk, fokus sehatin keuangan jajan dan kebutuhan pokok harianmu dulu biar pikiranmu lebih tenang!`;
      }
      aiData = {
        aiRecommendationText: text
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        ai_recommendation_text: aiData.aiRecommendationText
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        aiRecommendationText: aiData.aiRecommendationText
      }
    });
  } catch (error) {
    console.error("Error in saran according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
