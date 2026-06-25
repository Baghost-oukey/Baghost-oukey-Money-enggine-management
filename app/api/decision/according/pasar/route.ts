import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings } from "../../utils";
import { getDecisionBaseContext, buildPasarPrompt } from "../../prompt";

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

    if (riwayat.real_market_price) {
      return NextResponse.json({
        success: true,
        data: {
          realMarketPrice: riwayat.real_market_price,
          priceComparisonNote: riwayat.price_comparison_note,
          alternativeSuggestions: riwayat.alternative_suggestions
        }
      });
    }

    const baseContext = getDecisionBaseContext(decision, riwayat);
    const prompt = buildPasarPrompt(baseContext);

    let aiData: any;
    try {
      aiData = await callGemini(prompt);
      if (!aiData || typeof aiData.realMarketPrice !== "string") {
        throw new Error("Invalid structure from Gemini");
      }
    } catch (e) {
      console.error("Gemini failed for market price comparison, using fallback:", e);
      aiData = {
        realMarketPrice: `Harga pasar untuk "${decision.tujuan_membeli}" bervariasi bergantung pada merek dan spesifikasi.`,
        priceComparisonNote: `Ekspektasi harga Rp ${Number(decision.hargaTarget).toLocaleString("id-ID")} ini sebaiknya dibandingkan kembali dengan harga di e-commerce terpercaya untuk menghindari pemborosan.`,
        alternativeSuggestions: [
          "Cari versi second/bekas berkualitas untuk menghemat anggaran hingga 30-50%",
          "Pilih alternatif merk lain dengan spesifikasi mirip yang harganya lebih ramah di kantong"
        ]
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    await prisma.riwayatKeputusan.update({
      where: { id: riwayat.id },
      data: {
        real_market_price: aiData.realMarketPrice,
        price_comparison_note: aiData.priceComparisonNote,
        alternative_suggestions: aiData.alternativeSuggestions
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        realMarketPrice: aiData.realMarketPrice,
        priceComparisonNote: aiData.priceComparisonNote,
        alternativeSuggestions: aiData.alternativeSuggestions
      }
    });
  } catch (error) {
    console.error("Error in pasar according route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
