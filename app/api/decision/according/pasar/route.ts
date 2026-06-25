import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callGemini, recursiveSanitizeStrings, cleanTargetName } from "../../utils";
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
    const cleanedTarget = cleanTargetName(decision.tujuan_membeli || "");

    // Check DB cache
    if (riwayat.real_market_price) {
      let suggestions = riwayat.alternative_suggestions as any;
      if (Array.isArray(suggestions)) {
        // Map old string suggestions to structured suggestions if they are strings
        suggestions = suggestions.map((item: any) => {
          if (typeof item === "string") {
            const match = item.match(/^(.*?)\s*\(Rp\s*([\d.]+)\)/i);
            if (match) {
              const name = match[1].trim();
              const price = Number(match[2].replace(/\./g, "")) || null;
              return { name, estimatedPrice: price };
            }
            return { name: item, estimatedPrice: null };
          }
          return item;
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          cleanedTarget,
          realMarketPrice: riwayat.real_market_price,
          priceComparisonNote: riwayat.price_comparison_note,
          alternativeSuggestions: suggestions
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
        realMarketPrice: `Harga pasar untuk "${cleanedTarget}" bervariasi bergantung pada merek dan spesifikasi.`,
        priceComparisonNote: `Ekspektasi harga Rp ${Number(decision.hargaTarget).toLocaleString("id-ID")} ini sebaiknya dibandingkan kembali dengan harga di e-commerce terpercaya untuk menghindari pemborosan.`,
        alternativeSuggestions: [
          { name: "ASUS Vivobook Go 14", estimatedPrice: 5800000 },
          { name: "Lenovo IdeaPad Slim 1", estimatedPrice: 4900000 },
          { name: "Acer Aspire Lite 14", estimatedPrice: 4500000 }
        ]
      };
    }

    aiData = recursiveSanitizeStrings(aiData);

    // Validate structured suggestions
    if (Array.isArray(aiData.alternativeSuggestions)) {
      aiData.alternativeSuggestions = aiData.alternativeSuggestions.map((item: any) => {
        if (item && typeof item.estimatedPrice === "number") {
          item.estimatedPrice = Math.round(item.estimatedPrice);
        }
        return item;
      });
    }

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
        cleanedTarget,
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
