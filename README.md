# Bel Sekolah

Aplikasi bel sekolah otomatis untuk SD Negeri 1 Bedalisodo. Dibangun dengan Tauri + Vue + TypeScript + Tailwind CSS.

## Struktur File

Aplikasi menyimpan data di folder `Documents/bel/` pada sistem:

```
Documents/bel/
├── jadwal.json           # Jadwal pelajaran per hari
├── settings.json        # Pengaturan aplikasi
├── lonceng/             # Audio bel sekolah
│   ├── jamke_1.mp3
│   ├── jamke_2.mp3
│   ├── ...
│   └── day_end.mp3
├── lagunasional/        # Lagu nasional
│   └── *.mp3
├── religi/              # Audio religi
│   └── *.mp3
└── pramuka/             # Lagu pramuka
    └── *.mp3
```

## Cara Menyiapkan File Audio

### Metode 1: Salin dari folder `public/` (paling mudah)

1. Build aplikasi: `bun run tauri build`
2. Buka folder `src-tauri/target/release/bundle/` dan install aplikasi
3. Jalankan aplikasi
4. Salin folder `public/lonceng/` ke `Documents/bel/lonceng/`
5. Salin folder audio lain jika diperlukan ke `Documents/bel/lagunasional/`, `Documents/bel/religi/`, dan `Documents/bel/pramuka/`

### Metode 2: Letakkan file langsung

Letakkan semua file audio di folder berikut:

- **Bel sekolah**: `~/Documents/bel/lonceng/`
- **Lagu nasional**: `~/Documents/bel/lagunasional/`
- **Audio religi**: `~/Documents/bel/religi/`
- **Lagu pramuka**: `~/Documents/bel/pramuka/`

### Mengganti File Suara

Halaman **Edit Jadwal** menyediakan pemilih file suara pada kolom `Suara`:

- **Impor** — pilih file `.mp3` dari komputer, file otomatis disalin ke `Documents/bel/lonceng/`. Jika nama file sudah ada, file tersebut digantikan.
- **Daftar** — nama file yang tersedia di folder `lonceng` bisa dipilih dari dropdown tanpa mengetik manual.
- **Putar** — tombol play untuk mendengarkan suara sebelum disimpan.
- Jadwal yang menunjuk file yang sudah hilang ditandai badge `file hilang`.

Kolom `suara` pada `jadwal.json` menyimpan nama file (contoh: `jamke_1.mp3`).

## Cara Menyiapkan Jadwal

Jadwal disimpan sebagai satu file JSON di `~/Documents/bel/jadwal.json`, dengan kunci nama hari:

```json
{
  "Senin": [
    { "waktu": "07:00", "kegiatan": "Jam Pertama", "suara": "jamke_1.mp3" },
    { "waktu": "07:35", "kegiatan": "Jam Kedua", "suara": "jamke_2.mp3" }
  ]
}
```

Kalau file tersebut belum ada, aplikasi menyalin otomatis dari `public/jadwal.json`.

### Edit Jadwal

Jadwal dapat diubah langsung dari aplikasi lewat halaman **Edit Jadwal** (tombol di header), lalu disimpan dengan tombol **Simpan Semua**. Field yang bisa diisi: `waktu` (HH:MM), `kegiatan`, dan `suara` (pilih atau impor file `.mp3`). Perubahan hanya berlaku untuk hari yang sedang berjalan — untuk mengganti hari lain, edit file `jadwal.json` langsung atau ubah tanggal sistem.

## Pengaturan

File `settings.json` di `~/Documents/bel/` opsional. Format:

```json
{
  "schoolName": "SD Negeri 1 Bedalisodo",
  "volume": 1.0
}
```

Jika file tidak ada, aplikasi menggunakan nilai default.

## Build

```bash
# Install dependencies
bun install

# Development
bun run dev

# Build for production
bun run build
bun run tauri build
```

## Target Build

- **Windows**: `.exe`, `.msi`
- **Linux**: `.deb`, `.AppImage`
- **macOS**: `.app`, `.dmg`

## Teknologi

- [Tauri](https://tauri.app/) v2
- [Vue](https://vuejs.org/) 3
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [DaisyUI](https://daisyui.com/)
- [XLSX](https://github.com/SheetJS/sheetjs) untuk Excel (dihapus pada v1.2.4, jadwal kini disimpan sebagai JSON)

## License

Private - SD Negeri 1 Bedalisodo
