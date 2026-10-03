<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import { useSchedule } from '../composables/useSchedule';
import { useSoundFiles } from '../composables/useSoundFiles';
import { useAudioPlayer } from '../composables/useAudioPlayer';
import { useToast } from '../composables/useToast';
import ScheduleEntryRow from './ScheduleEntryRow.vue';
import type { JadwalEntry } from '../types/schedule';

function emptyEntry(): JadwalEntry {
  return {
    waktu: '',
    kegiatan: '',
    suara: ''
  };
}

const {
  hari,
  days,
  getJadwalByDay,
  loadJadwal,
  saveJadwal,
  normalizeTime
} = useSchedule();

const selectedDay = ref(hari.value);
const entries = ref<JadwalEntry[]>([]);
const isDirty = ref(false);

const editingEntry = ref<JadwalEntry>(emptyEntry());
const editingWaktu = ref<string | null>(null);
const isEditing = ref(false);

let formRow: HTMLElement | null = null;
const setFormRow = (el: unknown) => {
  formRow = (el as HTMLElement | null) ?? null;
};

const scrollToForm = () => {
  nextTick(() => {
    formRow?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
};

const { soundFiles, isImporting, listSoundFiles, importSoundFile, hasSoundFile } = useSoundFiles();
const { audioStatus, playBell, stopAudio } = useAudioPlayer();

const { error, success, warning } = useToast();

const isPreviewing = (name?: string) =>
  !!name && audioStatus.value.id === -1 && audioStatus.value.text === name && audioStatus.value.isPlaying;

const previewForm = computed(() => isPreviewing(editingEntry.value.suara));

const selectDay = (day: string) => {
  if (day === selectedDay.value) return;
  if (isDirty.value) {
    warning('Simpan dulu perubahan pada hari ini sebelum pindah hari');
    return;
  }
  cancelEdit();
  selectedDay.value = day;
  isDirty.value = false;
};

watch(selectedDay, day => {
  entries.value = getJadwalByDay(day);
});

const startAdd = () => {
  editingEntry.value = emptyEntry();
  editingWaktu.value = null;
  isEditing.value = true;
  scrollToForm();
};

const startEdit = (entry: JadwalEntry) => {
  editingEntry.value = { ...entry };
  editingWaktu.value = entry.waktu;
  isEditing.value = true;
  scrollToForm();
};

const cancelEdit = () => {
  editingEntry.value = emptyEntry();
  editingWaktu.value = null;
  isEditing.value = false;
};

const handleImport = async (file: File) => {
  try {
    const { name, replaced } = await importSoundFile(file);
    editingEntry.value.suara = name;
    success(replaced ? `File suara diganti: ${name}` : `File suara diimpor: ${name}`);
  } catch (err) {
    error(err instanceof Error ? err.message : 'Gagal mengimpor file suara');
  }
};

const togglePreview = async (name?: string) => {
  if (!name) return;
  if (isPreviewing(name)) {
    stopAudio();
    return;
  }
  await playBell(name);
};

const saveEntry = async () => {
  if (!editingEntry.value.waktu || !editingEntry.value.kegiatan) {
    error('Waktu dan kegiatan harus diisi');
    return;
  }

  const suara = editingEntry.value.suara?.trim() ?? '';
  if (suara && soundFiles.value.length && !hasSoundFile(suara)) {
    error(`File suara "${suara}" tidak ada di folder lonceng`);
    return;
  }

  const normalized: JadwalEntry = {
    waktu: normalizeTime(editingEntry.value.waktu),
    kegiatan: editingEntry.value.kegiatan,
    suara
  };

  const previousWaktu = editingWaktu.value;
  const idx = entries.value.findIndex(j => j.waktu === normalized.waktu);
  if (idx >= 0) {
    entries.value[idx] = normalized;
  } else {
    entries.value.push(normalized);
  }

  if (previousWaktu && previousWaktu !== normalized.waktu) {
    entries.value = entries.value.filter(j => j.waktu !== previousWaktu);
  }

  entries.value.sort((a, b) => a.waktu.localeCompare(b.waktu));
  isDirty.value = true;

  cancelEdit();
};

const deleteEntry = async (entry: JadwalEntry) => {
  if (isPreviewing(entry.suara)) stopAudio();
  entries.value = entries.value.filter(j => j.waktu !== entry.waktu);
  isDirty.value = true;
};

const handleSave = async () => {
  try {
    await saveJadwal(entries.value, selectedDay.value);
    isDirty.value = false;
    success(`Jadwal ${selectedDay.value} berhasil disimpan`);
  } catch (err) {
    console.error('Failed to save jadwal:', err);
    error('Gagal menyimpan jadwal');
  }
};

onMounted(async () => {
  await Promise.all([loadJadwal(), listSoundFiles()]);
  entries.value = getJadwalByDay(selectedDay.value);
});
</script>

<template>
  <div class="max-w-4xl mx-auto mt-10">
    <div class="card bg-white shadow-lg">
      <div class="card-header bg-sky-100 p-4 rounded-t-lg flex items-center justify-between">
        <h2 class="card-title text-xl font-bold flex items-center gap-2">
          <Icon icon="line-md:calendar-edit" />
          Edit Jadwal - {{ selectedDay }}
        </h2>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" @click="startAdd">
            <Icon icon="line-md:plus" class="text-xl" />
            Tambah
          </button>
          <button class="btn btn-success btn-sm" :disabled="!isDirty" @click="handleSave">
            <Icon icon="line-md:save" class="text-xl" />
            Simpan {{ selectedDay }}
          </button>
        </div>
      </div>

      <div class="card-body">
        <div role="tablist" class="tabs tabs-box mb-4 flex-wrap">
          <button
            v-for="day in days"
            :key="day"
            role="tab"
            class="tab gap-1"
            :class="{ 'tab-active': selectedDay === day }"
            @click="selectDay(day)"
          >
            {{ day }}
            <span v-if="day === hari" class="badge badge-success badge-xs">hari ini</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mb-2">
          {{ soundFiles.length }} file suara tersedia di Documents/bel/lonceng
        </p>
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
              <tr v-if="isEditing && editingWaktu === null" class="bg-sky-100" :ref="setFormRow">
                <td>
                  <span class="badge badge-sm badge-primary"> baru </span>
                </td>
                <ScheduleEntryRow
                  v-model="editingEntry"
                  :sound-files="soundFiles"
                  :is-importing="isImporting"
                  :is-previewing="previewForm"
                  @save="saveEntry"
                  @cancel="cancelEdit"
                  @import="handleImport"
                  @toggle-preview="togglePreview(editingEntry.suara)"
                />
              </tr>
              <template v-for="(entry, index) in entries" :key="entry.waktu">
                <tr v-if="editingWaktu === entry.waktu" class="bg-sky-100" :ref="setFormRow">
                  <td>{{ index + 1 }}</td>
                  <ScheduleEntryRow
                    v-model="editingEntry"
                    :sound-files="soundFiles"
                    :is-importing="isImporting"
                    :is-previewing="previewForm"
                    @save="saveEntry"
                    @cancel="cancelEdit"
                    @import="handleImport"
                    @toggle-preview="togglePreview(editingEntry.suara)"
                  />
                </tr>
                <tr v-else>
                  <td>{{ index + 1 }}</td>
                  <td>{{ entry.waktu }}</td>
                  <td>{{ entry.kegiatan }}</td>
                  <td>
                    <div class="flex items-center gap-1">
                      <span>{{ entry.suara || '-' }}</span>
                      <span
                        v-if="entry.suara && soundFiles.length && !hasSoundFile(entry.suara)"
                        class="badge badge-sm badge-error badge-outline"
                        title="File suara tidak ditemukan di folder lonceng"
                      >
                        file hilang
                      </span>
                      <button
                        v-if="entry.suara"
                        class="btn btn-square btn-ghost btn-sm"
                        :title="isPreviewing(entry.suara) ? 'Hentikan pratinjau' : 'Putar suara'"
                        @click="togglePreview(entry.suara)"
                      >
                        <Icon :icon="isPreviewing(entry.suara) ? 'line-md:pause' : 'line-md:play'" class="text-xl" />
                      </button>
                    </div>
                  </td>
                  <td class="flex gap-1">
                    <button class="btn btn-square btn-ghost btn-sm" @click="startEdit(entry)">
                      <Icon icon="line-md:edit" class="text-xl" />
                    </button>
                    <button class="btn btn-square btn-ghost btn-sm text-error" @click="deleteEntry(entry)">
                      <Icon icon="line-md:delete" class="text-xl" />
                    </button>
                  </td>
                </tr>
              </template>
              <tr v-if="!entries.length && !isEditing">
                <td colspan="5" class="text-center text-gray-400">Tidak ada jadwal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
