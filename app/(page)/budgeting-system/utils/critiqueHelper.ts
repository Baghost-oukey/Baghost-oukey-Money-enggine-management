export interface BudgetItem {
  name: string;
  amount: number;
}

export interface CategoryAllocation {
  key?: string;
  name: string;
  type: "needs" | "wants" | "savings" | "debts";
  percentage: number;
  amount: number;
  description: string;
  items: BudgetItem[];
}

export interface RecommendationData {
  needs?: CategoryAllocation;
  wants?: CategoryAllocation;
  savings?: CategoryAllocation;
  debts?: CategoryAllocation;
  categories?: CategoryAllocation[];
  sources?: string[];
  aiSummary: string;
  frameworkUsed: string;
  suggestRejection?: boolean;
  modelUsed?: string;
}

export interface ChangedItem {
  name: string;
  categoryName: string;
  oldAmount: number;
  newAmount: number;
  difference: number;
  isCritical: boolean;
  description: string;
  critique: string;
  shortCritique: string;
}

export function getChangedItems(
  categories: CategoryAllocation[],
  lastValidRecommendation: RecommendationData
): ChangedItem[] {
  const list: ChangedItem[] = [];

  categories.forEach((currentCat) => {
    // Find matching category in lastValidRecommendation
    const originalCat = lastValidRecommendation.categories?.find(
      (c) => c.type === currentCat.type
    );
    if (!originalCat) return;

    currentCat.items.forEach((currentItem) => {
      const originalItem = originalCat.items.find(
        (i: any) => i.name.toLowerCase() === currentItem.name.toLowerCase()
      );
      const oldAmt = originalItem ? originalItem.amount : 0;
      const newAmt = currentItem.amount;

      if (oldAmt !== newAmt) {
        const diff = newAmt - oldAmt;
        const nameLower = currentItem.name.toLowerCase();
        
        let description = `Pengeluaran pos ${currentCat.name}.`;
        let critique = "";
        let shortCritique = "";
        let isCritical = false;

        // Special logic for Rokok
        if (nameLower.includes("rokok")) {
          description = "Anggaran untuk rokok. Ini dipangkas drastis menjadi nol demi kesehatan finansial dan pribadi yang lebih baik.";
          if (diff > 0) {
            isCritical = true;
            critique = "Menaikkan anggaran rokok sangat tidak direkomendasikan karena memperburuk kesehatan fisik dan kestabilan keuangan jangka panjang.";
            shortCritique = "Kenaikan anggaran rokok merugikan kesehatan & keuangan";
          } else {
            // Decreased
            if (newAmt === 0 || diff <= -200000) {
              isCritical = true;
              critique = "Pemangkasan rokok hingga nol/sangat rendah adalah keputusan luar biasa! Namun pastikan tidak memicu stres berlebih yang mengalihkan pengeluaran ke jajan lain.";
              shortCritique = "Pemangkasan rokok drastis, waspadai stres withdrawal";
            } else {
              critique = "Langkah awal yang baik untuk mengurangi konsumsi rokok. Pertahankan dan coba pangkas lebih banyak di bulan berikutnya.";
              shortCritique = "Langkah awal mengurangi rokok secara bertahap";
            }
          }
        }
        // Special logic for food / sembako / dapur
        else if (nameLower.includes("makan") || nameLower.includes("sembako") || nameLower.includes("dapur") || nameLower.includes("konsumsi")) {
          description = "Anggaran belanja bahan pokok pangan dan konsumsi harian.";
          if (diff < 0) {
            const cutPercent = Math.abs(diff) / (oldAmt || 1);
            if (cutPercent > 0.3) {
              isCritical = true;
              critique = "Pemangkasan pos makanan terlalu ekstrim berisiko mengorbankan gizi keluarga. Pertimbangkan kembali keputusan ini agar kesehatan tidak terganggu.";
              shortCritique = "Potong belanja makanan >30% berisiko kurangi gizi";
            } else {
              critique = "Pemotongan kecil pada pos konsumsi. Pastikan kebutuhan gizi harian tetap terpenuhi dengan baik.";
              shortCritique = "Pengurangan kecil anggaran makanan bulanan";
            }
          } else {
            critique = "Peningkatan pos makan. Wajar untuk menyesuaikan dengan inflasi bahan pokok, namun pastikan tidak membuang sisa makanan.";
            shortCritique = "Peningkatan pos makan bulanan, jaga efisiensi";
          }
        }
        // Special logic for SPP / Pendidikan
        else if (nameLower.includes("spp") || nameLower.includes("sekolah") || nameLower.includes("pendidikan")) {
          description = "Biaya SPP bulanan dan perlengkapan sekolah anak.";
          if (diff < 0) {
            isCritical = true;
            critique = "Pos pendidikan anak sangat krusial demi masa depan mereka. Mengurangi pos ini sangat berisiko dan tidak disarankan.";
            shortCritique = "Jangan memotong anggaran SPP/pendidikan anak!";
          } else {
            critique = "Penambahan anggaran pendidikan sangat baik untuk menunjang fasilitas belajar anak.";
            shortCritique = "Peningkatan anggaran pendidikan anak";
          }
        }
        // Special logic for transport / bensin
        else if (nameLower.includes("bensin") || nameLower.includes("transport")) {
          description = "Biaya bahan bakar, parkir, dan ongkos perjalanan harian.";
          if (diff < 0) {
            const cutPercent = Math.abs(diff) / (oldAmt || 1);
            if (cutPercent > 0.4) {
              isCritical = true;
              critique = "Pemotongan bensin/transportasi terlalu besar dapat mengganggu mobilitas harianmu untuk bekerja.";
              shortCritique = "Potong bensin >40% ganggu mobilitas kerja";
            } else {
              critique = "Penghematan transportasi yang baik. Coba gunakan alternatif transportasi umum atau rute yang lebih efisien.";
              shortCritique = "Penghematan kecil biaya transportasi bulanan";
            }
          } else {
            critique = "Kenaikan pos transportasi. Pastikan memang diperlukan untuk operasional harian yang produktif.";
            shortCritique = "Kenaikan biaya transportasi bulanan";
          }
        }
        // Tabungan
        else if (currentCat.type === "savings") {
          description = "Alokasi simpanan untuk masa depan dan dana darurat.";
          if (diff < 0) {
            isCritical = true;
            critique = "Memangkas tabungan darurat membuat pertahanan keuanganmu rentan jika terjadi musibah mendadak. Sebaiknya pertahankan alokasi awal.";
            shortCritique = "Pangkas tabungan memperlemah dana darurat";
          } else {
            critique = "Keputusan yang sangat baik! Menambah porsi tabungan akan mempercepat tercapainya kebebasan finansial.";
            shortCritique = "Penambahan porsi tabungan sangat positif";
          }
        }
        // Wants / Gaya hidup
        else if (currentCat.type === "wants") {
          description = "Anggaran hiburan, hobi, jajan, dan rekreasi.";
          if (diff > 0) {
            isCritical = true;
            critique = "Menaikkan anggaran gaya hidup/jajan di saat pos lain belum optimal berisiko membuat pengeluaran bengkak dan keuangan tidak stabil.";
            shortCritique = "Kenaikan gaya hidup kurangi dana kebutuhan wajib";
          } else {
            critique = "Bagus! Memangkas gaya hidup membantu memperkuat tabungan dan mengamankan kebutuhan pokok.";
            shortCritique = "Pemangkasan gaya hidup bantu perkuat tabungan";
          }
        }
        // Debts / Hutang
        else if (currentCat.type === "debts") {
          description = "Kewajiban pelunasan utang dan cicilan bulanan.";
          if (diff < 0) {
            isCritical = true;
            critique = "Mengurangi alokasi cicilan utang berisiko denda atau skor kredit buruk. Prioritaskan pelunasan hutang tepat waktu.";
            shortCritique = "Pangkas cicilan utang berisiko denda/bunga";
          } else {
            critique = "Menambah porsi pelunasan hutang lebih cepat sangat baik untuk meringankan beban bunga jangka panjang.";
            shortCritique = "Pelunasan hutang lebih cepat lebih baik";
          }
        }
        // Default fallback
        else {
          if (diff < 0) {
            critique = `Kamu mengurangi pos ${currentItem.name}. Penghematan ini dapat dialokasikan ke tabungan atau pos wajib lainnya.`;
            shortCritique = `Pengurangan anggaran pada pos ${currentItem.name}`;
          } else {
            critique = `Kamu menambah pos ${currentItem.name}. Pastikan penambahan ini mendesak and tidak mengganggu alokasi penting lainnya.`;
            shortCritique = `Penambahan anggaran pada pos ${currentItem.name}`;
          }
        }

        list.push({
          name: currentItem.name,
          categoryName: currentCat.name,
          oldAmount: oldAmt,
          newAmount: newAmt,
          difference: diff,
          isCritical,
          description,
          critique,
          shortCritique,
        });
      }
    });

    // Check for deleted items
    originalCat.items.forEach((originalItem: any) => {
      const currentItem = currentCat.items.find(
        (i) => i.name.toLowerCase() === originalItem.name.toLowerCase()
      );
      if (!currentItem) {
        const oldAmt = originalItem.amount;
        const newAmt = 0;
        const diff = -oldAmt;
        const nameLower = originalItem.name.toLowerCase();

        let description = `Pengeluaran pos ${currentCat.name}.`;
        let critique = "";
        let shortCritique = "";
        let isCritical = false;

        if (nameLower.includes("rokok")) {
          description = "Anggaran untuk rokok. Ini dipangkas drastis menjadi nol demi kesehatan finansial dan pribadi yang lebih baik.";
          isCritical = true;
          critique = "Pemangkasan rokok hingga nol adalah keputusan luar biasa! Namun pastikan tidak memicu stres berlebih yang mengalihkan pengeluaran ke jajan lain.";
          shortCritique = "Hapus pos rokok sepenuhnya, awasi pengalihan jajan";
        } else if (nameLower.includes("makan") || nameLower.includes("sembako") || nameLower.includes("dapur") || nameLower.includes("konsumsi")) {
          description = "Anggaran belanja bahan pokok pangan dan konsumsi harian.";
          isCritical = true;
          critique = "Menghapus pos makanan sama sekali sangat berbahaya bagi kelangsungan hidup harian. Pastikan pos ini tidak kosong.";
          shortCritique = "Sangat bahaya menghapus pos makanan pokok harian!";
        } else if (nameLower.includes("spp") || nameLower.includes("sekolah") || nameLower.includes("pendidikan")) {
          description = "Biaya SPP bulanan dan perlengkapan sekolah anak.";
          isCritical = true;
          critique = "Menghapus pos pendidikan anak sangat tidak disarankan karena berdampak buruk pada masa depan anak.";
          shortCritique = "Jangan hapus pos pendidikan/SPP sekolah anak!";
        } else if (nameLower.includes("bensin") || nameLower.includes("transport")) {
          description = "Biaya bahan bakar, parkir, dan ongkos perjalanan harian.";
          isCritical = true;
          critique = "Menghapus biaya transportasi kerja dapat melumpuhkan produktivitas harianmu.";
          shortCritique = "Jangan hilangkan pos biaya transportasi kerja!";
        } else if (originalCat.type === "savings") {
          description = "Alokasi simpanan untuk masa depan dan dana darurat.";
          isCritical = true;
          critique = "Menghapus pos tabungan/investasi menghilangkan jaring pengaman keuanganmu di masa depan.";
          shortCritique = "Jangan hilangkan pos tabungan darurat & investasi!";
        } else {
          critique = `Kamu menghapus pos ${originalItem.name}. Penghematan ini dapat dialokasikan ke pos penting lainnya.`;
          shortCritique = `Penghapusan pos pengeluaran ${originalItem.name}`;
        }

        list.push({
          name: originalItem.name,
          categoryName: currentCat.name,
          oldAmount: oldAmt,
          newAmount: newAmt,
          difference: diff,
          isCritical,
          description,
          critique,
          shortCritique,
        });
      }
    });
  });

  return list;
}
