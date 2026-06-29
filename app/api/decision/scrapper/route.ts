import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cleanTargetName } from "../utils";

// File-based cache path to protect Apify $5 limit
const cacheDirectory = path.join(process.cwd(), "app", "api", "decision", "scrapper");
const cacheFilePath = path.join(cacheDirectory, "cache.json");

function getCachedResults(cacheKey: string): any[] | null {
  try {
    if (!fs.existsSync(cacheFilePath)) return null;
    const raw = fs.readFileSync(cacheFilePath, "utf8");
    const data = JSON.parse(raw);
    const normalizedKey = cacheKey.toLowerCase().trim();
    return data[normalizedKey] || null;
  } catch (e) {
    console.error("Failed to read from cache file:", e);
    return null;
  }
}

function setCachedResults(cacheKey: string, results: any[]) {
  try {
    if (!fs.existsSync(cacheDirectory)) {
      fs.mkdirSync(cacheDirectory, { recursive: true });
    }
    let data: any = {};
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, "utf8");
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        data = {};
      }
    }
    const normalizedKey = cacheKey.toLowerCase().trim();
    data[normalizedKey] = results;
    fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write scraper cache:", e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const priceStr = searchParams.get("price");

    if (!query) {
      return NextResponse.json({ success: false, message: "Query parameter 'q' is required" }, { status: 400 });
    }

    let cleanQuery = cleanTargetName(query).trim().toLowerCase();
    if (!cleanQuery) {
      cleanQuery = query.trim().toLowerCase();
    }
    
    // Map common broad abbreviations to avoid accessories & noise
    if (cleanQuery === "hp") {
      cleanQuery = "smartphone";
    } else if (cleanQuery === "notebook") {
      cleanQuery = "laptop";
    }

    const targetPrice = priceStr ? Number(priceStr) : 0;
    const cacheKey = targetPrice > 0 ? `${cleanQuery}_${targetPrice}` : cleanQuery;

    // Check persistent cache first
    const cached = getCachedResults(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    const cleanQueryLower = cleanQuery.toLowerCase();
    const isVehicleQuery = cleanQueryLower.includes("motor") || cleanQueryLower.includes("mio") || cleanQueryLower.includes("beat") || cleanQueryLower.includes("vario") || cleanQueryLower.includes("scoopy") || cleanQueryLower.includes("aerox") || cleanQueryLower.includes("nmax") || cleanQueryLower.includes("vespa") || cleanQueryLower.includes("jupiter") || cleanQueryLower.includes("supra") || cleanQueryLower.includes("yamaha") || cleanQueryLower.includes("honda");

    let searchQuery = cleanQuery;
    if (isVehicleQuery && !cleanQueryLower.includes("bekas") && !cleanQueryLower.includes("second") && !cleanQueryLower.includes("motor")) {
      searchQuery = `${cleanQuery} motor bekas`;
    }

    const payload: any = {
      results_wanted: 20,
      max_pages: 1
    };

    if (targetPrice > 0) {
      let minPrice = Math.round(targetPrice * 0.8);
      let maxPrice = Math.round(targetPrice * 1.2);
      
      if (isVehicleQuery && targetPrice < 5000000) {
        // Vehicles cannot be bought whole under 4M, so expand range to find actual cheap second-hand motorcycles
        minPrice = 3000000;
        maxPrice = 10000000;
      }
      
      payload.startUrl = `https://www.tokopedia.com/search?q=${encodeURIComponent(searchQuery)}&pmin=${minPrice}&pmax=${maxPrice}`;
    } else {
      payload.keyword = searchQuery;
    }

    const apiUrl = process.env.API_APIFY_TOKPED_SCRAPPER;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "Scraper API URL is not configured in .env" }, { status: 500 });
    }

    // Call Apify scraper.
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Apify scraper API returned error:", errText);
      return NextResponse.json({ success: false, message: "Apify actor failed to run" }, { status: res.status });
    }

    const items = await res.json();
    
    // Map items to clean representation using Apify's correct field names
    const mapItems = (arr: any[]) => {
      return arr.map((item: any) => {
        let priceNum = item.price_number || 0;
        if (!priceNum) {
          if (typeof item.price === "number") {
            priceNum = item.price;
          } else if (item.price) {
            priceNum = Number((item.price).toString().replace(/[^0-9]/g, "")) || 0;
          }
        }

        return {
          title: item.title || item.name || "",
          price: item.price || (priceNum ? `Rp ${priceNum.toLocaleString("id-ID")}` : ""),
          priceNumber: priceNum,
          url: item.product_url || item.url || item.productUrl || "",
          imageUrl: item.image_url || item.imageUrl || item.image || "",
          rating: item.rating || null,
          shopName: item.shop_name || item.shopName || item.merchant || "",
          location: item.shop_city || item.location || item.shopLocation || ""
        };
      });
    };

    let mapped = mapItems(items || []);

    // Filter out parts and accessories to avoid showing rims/shocks instead of actual vehicles/electronics
    const isPhoneQuery = cleanQueryLower.includes("hp") || cleanQueryLower.includes("phone") || cleanQueryLower.includes("samsung") || cleanQueryLower.includes("iphone") || cleanQueryLower.includes("android") || cleanQueryLower.includes("xiaomi") || cleanQueryLower.includes("oppo") || cleanQueryLower.includes("vivo") || cleanQueryLower.includes("redmi");
    const isLaptopQuery = cleanQueryLower.includes("laptop") || cleanQueryLower.includes("macbook") || cleanQueryLower.includes("asus") || cleanQueryLower.includes("lenovo") || cleanQueryLower.includes("acer") || cleanQueryLower.includes("notebook");

    let filteredMapped = mapped.filter((item: any) => {
      const titleLower = item.title.toLowerCase();
      
      // Exclude list for vehicles
      if (isVehicleQuery) {
        const vehicleExclusions = ["velg", "pelek", "shockbreaker", "shock", "knalpot", "ban ", " ban", "stang", "striping", "stiker", "sticker", "piringan", "disc", "helm", "spion", "rantai", "gir", "gear", "tromol", "master rem", "kaliper", "karburator", "cover", "mika", "reflektor", "suku cadang", "sparepart", "aksesoris", "part", "variasi", "kabel", "piston", "mesin"];
        if (vehicleExclusions.some(kw => titleLower.includes(kw))) {
          return false;
        }
      }
      
      // Exclude list for phones
      if (isPhoneQuery) {
        const phoneExclusions = ["casing", "case", "charger", "kabel", "tempered glass", "anti gores", "lcd", "baterai", "battery", "dus", "box", "adaptor", "housing", "gantungan", "dummy"];
        if (phoneExclusions.some(kw => titleLower.includes(kw))) {
          return false;
        }
      }

      // Exclude list for laptops
      if (isLaptopQuery) {
        const laptopExclusions = ["charger", "adaptor", "baterai", "battery", "ram", "ssd", "keyboard", "mouse", "tas", "sleeve", "lcd", "screen", "sparepart", "motherboard", "fan", "cooler"];
        if (laptopExclusions.some(kw => titleLower.includes(kw))) {
          return false;
        }
      }

      return true;
    });

    if (filteredMapped.length > 0) {
      mapped = filteredMapped;
    }

    // Filter items based on targetPrice if present to exclude accessories (cases, screen protectors, etc.)
    if (targetPrice > 0) {
      let minFilterPrice = targetPrice * 0.8;
      let maxFilterPrice = targetPrice * 1.2;

      if (isVehicleQuery && targetPrice < 5000000) {
        minFilterPrice = 3000000;
        maxFilterPrice = 10000000;
      }

      const filtered = mapped.filter((item: any) => item.priceNumber >= minFilterPrice && item.priceNumber <= maxFilterPrice);
      
      // Fallback: If price filtering removes all results, bypass filter so we don't return an empty grid
      if (filtered.length > 0) {
        mapped = filtered;
      }
    }

    // Keep top 4 items matching the search query and price range
    mapped = mapped.slice(0, 4);

    // Save to persistent cache
    setCachedResults(cacheKey, mapped);

    return NextResponse.json({
      success: true,
      data: mapped,
      cached: false
    });
  } catch (error) {
    console.error("Error in scrapper route:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
