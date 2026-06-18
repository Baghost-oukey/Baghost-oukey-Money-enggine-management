import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BudgetItem {
  name: string;
  amount: number;
}

interface CategoryAllocation {
  key?: string;
  name: string;
  type: "needs" | "wants" | "savings" | "debts";
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

interface StandardBudgetResult {
  needs: { percentage: number; amount: number; description: string; items: BudgetItem[] };
  wants: { percentage: number; amount: number; description: string; items: BudgetItem[] };
  savings: { percentage: number; amount: number; description: string; items: BudgetItem[] };
  debts: { percentage: number; amount: number; description: string; items: BudgetItem[] };
  categories: CategoryAllocation[];
  sources: string[];
  aiSummary: string;
  frameworkUsed: string;
  suggestRejection?: boolean;
}

let useFallbackModel = false;

// Helper to extract debt and installment amounts from Indonesian notes
function extractDebtsFromNotes(notes: string): BudgetItem[] {
  const items: BudgetItem[] = [];
  if (!notes) return items;

  const notesClean = notes.replace(/\n/g, " ");
  // Match patterns like "cicilan motor 500rb", "utang ke teman 200.000", "kredit hp 300 ribu", "bayar pinjol 100k"
  const regex = /(cicilan|utang|kredit|pinjol|pinjaman|bayar)\s+([a-zA-Z0-9\s\-_]+?)\s*(?:rp|Rp)?\s*([\d\.,]+)\s*(juta|jt|rb|ribu|k|K)?/gi;
  let match;
  while ((match = regex.exec(notesClean)) !== null) {
    const type = match[1];
    const name = match[2].trim();
    let amountStr = match[3].replace(/[\.,]/g, "");
    const suffix = match[4]?.toLowerCase();

    let amount = parseInt(amountStr, 10);
    if (isNaN(amount)) continue;

    if (suffix) {
      if (suffix === "juta" || suffix === "jt") {
        amount = amount * 1000000;
      } else if (suffix === "rb" || suffix === "ribu" || suffix === "k") {
        amount = amount * 1000;
      }
    } else {
      // If amount is small, e.g. 500 or 1500, assume it's in thousands
      if (amount < 10000) {
        amount = amount * 1000;
      }
    }

    const formattedName = `${type.charAt(0).toUpperCase() + type.slice(1)} ${name || ""}`.trim();
    items.push({ name: formattedName, amount });
  }

  // Fallback: search for simple "cicilan xxx" or "utang xxx" if complex regex didn't match
  if (items.length === 0) {
    const simpleRegex = /(cicilan|utang|kredit)\s+(?:rp\.?\s*)?([\d\.,]+)/gi;
    while ((match = simpleRegex.exec(notesClean)) !== null) {
      const type = match[1];
      let amountStr = match[2].replace(/[\.,]/g, "");
      let amount = parseInt(amountStr, 10);
      if (!isNaN(amount)) {
        if (amount < 10000) amount *= 1000;
        items.push({ name: `${type.charAt(0).toUpperCase() + type.slice(1)}`, amount });
      }
    }
  }

  return items;
}

function getStandardBaseline(salary: number, notes: string, syncedDecisions: any[] = []): StandardBudgetResult {
  const debtItems = extractDebtsFromNotes(notes);

  // Parse synced decisions and categorize as debt (if Pinjol/Paylater)
  syncedDecisions.forEach(d => {
    let isDebt = false;
    try {
      if (d.recommendation) {
        const rec = typeof d.recommendation === "string" ? JSON.parse(d.recommendation) : d.recommendation;
        isDebt = rec?.sumberDana === "Paylater/Kredit" || rec?.sumberDana === "Pinjaman Online";
      }
    } catch (_) {}
    if (isDebt) {
      const name = `Cicilan: ${d.targetName}`;
      // Avoid duplicate
      if (!debtItems.some(i => i.name === name)) {
        debtItems.push({ name, amount: Number(d.decisionCost || 0) });
      }
    }
  });

  const debtsAmount = debtItems.reduce((sum, item) => sum + item.amount, 0);
  const debtsPercent = salary > 0 ? (debtsAmount / salary) * 100 : 0;

  const netSalary = Math.max(0, salary - debtsAmount);

  // Strict 50:30:20 split of the remaining net salary
  const needsAmount = Math.round(netSalary * 0.5);
  const wantsAmount = Math.round(netSalary * 0.3);
  const savingsAmount = netSalary - needsAmount - wantsAmount;

  // Detect user profile and specific expenses from notes
  const notesLower = (notes || "").toLowerCase();
  const isFamily = notesLower.includes("keluarga") || notesLower.includes("istri") || notesLower.includes("suami") || notesLower.includes("anak") || notesLower.includes("spp") || notesLower.includes("sekolah") || notesLower.includes("rumah tangga");
  const isStudent = notesLower.includes("mahasiswa") || notesLower.includes("kos") || notesLower.includes("kuliah") || notesLower.includes("kampus") || notesLower.includes("anak kos");

  const categories: CategoryAllocation[] = [];

  // 1. Needs categories
  const foodItems: BudgetItem[] = [];
  if (notesLower.includes("belanja bulanan") || notesLower.includes("belanja istri") || notesLower.includes("belanja bulanan istri")) {
    foodItems.push({ name: "Belanja Bulanan Istri", amount: 0 });
  } else {
    foodItems.push({ name: isFamily ? "Belanja Dapur Keluarga" : "Makan & Konsumsi Harian", amount: 0 });
  }
  categories.push({
    name: "Makanan & Sembako",
    type: "needs",
    percentage: 0,
    amount: 0,
    description: "Kebutuhan bahan pokok dapur, belanja bulanan, dan konsumsi harian.",
    items: foodItems
  });

  const transportItems: BudgetItem[] = [];
  if (notesLower.includes("bensin") || notesLower.includes("transportasi") || notesLower.includes("transport")) {
    transportItems.push({ name: "Bensin & Transportasi", amount: 0 });
  } else {
    transportItems.push({ name: "Transportasi & Mobilitas", amount: 0 });
  }
  categories.push({
    name: "Transportasi",
    type: "needs",
    percentage: 0,
    amount: 0,
    description: "Anggaran bensin, parkir, tol, dan ongkos perjalanan harian.",
    items: transportItems
  });

  if (notesLower.includes("sekolah") || notesLower.includes("spp") || notesLower.includes("pendidikan")) {
    categories.push({
      name: "Pendidikan Anak",
      type: "needs",
      percentage: 0,
      amount: 0,
      description: "Biaya SPP bulanan dan perlengkapan sekolah anak.",
      items: [{ name: "Biaya Sekolah Anak", amount: 0 }]
    });
  }

  const utilityItems: BudgetItem[] = [];
  if (notesLower.includes("listrik") || notesLower.includes("air") || notesLower.includes("internet") || notesLower.includes("wifi")) {
    utilityItems.push({ name: "Listrik, Air & Internet", amount: 0 });
  } else {
    utilityItems.push({ name: "Tagihan Listrik & Utilitas Rumah", amount: 0 });
  }
  categories.push({
    name: "Listrik & Utilitas",
    type: "needs",
    percentage: 0,
    amount: 0,
    description: "Biaya bulanan listrik, air, pulsa, dan langganan internet.",
    items: utilityItems
  });

  // 2. Wants categories
  const wantsCats: CategoryAllocation[] = [];
  if (notesLower.includes("rokok")) {
    wantsCats.push({
      name: "Konsumsi Rokok",
      type: "wants",
      percentage: 0,
      amount: 0,
      description: "Pengeluaran rokok bulanan (wajib dipangkas jika budget terbatas).",
      items: [{ name: "Pembelian Rokok", amount: 0 }]
    });
  }

  const jajanItems: BudgetItem[] = [];
  if (notesLower.includes("jajan anak")) {
    jajanItems.push({ name: "Uang Jajan Anak", amount: 0 });
  } else if (notesLower.includes("jajan") || notesLower.includes("kopi") || notesLower.includes("ngopi")) {
    jajanItems.push({ name: "Uang Jajan & Kopi", amount: 0 });
  } else {
    jajanItems.push({ name: "Uang Kopi & Jajan Sore", amount: 0 });
  }
  wantsCats.push({
    name: "Jajan & Kopi",
    type: "wants",
    percentage: 0,
    amount: 0,
    description: "Anggaran ngopi, camilan sore, dan jajan santai.",
    items: jajanItems
  });

  wantsCats.push({
    name: "Hiburan & Rekreasi",
    type: "wants",
    percentage: 0,
    amount: 0,
    description: "Makan bersama di luar, rekreasi, nonton, atau belanja hobi.",
    items: [{ name: "Makan Luar & Hiburan", amount: 0 }]
  });
  categories.push(...wantsCats);

  // 3. Savings categories
  categories.push({
    name: "Dana Darurat",
    type: "savings",
    percentage: 0,
    amount: 0,
    description: "Cadangan simpanan tunai cair untuk keadaan darurat.",
    items: [{ name: "Tabungan Dana Darurat", amount: 0 }]
  });

  const savingsItems: BudgetItem[] = [];
  syncedDecisions.forEach(d => {
    let isDebt = false;
    try {
      if (d.recommendation) {
        const rec = typeof d.recommendation === "string" ? JSON.parse(d.recommendation) : d.recommendation;
        isDebt = rec?.sumberDana === "Paylater/Kredit" || rec?.sumberDana === "Pinjaman Online";
      }
    } catch (_) {}
    if (!isDebt) {
      savingsItems.push({ name: `Target: ${d.targetName}`, amount: Number(d.decisionCost || 0) });
    }
  });

  categories.push({
    name: "Tabungan Masa Depan",
    type: "savings",
    percentage: 0,
    amount: 0,
    description: "Tabungan jangka panjang, investasi reksa dana, emas, atau asuransi.",
    items: [
      { name: isFamily ? "Tabungan Pendidikan Anak" : "Investasi Reksa Dana", amount: 0 },
      ...savingsItems
    ]
  });

  // 4. Debts categories
  if (debtItems.length > 0) {
    categories.push({
      name: "Cicilan & Utang",
      type: "debts",
      percentage: 0,
      amount: 0,
      description: "Kewajiban pelunasan utang dan cicilan bulanan.",
      items: debtItems
    });
  }

  // Allocate amounts to categories of each type proportionally
  const allocateToTypeCats = (type: "needs" | "wants" | "savings", totalAmount: number) => {
    const typeCats = categories.filter(c => c.type === type);
    if (typeCats.length === 0) return;

    let allocated = 0;
    typeCats.forEach((c, idx) => {
      let pct = 1 / typeCats.length;
      if (type === "needs" && typeCats.length >= 3) {
        if (c.name.includes("Makanan")) pct = 0.5;
        else if (c.name.includes("Pendidikan")) pct = 0.25;
        else pct = (1 - 0.5 - (typeCats.some(x => x.name.includes("Pendidikan")) ? 0.25 : 0)) / (typeCats.length - (typeCats.some(x => x.name.includes("Pendidikan")) ? 2 : 1));
      }
      const amt = idx === typeCats.length - 1 ? (totalAmount - allocated) : Math.round(totalAmount * pct);
      c.amount = Math.max(0, amt);
      c.percentage = salary > 0 ? (c.amount / salary) * 100 : 0;
      allocated += c.amount;

      if (c.items.length > 0) {
        // Enforce/lock the amount of synced decisions so they don't get diluted
        const lockedItems = c.items.filter(i => i.name.startsWith("Target:") || i.name.startsWith("Cicilan:"));
        const lockedSum = lockedItems.reduce((sum, i) => sum + i.amount, 0);
        const unlockedItems = c.items.filter(i => !i.name.startsWith("Target:") && !i.name.startsWith("Cicilan:"));

        if (unlockedItems.length > 0) {
          const remainingForUnlocked = Math.max(0, c.amount - lockedSum);
          const share = Math.round(remainingForUnlocked / unlockedItems.length);
          let allocatedUnlocked = 0;
          unlockedItems.forEach((i, uIdx) => {
            const itemAmt = uIdx === unlockedItems.length - 1 ? (remainingForUnlocked - allocatedUnlocked) : share;
            i.amount = itemAmt;
            allocatedUnlocked += itemAmt;
          });
        } else {
          const itemsSum = c.items.reduce((s, i) => s + i.amount, 0);
          if (itemsSum !== c.amount && c.items.length > 0) {
            c.items[c.items.length - 1].amount = Math.max(0, c.items[c.items.length - 1].amount + (c.amount - itemsSum));
          }
        }
      }
    });
  };

  allocateToTypeCats("needs", needsAmount);
  allocateToTypeCats("wants", wantsAmount);
  allocateToTypeCats("savings", savingsAmount);

  if (debtItems.length > 0) {
    const debtCat = categories.find(c => c.type === "debts");
    if (debtCat) {
      debtCat.amount = debtsAmount;
      debtCat.percentage = debtsPercent;
    }
  }

  // Grouped results for compatibility
  const buildGroupedCategory = (type: "needs" | "wants" | "savings" | "debts", defaultDesc: string) => {
    const cats = categories.filter(c => c.type === type);
    const amount = cats.reduce((sum, c) => sum + c.amount, 0);
    const percentage = salary > 0 ? (amount / salary) * 100 : 0;
    const items = cats.reduce((list, c) => [...list, ...c.items], [] as BudgetItem[]);
    const description = cats.map(c => c.description).filter(Boolean).join(" | ") || defaultDesc;

    return { percentage, amount, description, items };
  };

  const needsGrouped = buildGroupedCategory("needs", "Kebutuhan Pokok");
  const wantsGrouped = buildGroupedCategory("wants", "Keinginan & Gaya Hidup");
  const savingsGrouped = buildGroupedCategory("savings", "Tabungan & Investasi");
  const debtsGrouped = buildGroupedCategory("debts", "Cicilan & Utang");

  const sources = [
    "Survei Biaya Hidup BPS 2024",
    "Rasio Kemampuan Membayar OJK",
    "Perencana Keuangan Indonesia CFP"
  ];

  let aiSummary = "";
  if (debtsAmount > 0) {
    aiSummary = `Anggaran bulanan kamu sudah disesuaikan secara kritis. Cicilan bulanan sebesar Rp ${debtsAmount.toLocaleString("id-ID")} diprioritaskan terlebih dahulu, baru sisa pendapatan bersih dikelola secara seimbang demi kelangsungan rumah tangga dan dana darurat.`;
  } else {
    aiSummary = `Rencana anggaran bulanan standar disusun praktis berdasarkan standar biaya hidup ideal di Indonesia dengan alokasi seimbang untuk pokok, keinginan, dan tabungan.`;
  }

  return {
    needs: needsGrouped,
    wants: wantsGrouped,
    savings: savingsGrouped,
    debts: debtsGrouped,
    categories,
    sources,
    aiSummary,
    frameworkUsed: "Rasio 50:30:20 setelah Cicilan"
  };
}

function balanceRecommendationLocally(
  recommendation: any,
  salary: number,
  force: boolean = false,
  categoryName: string | null = null,
  syncedDecisions: any[] = []
): any {
  if (!recommendation) {
    return getStandardBaseline(salary, "", syncedDecisions);
  }

  const sanitized = sanitizeAiResult(recommendation, salary, force, categoryName, syncedDecisions);

  let suggestRejection = false;
  if (!force) {
    const netSalary = Math.max(0, salary - sanitized.debts.amount);
    if (netSalary > 0) {
      const wantsTotal = sanitized.wants.amount;
      const savingsTotal = sanitized.savings.amount;
      if ((savingsTotal / netSalary) < 0.1 || (wantsTotal / netSalary) > 0.4) {
        suggestRejection = true;
      }
    }
  }

  return {
    ...sanitized,
    suggestRejection,
    aiSummary: suggestRejection
      ? "Maaf, berdasarkan pengeluaran yang baru kamu perbarui kami sarankan untuk tidak menyetujui perubahan Anda."
      : "Anggaran telah disesuaikan secara otomatis agar tetap pas dengan prioritas tingkat kebutuhan setelah cicilan.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, salary, notes, action, recommendation, force, resetModel, categoryName } = body;
    const forceBool = !!force;

    if (resetModel) {
      useFallbackModel = false;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 }
      );
    }

