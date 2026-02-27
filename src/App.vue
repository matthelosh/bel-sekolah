<script setup>
import { ref, onMounted, onBeforeMount, defineAsyncComponent, computed } from 'vue';
import { readTextFile, writeTextFile, BaseDirectory, exists, readDir, readFile } from "@tauri-apps/plugin-fs";
import { documentDir, join, resolveResource } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
//import defaultJadwal from './config/jadwal.json';
import { Icon } from '@iconify/vue';
const ManageJadwal = defineAsyncComponent(() => import('./ManageJadwal.vue'));

const display = ref('bel');
const hari = computed(() => new Date().toLocaleDateString('id-ID', { weekday: 'long' }));
const currentTime = ref('');
const status = ref({
  text: 'Menunggu...',
  id: null,
  isPlaying: false
});
const jadwals = ref([
  { waktu: "14:26", kegiatan: "jam_1", suara: "jamke_1.mp3" },
  { waktu: "10:00", kegiatan: "jam_2" },
  { waktu: "12:00", kegiatan: "jam_3" }
]);

const managejadwal = () => {
  display.value = 'jadwal';
}

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

const listLaguNasional = ref([])
const loadLaguNasional = async () => {
  try {
    const entries = await readDir('bel/lagunasional', { baseDir: BaseDirectory.Document });
    listLaguNasional.value = entries.filter(entry => entry.name.endsWith('.mp3'));

  } catch (err) {
    console.log(err);
  }
}




const checkTime = () => {
  const now = new Date();
  // const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const jamMenit = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  currentTime.value = now.toLocaleTimeString('id-ID');

  
  // Jika jam & menit cocok, dan detik berada di angka 00
  const match = jadwals.value?.find(j => j.waktu.replace('.', ':').trim() === jamMenit);
  // console.log(jadwals.value);
  // console.log(hari);
  if (match && now.getSeconds() === 0) {
    if(status.value.isPlaying) {
      togglePause();
    }
    //console.log(match)
    playBell('lonceng', match.suara);

    togglePause();
  }
};

const bel = new Audio();
const playBell = async (folder, suara) => {
  if (!bel.paused) {
    bel.pause();
  }
  
  // const baseDocPath = await documentDir();

  // const fullPath = await join(baseDocPath, 'bel', folder, suara);

  // const assetUrl = convertFileSrc(fullPath);

  // console.log(fullPath);

  bel.src = `/${folder}/${suara}`;

  bel.play();
  status.value = `Berbunyi: ${suara}`;
  setTimeout(() => status.value = 'Menunggu...', 10000);
};

const audio = new Audio();

