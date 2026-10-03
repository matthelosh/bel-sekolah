import { ref, computed } from 'vue';
import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import type { JadwalEntry } from '../types/schedule';

const JADWAL_PATH = 'bel/jadwal.json';
const DEFAULT_JADWAL_URL = '/jadwal.json';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

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

const getJadwalByDay = (day: string): JadwalEntry[] => {
  return (fullJadwal.value[day] ?? []).map(item => ({ ...item }));
};

const normalizeEntries = (list: JadwalEntry[]): JadwalEntry[] => {
  return (list ?? [])
    .filter(item => item && item.waktu)
    .map(item => ({
      waktu: normalizeTime(String(item.waktu)),
      kegiatan: String(item.kegiatan ?? ''),
      suara: item.suara ? String(item.suara) : ''
    }))
    .sort((a, b) => a.waktu.localeCompare(b.waktu));
};

const writeStoredJadwal = async (data: Record<string, JadwalEntry[]>): Promise<void> => {
  await writeTextFile(JADWAL_PATH, JSON.stringify(data, null, 2), { baseDir: BaseDirectory.Document });
};

const fetchDefaultJadwal = async (): Promise<Record<string, JadwalEntry[]>> => {
  const response = await fetch(DEFAULT_JADWAL_URL);
  return (await response.json()) as Record<string, JadwalEntry[]>;
};

const loadJadwal = async () => {
  try {
    const hasStored = isTauri
      ? await exists(JADWAL_PATH, { baseDir: BaseDirectory.Document }).catch(() => false)
      : false;

    let data: Record<string, JadwalEntry[]>;
    if (hasStored) {
      const content = await readTextFile(JADWAL_PATH, { baseDir: BaseDirectory.Document });
      data = JSON.parse(content) as Record<string, JadwalEntry[]>;
    } else {
      data = await fetchDefaultJadwal();
      if (isTauri) {
        await writeStoredJadwal(data);
      }
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Format jadwal tidak valid');
    }

    fullJadwal.value = Object.fromEntries(
      Object.entries(data).map(([day, list]) => [day, normalizeEntries(list)])
    );
    jadwals.value = fullJadwal.value[hari.value] ?? [];
  } catch (err) {
    console.error('Failed to load jadwal:', err);
    error.value = 'Gagal memuat jadwal';
    jadwals.value = [];
  }
};

const saveJadwal = async (entries: JadwalEntry[], day: string = hari.value): Promise<boolean> => {
  if (!isTauri) {
    throw new Error('Penyimpanan jadwal hanya tersedia di aplikasi desktop');
  }
  try {
    const updated: Record<string, JadwalEntry[]> = {
      ...fullJadwal.value,
      [day]: normalizeEntries(entries)
    };
    await writeStoredJadwal(updated);
    fullJadwal.value = updated;
    if (day === hari.value) {
      jadwals.value = updated[day];
    }
    return true;
  } catch (err) {
    console.error('Failed to save jadwal:', err);
    throw err;
  }
};

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTriggered = '';

const startScheduleCheck = (onMatch: (entry: JadwalEntry) => void) => {
  intervalId = setInterval(() => {
    const now = new Date();
    if (now.getSeconds() > 3) return;

    const jamMenit = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).replace('.', ':');

    const key = `${hari.value}-${jamMenit}`;
    if (lastTriggered === key) return;

    const match = jadwals.value.find(j => j.waktu === jamMenit);
    if (!match) return;

    lastTriggered = key;
    onMatch(match);
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
    days,
    error,
    getJadwalByDay,
    loadJadwal,
    saveJadwal,
    startScheduleCheck,
    stopScheduleCheck,
    normalizeTime
  };
}
