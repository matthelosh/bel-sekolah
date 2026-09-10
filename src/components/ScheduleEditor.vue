<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useSchedule } from '../composables/useSchedule';
import { useToast } from '../composables/useToast';
import type { JadwalEntry } from '../types/schedule';

function emptyEntry(): JadwalEntry {
  return {
    waktu: '',
    kegiatan: '',
    suara: ''
  };
}

const {
  jadwals,
  hari,
  loadJadwalFromExcel,
  saveJadwalToExcel,
  normalizeTime
} = useSchedule();

const editingEntry = ref<JadwalEntry>(emptyEntry());
const isEditing = ref(false);

const { error, success } = useToast();

const startAdd = () => {
  editingEntry.value = emptyEntry();
  isEditing.value = true;
};

const startEdit = (entry: JadwalEntry) => {
  editingEntry.value = { ...entry };
  isEditing.value = true;
};

const cancelEdit = () => {
  editingEntry.value = emptyEntry();
  isEditing.value = false;
};

const saveEntry = async () => {
  if (!editingEntry.value.waktu || !editingEntry.value.kegiatan) {
    error('Waktu dan kegiatan harus diisi');
    return;
  }

  const normalized: JadwalEntry = {
    waktu: normalizeTime(editingEntry.value.waktu),
    kegiatan: editingEntry.value.kegiatan,
    suara: editingEntry.value.suara || ''
  };

  const idx = jadwals.value.findIndex(j => j.waktu === normalized.waktu);
  if (idx >= 0) {
    jadwals.value[idx] = normalized;
  } else {
    jadwals.value.push(normalized);
  }

  jadwals.value.sort((a, b) => a.waktu.localeCompare(b.waktu));

  cancelEdit();
};

const deleteEntry = async (entry: JadwalEntry) => {
  jadwals.value = jadwals.value.filter(j => j.waktu !== entry.waktu);
};

const handleSaveAll = async () => {
  try {
    await saveJadwalToExcel(jadwals.value);
    success('Jadwal berhasil disimpan');
  } catch (err) {
    console.error('Failed to save jadwal:', err);
    error('Gagal menyimpan jadwal');
  }
};

onMounted(async () => {
  await loadJadwalFromExcel();
});
</script>

<template>
  <div class="max-w-4xl mx-auto mt-10">
    <div class="card bg-white shadow-lg">
      <div class="card-header bg-sky-100 p-4 rounded-t-lg flex items-center justify-between">
        <h2 class="card-title text-xl font-bold flex items-center gap-2">
          <Icon icon="line-md:calendar-edit" />
          Edit Jadwal - {{ hari }}
        </h2>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" @click="startAdd">
            <Icon icon="line-md:plus" class="text-xl" />
            Tambah
          </button>
          <button class="btn btn-success btn-sm" @click="handleSaveAll">
            <Icon icon="line-md:save" class="text-xl" />
            Simpan Semua
          </button>
        </div>
      </div>

      <div class="card-body">
        <!-- Add/Edit Form -->
        <div v-if="isEditing" class="mb-6 p-4 border rounded-lg bg-base-100">
          <h3 class="font-bold mb-3">{{ editingEntry?.waktu ? 'Edit' : 'Tambah' }} Jadwal</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Waktu (HH:MM)</span>
              </label>
              <input
                v-model="editingEntry.waktu"
                type="text"
                placeholder="07:00"
                class="input input-bordered"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Kegiatan</span>
              </label>
              <input
                v-model="editingEntry.kegiatan"
                type="text"
                placeholder="Jam Pertama"
                class="input input-bordered"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Suara (opsional)</span>
              </label>
              <input
                v-model="editingEntry.suara"
                type="text"
                placeholder="jamke_1.mp3"
                class="input input-bordered"
              />
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button class="btn btn-success btn-sm" @click="saveEntry">Simpan</button>
            <button class="btn btn-ghost btn-sm" @click="cancelEdit">Batal</button>
          </div>
        </div>

        <!-- Schedule List -->
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <td>#</td>
                <td>Waktu</td>
                <td>Kegiatan</td>
                <td>Suara</td>
                <td>Aksi</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, index) in jadwals" :key="entry.waktu">
                <td>{{ index + 1 }}</td>
                <td>{{ entry.waktu }}</td>
                <td>{{ entry.kegiatan }}</td>
                <td>{{ entry.suara || '-' }}</td>
                <td class="flex gap-1">
                  <button class="btn btn-square btn-ghost btn-sm" @click="startEdit(entry)">
                    <Icon icon="line-md:edit" class="text-xl" />
                  </button>
                  <button class="btn btn-square btn-ghost btn-sm text-error" @click="deleteEntry(entry)">
                    <Icon icon="line-md:delete" class="text-xl" />
                  </button>
                </td>
              </tr>
              <tr v-if="!jadwals.length">
                <td colspan="5" class="text-center text-gray-400">Tidak ada jadwal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
