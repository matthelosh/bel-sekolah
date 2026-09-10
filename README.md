# Bel Sekolah

Aplikasi bel sekolah otomatis untuk SD Negeri 1 Bedalisodo. Dibangun dengan Tauri + Vue + TypeScript + Tailwind CSS.

## Struktur File

Aplikasi menyimpan data di folder `Documents/bel/` pada sistem:

```
Documents/bel/
├── jadwal.xlsx          # Jadwal pelajaran per hari
├── settings.json        # Pengaturan aplikasi
├── lonceng/             # Audio bel sekolah
│   ├── jamke_1.mp3
│   ├── jamke_2.mp3
│   ├── ...
│   └── day_end.mp3
├── lagunasional/        # Lagu nasional
│   └── *.mp3
└── religi/              # Audio religi
    └── *.mp3
```

## Cara Menyiapkan File Audio

### Metode 1: Salin dari folder `public/` (paling mudah)

1. Build aplikasi: `bun run tauri build`
2. Buka folder `src-tauri/target/release/bundle/` dan install aplikasi
3. Jalankan aplikasi
4. Salin folder `public/lonceng/` ke `Documents/bel/lonceng/`
5. Salin folder audio lain jika diperlukan ke `Documents/bel/lagunasional/` dan `Documents/bel/religi/`

### Metode 2: Letakkan file langsung

Letakkan semua file audio di folder berikut:

- **Bel sekolah**: `~/Documents/bel/lonceng/`
- **Lagu nasional**: `~/Documents/bel/lagunasional/`
- **Audio religi**: `~/Documents/bel/religi/`

## Cara Menyiapkan Jadwal

### Excel (disarankan)

Letakkan file `jadwal.xlsx` di `~/Documents/bel/`.

Format Excel:
- Setiap sheet bernama sesuai hari: `Senin`, `Selasa`, `Rabu`, `Kamis`, `Jumat`, `Sabtu`
- Kolom: `waktu`, `kegiatan`, `suara` (opsional)

Contoh data:
| waktu | kegiatan | suara |
|-------|----------|-------|
| 07:00 | Jam Pertama | jamke_1.mp3 |
| 07:35 | Jam Kedua | jamke_2.mp3 |
| 08:10 | Jam Ketiga | jamke_3.mp3 |

### JSON (fallback)

File `jadwal.json` di folder `public/` digunakan sebagai fallback jika `jadwal.xlsx` tidak ditemukan.

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
- [XLSX](https://github.com/SheetJS/sheetjs) untuk Excel

## License

Private - SD Negeri 1 Bedalisodo