    const salaryNum = Number(salary);
    if (!salary || isNaN(salaryNum) || salaryNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid income salary is required." },
        { status: 400 }
      );
    }

    // Fetch user's active synchronized target decisions from database
    const syncedDecisions = await prisma.decisionAnalysis.findMany({
      where: {
        userId,
        status: "TERSINKRONISASI",
      },
    });

    let syncedDecisionsText = "";
    if (syncedDecisions.length > 0) {
      syncedDecisionsText = "\n\n[SINKRONISASI TARGET BELANJA WAJIB]:\n" + 
        syncedDecisions.map(d => {
          let isDebt = false;
          try {
            if (d.recommendation) {
              const rec = typeof d.recommendation === "string" ? JSON.parse(d.recommendation) : d.recommendation;
              if (rec && rec.sumberDana) {
                isDebt = rec.sumberDana === "Paylater/Kredit" || rec.sumberDana === "Pinjaman Online";
              } else {
                const recStr = JSON.stringify(d.recommendation).toLowerCase();
                isDebt = recStr.includes("paylater") || recStr.includes("pinjaman online");
              }
            }
          } catch (_) {}
          return `- ${isDebt ? "Cicilan" : "Target"}: ${d.targetName} Rp ${Number(d.decisionCost || 0).toLocaleString("id-ID")}/bulan (Pos: ${isDebt ? "debts" : "savings"})`;
        }).join("\n");
    }

    const additionalNotes = (notes || "") + syncedDecisionsText;
    const apiKey = process.env.API_KEY;

    // Calculate deterministic standard baseline
    const baseline = getStandardBaseline(salaryNum, additionalNotes, syncedDecisions);

    let aiResult: typeof baseline;
    let modelUsed = "local-fallback";

    if (!apiKey) {
      console.warn("API_KEY environment variable is not defined, running local fallback.");
      aiResult = action === "negotiate" ? balanceRecommendationLocally(recommendation, salaryNum, forceBool, categoryName, syncedDecisions) : baseline;
    } else {
      let systemPrompt = "";

      if (action === "negotiate") {
        const forceInstructions = forceBool
          ? `
[PENTING - ATURAN FORCE CONTINUE / OVERRIDE]:
Karena ini adalah pemaksaan override/lanjutkan (Force Continue = YA) oleh pengguna, Anda WAJIB mempertahankan perubahan nominal yang mereka ajukan pada kategori "${categoryName || "yang disesuaikan"}". Jangan ubah nominal kategori yang dipaksakan ini!
Untuk menyeimbangkan total anggaran agar tetap tepat 100% dari gaji bulanan (Rp ${salaryNum.toLocaleString("id-ID")}), Anda harus menyesuaikan/memangkas kategori lainnya secara otomatis. Pemangkasan kategori lain wajib didasarkan pada tingkat urgensi kebutuhan (prioritas pemotongan dari yang paling tidak penting ke yang paling penting):
1. Kategori bertipe 'wants' (Gaya Hidup) wajib dipotong/dikurangi terlebih dahulu.
2. Jika seluruh kategori 'wants' sudah dipotong hingga nol dan totalnya masih belum seimbang, barulah kurangi kategori bertipe 'savings' (Tabungan).
3. Jika kategori 'savings' juga sudah dipotong habis, barulah kurangi kategori bertipe 'needs' (Pokok) secara sangat hati-hati.
4. Kategori bertipe 'debts' (Cicilan/Utang) bersifat wajib dan sama sekali tidak boleh dipotong.
Atur "suggestRejection": false karena pengguna memaksa melanjutkan perubahan ini. Jelaskan penyesuaian penyeimbang yang Anda lakukan di "aiSummary" secara ramah, santai, jujur, dan tetap kritis.
`
          : `
[ATURAN NEGOSIASI STANDAR]:
Jika penyesuaian anggaran yang diajukan oleh pengguna tidak realistis atau membahayakan kesehatan finansial mereka (misalnya total wants melebihi jatah target wants, atau wants berisi rokok/jajan mahal padahal SPP anak mepet), Anda wajib mengatur "suggestRejection": true. Jelaskan alasan penolakan dan kritik Anda di "aiSummary" secara sangat natural, jujur, kritis, dan penuh kepedulian.
Jika penyesuaian pengguna masih dalam batas wajar/sehat, atur "suggestRejection": false.
`;

        systemPrompt = `
Anda adalah konsultan keuangan pribadi cerdas, kritis, realistis, dan pakar perencanaan anggaran (budgeting planner) bulanan real di Indonesia. Panggil pengguna dengan sebutan "kamu" secara sopan, bersahabat, namun tetap tegas dan kritis demi kesehatan finansial mereka.

Tugas Anda saat ini adalah melakukan **Negosiasi Anggaran** (Budget Negotiation) dengan pengguna.
Gaji bulanan pengguna adalah Rp ${salaryNum.toLocaleString("id-ID")}.
Catatan tambahan asli pengguna: "${additionalNotes}"
Apakah ini pemaksaan override/lanjutkan (Force Continue)? ${forceBool ? "YA" : "TIDAK"}
Kategori yang sedang dinegosiasikan: "${categoryName || "Tidak spesifik"}"

Pengguna telah melakukan penyesuaian nominal pada draf rencana anggaran mereka. Berikut adalah draf anggaran terbaru yang telah diubah oleh pengguna:
${JSON.stringify(recommendation, null, 2)}

Sebagai asisten AI, Anda wajib bertindak kritis:
1. **Analisis Profil & Evaluasi Gaya Hidup Realistis**:
   - Analisis gaji bulanan pengguna (Rp ${salaryNum.toLocaleString("id-ID")}). Carilah/pikirkan apa gaya hidup praktis dan realistis yang efektif untuk kelas pendapatan ini di Indonesia.
   - Jika gaji bersih setelah cicilan (net salary) tergolong pas-pasan/mepet (misalnya di bawah Rp 4-5 juta untuk keluarga), Anda wajib bersikap sangat kritis dan protektif terhadap kebutuhan primer.
2. **Pemangkasan Pengeluaran Tidak Penting (Rokok, Jajan Berlebih, dll.)**:
   - Jika pengguna memasukkan atau meningkatkan nominal item tidak penting/gaya hidup (contoh: membeli rokok, kopi mahal, jajan berlebihan) sedangkan kondisi anggaran mepet/pas-pasan, Anda wajib memangkas/mengurangi nominal tersebut secara signifikan (ke batas minimal atau nol) demi menyelamatkan pos krusial seperti biaya sekolah/SPP anak, sembako dapur, atau tabungan dana darurat.
   - Berikan alasan pemangkasan tersebut secara jujur dan kritis di "aiSummary".
3. **Pembagian Kategori Dinamis (Sangat Penting!)**:
   - Jangan batasi kategori anggaran hanya menjadi 4 kategori template saja. Buatlah list kategori anggaran yang dinamis, spesifik, dan detail (minimal ada 7 hingga 10+ kategori di dalam array "categories").
   - Kategori-kategori tersebut harus memiliki tipe ("type") salah satu dari: "needs", "wants", "savings", atau "debts".
   - Contoh nama kategori dinamis: "Makanan & Dapur", "Transportasi & Bensin", "Pendidikan Anak", "Utilitas & Tagihan", "Konsumsi Rokok", "Dana Darurat", "Investasi Masa Depan", "Cicilan Bank", dll.
4. **Aturan Penyeimbangan Anggaran**:
   ${forceBool 
     ? `Karena Force Continue = YA, Anda harus mengikuti aturan penyeimbangan dengan prioritas pemangkasan kategori lain (wants -> savings -> needs) agar total jumlah seluruh kategori sama dengan gaji bulanan (Rp ${salaryNum}).`
     : `Rasio Paten (50:30:20 dari sisa gaji bersih setelah cicilan) wajib dipenuhi. Total debts = D. Sisa gaji bersih = Gaji - D. Total needs = 0.5 * (Gaji - D). Total wants = 0.3 * (Gaji - D). Total savings = 0.2 * (Gaji - D). Jumlah total persentase seluruh kategori harus tepat 100.`
   }
5. **Keputusan & Tindakan**:
   ${forceInstructions}
6. **Sumber & Referensi**:
   - Tentukan sumber data/referensi nyata yang melandasi standar gaya hidup praktis tersebut (misalnya BPS 2024, OJK, cost of living index, dll.) dan sertakan dalam array "sources".
7. **Bahasa & Kepadatan (Sangat Penting!)**:
   - Tulis "aiSummary" secara natural, bersahabat, menggunakan gaya bahasa Indonesia sehari-hari ("gaul" tapi sopan, menggunakan kata 'aku', 'kamu', 'kok', 'biar', 'lho'). Jangan mencantumkan rasio persentase rumus 50:30:20 secara kaku.
   - **WAJIB SANGAT SINGKAT, PADAT, DAN LANGSUNG KE POIN UTAMA (Maksimal 2-3 kalimat pendek, kisaran 30-50 kata)**. Jangan menulis paragraf yang panjang atau naratif bertele-tele. Langsung jelaskan intinya (misalnya: cicilan diprioritaskan, belanja bulanan diamankan, dan pemangkasan rokok/kopi).

Hasil negosiasi wajib dikembalikan berupa JSON murni dengan skema berikut:
{
  "categories": [
    {
      "name": "Nama Kategori (misal Makanan & Sembako)",
      "type": "needs" | "wants" | "savings" | "debts",
      "percentage": number,
      "amount": number,
      "description": "Penjelasan singkat pos kategori ini...",
      "items": [
        { "name": "Item Detail 1", "amount": number },
        { "name": "Item Detail 2", "amount": number }
      ]
    }
  ],
  "sources": [
    "string (Nama sumber/referensi, misal: Data SBH BPS 2024)"
  ],
  "suggestRejection": boolean,
  "aiSummary": "Penjelasan keputusan atau saran negosiasi Anda...",
  "frameworkUsed": "Rasio 50:30:20 setelah Cicilan"
}
`;
      } else {
        systemPrompt = `
Anda adalah konsultan keuangan pribadi cerdas, kritis, realistis, dan pakar perencanaan anggaran (budgeting planner) bulanan real di Indonesia. Panggil pengguna dengan sebutan "kamu" secara sopan, bersahabat, namun tegas demi kesehatan finansial mereka.

Tugas utama Anda adalah menganalisis gaji bulanan Rp ${salaryNum.toLocaleString("id-ID")} dan catatan tambahan dari pengguna berikut:
"${additionalNotes}"

Anda wajib merencanakan dan mengalokasikan anggaran pengguna secara kritis dan praktis:
1. **Analisis Latar Belakang & Gaya Hidup**:
   - Analisis gaji bulanan pengguna (Rp ${salaryNum.toLocaleString("id-ID")}). Carilah/pikirkan apa gaya hidup praktis dan realistis yang efektif untuk kelas pendapatan ini di Indonesia.
   - Pahami kondisi tempat tinggal dan keluarga mereka dari catatan tambahan.
2. **Prioritaskan Kebutuhan Pokok Ril**:
   - Ekstrak seluruh item pengeluaran spesifik yang ditulis oleh pengguna dalam catatan tambahannya (seperti rokok, jajan anak, sekolah anak, belanja bulanan istri, bensin, cicilan bank). Prioritaskan item-item ini dalam pemetaan kategori Anda.
   - Kelompokkan SPP/sekolah/pendidikan anak ke Kebutuhan Utama (type: "needs").
   - Kelompokkan belanja dapur bulanan istri dan bensin transportasi kerja ke Kebutuhan Utama (type: "needs").
   - Kelompokkan rokok ke Wants (type: "wants").
   - Kelompokkan utang/cicilan ke Debts (type: "debts").
3. **Pemangkasan Kebutuhan Tidak Penting (Critical Slashing)**:
   - Jika gaji bersih setelah cicilan mepet/pas-pasan untuk menghidupi keluarga (misal pendapatan bersih Rp 3-4 juta), Anda wajib memangkas pengeluaran gaya hidup tidak penting (seperti rokok, jajan kopi, nongkrong) secara signifikan (ke batas minimal atau Rp 0) demi menyelamatkan pos krusial seperti biaya sekolah anak dan sembako dapur.
   - Berikan catatan dan saran solutif yang tegas namun ramah tentang pemotongan ini di "aiSummary".
4. **Pembagian Kategori Dinamis (Sangat Penting!)**:
   - Jangan batasi kategori anggaran hanya menjadi 4 kategori template saja. Buatlah list kategori anggaran yang dinamis, spesifik, dan detail (minimal ada 7 hingga 10+ kategori di dalam array "categories").
   - Setiap kategori harus diklasifikasikan ke salah satu tipe: "needs", "wants", "savings", atau "debts".
   - Contoh nama kategori dinamis: "Makanan & Dapur", "Transportasi & Bensin", "Pendidikan Anak", "Utilitas & Tagihan", "Dana Darurat", "Tabungan Pendidikan", "Cicilan Bank", dll.
5. **Aturan Rasio Paten (50:30:20 dari sisa gaji bersih setelah cicilan)**:
   - Hitung total nominal debts dari item-item debts. Misalkan total debts = D.
   - Sisa gaji bersih = Gaji - D.
   - Total seluruh kategori bertipe "needs" wajib tepat = 0.5 * (Gaji - D).
   - Total seluruh kategori bertipe "wants" wajib tepat = 0.3 * (Gaji - D).
   - Total seluruh kategori bertipe "savings" wajib tepat = 0.2 * (Gaji - D).
   - Total seluruh kategori bertipe "debts" wajib tepat = D.
   - Jumlah total persentase seluruh kategori harus tepat 100%.
6. **Sumber & Referensi**:
   - Cantumkan sumber data/referensi nyata yang digunakan untuk menentukan biaya hidup ini (misal BPS 2024, OJK, cost of living index, dll.) di array "sources".
7. **Bahasa & Kepadatan (Sangat Penting!)**:
   - Tulis "aiSummary" secara natural, bersahabat, menggunakan gaya bahasa Indonesia sehari-hari ("gaul" tapi sopan, menggunakan kata 'aku', 'kamu', 'kok', 'biar', 'lho'). Jangan mencantumkan angka persentase rumus 50:30:20 secara kaku.
   - **WAJIB SANGAT SINGKAT, PADAT, DAN LANGSUNG KE POIN UTAMA (Maksimal 2-3 kalimat pendek, kisaran 30-50 kata)**. Jangan menulis paragraf yang panjang atau naratif bertele-tele. Langsung jelaskan intinya (misalnya: cicilan diprioritaskan, belanja bulanan diamankan, dan pemangkasan rokok/kopi).

Hasil pembagian wajib dikembalikan berupa JSON murni dengan skema berikut:
{
  "categories": [
    {
      "name": "Nama Kategori (misal Makanan & Sembako)",
      "type": "needs" | "wants" | "savings" | "debts",
      "percentage": number,
      "amount": number,
      "description": "Penjelasan singkat pos kategori ini...",
      "items": [
        { "name": "Item Detail 1", "amount": number },
        { "name": "Item Detail 2", "amount": number }
      ]
    }
  ],
  "sources": [
    "string (Nama sumber/referensi)"
  ],
  "aiSummary": "Saran dan analisis dari asisten AI bulanan secara santai, natural, kritis, dan memotivasi...",
  "frameworkUsed": "Rasio 50:30:20 setelah Cicilan"
}
`;
      }

      modelUsed = "gemini-2.5-flash";
      const fallbackInstructions = `
[PENTING - PERINGATAN KETAT UNTUK LITE MODEL]:
Karena Anda berjalan dalam mode efisiensi tinggi (Gemini 3.1 Flash-Lite), harap patuhi aturan berikut dengan sangat ketat agar tidak keluar konteks:
1. Output Anda HARUS berupa JSON valid tanpa teks penjelasan di luar blok JSON.
2. Pastikan rasio 50:30:20 setelah dikurangi pos cicilan (debts) tepat 100% secara matematis.
3. Kategori dalam array "categories" minimal berjumlah 7-10 pos pengeluaran secara dinamis.
4. Tulis deskripsi dan "aiSummary" secara sangat padat (maksimal 2-3 kalimat pendek, 30-50 kata) dalam bahasa Indonesia santai/gaul sehari-hari yang bersahabat dan kritis.
5. Dilarang keras keluar dari konteks budgeting pribadi.
`;

      const callModel = async (modelName: string, promptText: string) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: promptText,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status} for ${modelName}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error(`Empty response from Gemini API for ${modelName}`);
        }
        return text;
      };

      try {
        let responseText = "";
        if (useFallbackModel) {
          modelUsed = "gemini-3.1-flash-lite";
          responseText = await callModel("gemini-3.1-flash-lite", systemPrompt + "\n" + fallbackInstructions);
        } else {
          try {
            modelUsed = "gemini-2.5-flash";
            responseText = await callModel("gemini-2.5-flash", systemPrompt);
          } catch (firstTryErr) {
            console.warn("Primary model gemini-2.5-flash failed, falling back to gemini-3.1-flash-lite:", firstTryErr);
            useFallbackModel = true;
            modelUsed = "gemini-3.1-flash-lite";
            responseText = await callModel("gemini-3.1-flash-lite", systemPrompt + "\n" + fallbackInstructions);
          }
        }

        const cleanedText = responseText.replace(/^\s*```json\s*|```\s*$/g, "").trim();
        aiResult = JSON.parse(cleanedText);
      } catch (err) {
        console.error("Gemini API error during budgeting, falling back locally:", err);
        modelUsed = "local-fallback";
        aiResult = action === "negotiate" ? balanceRecommendationLocally(recommendation, salaryNum, forceBool, categoryName, syncedDecisions) : baseline;
      }
    }

    // Sanitize the AI result to enforce schema consistency
    const sanitizedResult = sanitizeAiResult(aiResult, salaryNum, forceBool, categoryName, syncedDecisions);
    sanitizedResult.modelUsed = modelUsed;

    if (sanitizedResult.suggestRejection) {
      return NextResponse.json(
        {
          success: true,
          message: "Negosiasi anggaran bulanan disarankan untuk ditolak karena melebihi batasan.",
          data: {
            recommendation: sanitizedResult
          },
        },
        { status: 200 }
      );
    }

    // Save budgeting analysis results to Database using Prisma client
    const budgetPlan = await prisma.budgetPlan.create({
      data: {
        userId,
        monthlyBudget: salaryNum,
        recommendation: sanitizedResult as any,
        aiSummary: sanitizedResult.aiSummary,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: action === "negotiate" ? "Negosiasi anggaran bulanan berhasil diproses." : "Alokasi anggaran bulanan berhasil dibuat.",
        data: budgetPlan,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating budget plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan internal saat memproses alokasi anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, monthlyBudget, recommendation, aiSummary } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Budget Plan ID is required." },
        { status: 400 }
      );
    }

    const updatedPlan = await prisma.budgetPlan.update({
      where: { id },
      data: {
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : undefined,
        recommendation: recommendation ? recommendation : undefined,
        aiSummary: aiSummary ? aiSummary : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Anggaran berhasil diperbarui.",
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating budget plan:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memperbarui anggaran.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function rebalanceCategoriesWithPriority(
  categories: CategoryAllocation[],
  salaryNum: number,
  forcedCategoryName: string | null
): CategoryAllocation[] {
  const totalSum = categories.reduce((sum, c) => sum + c.amount, 0);
  const diff = totalSum - salaryNum;

  if (diff === 0) return categories;

  const isExcluded = (c: CategoryAllocation) => {
    return (
      (forcedCategoryName && c.name.toLowerCase().trim() === forcedCategoryName.toLowerCase().trim()) ||
      c.type === "debts"
    );
  };

  if (diff > 0) {
    let remainingToCut = diff;

    // Wants
    const wantsCats = categories.filter(c => c.type === "wants" && !isExcluded(c));
    for (const c of wantsCats) {
      if (remainingToCut <= 0) break;
      const cut = Math.min(c.amount, remainingToCut);
      c.amount -= cut;
      remainingToCut -= cut;
    }

    // Savings
    if (remainingToCut > 0) {
      const savingsCats = categories.filter(c => c.type === "savings" && !isExcluded(c));
      for (const c of savingsCats) {
        if (remainingToCut <= 0) break;
        const cut = Math.min(c.amount, remainingToCut);
        c.amount -= cut;
        remainingToCut -= cut;
      }
    }

    // Needs
    if (remainingToCut > 0) {
      const needsCats = categories.filter(c => c.type === "needs" && !isExcluded(c));
      for (const c of needsCats) {
        if (remainingToCut <= 0) break;
        const cut = Math.min(c.amount, remainingToCut);
        c.amount -= cut;
        remainingToCut -= cut;
      }
    }
  } else {
    let surplusToDistribute = Math.abs(diff);

    // Savings
    const savingsCats = categories.filter(c => c.type === "savings" && !isExcluded(c));
    if (savingsCats.length > 0) {
      const share = Math.round(surplusToDistribute / savingsCats.length);
      savingsCats.forEach((c, idx) => {
        const added = idx === savingsCats.length - 1 ? surplusToDistribute : share;
        c.amount += added;
        surplusToDistribute -= added;
      });
    }

    // Needs
    if (surplusToDistribute > 0) {
      const needsCats = categories.filter(c => c.type === "needs" && !isExcluded(c));
      if (needsCats.length > 0) {
        const share = Math.round(surplusToDistribute / needsCats.length);
        needsCats.forEach((c, idx) => {
          const added = idx === needsCats.length - 1 ? surplusToDistribute : share;
          c.amount += added;
          surplusToDistribute -= added;
        });
      }
    }

    // Wants
    if (surplusToDistribute > 0) {
      const wantsCats = categories.filter(c => c.type === "wants" && !isExcluded(c));
      if (wantsCats.length > 0) {
        const share = Math.round(surplusToDistribute / wantsCats.length);
        wantsCats.forEach((c, idx) => {
          const added = idx === wantsCats.length - 1 ? surplusToDistribute : share;
          c.amount += added;
          surplusToDistribute -= added;
        });
      }
    }
  }

  // Recalculate percentages and items inside each category
  categories.forEach(c => {
    c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
    if (c.items && c.items.length > 0) {
      const currentItemsSum = c.items.reduce((sum, item) => sum + item.amount, 0) || 1;
      let allocatedItems = 0;
      c.items.forEach((item, idx) => {
        const weight = item.amount / currentItemsSum;
        const newAmt = idx === c.items.length - 1 ? (c.amount - allocatedItems) : Math.round(c.amount * weight);
        item.amount = Math.max(0, newAmt);
        allocatedItems += item.amount;
      });
    }
  });

  return categories;
}

function sanitizeAiResult(
  rawResult: any,
  salaryNum: number,
  forceBool: boolean = false,
  forcedCategoryName: string | null = null,
  syncedDecisions: any[] = []
): any {
  let categories: any[] = [];
  let sources: string[] = Array.isArray(rawResult?.sources) ? rawResult.sources : [];

  const sanitizeCategoryItems = (items: any[]) => {
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => {
      if (typeof item === "string") return { name: item, amount: 0 };
      if (item && typeof item === "object") {
        return {
          name: String(item.name || item.item || item.description || item.title || "Item Pengeluaran"),
          amount: Number(item.amount || item.value || item.cost || 0),
        };
      }
      return { name: "Item Pengeluaran", amount: 0 };
    });
  };

  if (Array.isArray(rawResult?.categories)) {
    categories = rawResult.categories.map((cat: any) => {
      return {
        name: String(cat?.name || "Kategori"),
        type: String(cat?.type || "needs") as "needs" | "wants" | "savings" | "debts",
        percentage: Number(cat?.percentage || 0),
        amount: Number(cat?.amount || 0),
        description: String(cat?.description || ""),
        items: sanitizeCategoryItems(cat?.items),
      };
    });
  } else {
    // Convert old format to dynamic categories format
    const sanitizeCategory = (cat: any) => {
      if (!cat) return null;
      return {
        percentage: Number(cat.percentage || 0),
        amount: Number(cat.amount || 0),
        description: String(cat.description || ""),
        items: sanitizeCategoryItems(cat.items),
      };
    };

    const needsObj = sanitizeCategory(rawResult?.needs);
    const wantsObj = sanitizeCategory(rawResult?.wants);
    const savingsObj = sanitizeCategory(rawResult?.savings);
    const debtsObj = sanitizeCategory(rawResult?.debts || rawResult?.loans || rawResult?.cicilan);

    if (needsObj) {
      categories.push({
        name: "Pokok",
        type: "needs",
        percentage: needsObj.percentage,
        amount: needsObj.amount,
        description: needsObj.description,
        items: needsObj.items,
      });
    }
    if (wantsObj) {
      categories.push({
        name: "Gaya Hidup",
        type: "wants",
        percentage: wantsObj.percentage,
        amount: wantsObj.amount,
        description: wantsObj.description,
        items: wantsObj.items,
      });
    }
    if (savingsObj) {
      categories.push({
        name: "Tabungan",
        type: "savings",
        percentage: savingsObj.percentage,
        amount: savingsObj.amount,
        description: savingsObj.description,
        items: savingsObj.items,
      });
    }
    if (debtsObj && debtsObj.items.length > 0) {
      categories.push({
        name: "Cicilan & Utang",
        type: "debts",
        percentage: debtsObj.percentage,
        amount: debtsObj.amount,
        description: debtsObj.description,
        items: debtsObj.items,
      });
    }
  }

  // Programmatically inject synced decisions to ensure they are NEVER lost, even if AI hallucinated or omitted them
  syncedDecisions.forEach(d => {
    let isDebt = false;
    try {
      if (d.recommendation) {
        const rec = typeof d.recommendation === "string" ? JSON.parse(d.recommendation) : d.recommendation;
        isDebt = rec?.sumberDana === "Paylater/Kredit" || rec?.sumberDana === "Pinjaman Online";
      }
    } catch (_) {}
    
    const categoryType = isDebt ? "debts" : "savings";
    const itemName = isDebt ? `Cicilan: ${d.targetName}` : `Target: ${d.targetName}`;
    const itemAmt = Number(d.decisionCost || 0);

    // Find category of matching type
    let cat = categories.find(c => c.type === categoryType);
    if (!cat) {
      // Create a default category of that type if missing
      cat = {
        name: isDebt ? "Cicilan & Utang" : "Tabungan Masa Depan",
        type: categoryType,
        percentage: 0,
        amount: 0,
        description: isDebt ? "Kewajiban pelunasan cicilan." : "Tabungan jangka panjang dan target belanja.",
        items: []
      };
      categories.push(cat);
    }

    // Ensure the item exists with correct amount
    const existingItem = cat.items.find((i: any) => i.name === itemName);
    if (!existingItem) {
      cat.items.push({ name: itemName, amount: itemAmt });
    } else {
      existingItem.amount = itemAmt; // enforce correct synced amount
    }
  });

  // If empty, fall back to standard baseline
  if (categories.length === 0) {
    return getStandardBaseline(salaryNum, "", syncedDecisions);
  }

  // Separate dynamic categories by type
  const debtsCats = categories.filter(c => c.type === "debts");
  const totalDebtsAmount = debtsCats.reduce((sum, c) => sum + c.items.reduce((s: number, i: any) => s + i.amount, 0), 0);
  
  // Set debts category amounts and percentages
  debtsCats.forEach(c => {
    c.amount = c.items.reduce((sum: number, i: any) => sum + i.amount, 0);
    c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
  });

  const netSalary = Math.max(0, salaryNum - totalDebtsAmount);

  if (forceBool && forcedCategoryName) {
    categories = rebalanceCategoriesWithPriority(categories, salaryNum, forcedCategoryName);
  } else {
    // Targets based on 50:30:20 net ratio
    const needsTargetTotal = Math.round(netSalary * 0.5);
    const wantsTargetTotal = Math.round(netSalary * 0.3);
    const savingsTargetTotal = netSalary - needsTargetTotal - wantsTargetTotal;

    // Function to distribute target total among categories of a type
    const distributeToCategories = (type: "needs" | "wants" | "savings", targetTotal: number) => {
      const catsOfType = categories.filter(c => c.type === type);
      if (catsOfType.length === 0) return;

      const currentSum = catsOfType.reduce((sum, c) => sum + c.amount, 0) || 1;
      let allocated = 0;
      
      catsOfType.forEach((c, idx) => {
        const weight = c.amount / currentSum;
        const amt = idx === catsOfType.length - 1 ? (targetTotal - allocated) : Math.round(targetTotal * weight);
        c.amount = Math.max(0, amt);
        c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
        allocated += c.amount;

        // Adjust items within this category to match category amount
        if (c.items.length > 0) {
          // Enforce/lock the amount of synced decisions so they don't get diluted
          const lockedItems = c.items.filter((i: any) => i.name.startsWith("Target:") || i.name.startsWith("Cicilan:"));
          const lockedSum = lockedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
          const unlockedItems = c.items.filter((i: any) => !i.name.startsWith("Target:") && !i.name.startsWith("Cicilan:"));

          // Make sure the category amount is at least the sum of locked items
          c.amount = Math.max(c.amount, lockedSum);
          c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;

          if (unlockedItems.length > 0) {
            const remainingForUnlocked = Math.max(0, c.amount - lockedSum);
            const share = Math.round(remainingForUnlocked / unlockedItems.length);
            let allocatedUnlocked = 0;
            unlockedItems.forEach((i: any, uIdx: number) => {
              const itemAmt = uIdx === unlockedItems.length - 1 ? (remainingForUnlocked - allocatedUnlocked) : share;
              i.amount = itemAmt;
              allocatedUnlocked += itemAmt;
            });
          } else {
            const itemsSum = c.items.reduce((sum: number, item: any) => sum + item.amount, 0);
            if (itemsSum !== c.amount) {
              c.items[c.items.length - 1].amount = Math.max(0, c.items[c.items.length - 1].amount + (c.amount - itemsSum));
            }
          }
        }
      });
    };

    distributeToCategories("needs", needsTargetTotal);
    distributeToCategories("wants", wantsTargetTotal);
    distributeToCategories("savings", savingsTargetTotal);
  }

  // For backward compatibility, also build needs/wants/savings/debts objects
  const buildGroupedCategory = (type: "needs" | "wants" | "savings" | "debts", defaultDesc: string) => {
    const cats = categories.filter(c => c.type === type);
    const amount = cats.reduce((sum, c) => sum + c.amount, 0);
    const percentage = salaryNum > 0 ? (amount / salaryNum) * 100 : 0;
    const items = cats.reduce((list, c) => [...list, ...c.items], [] as any[]);
    const description = cats.map(c => c.description).filter(Boolean).join(" | ") || defaultDesc;

    return {
      percentage,
      amount,
      description,
      items
    };
  };

  const needs = buildGroupedCategory("needs", "Kebutuhan Pokok");
  const wants = buildGroupedCategory("wants", "Keinginan & Gaya Hidup");
  const savings = buildGroupedCategory("savings", "Tabungan & Investasi");
  const debts = buildGroupedCategory("debts", "Cicilan & Utang");

  if (sources.length === 0) {
    sources = [
      "Survei Biaya Hidup BPS 2024",
      "Rasio Kemampuan Membayar OJK",
      "Perencana Keuangan Indonesia CFP"
    ];
  }

  return {
    categories,
    sources,
    needs,
    wants,
    savings,
    debts,
    suggestRejection: !!rawResult?.suggestRejection,
    aiSummary: String(rawResult?.aiSummary || ""),
    frameworkUsed: String(rawResult?.frameworkUsed || "Rasio 50:30:20 setelah Cicilan"),
    modelUsed: String(rawResult?.modelUsed || ""),
  };
}
