<script setup>
import { ref, onMounted, onBeforeMount, defineAsyncComponent, computed, watch } from 'vue';
import { readTextFile, writeTextFile, BaseDirectory, exists, readDir, readFile } from "@tauri-apps/plugin-fs";
import { documentDir, join, resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Icon } from '@iconify/vue';
import { read, utils } from 'xlsx';

const display = ref('bel');
const hari = computed(() => new Date().toLocaleDateString('id-ID', { weekday: 'long' }));
const currentTime = ref('');
const progressLagu = ref(0)
const status = ref({
  text: 'Menunggu...',
  id: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isDragging: false
});
const folderAudio = ref('lagunasional')
const jadwals = ref([
  { waktu: "14:26", kegiatan: "jam_1", suara: "jamke_1.mp3" },
  { waktu: "10:00", kegiatan: "jam_2" },
  { waktu: "12:00", kegiatan: "jam_3" }
]);

const loadJadwal = async() => {
  const now = new Date();

  const response = await fetch("/jadwal.json");
  const defaultJadwal = await response.json();
  if (window.__TAURI_INTERNALS__) {
    try {
      const fileJadwal = await exists('bel/jadwal.json', { baseDir: BaseDirectory.Document });

      const contents = await readTextFile('bel/jadwal.json', { baseDir: BaseDirectory.Document });
      jadwals.value = JSON.parse(contents)[hari.value];
    } catch (err) {
      console.log(err);
    }
  } else {
    jadwals.value = defaultJadwal[hari.value];
  }
}

const loadJadwalFromExcel = async() => {
  try {
    const docPath = await documentDir();
    const filePath = await join(docPath, 'bel', 'jadwal.xlsx')
    const fileBin = await readFile(filePath);
    const wb = read(fileBin, { type: 'array' });
    const ws = wb.Sheets[hari.value];
    const dataJadwals = utils.sheet_to_json(ws);

    jadwals.value = dataJadwals;
  } catch(err) {
    console.log(err);
  }
}

watch(folderAudio, (newVal) => {
  loadLagu();
})

const listLagu = ref([])
const loadLagu = async () => {
  try {
    const entries = await readDir(`bel/${folderAudio.value}`, { baseDir: BaseDirectory.Document });
    listLagu.value = entries.filter(entry => entry.name.endsWith('.mp3'));

  } catch (err) {
    console.log(err);
  }
}

const checkTime = () => {
  const now = new Date();
  const jamMenit = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  currentTime.value = now.toLocaleTimeString('id-ID');

  
  // Jika jam & menit cocok, dan detik berada di angka 00
  const match = jadwals.value?.find(j => j.waktu.replace('.', ':').trim() === jamMenit);
  if (match && now.getSeconds() === 0) {
    if(status.value.isPlaying) {
      togglePause();
    }
    //console.log(match)
    playBell('lonceng', match.suara);

    togglePause();
  }
};

const audio = new Audio();
audio.onloadedmetadata = () => {
  status.value.duration = audio.duration;
}

audio.ontimeupdate = () => {
  if (!status.value.isDragging) {
    status.value.currentTime = audio.currentTime

    if (audio.duration) {
      progressLagu.value = (audio.currentTime / audio.duration) * 100;
    }
  }
}

const updateProgressLagu = () => {
  audio.currentTime = status.value.currentTime
}

