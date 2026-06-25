"use client";

import React, { useEffect, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlternativeSuggestion {
  name: string;
  estimatedPrice: number | null;
}

interface KabarHargaPasarProps {
  decisionId: string;
  target?: string;
  targetValue?: string;
}

interface ScraperItem {
  title: string;
  price: string;
  priceNumber: number;
  url: string;
  imageUrl: string;
  rating: number | null;
  shopName: string;
  location: string;
}

const cleanTargetName = (name: string): string => {
  if (!name) return "";
  let cleaned = name.trim();
  cleaned = cleaned.replace(/^(?:saya|aku|kami|kita)\s+(?:pengen|mau|ingin|butuh|perlu)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:saya|aku|kami|kita)\s+(?:pengen|mau|ingin|butuh|perlu)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:pengen|mau|ingin|butuh|perlu)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:beli|membeli|belanja|butuh|perlu)\s+/gi, "");
  cleaned = cleaned.replace(/^(?:untuk|buat)\s+(?:beli|membeli|belanja)\s+/gi, "");
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^['"“‘](.*)['"”’]$/, "$1").trim();
  return cleaned || name.trim();
};

function ProductGrid({ items, loading }: { items: ScraperItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-6 space-x-2 bg-muted/10 border border-muted/20 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        <span className="text-[10px] text-muted-foreground">Mencari produk terbaik di Tokopedia...</span>
      </div>
    );
  }
  if (!items || items.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic text-center py-2">Produk tidak ditemukan di Tokopedia.</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block p-2 border rounded-lg bg-background/50 hover:bg-background/80 hover:border-violet-300 transition-all flex flex-col justify-between h-full hover:shadow-sm"
        >
          <div className="space-y-1.5 flex-1 flex flex-col">
            {item.imageUrl ? (
              <div className="aspect-square w-full rounded overflow-hidden bg-muted flex items-center justify-center relative">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                />
              </div>
            ) : (
              <div className="aspect-square w-full rounded bg-muted flex items-center justify-center text-muted-foreground text-[10px]">
                No Image
              </div>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <span className="text-[10px] font-medium text-foreground line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
                {item.title}
              </span>
              <div className="mt-1">
                <span className="text-[11px] font-extrabold text-foreground block">
                  {item.price}
                </span>
                {item.rating && (
                  <span className="text-[9px] text-amber-500 font-bold block mt-0.5">
                    ⭐ {item.rating}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-muted/10 text-[9px] text-muted-foreground flex justify-between items-center leading-none">
            <span className="truncate max-w-[50px]">{item.shopName}</span>
            <span className="truncate max-w-[50px]">{item.location}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export function KabarHargaPasar({
  decisionId,
  target,
  targetValue,
}: KabarHargaPasarProps) {
  const [loading, setLoading] = useState(true);
  const [cleanedTarget, setCleanedTarget] = useState("");
  const [marketData, setMarketData] = useState({
    realMarketPrice: "",
    priceComparisonNote: "",
    alternativeSuggestions: [] as AlternativeSuggestion[]
  });

  const [targetProducts, setTargetProducts] = useState<ScraperItem[]>([]);
  const [loadingTargetProducts, setLoadingTargetProducts] = useState(false);

  const [expandedAltIndex, setExpandedAltIndex] = useState<number | null>(null);
  const [altProducts, setAltProducts] = useState<Record<number, ScraperItem[]>>({});
  const [loadingAltIndex, setLoadingAltIndex] = useState<number | null>(null);

  // Load basic market price & recommendations from backend
  useEffect(() => {
    let isMounted = true;
    async function loadMarketPrice() {
      setLoading(true);
      try {
        const res = await fetch(`/api/decision/according/pasar?decisionId=${decisionId}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setMarketData({
            realMarketPrice: json.data.realMarketPrice || "",
            priceComparisonNote: json.data.priceComparisonNote || "",
            alternativeSuggestions: json.data.alternativeSuggestions || []
          });
          setCleanedTarget(json.data.cleanedTarget || cleanTargetName(target || ""));
        }
      } catch (err) {
        console.error("Failed to load market prices:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadMarketPrice();
    return () => {
      isMounted = false;
    };
  }, [decisionId, target]);

  // Load live Tokopedia products for the main target query, with price range filtering
  useEffect(() => {
    if (!cleanedTarget) return;
    let isMounted = true;
    async function fetchTargetProducts() {
      setLoadingTargetProducts(true);
      try {
        const priceParam = targetValue ? `&price=${targetValue}` : "";
        const res = await fetch(`/api/decision/scrapper?q=${encodeURIComponent(cleanedTarget)}${priceParam}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setTargetProducts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch Tokopedia products:", err);
      } finally {
        if (isMounted) setLoadingTargetProducts(false);
      }
    }
    fetchTargetProducts();
    return () => {
      isMounted = false;
    };
  }, [cleanedTarget, targetValue]);

  // Toggle dynamic loading of Tokopedia products for cheaper alternatives, passing estimated price as filter
  async function handleToggleAlt(index: number, name: string, estimatedPrice: number | null) {
    if (expandedAltIndex === index) {
      setExpandedAltIndex(null);
      return;
    }
    setExpandedAltIndex(index);
    if (altProducts[index]) return; // already loaded

    setLoadingAltIndex(index);
    try {
      const priceParam = estimatedPrice ? `&price=${estimatedPrice}` : "";
      const res = await fetch(`/api/decision/scrapper?q=${encodeURIComponent(name)}${priceParam}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAltProducts(prev => ({ ...prev, [index]: json.data }));
      }
    } catch (err) {
      console.error("Failed to fetch alt product details:", err);
    } finally {
      setLoadingAltIndex(null);
    }
  }

  return (
    <AccordionItem value="market-price" className="px-4">
      <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4 focus-visible:underline focus-visible:ring-0">
        <div className="flex items-center gap-2">
          <span>Berapa sih Harga Pasaran Aslinya? 🏷️</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-4 text-xs leading-relaxed">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            <p className="text-xs text-muted-foreground">Mengecek harga pasar riil buat kamu...</p>
          </div>
        ) : (
          <>
            {/* Real Market Price description */}
            <div className="p-3.5 border rounded-xl space-y-2 bg-background/50">
              <div className="text-xs font-semibold text-foreground flex flex-col gap-1">
                <span className="font-bold text-violet-600 block leading-tight">
                  Harga Pasaran untuk "{cleanedTarget || cleanTargetName(target || "")}":
                </span>
                <span className="font-medium text-justify text-muted-foreground mt-0.5">
                  {marketData.realMarketPrice}
                </span>
              </div>
              {marketData.priceComparisonNote && (
                <p className="text-[10px] text-muted-foreground leading-relaxed italic border-t pt-1.5 mt-1 bg-violet-500/[0.01]">
                  💡 <strong>Catatan:</strong> {marketData.priceComparisonNote}
                </p>
              )}
            </div>

            {/* Live Tokopedia products for the target item */}
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-foreground tracking-wide flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5 text-violet-500" />
                Live Produk Tokopedia untuk "{cleanedTarget}":
              </span>
              <ProductGrid items={targetProducts} loading={loadingTargetProducts} />
            </div>

            {/* Live alternatives lists */}
            {marketData.alternativeSuggestions && marketData.alternativeSuggestions.length > 0 && (
              <div className="p-3.5 border rounded-xl space-y-3 bg-background/20">
                <span className="text-xs font-bold text-violet-600 block">
                  Coba Lirik Alternatif yang Lebih Hemat & Sehat Ini:
                </span>
                <div className="space-y-2">
                  {marketData.alternativeSuggestions.map((item, index) => {
                    const isExpanded = expandedAltIndex === index;
                    const isLoadingAlt = loadingAltIndex === index;
                    const items = altProducts[index] || [];
                    
                    return (
                      <div key={index} className="border rounded-lg overflow-hidden bg-background/30 transition-all">
                        <button
                          onClick={() => handleToggleAlt(index, item.name, item.estimatedPrice)}
                          className="w-full text-left p-2.5 flex justify-between items-center hover:bg-background/80 transition-colors text-[10px] font-semibold"
                        >
                          <div className="flex flex-col">
                            <span className="text-foreground text-[11px] font-bold">{item.name}</span>
                            {item.estimatedPrice && (
                              <span className="text-emerald-600 font-semibold text-[9px] mt-0.5">
                                Kisaran: Rp {item.estimatedPrice.toLocaleString("id-ID")}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-violet-600 hover:underline flex items-center gap-1 font-bold">
                            {isExpanded ? "Tutup Detail ✕" : "Cari di Tokopedia 🔍"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="p-2.5 border-t border-muted/20 bg-background/10 space-y-2">
                            <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">
                              Hasil Pencarian Tokopedia untuk "{item.name}":
                            </span>
                            <ProductGrid items={items} loading={isLoadingAlt} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
