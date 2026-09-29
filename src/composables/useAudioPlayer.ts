import { ref } from 'vue';
import { readFile } from '@tauri-apps/plugin-fs';
import { documentDir, join } from '@tauri-apps/api/path';
import type { AudioStatus } from '../types/schedule';

const audio = new Audio();
const volume = ref(1);

const status = ref<AudioStatus>({
  text: 'Menunggu...',
  id: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isDragging: false
});

const progressLagu = ref(0);

let currentBlobUrl: string | null = null;

const revokeCurrentBlob = () => {
  if (currentBlobUrl && currentBlobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
};

const cleanUpAudio = () => {
  audio.pause();
  audio.removeAttribute('src');
  audio.currentTime = 0;
  audio.onended = null;
  revokeCurrentBlob();
};

const getAbsolutePath = async (folder: string, fileName: string): Promise<string> => {
  const docPath = await documentDir();
  return await join(docPath, 'bel', folder, fileName);
};

const playLagu = async (folder: string, fileName: string, idx: number, listLength: number) => {
  try {
    const absolutePath = await getAbsolutePath(folder, fileName);
    const data = await readFile(absolutePath);

    revokeCurrentBlob();
    cleanUpAudio();

    const blob = new Blob([data], { type: 'audio/mpeg' });
    currentBlobUrl = URL.createObjectURL(blob);

    audio.src = currentBlobUrl;
    audio.volume = volume.value;
    audio.preload = 'auto';

    status.value = {
      text: `${idx + 1}. ${fileName}`,
      id: idx,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      isDragging: false
    };
    progressLagu.value = 0;

    await audio.play();

    audio.onloadedmetadata = () => {
      status.value.duration = audio.duration;
    };

    audio.ontimeupdate = () => {
      if (!status.value.isDragging) {
        status.value.currentTime = audio.currentTime;
        if (audio.duration) {
          progressLagu.value = (audio.currentTime / audio.duration) * 100;
        }
      }
    };

    audio.onended = () => {
      revokeCurrentBlob();
      progressLagu.value = 0;

      if (idx < listLength - 1) {
        // Auto-next will be handled by caller or via event
      } else {
        status.value = {
          text: 'Menunggu...',
          id: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          isDragging: false
        };
      }
    };
  } catch (err) {
    console.error('Gagal putar lagu:', err);
    status.value.isPlaying = false;
    revokeCurrentBlob();
  }
};

const playBell = async (soundFile: string) => {
  try {
    const absolutePath = await getAbsolutePath('lonceng', soundFile);
    const data = await readFile(absolutePath);

    revokeCurrentBlob();
    cleanUpAudio();

    const blob = new Blob([data], { type: 'audio/mpeg' });
    currentBlobUrl = URL.createObjectURL(blob);

    audio.src = currentBlobUrl;
    audio.volume = volume.value;
    audio.preload = 'auto';

    status.value = {
      text: soundFile,
      id: -1,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      isDragging: false
    };
    progressLagu.value = 0;

    await audio.play();

    audio.onloadedmetadata = () => {
      status.value.duration = audio.duration;
    };

    audio.ontimeupdate = () => {
      if (!status.value.isDragging) {
        status.value.currentTime = audio.currentTime;
        if (audio.duration) {
          progressLagu.value = (audio.currentTime / audio.duration) * 100;
        }
      }
    };

    audio.onended = () => {
      revokeCurrentBlob();
      status.value = {
        text: 'Menunggu...',
        id: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isDragging: false
      };
    };
  } catch (err) {
    console.error('Gagal putar bel:', err);
    revokeCurrentBlob();
  }
};

const togglePause = () => {
  if (!audio.src) return false;
  if (audio.paused) {
    audio.play();
    status.value.isPlaying = true;
  } else {
    audio.pause();
    status.value.isPlaying = false;
  }
};

const stopAudio = () => {
  cleanUpAudio();
  status.value = {
    text: 'Menunggu...',
    id: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isDragging: false
  };
  progressLagu.value = 0;
};

const playNext = (listLength: number) => {
  const idx = status.value.id;
  if (idx !== null && idx >= 0 && idx < listLength - 1) {
    const nextIdx = idx + 1;
    return nextIdx;
  }
  return null;
};

const playPrev = (_listLength: number) => {
  const idx = status.value.id;
  if (idx !== null && idx > 0) {
    const prevIdx = idx - 1;
    return prevIdx;
  }
  return null;
};

const seek = (time: number) => {
  audio.currentTime = time;
  status.value.currentTime = time;
};

const setVolume = (val: number) => {
  volume.value = Math.max(0, Math.min(1, val));
  audio.volume = volume.value;
};

export function useAudioPlayer() {
  return {
    audioStatus: status,
    progressLagu,
    volume,
    playLagu,
    playBell,
    togglePause,
    stopAudio,
    playNext,
    playPrev,
    seek,
    setVolume
  };
}