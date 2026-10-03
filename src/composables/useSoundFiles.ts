import { ref } from 'vue';
import { readDir, writeFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const LONCENG_DIR = 'bel/lonceng';
const SUPPORTED_EXT = '.mp3';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const soundFiles = ref<string[]>([]);
const isImporting = ref(false);

const sanitizeName = (raw: string): string => {
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[<>:"|?*\u0000-\u001f]/g, '_').trim();
  if (!cleaned) return `suara${SUPPORTED_EXT}`;
  if (/\.mp3$/i.test(cleaned)) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  return `${dot > 0 ? cleaned.slice(0, dot) : cleaned}${SUPPORTED_EXT}`;
};

const listSoundFiles = async (): Promise<string[]> => {
  if (!isTauri) {
    soundFiles.value = [];
    return soundFiles.value;
  }
  try {
    const entries = await readDir(LONCENG_DIR, { baseDir: BaseDirectory.Document });
    soundFiles.value = entries
      .filter(entry => !entry.isDirectory && entry.name.toLowerCase().endsWith(SUPPORTED_EXT))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, 'id'));
  } catch (err) {
    console.error('Gagal membaca daftar file suara:', err);
    soundFiles.value = [];
  }
  return soundFiles.value;
};

const importSoundFile = async (file: File): Promise<{ name: string; replaced: boolean }> => {
  if (!isTauri) {
    throw new Error('Impor file suara hanya tersedia di aplikasi desktop');
  }
  if (!file.name.toLowerCase().endsWith(SUPPORTED_EXT)) {
    throw new Error(`Hanya file ${SUPPORTED_EXT} yang didukung`);
  }

  const name = sanitizeName(file.name);
  const target = `${LONCENG_DIR}/${name}`;
  const replaced = await exists(target, { baseDir: BaseDirectory.Document }).catch(() => false);

  isImporting.value = true;
  try {
    const buffer = await file.arrayBuffer();
    await writeFile(target, new Uint8Array(buffer), { baseDir: BaseDirectory.Document });
  } catch (err) {
    console.error('Gagal mengimpor file suara:', err);
    throw new Error(`Gagal menyimpan ${name}`);
  } finally {
    isImporting.value = false;
  }

  await listSoundFiles();
  return { name, replaced };
};

const hasSoundFile = (name?: string): boolean => {
  if (!name) return false;
  return soundFiles.value.includes(name);
};

export function useSoundFiles() {
  return {
    soundFiles,
    isImporting,
    listSoundFiles,
    importSoundFile,
    hasSoundFile
  };
}
