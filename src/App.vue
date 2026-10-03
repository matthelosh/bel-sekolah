<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';
import { useSchedule } from './composables/useSchedule';
import { useAudioPlayer } from './composables/useAudioPlayer';
import { useToast } from './composables/useToast';
import { useInit } from './composables/useInit';
import ScheduleTable from './components/ScheduleTable.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import SettingsPage from './components/SettingsPage.vue';
import ScheduleEditor from './components/ScheduleEditor.vue';
import ToastContainer from './components/ToastContainer.vue';
import type { DisplayView } from './types/schedule';

const display = ref<DisplayView>('bel');
const currentTime = ref('');
const folderAudio = ref('lagunasional');
const listLagu = ref<{ name: string }[]>([]);

const { toasts, error } = useToast();
const { initBelFolder } = useInit();

const loadSettings = async () => {
  if (!isTauri) return;
  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const { BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const content = await readTextFile('bel/settings.json', { baseDir: BaseDirectory.Document });
    const data = JSON.parse(content);
    if (data.volume !== undefined) {
      setVolume(data.volume);
    }
  } catch {
    error('Gagal memuat pengaturan');
  }
};

const {
  jadwals,
  loadJadwal,
  loadJadwalFromExcel,
  startScheduleCheck,
  stopScheduleCheck
} = useSchedule();

const {
  audioStatus,
  progressLagu,
  volume,
  playLagu,
  playBell,
  togglePause,
  stopAudio,
  playNext,
  playPrev,
  setVolume
} = useAudioPlayer();

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const loadLagu = async () => {
  if (!isTauri) {
    listLagu.value = [];
    return;
  }
  try {
    const { readDir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    const entries = await readDir(`bel/${folderAudio.value}`, { baseDir: BaseDirectory.Document });
    listLagu.value = entries.filter(entry => entry.name.endsWith('.mp3'));
    if (!listLagu.value.length) {
      error('Folder lagu kosong');
    }
  } catch (err) {
    console.error('Failed to load music:', err);
    listLagu.value = [];
    error('Gagal memuat daftar lagu');
  }
};

const handleScheduleMatch = async (entry: { waktu: string; kegiatan: string; suara?: string }) => {
  if (entry.suara) {
    await playBell(entry.suara);
  }
};

const handlePlayLagu = async (folder: string, fileName: string, idx: number) => {
  await playLagu(folder, fileName, idx, listLagu.value.length);
};

const handlePlayBell = async (fileName: string) => {
  await playBell(fileName);
};

const handleToggle = () => {
  togglePause();
};

const handleStop = () => {
  stopAudio();
};

const handleNext = async () => {
  const nextIdx = playNext(listLagu.value.length);
  if (nextIdx !== null) {
    await playLagu(folderAudio.value, listLagu.value[nextIdx].name, nextIdx, listLagu.value.length);
  }
};

const handlePrev = async () => {
  const prevIdx = playPrev(listLagu.value.length);
  if (prevIdx !== null) {
    await playLagu(folderAudio.value, listLagu.value[prevIdx].name, prevIdx, listLagu.value.length);
  }
};

const handleFolderChange = async (folder: string) => {
  if (folder === folderAudio.value) return;
  folderAudio.value = folder;
  stopAudio();
  await loadLagu();
};

const handleSettingsSaved = async (settings: { schoolName: string; volume: number }) => {
  setVolume(settings.volume);
};

const switchView = (view: DisplayView) => {
  display.value = view;
  if (view === 'bel') {
    setVolume(volume.value);
  }
};

onMounted(async () => {
  if (isTauri) {
    await initBelFolder();
  }
  if (isTauri) {
    await loadJadwalFromExcel();
  } else {
    await loadJadwal();
  }
  await loadLagu();
  await loadSettings();
  startScheduleCheck(handleScheduleMatch);
  setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('id-ID');
  }, 1000);
});