const playLagu = async (fileName) => {
  try {
    const docPath = await documentDir();
    const absolutePath = await join(docPath, 'bel', 'lagunasional', fileName);
    
    console.log("DEBUG: Mencoba membaca path absolut:", absolutePath);
    const data = await readFile(absolutePath);
    const blob = new Blob([data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    // console.log(blob, url);
    if (audio.played) {
      await stopAudio();
    }
    audio.src = url;
    status.value.id = fileName;
    status.value.text = 'Memutar ' + fileName;
    status.isPlaying = true;
    await audio.play();
    // console.log(audio);

    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
  } catch (err) {
    console.log(err);
  }
}

// Fungsi Pause / Resume
const togglePause = () => {
  if (!audio.src) return false;

  if (audio.paused) {
    audio.play();
    status.isPlaying = true;
  } else {
    audio.pause();
    status.isPlaying = false;
  }
};

// Fungsi Stop Total
const stopAudio = () => {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.currentTime = 0; // Kembalikan ke detik 0
    // isPlaying.value = false;
    status.value = {text: 'Menunggu...', id: null, isPlaying: false};
  }
};

onMounted(async () => {
  await loadJadwal();
  await loadLaguNasional();
  setInterval(checkTime, 1000);
  // const now = new Date();
  // const jamMenit = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  // currentTime.value = now.toLocaleTimeString('id-ID');
  // console.log(jadwals.value.find(j => j.waktu == '07:00'))
   const tes = jadwals.value.find(j => j.waktu == '07:00')
  console.log(tes);

});

// onBeforeMount(async () => {
//   await loadJadwal();
//   await loadLaguNasional();

//   // const tes = jadwals.value.find(j => j.waktu == '07:01')
//   // console.log(tes);
// })
</script>

<template>
  <div class="w-screen min-h-screen bg-sky-950">
    <div class="status-app w-full text-center p-2 h-[14vh] bg-sky-950 flex items-center justify-center relative">
      <div class="status-content text-center">
        <h1 class="font-bold text-2xl text-white">Bell Sekolah</h1>
        <h1 class="text-4xl uppercase font-bold text-orange-50">{{ currentTime }}</h1>
        <p class="text-white">Status: {{ status.text }}</p>
        <div class="tools flex gap-2 items-center absolute top-10 right-10">
          <button class="btn-square  hover:cursor-pointer" @click="display = 'bel'">
            <Icon icon="line-md:bell-twotone" class="text-xl text-white"/>
          </button>
          <button class="btn-square hover:cursor-pointer" @click="managejadwal">
            <Icon icon="line-md:calendar" class="text-xl text-white"/>
          </button>
        </div>
      </div>
    </div>
    <!-- Halaman Bel depan -->
    <div class="content grid grid-cols-12 gap-6 px-4 lg:px-16 py-8 w-screen" v-if="display === 'bel'">
      <div class="jadwal-content mr-2 lg:mr-0 col-span-12 lg:col-span-4 card bg-white shadow-lg">
        <div class="card-header p-4 bg-violet-300 rounded-t-lg">
            <h3 class="card-title text-xl ">Jam Pelajaran {{ new Date().toLocaleDateString('id-ID', { weekday: 'long' }) }}</h3>
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
                    <button class="btn btn-square btn-ghost" @click="playBell('lonceng', jdw.suara)">
                      <Icon icon="line-md:bell-twotone" class="text-xl" />
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <div class="card musik mr-2 lg:mr-0 col-span-12 lg:col-span-8 bg-white shadow-lg">
        <div class="card-header bg-sky-100 p-4 rounded-t-lg">
          <h2 class="font-bold text-xl">Audio Lagu Nasional dan Religi</h2>
        </div>
        <div class="card-body p-0 max-h-[70vh] overflow-auto">
          <ul class="list bg-base-100 rounded-box shadow-md">
            <template v-for="(lagu, l) in listLaguNasional" :key="l">
              <li class="list-row">
                <div>
                  <div class="flag h-8 w-8 rounded-full bg-linear-to-b from-red-500 from-50% to-50% to-white-500 shadow-lg hover:shadow-md transition-all duration-300 ease-in-out">

                  </div>
                </div>
                <div>
                  <!-- <div>{{ l+1 }}</div> -->
                   {{ lagu.name.split('.')[0] }}
                  <!-- <div class="text-xs uppercase font-semibold opacity-60">{{ lagu.name.split('.')[0] }}</div> -->
                </div>
                <button class="btn btn-square btn-secondary" @click="playLagu(lagu.name)">
                  <Icon icon="line-md:play" class="text-xl" />
                </button>
                <button class="btn btn-square btn-secondary" @click="togglePause">
                  <Icon :icon="`line-md:pause`" class="text-xl" />
                </button>
                <button class="btn btn-square btn-secondary" @click="stopAudio">
                  <Icon :icon="`line-md:square`" class="text-xl" />
                </button>
              </li>
            </template>
          </ul>
          <!-- {{ listLaguNasional }} -->
        </div>
      </div>
    </div>

    <!-- Halaman Jadwal -->
    <div class="content w-screen px-16 py-8 " v-if="display === 'jadwal'">
        <ManageJadwal />
    </div>
  </div>
</template>


