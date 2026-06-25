import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildSavingPrompt } from "../../prompt";

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

    if (riwayat.opportunity_cost_investment || riwayat.opportunity_cost_saving) {
      return NextResponse.json({
        success: true,
        data: {
          investmentAlternative: riwayat.opportunity_cost_investment,
          savingAlternative: riwayat.opportunity_cost_saving
        }
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildSavingPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (!aiData || !aiData.opportunityCost) {
        throw new Error("Invalid structure from Gemini");
      }
    } catch (e) {
      console.error("Gemini failed for saving/opportunity cost, using fallback:", e);
      const cashPrice = Number(decision.hargaTarget);
      const futureInvestedVal = Math.round(cashPrice * 1.46);
      aiData = {
        opportunityCost: {
          investmentAlternative: `Jika uang Rp ${cashPrice.toLocaleString("id-ID")} ini dialokasikan ke investasi reksa dana dengan potensi return 8% per tahun, dalam 5 tahun nilainya bisa berkembang menjadi Rp ${futureInvestedVal.toLocaleString("id-ID")}, lho!`,
          savingAlternative: `Nominal ini juga sangat bagus jika ditabung secara rutin untuk memperkuat dana darurat demi menjaga ketahanan keuanganmu.`
        }
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        opportunity_cost_investment: aiData.opportunityCost.investmentAlternative,
        opportunity_cost_saving: aiData.opportunityCost.savingAlternative
      }
    });

    return NextResponse.json({
      success: true,
      data: aiData.opportunityCost
    });
  } catch (error) {
    console.error("Error in saving according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
