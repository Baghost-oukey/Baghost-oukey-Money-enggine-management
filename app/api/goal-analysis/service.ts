import { prisma } from "@/lib/prisma";
import { callGemini } from "../decision/utils";

export interface ExpenseInput {
  name: string;
  amount: number;
}

export interface CreateGoalParams {
  userId: string;
  decisionId: string;
  targetName: string;
  targetValue: number;
  monthlyBudget: number;
  expenses: ExpenseInput[];
  targetDate?: string;
}

export async function createGoalAndSyncExpenses(params: CreateGoalParams) {
  const {
    userId,
    decisionId,
    targetName,
    targetValue,
    monthlyBudget,
    expenses,
    targetDate,
  } = params;

  // Calculate required monthly savings
  const currentDate = new Date();
  let monthsDiff = 1;
  if (targetDate) {
    const tDate = new Date(targetDate);
    const diffTime = tDate.getTime() - currentDate.getTime();
    const daysDiff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    monthsDiff = Math.max(1, Math.ceil(daysDiff / 30.44));
  }
  const requiredMonthlySavings = monthsDiff > 0 ? targetValue / monthsDiff : targetValue;

  // Ask Gemini to plan the user's monthly budget seefektif mungkin to reach target
  let planDescription = "";
  try {
    const prompt = `
Anda adalah seorang konsultan keuangan personal profesional yang bersahabat, ramah, dan komunikatif. Panggillah pengguna dengan sebutan "kamu", gunakan gaya bahasa santai khas Indonesia ("nih", "ya", "yuk", "lho") yang mudah diterima semua kalangan termasuk pelajar.

Tugas kamu adalah membuat **Rencana Alokasi Anggaran Bulanan Hidup Sehari-hari** agar pengguna bisa memiliki target barang impiannya se-efektif mungkin.

Data Pengguna:
1. Pemasukan/Uang Bulanan: Rp ${monthlyBudget.toLocaleString("id-ID")}
2. Target Barang: "${targetName}"
3. Harga Target: Rp ${targetValue.toLocaleString("id-ID")}
4. Sisa Waktu Target: ${monthsDiff} Bulan
5. Uang yang harus ditabung per bulan untuk target ini: Rp ${requiredMonthlySavings.toLocaleString("id-ID")}
6. Pengeluaran bulanan saat ini:
${expenses.map((e) => `- ${e.name}: Rp ${e.amount.toLocaleString("id-ID")}`).join("\n")}

Instruksi:
Susunlah rencana alokasi anggaran Rp ${monthlyBudget.toLocaleString("id-ID")} untuk hidup selama 1 bulan secara realistis agar target tabungan bulanan sebesar Rp ${requiredMonthlySavings.toLocaleString("id-ID")} dapat terpenuhi se-efektif mungkin.

Kalkulasikan alokasi yang tepat untuk:
- Kebutuhan Pokok (Needs)
- Gaya Hidup (Wants)
- Tabungan Target (Savings)
Dan pastikan total ketiganya pas dengan Uang Bulanan (Rp ${monthlyBudget}).
Jika jumlah Tabungan Target + Kebutuhan Pokok melebihi Uang Bulanan, sarankan pengurangan drastis di pos Gaya Hidup atau cari alternatif yang lebih hemat agar tidak terjadi defisit anggaran.

Kamu juga harus membagi pos pengeluaran tersebut ke dalam rincian item belanja bulanan nyata (itemized) agar pengguna tahu persis berapa yang harus dibelanjakan untuk makan, transportasi, jajan, dll.
Contoh pembagian:
- Kebutuhan Pokok (needsItems): Makan Rp 300.000, Bensin Rp 100.000, Sabun/Mandi Rp 50.000, dll. (Jumlah total item ini harus persis sama dengan alokasi needs).
- Gaya Hidup (wantsItems): Jajan Kopi Rp 50.000, Nonton/Hiburan Rp 50.000, dll. (Jumlah total item ini harus persis sama dengan alokasi wants).
- Tabungan (savingsItems): Tabungan Target Rp 416.667, dll. (Jumlah total item ini harus persis sama dengan alokasi savings).

Kembalikan respon dalam format JSON murni dengan struktur berikut (pastikan semua key ada):
{
  "allocation": {
    "needs": 500000,
    "wants": 100000,
    "savings": 400000,
    "explanation": "Tulis penjelasan singkat (1-2 kalimat) mengapa alokasi ini yang paling pas buat mereka."
  },
  "needsItems": [
    { "name": "Makan Harian (Bahan Masak)", "amount": 350000 },
    { "name": "Bensin / Transportasi", "amount": 100000 },
    { "name": "Sabun & Perlengkapan Mandi", "amount": 50000 }
  ],
  "wantsItems": [
    { "name": "Nongkrong / Jajan Kopi", "amount": 50000 },
    { "name": "Internet / Kuota Hiburan", "amount": 50000 }
  ],
  "savingsItems": [
    { "name": "Tabungan Target", "amount": 400000 }
  ],
  "verdict": "Sangat Realistis / Menantang / Hampir Mustahil",
  "tips": [
    "Tip penghematan konkret 1...",
    "Tip penghematan konkret 2..."
  ],
  "roadmap": [
    "Langkah/fase tindakan konkret 1...",
    "Langkah/fase tindakan konkret 2..."
  ],
  "advice": "Tulis nasihat hangat, memotivasi, dan ramah (3-4 kalimat) mengenai cara menjalani hidup dengan uang bulanan ini demi mendapatkan target belanjanya."
}
`;

    const aiPlan = await callGemini(prompt);
    planDescription = JSON.stringify(aiPlan);
  } catch (e) {
    console.error("Gemini failed to generate goal plan, using default structure:", e);
    // Dynamic fallback structure
    const targetSavingsVal = Math.min(requiredMonthlySavings, monthlyBudget * 0.5);
    const needsVal = Math.min(monthlyBudget - targetSavingsVal, monthlyBudget * 0.5);
    const wantsVal = Math.max(0, monthlyBudget - needsVal - targetSavingsVal);
    
    const fallbackPlan = {
      allocation: {
        needs: needsVal,
        wants: wantsVal,
        savings: targetSavingsVal,
        explanation: "Kami menyusun pembagian budget ini secara otomatis agar kamu bisa menyisihkan uang bulanan untuk target belanjamu.",
      },
      needsItems: [
        { name: "Makan Harian (Bahan Masak)", amount: Math.round(needsVal * 0.7) },
        { name: "Bensin / Transportasi", amount: Math.round(needsVal * 0.3) }
      ],
      wantsItems: [
        { name: "Jajan / Kopi Santai", amount: wantsVal }
      ],
      savingsItems: [
        { name: "Tabungan Target", amount: targetSavingsVal }
      ],
      verdict: targetSavingsVal > monthlyBudget * 0.4 ? "Menantang" : "Sangat Realistis",
      tips: [
        "Prioritaskan kebutuhan esensial terlebih dahulu sebelum membelanjakan pos keinginan.",
        "Langsung sisihkan uang tabungan target di awal bulan setelah menerima uang bulanan.",
      ],
      roadmap: [
        "Fase 1: Amankan kebutuhan pokok sehari-hari terlebih dahulu.",
        "Fase 2: Pisahkan dana tabungan target ke tabungan terpisah.",
        "Fase 3: Jaga disiplin pengeluaran keinginan agar tidak melewati batas.",
      ],
      advice: `Yuk, mulai kelola uang Rp ${monthlyBudget.toLocaleString("id-ID")} dengan disiplin! Menyisihkan Rp ${targetSavingsVal.toLocaleString("id-ID")} setiap bulan akan membantumu mendapatkan ${targetName} secepat mungkin secara aman dan bebas utang. Semangat ya!`,
    };
    planDescription = JSON.stringify(fallbackPlan);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create the Goal Analysis Placeholder
    const goal = await tx.goal.create({
      data: {
        userId,
        title: targetName,
        targetAmount: targetValue,
        targetDate: targetDate ? new Date(targetDate) : null,
        currentAmount: 0,
        isCompleted: false,
        description: planDescription,
      },
    });

    // 2. Update KeputusanBudget
    await tx.keputusanBudget.update({
      where: { id_keputusan: decisionId },
      data: {
        keuanganmu: monthlyBudget,
        tujuan_membeli: targetName,
        hargaTarget: targetValue,
        target_budget: requiredMonthlySavings,
        tanggal_target: targetDate ? new Date(targetDate) : null,
      },
    });

    // 3. Sync expenses: delete existing and create new ones
    await tx.decisionExpense.deleteMany({
      where: { id_keputusan: decisionId },
    });

    if (expenses.length > 0) {
      await tx.decisionExpense.createMany({
        data: expenses.map((exp) => ({
          id_keputusan: decisionId,
          name: exp.name,
          amount: exp.amount,
        })),
      });
    }

    return goal;
  });
}

export async function getUserGoals(userId: string) {
  return await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLatestUserDecision(userId: string) {
  return await prisma.keputusanBudget.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      expenses: true,
    },
  });
}
