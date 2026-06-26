import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildTaktikPrompt } from "../../prompt";

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

    if (riwayat.emergency_mode_strategy || riwayat.sacrifice_transparency) {
      return NextResponse.json({
        success: true,
        data: {
          emergencyMode: {
            isActive: riwayat.emergency_mode_active,
            strategy: riwayat.emergency_mode_strategy
          },
          sacrificeTransparency: riwayat.sacrifice_transparency
        }
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildTaktikPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (!aiData || !aiData.emergencyMode || !Array.isArray(aiData.sacrificeTransparency)) {
        throw new Error("Invalid structure from Gemini");
      }

      // Round numbers in sacrificeTransparency
      aiData.sacrificeTransparency = aiData.sacrificeTransparency.map((item: any) => {
        if (item && typeof item.nominalToCut === "number") {
          item.nominalToCut = Math.round(item.nominalToCut);
        }
        return item;
      });
    } catch (e) {
      console.error("Gemini failed for taktik keuangan, using fallback:", e);
      const expenses = decision.expenses || [];
      const sacrifice = expenses.slice(0, 2).map((exp: any) => {
        const nominalToCut = Math.round(Number(exp.amount) * 0.2);
        return {
          item: exp.name,
          nominalToCut,
          reasons: [`Bisa dipotong dikit pos jajan ini buat dimasukin ke celengan targetmu!`]
        };
      });

      aiData = {
        emergencyMode: {
          isActive: true,
          strategy: "Yuk, kurangi tipis-tipis pengeluaran jajan harianmu dan langsung sisihkan buat nabung di awal bulan biar celengan cepat gemuk secara sehat!"
        },
        sacrificeTransparency: sacrifice.length > 0 ? sacrifice : [
          {
            item: "Uang Jajan",
            nominalToCut: 50000,
            reasons: ["Dikurangin dikit beli kopi atau boba kekiniannya ya, biar celengan targetmu cepat gemuk."]
          }
        ]
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        emergency_mode_active: aiData.emergencyMode.isActive,
        emergency_mode_strategy: aiData.emergencyMode.strategy,
        sacrifice_transparency: aiData.sacrificeTransparency
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        emergencyMode: aiData.emergencyMode,
        sacrificeTransparency: aiData.sacrificeTransparency
      }
    });
  } catch (error) {
    console.error("Error in taktik according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
