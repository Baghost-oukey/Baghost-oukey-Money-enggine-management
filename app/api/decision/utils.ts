export function detectSumberDana(text: string): string {
  if (!text) return "Nabung Cash";
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("judi") ||
    lowerText.includes("slot") ||
    lowerText.includes("gacor") ||
    lowerText.includes("jp") ||
    lowerText.includes("maxwin") ||
    lowerText.includes("taruhan") ||
    lowerText.includes("depo") ||
    lowerText.includes("zeus") ||
    lowerText.includes("spekulasi")
  ) {
    return "Hasil Judi / Spekulasi";
  }

  if (
    lowerText.includes("pinjol") ||
    lowerText.includes("pinjam online") ||
    lowerText.includes("cair cepat") ||
    lowerText.includes("dana cepat") ||
    lowerText.includes("rupiah cepat") ||
    lowerText.includes("adakami") ||
    lowerText.includes("kredivo") ||
    lowerText.includes("easycash") ||
    lowerText.includes("pinjaman online")
  ) {
    return "Pinjaman Online";
  }

  if (
    lowerText.includes("paylater") ||
    lowerText.includes("spaylater") ||
    lowerText.includes("gopaylater") ||
    lowerText.includes("cicil") ||
    lowerText.includes("kredit") ||
    lowerText.includes("cc") ||
    lowerText.includes("kartu kredit") ||
    lowerText.includes("tempo")
  ) {
    return "Paylater/Kredit";
  }

  if (
    lowerText.includes("tabungan") ||
    lowerText.includes("dana cadangan") ||
    lowerText.includes("simpanan") ||
    lowerText.includes("aktif") ||
    lowerText.includes("emas") ||
    lowerText.includes("reksa") ||
    lowerText.includes("saham") ||
    lowerText.includes("celengan")
  ) {
    return "Dana Cadangan";
  }

  return "Nabung Cash";
}

export function cleanRupiahInText(text: string): string {
  if (typeof text !== "string") return text;
  return text.replace(/(Rp\.?\s*)(\d{1,3}(?:\.\d{3})+)(,\d+)?/gi, (match, prefix, numStr) => {
    const numberValue = parseInt(numStr.replace(/\./g, ""), 10);
    if (isNaN(numberValue)) return match;
    const roundedValue = Math.round(numberValue / 1000) * 1000;
    return `${prefix}${roundedValue.toLocaleString("id-ID")}`;
  });
}

export function recursiveSanitizeStrings(obj: any): any {
  if (typeof obj === "string") {
    return cleanRupiahInText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveSanitizeStrings);
  }
  if (obj !== null && typeof obj === "object") {
    const sanitizedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = recursiveSanitizeStrings(obj[key]);
      }
    }
    return sanitizedObj;
  }
  return obj;
}

export function formatDecisionResponse(decision: any) {
  if (!decision) return null;
  const latestRiwayat = decision.riwayat?.[0] || null;

  let recommendation: any = null;
  if (latestRiwayat) {
    recommendation = {
      score: latestRiwayat.score,
      riskLevel: latestRiwayat.risk_level,
      decisionVerdict: latestRiwayat.decision_verdict,
      realityCheck: {
        isRealistic: latestRiwayat.reality_check_is_realistic,
        impactDescription: latestRiwayat.reality_check_impact
      },
      verdictOpinion: {
        title: latestRiwayat.verdict_opinion_title,
        explanation: latestRiwayat.verdict_opinion_explanation
      },
      financialTrapWarning: latestRiwayat.financial_trap_warning,
      paylaterSimulation: latestRiwayat.paylater_simulation,
      opportunityCost: {
        investmentAlternative: latestRiwayat.opportunity_cost_investment,
        savingAlternative: latestRiwayat.opportunity_cost_saving
      },
      psychologicalInsight: latestRiwayat.psychological_insight,
      realMarketPrice: latestRiwayat.real_market_price,
      priceComparisonNote: latestRiwayat.price_comparison_note,
      alternativeSuggestions: latestRiwayat.alternative_suggestions,
      budgetEvolution: latestRiwayat.budget_evolution,
      emergencyMode: {
        isActive: latestRiwayat.emergency_mode_active,
        strategy: latestRiwayat.emergency_mode_strategy
      },
      sacrificeTransparency: latestRiwayat.sacrifice_transparency,
      aiRecommendationText: latestRiwayat.ai_recommendation_text,
      sumberDana: latestRiwayat.sumber_dana,
      jenisTarget: latestRiwayat.jenis_target
    };
  }

  return {
    id: decision.id_keputusan,
    userId: decision.userId,
    monthlyBudget: Number(decision.keuanganmu),
    targetName: decision.tujuan_membeli,
    targetValue: Number(decision.hargaTarget),
    targetDate: decision.tanggal_target,
    decisionName: decision.tujuan_membeli,
    decisionCost: Number(decision.target_budget),
    decisionReason: latestRiwayat?.ai_recommendation_text || "",
    status: latestRiwayat?.status || "SELESAI",
    score: latestRiwayat?.score || 0,
    riskLevel: latestRiwayat?.risk_level || "",
    recommendation,
    jenisTarget: decision.kategori_belanja === "KEBUTUHAN" ? "kebutuhan" : "keinginan",
    keteranganTambahan: decision.keterangan,
    createdAt: decision.createdAt,
    expenses: (decision.expenses || []).map((exp: any) => ({
      id: exp.id,
      decisionId: exp.id_keputusan,
      name: exp.name,
      amount: Number(exp.amount),
      createdAt: exp.createdAt
    }))
  };
}

export async function callGemini(prompt: string): Promise<any> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not defined");
  }
  const apiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!apiResponse.ok) {
    throw new Error(`Gemini API returned status ${apiResponse.status}`);
  }

  const apiData = await apiResponse.json();
  const responseText = apiData.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!responseText) {
    throw new Error("Empty response from Gemini API");
  }

  const cleanedText = responseText.replace(/^\s*```json\s*|```\s*$/g, "").trim();
  return JSON.parse(cleanedText);
}

export function cleanTargetName(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();
  
  // Strip common Indonesian prefix phrases for buying items
  cleaned = cleaned.replace(/^(?:saya|aku|kami|kita)\s+(?:pengen|mau|ingin|butuh|perlu)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:saya|aku|kami|kita)\s+(?:pengen|mau|ingin|butuh|perlu)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:pengen|mau|ingin|butuh|perlu)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:beli|membeli|belanja|butuh|perlu)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:untuk|buat)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.trim();
  
  // Strip surrounding quotes if any
  cleaned = cleaned.replace(/^['"“‘](.*)['"”’]$/, "$1").trim();

  return cleaned || name.trim();
}


