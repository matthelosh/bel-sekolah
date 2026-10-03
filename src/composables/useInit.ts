import { ref } from 'vue';
import { readDir, writeFile, writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { join, documentDir } from '@tauri-apps/api/path';

const initialized = ref(false);
const initError = ref<string | null>(null);

export function useInit() {
  const ensureDir = async (dirPath: string): Promise<void> => {
    try {
      await readDir(dirPath, { baseDir: BaseDirectory.Document });
    } catch {
      await mkdir(dirPath, { baseDir: BaseDirectory.Document, recursive: true });
    }
  };

  const copyPublicToDocument = async (publicPath: string, documentPath: string): Promise<void> => {
    try {
      const response = await fetch(publicPath);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      await writeFile(documentPath, data, { baseDir: BaseDirectory.Document });
    } catch (err) {
      console.error(`Failed to copy ${publicPath}:`, err);
    }
  };

  const initBelFolder = async (): Promise<boolean> => {
    if (initialized.value) return true;

    try {
      const docPath = await documentDir();
      const belPath = await join(docPath, 'bel');
      const loncengPath = await join(belPath, 'lonceng');
      const laguNasionalPath = await join(belPath, 'lagunasional');
      const religiPath = await join(belPath, 'religi');
      const pramukaPath = await join(belPath, 'pramuka');

      await ensureDir(belPath);
      await ensureDir(loncengPath);
      await ensureDir(laguNasionalPath);
      await ensureDir(religiPath);
      await ensureDir(pramukaPath);

      const hasLonceng = await exists('bel/lonceng/jamke_1.mp3', { baseDir: BaseDirectory.Document }).catch(() => false);
      if (!hasLonceng) {
        await copyPublicToDocument('/lonceng/jamke_1.mp3', 'bel/lonceng/jamke_1.mp3');
        await copyPublicToDocument('/lonceng/jamke_2.mp3', 'bel/lonceng/jamke_2.mp3');
        await copyPublicToDocument('/lonceng/jamke_3.mp3', 'bel/lonceng/jamke_3.mp3');
        await copyPublicToDocument('/lonceng/jamke_4.mp3', 'bel/lonceng/jamke_4.mp3');
        await copyPublicToDocument('/lonceng/jamke_5.mp3', 'bel/lonceng/jamke_5.mp3');
        await copyPublicToDocument('/lonceng/jamke_6.mp3', 'bel/lonceng/jamke_6.mp3');
        await copyPublicToDocument('/lonceng/jamke_7.mp3', 'bel/lonceng/jamke_7.mp3');
        await copyPublicToDocument('/lonceng/jamke_8.mp3', 'bel/lonceng/jamke_8.mp3');
        await copyPublicToDocument('/lonceng/break_1.mp3', 'bel/lonceng/break_1.mp3');
        await copyPublicToDocument('/lonceng/break_3.mp3', 'bel/lonceng/break_3.mp3');
        await copyPublicToDocument('/lonceng/dhuhur.mp3', 'bel/lonceng/dhuhur.mp3');
        await copyPublicToDocument('/lonceng/day_end.mp3', 'bel/lonceng/day_end.mp3');
        await copyPublicToDocument('/lonceng/upacara.mp3', 'bel/lonceng/upacara.mp3');
        await copyPublicToDocument('/lonceng/week_end.mp3', 'bel/lonceng/week_end.mp3');
      }

      const hasJadwal = await exists('bel/jadwal.json', { baseDir: BaseDirectory.Document }).catch(() => false);
      if (!hasJadwal) {
        await copyPublicToDocument('/jadwal.json', 'bel/jadwal.json');
      }

      const hasSettings = await exists('bel/settings.json', { baseDir: BaseDirectory.Document }).catch(() => false);
      if (!hasSettings) {
        await writeTextFile(
          'bel/settings.json',
          JSON.stringify({ schoolName: 'SD Negeri 1 Bedalisodo', volume: 1 }, null, 2),
          { baseDir: BaseDirectory.Document }
        );
      }

      initialized.value = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize bel folder:', err);
      initError.value = 'Gagal menginisialisasi folder bel';
      return false;
    }
  };

  return {
    initialized,
    initError,
    initBelFolder
  };
}