// 4. Helper format waktu (00:00)
const formatWaktu = (detik) => {
  if (!detik) return "00:00";
  const m = Math.floor(detik / 60);
  const s = Math.floor(detik % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const playNext = () => {
  const idx = status.value.id
  if (idx < listLagu.value.length-1) {
    const nextIdx = idx + 1;
    const nextLagu = listLagu.value[nextIdx].name;
    playLagu(folderAudio.value, nextLagu, nextIdx);
  }
}

const playPrev = () => {
  const idx = status.value.id
  if (idx > 0) {
    const nextIdx = idx - 1;
    const nextLagu = listLagu.value[nextIdx].name;
    playLagu(folderAudio.value, nextLagu, nextIdx);
  }
}

const playLagu = async (folder, fileName, idx) => {
  try {
    console.log(folder, fileName, idx);
    // 1. EXTRACTION: Pastikan semua adalah string murni sebelum masuk ke 'join'
    const folderStr = typeof folder === 'object' ? folder.value : folder;
    const fileStr = typeof fileName === 'object' ? fileName.value : fileName;

    const docPath = await documentDir();
    // Gunakan string murni hasil ekstraksi
    const absolutePath = await join(docPath, 'bel', folderStr, fileStr);
    
    const data = await readFile(absolutePath);
    
    // 2. MEMORY MANAGEMENT: Revoke URL lama jika ada
    if (audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src);
    }

    const blob = new Blob([data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);

    // Hentikan audio yang sedang berjalan dengan bersih
    audio.pause();
    audio.src = url;
    
    status.value.id = idx;
    // Gunakan idx + 1 agar di UI terlihat mulai dari angka 1
    status.value.text = `${idx + 1}. ${fileStr}`;
    status.value.isPlaying = true;
    
    await audio.play();


    // 4. RECURSIVE QUEUE (Next Song)
    audio.onended = () => {
      URL.revokeObjectURL(url);
      progressLagu.value = 0;

      if (idx < listLagu.value.length - 1) {
        const nextIdx = idx + 1;
        const nextLagu = listLagu.value[nextIdx].name;
        
        setTimeout(() => {
          // Tetap kirim folderStr (string murni) agar tidak error map/object lagi
          playLagu(folderAudio.value, nextLagu, nextIdx);
        }, 100);
      } else {
        status.value = {
          isPlaying: false,
          text: 'Menunggu...',
          id: null
        };
      }
    };
  } catch (err) {
    console.error("Gagal putar lagu:", err);
    status.value.isPlaying = false;
  }
};


// Fungsi Pause / Resume
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

// Fungsi Stop Total
const stopAudio = () => {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.currentTime = 0; // Kembalikan ke detik 0
    audio.onended = null;
    status.value = {text: 'Menunggu...', id: null, isPlaying: false};
  }
};

onMounted(async () => {
  await loadJadwalFromExcel();
  await loadLagu();
  setInterval(checkTime, 1000);

});

</script>

<template>
  <div class="w-screen min-h-screen bg-sky-950">
    <div class="status-app w-full text-center p-2  bg-sky-950 flex items-center justify-center relative">
      <div class="status-content text-center w-full">
        <h1 class="font-bold text-2xl text-white absolute left-10">Bell Sekolah</h1>
        <h1 class="text-4xl uppercase font-bold text-orange-50 absolute right-10">{{ currentTime }}</h1>
        
        <div class="w-full sm:w-1/2 mx-auto mt-2 rounded-full shadow-inner pt-2">
          <div class="flex justify-center items-center mb-2 px-1 w-full">
            <span class="text-xs font-bold text-warning truncate w-48 grow uppercase">{{ status.text }}</span>
            <span class=" badge badge-sm flex items-center justify-center text-[10px]  font-mono mr-4" v-if="status.isPlaying">{{ formatWaktu(status.currentTime) }}</span>
          </div>
          <input type="range" :min="0" step="0.1" :max="status.duration || 100" v-model="status.currentTime" @input="updateProgressLagu" @mousedown="status.isDragging = true" @mouseup="status.isDragging = false" class="range range-warning range-sm w-100" v-if="status.id" />
          <div class="controls flex gap-2 items-center justify-center p-2" v-if="status.text !== 'Menunggu...'">
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" :disabled="status.id < 1" @click="playPrev">
              <Icon icon="line-md:chevron-double-left" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="!status.isPlaying" @click="togglePause">
              <Icon icon="line-md:play" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="status.isPlaying" @click="togglePause">
              <Icon icon="line-md:pause" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" v-if="status.isPlaying" @click="stopAudio">
              <Icon icon="line-md:square" class="text-xl" />
            </button>
            <button class="btn btn-square btn-ghost btn-warning btn-sm btn-outline" :disabled="status.id >= listLagu.length-1" @click="playNext">
              <Icon icon="line-md:chevron-double-right" class="text-xl" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Halaman Bel depan -->
    <div class="content grid grid-cols-12 gap-6 px-4 lg:px-16 py-4 w-screen" v-if="display === 'bel'">
      <div class="jadwal-content mr-2 lg:mr-0 col-span-12 lg:col-span-5 card bg-white shadow-lg">
        <div class="card-header p-4 bg-sky-100 rounded-t-lg">
            <h3 class="card-title text-xl font-bold">
              <Icon icon="line-md:calendar" class="mt-1" />
              Jam Pelajaran {{ new Date().toLocaleDateString('id-ID', { weekday: 'long' }) }}
            </h3>
        </div>
        <div class="card-body p-0 max-h-[70vh] overflow-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <td>#</td>
                <td>Waktu</td>
                <td>Kegiatan</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              <template v-for="(jdw, j) in jadwals" :key="j">
                <tr>
                  <td>{{j +1}}</td>
                  <td>{{jdw.waktu}}</td>
                  <td>{{jdw.kegiatan}}</td>
                  <td>
                    <button class="btn btn-square btn-ghost" @click="playLagu('lonceng', jdw.suara)">
                      <Icon icon="line-md:bell-twotone" class="text-xl" />
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card musik mr-2 lg:mr-0 col-span-12 lg:col-span-7 bg-white shadow-lg">
        <div class="card-header bg-sky-100 p-4 rounded-t-lg flex items-center justify-between">
          <h2 class="font-bold text-xl flex items-center gap-1">
            <Icon icon="line-md:folder-music-twotone" />
            Musik
          </h2>
          <select name="musik" id="musik" class="select select-sm" v-model="folderAudio">
            <option value="" disabled selected>Pilih Musik</option>
            <option value="lagunasional">Lagu Nasional</option>
            <option value="religi">Audio Islami</option>
          </select>
        </div>
        <div class="card-body p-0 max-h-[70vh] overflow-auto">
          <ul class="list bg-base-100 rounded-box shadow-md">
            <template v-for="(lagu, l) in listLagu" :key="l">
              <li class="list-row" :class="{'bg-sky-200': status.id === l}">
                <div>
                  <div class="flag h-8 w-8 rounded-full bg-linear-to-b from-red-500 from-50% to-50% to-white-500 shadow-lg hover:shadow-md transition-all duration-300 ease-in-out">

                  </div>
                </div>
                <div>
                   {{ lagu.name.split('.')[0] }} <br>
                   <progress class="progress progress-success w-100" :value="progressLagu" max="100" v-if="status.id === l && status.isPlaying"></progress>
                </div>
                <button class="btn btn-square btn-primary btn-sm" @click="playLagu(folderAudio, lagu.name, l)" :disabled="status.id === l && status.isPlaying">
                  <Icon icon="line-md:play" class="text-xl" />
                </button>
                <!-- <button class="btn btn-square btn-warning btn-sm" @click="togglePause">
                  <Icon :icon="`line-md:pause`" class="text-xl" />
                </button>
                <button class="btn btn-square btn-secondary btn-sm" @click="stopAudio">
                  <Icon :icon="`line-md:square-filled`" class="text-xl" />
                </button> -->
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>