onBeforeUnmount(() => {
  stopScheduleCheck();
  stopAudio();
});
</script>

<template>
  <div class="w-screen min-h-screen bg-sky-950">
    <ToastContainer :toasts="toasts" />
    <div class="status-app w-full text-center p-2 bg-sky-950 flex items-center justify-center relative">
      <div class="status-content text-center  flex items-center  px-4">
        <h1 class="font-bold text-2xl text-white">Bell Sekolah</h1>
          <button
          class="btn btn-ghost btn-sm text-white"
          @click="switchView('editor')"
        >
          <Icon icon="mdi:calendar-edit" class="text-xl" />
          Edit Jadwal
        </button>
        <button
          class="btn btn-ghost btn-sm text-white"
          @click="switchView(display === 'bel' ? 'settings' : 'bel')"
        >
          <Icon :icon="display === 'bel' ? 'mdi:settings' : 'mdi:home'" class="text-xl" />
          {{display==='bel' ? 'Pengaturan' : 'Beranda'}}
        </button>

      </div>
      <h1 class="text-4xl uppercase font-bold text-orange-50 absolute right-10">{{ currentTime }}</h1>

        <div v-if="display === 'bel'" class="w-full sm:w-1/2 mx-auto mt-2 rounded-full shadow-inner pt-2">
          <div class="flex justify-center items-center mb-2 px-1 w-full">
            <span class="text-xs font-bold text-warning truncate w-48 grow uppercase">{{ audioStatus.text }}</span>
            <span
              class="badge badge-sm flex items-center justify-center text-[10px] font-mono mr-4"
              v-if="audioStatus.isPlaying"
            >
              {{ audioStatus.currentTime ? Math.floor(audioStatus.currentTime / 60).toString().padStart(2, '0') + ':' + Math.floor(audioStatus.currentTime % 60).toString().padStart(2, '0') : '00:00' }}
            </span>
          </div>
          <input
            v-if="audioStatus.id !== null"
            type="range"
            :min="0"
            step="0.1"
            :max="audioStatus.duration || 100"
            v-model="audioStatus.currentTime"
            @input="$event => audioStatus.currentTime = Number(($event.target as HTMLInputElement).value)"
            @mousedown="audioStatus.isDragging = true"
            @mouseup="audioStatus.isDragging = false"
            class="range range-warning range-sm w-100"
          />
          <div class="controls flex gap-2 items-center justify-center p-2" v-if="audioStatus.text !== 'Menunggu...'">
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" :disabled="(audioStatus.id ?? -1) < 1" @click="handlePrev">
              <Icon icon="line-md:chevron-double-left" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="!audioStatus.isPlaying" @click="handleToggle">
              <Icon icon="line-md:play" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="audioStatus.isPlaying" @click="handleToggle">
              <Icon icon="line-md:pause" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="audioStatus.isPlaying" @click="handleStop">
              <Icon icon="line-md:square" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" :disabled="(audioStatus.id ?? -1) >= listLagu.length - 1" @click="handleNext">
              <Icon icon="line-md:chevron-double-right" class="text-xl" />
            </button>
          </div>
        </div>
      </div>

    <div v-if="display === 'bel'" class="content grid grid-cols-12 gap-6 px-4 lg:px-16 py-4 w-screen">
      <ScheduleTable :jadwals="jadwals" @play="handlePlayBell" />
      <MusicPlayer
        :listLagu="listLagu"
        :folderAudio="folderAudio"
        :currentId="audioStatus.id"
        :isPlaying="audioStatus.isPlaying"
        :progressLagu="progressLagu"
        @update:folderAudio="handleFolderChange"
        @play="handlePlayLagu"
        @prev="handlePrev"
        @next="handleNext"
        @toggle="handleToggle"
        @stop="handleStop"
      />
    </div>

    <SettingsPage v-else-if="display === 'settings'" @saved="handleSettingsSaved" />
    <ScheduleEditor v-else />
  </div>
</template>
