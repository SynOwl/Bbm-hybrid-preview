# Belajar Bareng Mami 💖 (BBM)

Aplikasi edukatif dan gamifikasi belajar interaktif ramah anak kelas 4 SD (Grace), dikombinasikan dengan tema grup idola K-pop **Hearts2Hearts (H2H)**.

Aplikasi ini telah direwrite sepenuhnya menjadi aplikasi modern berbasis **React 18 + TypeScript + Vite**.

---

## 🚀 Fitur Utama & Logika Bisnis

1. **Struktur Pembelajaran 10 Mata Pelajaran (Mapel)**
   - Matematika, IPAS, Bahasa Indonesia, Bahasa Inggris, Pendidikan Pancasila, Agama Kristen, PJOK, Seni Musik, Seni Rupa, Bahasa Sunda.
   - Dilengkapi sistem kuota mingguan (3 sesi per mapel) dan reset otomatis setiap Senin pukul 00:00.
   - Sesi latihan mingguan (Hari Minggu) dengan mapel Matematika gratis / uncounted.

2. **Mode Belajar**
   - **Mode 1 (Tambah Waktu)**: Belajar 20 menit untuk menabung 15 menit waktu bermain.
   - **Mode 2 (Buka Kunci)**: Menukarkan 20 menit tabungan waktu untuk bermain game/hiburan.

3. **Gamifikasi & Progres Grace**
   - **Tabungan Waktu**: Dilacak dalam menit (maksimal 300 menit).
   - **Petualangan Grace**: Leveling (100 XP per level) dan pelacak Streak harian (api membara).
   - **7 Lencana Prestasi (Badges)**: Pembelajar Rajin, Bintang Matematika, Sang Juara, Ahli Trivia, Pemancing Handal, Kolektor Foto, Detektif Cilik.

4. **12 Game Edukasi & Rekreasi**
   - 🎣 **Mancing Ikan**: Game memancing interaktif dengan getaran pancing, animasi ikan berenang, tegangnya tali pancing, dan beragam jenis ikan/zonk/harta karun.
   - 🎯 **Lempar Sasaran**: Uji ketepatan & kekuatan lemparan dengan indikator dinamis.
   - 🎁 **Kotak Misteri**: 9 kotak kejutan berhadiah XP, waktu, atau zonk.
   - 🎡 **Roda Hadiah**: Roda putar beranimasi dengan jarum penunjuk keberuntungan.
   - 🦆 **Tangkap Bebek**: Kolam bebek 30 detik dengan bebek reguler, bebek emas berbonus tinggi, dan bebek zonk.
   - 🔮 **Bola Ramalan**: Bola kristal 3D dengan Web Speech Synthesis (suara ramalan ramah anak).
   - ⚡ **Hitung Cepat**: Kuis matematika penjumlahan, pengurangan, dan perkalian.
   - 🧩 **Tebak Pola**: Deret angka berpola logis.
   - 🔢 **Tebak Angka**: Game tebak angka 1-50 dengan petunjuk "Lebih besar" / "Lebih kecil".
   - 🧠 **Ingat Urutan**: Simon-says pengingat urutan emoji.
   - 🔤 **Susun Kata**: Anagram kosakata bahasa Indonesia dan Inggris.
   - 🤔 **Teka-Teki**: Tebak-tebakan lucu dan mendidik khas anak-anak.

5. **Katalog & Profil Hearts2Hearts (H2H)**
   - 8 Member: Jiwoo, Carmen, Yuha, Stella, Juun, Ana, Ian, Yeon + Tema Grup H2H.
   - Personalisasi avatar & custom foto profil yang tersimpan lokal di IndexedDB.
   - Wallpaper dinamis & palet warna bertema per member.
   - Katalog video YouTube & Shorts, serta Reels player interaktif vertikal.

6. **Integrasi WhatsApp & Keamanan Anak**
   - Pengiriman otomatis format pesan WA terstruktur ke Mami (`6285778843327`) untuk verifikasi belajar, klaim bonus, dan pelaporan harian.
   - **AI Aman**: Pembuat prompt belajar AI ramah anak dengan filter kata terlarang (konten dewasa, kekerasan, kata kasar, dll.) untuk memastikan anak belajar dengan aman.

---

## 🛠️ Arsitektur Teknologi

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS & CSS kustom dengan variabel tema CSS (`--bg1`, `--bg2`, `--acc1`, `--acc2`)
- **Audio**: Web Audio API Synthesizer (suara klik, koin, menang, kalah, level up, joran lempar, roda putar) & Web Speech Synthesis
- **Penyimpanan Lokal**:
  - `localStorage`: Tabungan waktu, XP, level, streak, badges, kuota mingguan, riwayat belajar.
  - `IndexedDB`: Foto member kustom offline.

---

## 📦 Menjalankan Aplikasi

```bash
# Menjalankan dev server
npm run dev

# Kompilasi aplikasi untuk produksi
npm run build
```