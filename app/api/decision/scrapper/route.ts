import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

    let cleanQuery = query.trim().toLowerCase();
    
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

    const apiUrl = process.env.API_APIFY_TOKPED_SCRAPPER;
    if (!apiUrl) {
      return NextResponse.json({ success: false, message: "Scraper API URL is not configured in .env" }, { status: 500 });
    }

    // Call Apify scraper. Fetch 20 results so we have enough items to apply price filtering
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        keyword: cleanQuery,
        results_wanted: 20,
        max_pages: 1
      })
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

    // Filter items based on targetPrice if present to exclude accessories (cases, screen protectors, etc.)
    if (targetPrice > 0) {
      const minPrice = targetPrice * 0.25;
      const maxPrice = targetPrice * 1.75;
      const filtered = mapped.filter((item: any) => item.priceNumber >= minPrice && item.priceNumber <= maxPrice);
      
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
