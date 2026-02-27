<script setup>
import { onBeforeMount, ref } from 'vue';
import { writeTextFile, readTextFile, BaseDirectory, exists} from '@tauri-apps/plugin-fs';
const semuaJadwal = ref({
  Senin: [], Selasa: [], Rabu: [], Kamis: [], Jumat: [], Sabtu: [], Minggu: []
});
const hariDipilih = ref("Senin"); // Tab hari yang sedang dibuka di editor

const simpanKeDisk = async () => {
  try {
    await writeTextFile('jadwal.json', JSON.stringify(semuaJadwal.value, null, 2), {
      dir: BaseDirectory.Document
    });
    // Beri notifikasi sukses (bisa pakai toast DaisyUI)
    console.log("Jadwal berhasil disimpan!");
  } catch (err) {
    console.error("Gagal menyimpan:", err);
  }
};

const tambahItem = () => {
  semuaJadwal.value[hariDipilih.value].push({
    waktu: "07:00",
    kegiatan: "Kegiatan Baru",
    suara: "default.mp3"
  });
};

const hapusItem = (index) => {
  semuaJadwal.value[hariDipilih.value].splice(index, 1);
};

const loadJadwal = async () => {
    const fileJadwal = await exists('jadwal.json', { baseDir: BaseDirectory.Document });
    if (fileJadwal) {
      const contents = await readTextFile('jadwal.json', { baseDir: BaseDirectory.Document });
      semuaJadwal.value = JSON.parse(contents);
    }
}

onBeforeMount(async () => {
  await loadJadwal();
});

</script>

<template>
    <Transition name="slide-left" mode="out-in">
        <div class="p-6 bg-base-100 rounded-box shadow-xl">
          <h2 class="text-2xl font-bold mb-4">⚙️ Pengaturan Jadwal</h2>
          
          <div class="tabs tabs-boxed mb-4">
            <a v-for="hari in Object.keys(semuaJadwal)" 
               :key="hari"
               class="tab" 
               :class="{ 'tab-active': hariDipilih === hari }"
               @click="hariDipilih = hari">
              {{ hari }}
            </a>
          </div>
          <div class="max-h-[60vh] overflow-y-auto">
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Kegiatan</th>
                    <th>Suara</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in semuaJadwal[hariDipilih]" :key="index">
                    <td><input v-model="item.waktu" type="time" class="input input-bordered input-sm"></td>
                    <td><input v-model="item.kegiatan" type="text" class="input input-bordered input-sm w-full"></td>
                    <td><input v-model="item.suara" type="text" class="input input-bordered input-sm"></td>
                    <td>
                      <button @click="hapusItem(index)" class="btn btn-error btn-xs">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
          </div>
      
          <div class="mt-4 flex gap-2">
            <button @click="tambahItem" class="btn btn-primary">➕ Tambah Baris</button>
            <button @click="simpanKeDisk" class="btn btn-success">💾 Simpan Permanen</button>
          </div>
        </div>
    </Transition>
</template>