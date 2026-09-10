import { ref, computed } from 'vue';
import { read, utils, writeFile as xlsxWriteFile } from 'xlsx';
import { readFile, writeFile as tauriWriteFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import type { JadwalEntry } from '../types/schedule';

const jadwals = ref<JadwalEntry[]>([]);
const fullJadwal = ref<Record<string, JadwalEntry[]>>({});
const error = ref<string | null>(null);

const normalizeTime = (time: string): string => {
  return time.replace(/\./g, ':').trim();
};

const hari = computed(() => {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long' });
});

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const loadJadwal = async () => {
  try {
    const response = await fetch('/jadwal.json');
    const jsonData = await response.json();
    const defaultJadwal: Record<string, JadwalEntry[]> = jsonData as Record<string, JadwalEntry[]>;
    fullJadwal.value = defaultJadwal;
    jadwals.value = ((defaultJadwal[hari.value] || []) as unknown as JadwalEntry[]).map(item => ({
      ...item,
      waktu: normalizeTime(item.waktu)
    }));
  } catch (err) {
    console.error('Failed to load default jadwal:', err);
    error.value = 'Gagal memuat jadwal default';
  }
};

const loadJadwalFromExcel = async () => {
  try {
    const docPath = await documentDir();
    const filePath = await join(docPath, 'bel', 'jadwal.xlsx');
    const fileBin = await readFile(filePath);
    const wb = read(fileBin, { type: 'array' });
    
    fullJadwal.value = {};
    days.forEach(day => {
      const ws = wb.Sheets[day];
      if (ws) {
        const dataJadwals: Record<string, string>[] = utils.sheet_to_json(ws);
        fullJadwal.value[day] = (dataJadwals as unknown as JadwalEntry[]).map(item => ({
          ...item,
          waktu: normalizeTime(item.waktu)
        }));
      }
    });

    const todaySheet = wb.Sheets[hari.value];
    if (todaySheet) {
      const dataJadwals: Record<string, string>[] = utils.sheet_to_json(todaySheet);
      jadwals.value = (dataJadwals as unknown as JadwalEntry[]).map(item => ({
        ...item,
        waktu: normalizeTime(item.waktu)
      }));
    } else {
      jadwals.value = [];
    }
  } catch (err) {
    console.error('Failed to load Excel jadwal:', err);
    await loadJadwal();
  }
};

const saveJadwalToExcel = async (entries: JadwalEntry[]) => {
  try {
    const docPath = await documentDir();
    const filePath = await join(docPath, 'bel', 'jadwal.xlsx');
    
    const existsFile = await exists('bel/jadwal.xlsx', { baseDir: BaseDirectory.Document });
    let wb: ReturnType<typeof read>;
    
    if (existsFile) {
      const fileBin = await readFile(filePath);
      wb = read(fileBin, { type: 'array' });
    } else {
      wb = utils.book_new();
    }

    const todayData = entries.map(entry => ({
      waktu: entry.waktu,
      kegiatan: entry.kegiatan,
      suara: entry.suara || ''
    }));

    const ws = utils.json_to_sheet(todayData);
    
    if (existsFile) {
      wb.Sheets[hari.value] = ws;
    } else {
      utils.book_append_sheet(wb, ws, hari.value);
    }

    const wbout = xlsxWriteFile(wb, 'jadwal.xlsx', { type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const buffer = await blob.arrayBuffer();
    const data = new Uint8Array(buffer);
    await tauriWriteFile(filePath, data);
    
    return true;
  } catch (err) {
    console.error('Failed to save Excel jadwal:', err);
    throw err;
  }
};

const saveJadwalToJson = async (entries: JadwalEntry[]) => {
  try {
    const updated = { ...fullJadwal.value };
    updated[hari.value] = entries;
    const content = JSON.stringify(updated, null, 2);
    await writeTextFile('bel/jadwal.json', content, { baseDir: BaseDirectory.Document });
    return true;
  } catch (err) {
    console.error('Failed to save JSON jadwal:', err);
    throw err;
  }
};

let intervalId: ReturnType<typeof setInterval> | null = null;

const startScheduleCheck = (onMatch: (entry: JadwalEntry) => void) => {
  intervalId = setInterval(() => {
    const now = new Date();
    const jamMenit = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).replace('.', ':');
    
    const match = jadwals.value.find(j => j.waktu === jamMenit);
    if (match && now.getSeconds() === 0) {
      onMatch(match);
    }
  }, 1000);
};

const stopScheduleCheck = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export function useSchedule() {
  return {
    jadwals,
    hari,
    error,
    loadJadwal,
    loadJadwalFromExcel,
    saveJadwalToExcel,
    saveJadwalToJson,
    startScheduleCheck,
    stopScheduleCheck,
    normalizeTime
  };
}
