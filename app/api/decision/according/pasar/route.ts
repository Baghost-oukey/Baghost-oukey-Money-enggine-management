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
      
      const targetLower = cleanedTarget.toLowerCase();
      const curhatLower = (decision.keterangan || "").toLowerCase();
      const combinedLower = `${targetLower} ${curhatLower}`;
      const targetVal = Number(decision.hargaTarget) || 0;
      
      let fallbackAlts: { name: string; estimatedPrice: number }[] = [];
      const effectiveTargetVal = targetVal || (Number(decision.keuanganmu) * 0.8) || 3000000;

      // Calculate monthly surplus (buffer)
      const expenses = decision.expenses || [];
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
      const remainingBudget = Number(decision.keuanganmu) - totalExpenses;

      // Calculate months remaining
      let monthsDiff = 1;
      if (decision.tanggal_target) {
        const currentDate = new Date(decision.createdAt);
        const tDate = new Date(decision.tanggal_target);
        const diffTime = tDate.getTime() - currentDate.getTime();
        const daysDiff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        monthsDiff = Math.max(1, Math.ceil(daysDiff / 30.44));
      }

      // Always recommend a cheaper alternative at approximately 50% of the original target price
      const altTargetVal = effectiveTargetVal * 0.5;

      const isPhone = targetLower.includes("hp") || 
                      targetLower.includes("phone") || 
                      targetLower.includes("samsung") || 
                      targetLower.includes("iphone") || 
                      targetLower.includes("android") || 
                      targetLower.includes("xiaomi") || 
                      targetLower.includes("oppo") || 
                      targetLower.includes("smartphone") ||
                      targetLower.includes("gawai") ||
                      curhatLower.includes("beli hp") ||
                      curhatLower.includes("beli handphone") ||
                      curhatLower.includes("beli smartphone");

      const isLaptop = targetLower.includes("laptop") || 
                       targetLower.includes("komputer") || 
                       targetLower.includes("pc") || 
                       targetLower.includes("macbook") || 
                       targetLower.includes("asus") || 
                       targetLower.includes("lenovo") ||
                       targetLower.includes("notebook") ||
                       curhatLower.includes("beli laptop") ||
                       curhatLower.includes("beli notebook");

      const isMotor = targetLower.includes("motor") || 
                      targetLower.includes("honda") || 
                      targetLower.includes("yamaha") || 
                      targetLower.includes("kendaraan") ||
                      targetLower.includes("vespa") ||
                      curhatLower.includes("beli motor");

      let realMarketPrice = `Harga pasar untuk "${cleanedTarget}" bervariasi bergantung pada merek, tipe, dan spesifikasi terbarunya.`;
      let priceComparisonNote = `Ekspektasi harga Rp ${effectiveTargetVal.toLocaleString("id-ID")} ini sebaiknya dibandingkan kembali dengan harga di e-commerce terpercaya untuk menghindari pemborosan.`;

      if (isPhone) {
        const isPhoto = combinedLower.includes("foto") || 
                        combinedLower.includes("kamera") || 
                        combinedLower.includes("photo") || 
                        combinedLower.includes("camera") || 
                        combinedLower.includes("videografi") || 
                        combinedLower.includes("ngonten") || 
                        combinedLower.includes("content") ||
                        combinedLower.includes("lensa");
                        
        const isGaming = combinedLower.includes("game") || 
                         combinedLower.includes("gaming") || 
                         combinedLower.includes("play") || 
                         combinedLower.includes("pubg") || 
                         combinedLower.includes("mlbb") || 
                         combinedLower.includes("genshin") ||
                         combinedLower.includes("lancar");

        if (isPhoto) {
          realMarketPrice = `Untuk HP yang fokus di kamera/foto-foto, harga pasaran terbarunya berkisar antara Rp 3.000.000 (mid-range stabil) sampai Rp 12.000.000+ untuk kelas flagship dengan sensor OIS dan lensa premium.`;
          priceComparisonNote = `Dengan uang bulanan Rp ${Number(decision.keuanganmu).toLocaleString("id-ID")} dan target ekspektasimu sebesar Rp ${effectiveTargetVal.toLocaleString("id-ID")}, rekomendasi HP di bawah ini punya kamera yang cakep banget di kelasnya untuk langsung dipasang di media sosialmu!`;

          if (altTargetVal >= 12000000) {
            fallbackAlts = [
              { name: "iPhone 13", estimatedPrice: 10500000 },
              { name: "Samsung Galaxy S23", estimatedPrice: 11500000 },
              { name: "Xiaomi 14", estimatedPrice: 11999000 }
            ];
          } else if (altTargetVal >= 7000000) {
            fallbackAlts = [
              { name: "Samsung Galaxy S23 FE", estimatedPrice: 8500000 },
              { name: "Vivo V40 5G", estimatedPrice: 6499000 },
              { name: "Xiaomi 13T", estimatedPrice: 6200000 }
            ];
          } else if (altTargetVal >= 4000000) {
            fallbackAlts = [
              { name: "Redmi Note 13 Pro+ 5G", estimatedPrice: 5400000 },
              { name: "Samsung Galaxy A55 5G", estimatedPrice: 5799000 },
              { name: "Oppo Reno 11 5G", estimatedPrice: 4900000 }
            ];
          } else {
            fallbackAlts = [
              { name: "Redmi Note 13 Pro 4G", estimatedPrice: 3499000 },
              { name: "Samsung Galaxy A25 5G", estimatedPrice: 3500000 },
              { name: "Vivo Y100 5G", estimatedPrice: 3200000 }
            ];
          }
        } else if (isGaming) {
          realMarketPrice = `Untuk HP gaming dengan performa lancar rata kanan, harga pasarannya berkisar antara Rp 3.000.000 (chipset Mediatek Dimensity/Snapdragon mid-range) hingga Rp 13.000.000+ untuk flagship gaming terdedikasi.`;
          priceComparisonNote = `Target budgetmu Rp ${effectiveTargetVal.toLocaleString("id-ID")} udah cukup oke kok. Alternatif di bawah ini punya performa chipset kencang dan sistem pendingin handal biar pas main game nggak drop FPS.`;

          if (altTargetVal >= 12000000) {
            fallbackAlts = [
              { name: "iQOO 12", estimatedPrice: 10999000 },
              { name: "ASUS ROG Phone 8", estimatedPrice: 12999000 },
              { name: "Samsung Galaxy S23 Ultra", estimatedPrice: 14500000 }
            ];
          } else if (altTargetVal >= 7000000) {
            fallbackAlts = [
              { name: "POCO F6 Pro", estimatedPrice: 8499000 },
              { name: "Xiaomi 14T", estimatedPrice: 7999000 },
              { name: "iQOO Z9 Pro", estimatedPrice: 6000000 }
            ];
          } else if (altTargetVal >= 4000000) {
            fallbackAlts = [
              { name: "POCO F6", estimatedPrice: 5499000 },
              { name: "POCO X6 Pro 5G", estimatedPrice: 4800000 },
              { name: "Infinix GT 20 Pro", estimatedPrice: 4299000 }
            ];
          } else {
            fallbackAlts = [
              { name: "POCO X6 5G", estimatedPrice: 3699000 },
              { name: "iQOO Z9", estimatedPrice: 3900000 },
              { name: "Redmi Note 13 5G", estimatedPrice: 2999000 }
            ];
          }
        } else {
          realMarketPrice = `Untuk HP standar harian, rentang harga pasarannya berkisar antara Rp 1.500.000 untuk kelas entry-level hingga Rp 14.000.000+ untuk seri flagship terbaru.`;
          priceComparisonNote = `Ekspektasimu sebesar Rp ${effectiveTargetVal.toLocaleString("id-ID")} sangat fleksibel. Rekomendasi di bawah ini merupakan opsi terbaik yang seimbang antara baterai, layar, dan performa harian.`;

          if (altTargetVal >= 12000000) {
            fallbackAlts = [
              { name: "iPhone 15", estimatedPrice: 14200000 },
              { name: "Samsung Galaxy S24", estimatedPrice: 13999000 },
              { name: "OnePlus 12", estimatedPrice: 12500000 }
            ];
          } else if (altTargetVal >= 7000000) {
            fallbackAlts = [
              { name: "Samsung Galaxy A55 5G", estimatedPrice: 5799000 },
              { name: "Xiaomi 13T", estimatedPrice: 6200000 },
              { name: "Vivo V40 Lite", estimatedPrice: 4299000 }
            ];
          } else if (altTargetVal >= 4000000) {
            fallbackAlts = [
              { name: "Samsung Galaxy A35 5G", estimatedPrice: 4800000 },
              { name: "Redmi Note 13 Pro 5G", estimatedPrice: 4300000 },
              { name: "Oppo Reno 11 F", estimatedPrice: 4399000 }
            ];
          } else if (altTargetVal >= 2000000) {
            fallbackAlts = [
              { name: "Redmi Note 13 4G", estimatedPrice: 2399000 },
              { name: "Samsung Galaxy A15 LTE", estimatedPrice: 2699000 },
              { name: "Oppo A60", estimatedPrice: 2499000 }
            ];
          } else {
            fallbackAlts = [
              { name: "Redmi 13C", estimatedPrice: 1499000 },
              { name: "Samsung Galaxy A05", estimatedPrice: 1299000 },
              { name: "Infinix Smart 8", estimatedPrice: 1099000 }
            ];
          }
        }
      } else if (isLaptop) {
        const isGamingOrDesign = combinedLower.includes("game") || 
                                 combinedLower.includes("gaming") || 
                                 combinedLower.includes("desain") || 
                                 combinedLower.includes("editing") || 
                                 combinedLower.includes("render") || 
                                 combinedLower.includes("video") || 
                                 combinedLower.includes("coding") ||
                                 combinedLower.includes("program") ||
                                 combinedLower.includes("grafis");

        if (isGamingOrDesign) {
          realMarketPrice = `Untuk laptop gaming/desain grafis dengan kartu grafis terdedikasi (RTX/RX), harga pasarannya berkisar antara Rp 9.000.000 untuk entry-level hingga Rp 25.000.000+ untuk spesifikasi super kencang.`;
          priceComparisonNote = `Dengan target Rp ${effectiveTargetVal.toLocaleString("id-ID")}, rekomendasi laptop di bawah ini siap mendukung kebutuhan render video, desain grafis, coding, maupun bermain game berat dengan lancar.`;

          if (altTargetVal >= 18000000) {
            fallbackAlts = [
              { name: "ASUS ROG Zephyrus G14", estimatedPrice: 22000000 },
              { name: "Lenovo Legion Slim 5", estimatedPrice: 19500000 },
              { name: "HP Omen 16", estimatedPrice: 18900000 }
            ];
          } else if (altTargetVal >= 12000000) {
            fallbackAlts = [
              { name: "ASUS TUF Gaming A15", estimatedPrice: 13500000 },
              { name: "Lenovo LOQ 15", estimatedPrice: 12500000 },
              { name: "Acer Nitro V 15", estimatedPrice: 10999000 }
            ];
          } else if (altTargetVal >= 7000000) {
            fallbackAlts = [
              { name: "MSI Thin A15", estimatedPrice: 9500000 },
              { name: "HP Victus 15", estimatedPrice: 10500000 },
              { name: "Lenovo IdeaPad Gaming 3", estimatedPrice: 8900000 }
            ];
          } else {
            fallbackAlts = [
              { name: "Acer Aspire 3 Spin", estimatedPrice: 5800000 },
              { name: "Lenovo IdeaPad Slim 3", estimatedPrice: 6200000 },
              { name: "ASUS Vivobook Go 14", estimatedPrice: 5999000 }
            ];
          }
        } else {
          realMarketPrice = `Untuk laptop harian (kerja/belajar/sekolah), harga pasarannya berkisar antara Rp 4.000.000 untuk kelas entry-level hingga Rp 20.000.000+ untuk seri ultrabook premium/MacBook.`;
          priceComparisonNote = `Target Rp ${effectiveTargetVal.toLocaleString("id-ID")} ini sudah sangat pas untuk laptop kerja harian. Opsi di bawah ini menawarkan performa stabil, baterai awet, dan body yang ringkas.`;

          if (altTargetVal >= 18000000) {
            fallbackAlts = [
              { name: "MacBook Pro M3", estimatedPrice: 23000000 },
              { name: "Dell XPS 13", estimatedPrice: 21000000 },
              { name: "ThinkPad X1 Carbon", estimatedPrice: 24500000 }
            ];
          } else if (altTargetVal >= 12000000) {
            fallbackAlts = [
              { name: "MacBook Air M2", estimatedPrice: 15500000 },
              { name: "ASUS Zenbook 14 OLED", estimatedPrice: 13999000 },
              { name: "HP Pavilion Plus 14", estimatedPrice: 12500000 }
            ];
          } else if (altTargetVal >= 7000000) {
            fallbackAlts = [
              { name: "Lenovo IdeaPad Slim 5", estimatedPrice: 8900000 },
              { name: "ASUS Vivobook 14", estimatedPrice: 7899000 },
              { name: "Huawei MateBook D14", estimatedPrice: 7499000 }
            ];
          } else if (altTargetVal >= 4000000) {
            fallbackAlts = [
              { name: "Lenovo IdeaPad Slim 1", estimatedPrice: 4900000 },
              { name: "Acer Aspire Lite 14", estimatedPrice: 4500000 },
              { name: "Axioo MyBook Hype 5", estimatedPrice: 4200000 }
            ];
          } else {
            fallbackAlts = [
              { name: "Axioo MyBook Hype 1", estimatedPrice: 2899000 },
              { name: "Advan Soulmate", estimatedPrice: 2499000 },
              { name: "Zyrex Sky 232", estimatedPrice: 1999000 }
            ];
          }
        }
      } else if (isMotor) {
        realMarketPrice = `Untuk sepeda motor baru, harga pasarannya berkisar antara Rp 18.000.000 untuk tipe matic entry-level hingga Rp 35.000.000+ untuk kelas matic bongsor 150cc ke atas.`;
        priceComparisonNote = `Dengan target Rp ${effectiveTargetVal.toLocaleString("id-ID")}, rekomendasi motor di bawah ini menawarkan kenyamanan, keiritan bahan bakar, dan perawatan yang mudah.`;

        if (altTargetVal >= 25000000) {
          fallbackAlts = [
            { name: "Honda Vario 160", estimatedPrice: 27000000 },
            { name: "Yamaha Aerox 155", estimatedPrice: 28000000 },
            { name: "Honda PCX 160", estimatedPrice: 32000000 }
          ];
        } else if (altTargetVal >= 15000000) {
          fallbackAlts = [
            { name: "Honda Beat Baru", estimatedPrice: 18500000 },
            { name: "Yamaha Gear 125", estimatedPrice: 18200000 },
            { name: "Honda Scoopy", estimatedPrice: 22000000 }
          ];
        } else {
          fallbackAlts = [
            { name: "Honda Beat Bekas", estimatedPrice: 9000000 },
            { name: "Yamaha Mio Bekas", estimatedPrice: 7000000 },
            { name: "Honda Vario 125 Bekas", estimatedPrice: 12000000 }
          ];
        }
      } else {
        if (effectiveTargetVal > 10000000) {
          fallbackAlts = [
            { name: `Versi Bekas dari ${cleanedTarget}`, estimatedPrice: Math.round(altTargetVal) },
            { name: `Sewa/Rental ${cleanedTarget}`, estimatedPrice: Math.round(altTargetVal * 0.2) }
          ];
        } else if (effectiveTargetVal > 2000000) {
          fallbackAlts = [
            { name: `Merk Lokal untuk ${cleanedTarget}`, estimatedPrice: Math.round(altTargetVal * 1.2) },
            { name: `Versi Bekas untuk ${cleanedTarget}`, estimatedPrice: Math.round(altTargetVal) }
          ];
        } else {
          fallbackAlts = [
            { name: `Tunda Pembelian ${cleanedTarget}`, estimatedPrice: 0 }
          ];
        }
      }

      aiData = {
        realMarketPrice,
        priceComparisonNote,
        alternativeSuggestions: fallbackAlts
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
