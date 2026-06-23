import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function isItemLocked(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (name.startsWith("Target:") || name.startsWith("Cicilan:")) {
    return true;
  }
  const strictRentNames = [
    "sewa kos",
    "sewa kost",
    "sewa kamar bulanan",
    "sewa kamar",
    "bayar kos",
    "bayar kost",
    "kos",
    "kost",
    "akomodasi kos",
    "biaya sewa bulanan",
    "sewa kos/akomodasi"
  ];
  return strictRentNames.includes(lower);
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

    let cat = categories.find(c => c.type === categoryType);
    if (!cat) {
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

    const existingItem = cat.items.find((i: any) => i.name === itemName);
    if (!existingItem) {
      cat.items.push({ name: itemName, amount: itemAmt });
    } else {
      existingItem.amount = itemAmt; // enforce correct synced amount
    }
  });

  const debtsCats = categories.filter(c => c.type === "debts");
  const totalDebtsAmount = debtsCats.reduce((sum, c) => sum + c.items.reduce((s: number, i: any) => s + i.amount, 0), 0);
  
  debtsCats.forEach(c => {
    c.amount = c.items.reduce((sum: number, i: any) => sum + i.amount, 0);
    c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
  });

  const netSalary = Math.max(0, salaryNum - totalDebtsAmount);

  console.log("Calculated netSalary:", netSalary);

  const getLockedSumForType = (type: "needs" | "wants" | "savings") => {
    const cats = categories.filter(c => c.type === type);
    return cats.reduce((sum, c) => sum + c.items.filter((i: any) => isItemLocked(i.name)).reduce((s: number, i: any) => s + i.amount, 0), 0);
  };

  const lockedNeeds = getLockedSumForType("needs");
  const lockedWants = getLockedSumForType("wants");
  const lockedSavings = getLockedSumForType("savings");

  console.log("Locked sums:", { lockedNeeds, lockedWants, lockedSavings });

  let needsTargetTotal = 0;
  let wantsTargetTotal = 0;
  let savingsTargetTotal = 0;

  const idealNeeds = Math.round(netSalary * 0.5);
  const idealWants = Math.round(netSalary * 0.3);
  const idealSavings = Math.round(netSalary * 0.2);

  console.log("Ideal targets:", { idealNeeds, idealWants, idealSavings });

  needsTargetTotal = Math.max(idealNeeds, lockedNeeds);
  console.log("Initial needsTargetTotal:", needsTargetTotal);

  if (needsTargetTotal >= netSalary) {
    console.log("needsTargetTotal >= netSalary path taken!");
    needsTargetTotal = netSalary;
    wantsTargetTotal = 0;
    savingsTargetTotal = 0;
  } else {
    console.log("else path taken!");
    const remaining = netSalary - needsTargetTotal;
    const wantsFloor = Math.round(netSalary * 0.1);
    
    let maxSavingsAllowed = Math.max(idealSavings, remaining - wantsFloor);
    maxSavingsAllowed = Math.min(remaining, maxSavingsAllowed);

    savingsTargetTotal = Math.min(maxSavingsAllowed, lockedSavings);
    if (savingsTargetTotal < idealSavings) {
      savingsTargetTotal = Math.min(remaining, idealSavings);
    }

    wantsTargetTotal = remaining - savingsTargetTotal;
    
    if (wantsTargetTotal < wantsFloor && savingsTargetTotal > lockedSavings) {
      const adjustment = Math.min(wantsFloor - wantsTargetTotal, savingsTargetTotal - lockedSavings);
      savingsTargetTotal -= adjustment;
      wantsTargetTotal += adjustment;
    }
  }

  console.log("Calculated target totals:", { needsTargetTotal, wantsTargetTotal, savingsTargetTotal });

  const distributeToCategories = (type: "needs" | "wants" | "savings", targetTotal: number) => {
    console.log(`\nDistributing to ${type} (Target Total: ${targetTotal})`);
    const catsOfType = categories.filter(c => c.type === type);
    console.log(`Categories of type ${type}:`, catsOfType.map(c => c.name));
    if (catsOfType.length === 0) return;

    const catsWithLocks = catsOfType.map(c => {
      const lockedItems = c.items.filter((i: any) => isItemLocked(i.name));
      const lockedSum = lockedItems.reduce((sum: number, i: any) => sum + i.amount, 0);
      return {
        category: c,
        lockedSum,
        unlockedRaw: Math.max(0, c.amount - lockedSum)
      };
    });

    const totalLockedSum = catsWithLocks.reduce((sum, item) => sum + item.lockedSum, 0);
    console.log(`totalLockedSum for ${type}: ${totalLockedSum}`);

    if (totalLockedSum > targetTotal) {
      console.log(`  totalLockedSum > targetTotal`);
      let allocated = 0;
      catsWithLocks.forEach((item, idx) => {
        const c = item.category;
        const share = item.lockedSum / (totalLockedSum || 1);
        const catAmt = idx === catsWithLocks.length - 1 ? (targetTotal - allocated) : Math.round(targetTotal * share);
        c.amount = Math.max(0, catAmt);
        c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
        allocated += c.amount;

        const lockedItems = c.items.filter((i: any) => isItemLocked(i.name));
        const unlockedItems = c.items.filter((i: any) => !isItemLocked(i.name));
        
        let allocatedItems = 0;
        lockedItems.forEach((i: any, lIdx: number) => {
          const itemShare = i.amount / (item.lockedSum || 1);
          const itemAmt = lIdx === lockedItems.length - 1 ? (c.amount - allocatedItems) : Math.round(c.amount * itemShare);
          i.amount = Math.max(0, itemAmt);
          allocatedItems += i.amount;
        });
        unlockedItems.forEach((i: any) => {
          i.amount = 0;
        });
      });
    } else {
      console.log(`  totalLockedSum <= targetTotal`);
      const remainingTarget = targetTotal - totalLockedSum;
      const totalUnlockedRaw = catsWithLocks.reduce((sum, item) => sum + item.unlockedRaw, 0);
      console.log(`  remainingTarget: ${remainingTarget}, totalUnlockedRaw: ${totalUnlockedRaw}`);
      
      let allocated = 0;
      catsWithLocks.forEach((item, idx) => {
        const c = item.category;
        let addedAmt = 0;
        if (totalUnlockedRaw > 0) {
          const share = item.unlockedRaw / totalUnlockedRaw;
          addedAmt = idx === catsWithLocks.length - 1 ? (remainingTarget - allocated) : Math.round(remainingTarget * share);
        } else {
          const share = Math.round(remainingTarget / catsWithLocks.length);
          addedAmt = idx === catsWithLocks.length - 1 ? (remainingTarget - allocated) : share;
        }
        c.amount = item.lockedSum + addedAmt;
        c.percentage = salaryNum > 0 ? (c.amount / salaryNum) * 100 : 0;
        allocated += addedAmt;

        console.log(`   Category ${c.name} c.amount updated to: ${c.amount}`);

        const lockedItems = c.items.filter((i: any) => isItemLocked(i.name));
        const unlockedItems = c.items.filter((i: any) => !isItemLocked(i.name));

        if (unlockedItems.length > 0) {
          let allocatedUnlocked = 0;
          const share = Math.round(addedAmt / unlockedItems.length);
          unlockedItems.forEach((i: any, uIdx: number) => {
            const itemAmt = uIdx === unlockedItems.length - 1 ? (addedAmt - allocatedUnlocked) : share;
            i.amount = Math.max(0, itemAmt);
            allocatedUnlocked += itemAmt;
            console.log(`     Unlocked item ${i.name} updated to: ${i.amount}`);
          });
        } else {
          if (lockedItems.length > 0 && addedAmt > 0) {
            lockedItems[lockedItems.length - 1].amount += addedAmt;
            console.log(`     Locked item ${lockedItems[lockedItems.length - 1].name} added amount updated to: ${lockedItems[lockedItems.length - 1].amount}`);
          }
        }
      });
    }
  };

  distributeToCategories("needs", needsTargetTotal);
  distributeToCategories("wants", wantsTargetTotal);
  distributeToCategories("savings", savingsTargetTotal);

  return categories;
}

async function main() {
  const plan = await prisma.budgetPlan.findFirst({
    where: { monthlyBudget: 2000000 },
    orderBy: { createdAt: "desc" },
  });
  
  if (!plan) {
    console.log("No 2M plan found.");
    return;
  }

  // Get the active synced decisions for this user
  const syncedDecisions = await prisma.decisionAnalysis.findMany({
    where: {
      userId: plan.userId,
      status: "TERINTEGRASI", // simulate using integrated targets
    },
  });

  const rawReco = typeof plan.recommendation === "string" ? JSON.parse(plan.recommendation) : plan.recommendation;

  console.log("Running sanitizeAiResult with raw recommendations and synced decisions (Salary: 2M)...");
  const sanitizedCats = sanitizeAiResult(rawReco, 2000000, false, null, syncedDecisions);
  console.dir(sanitizedCats, { depth: null });

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
