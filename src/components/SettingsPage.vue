<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { readTextFile, writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { Icon } from '@iconify/vue';
import { useToast } from '../composables/useToast';

const schoolName = ref('SD Negeri 1 Bedalisodo');
const volume = ref(1);

const SETTINGS_PATH = 'bel/settings.json';

const { success, error } = useToast();

const loadSettings = async () => {
  try {
    const content = await readTextFile(SETTINGS_PATH, { baseDir: BaseDirectory.Document });
    const data = JSON.parse(content);
    schoolName.value = data.schoolName || schoolName.value;
    volume.value = data.volume ?? volume.value;
  } catch {
    // Use defaults
  }
};

const emit = defineEmits<{
  saved: [settings: { schoolName: string; volume: number }]
}>();

const saveSettings = async () => {
  try {
    const content = JSON.stringify({
      schoolName: schoolName.value,
      volume: volume.value
    });
    await writeTextFile(SETTINGS_PATH, content, { baseDir: BaseDirectory.Document });
    success('Pengaturan tersimpan');
    emit('saved', { schoolName: schoolName.value, volume: volume.value });
  } catch (err) {
    console.error('Gagal menyimpan pengaturan:', err);
    error('Gagal menyimpan pengaturan');
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10">
    <div class="card bg-white shadow-lg">
      <div class="card-header bg-sky-100 p-4 rounded-t-lg">
        <h2 class="card-title text-xl font-bold flex items-center gap-2">
          <Icon icon="line-md:settings" />
          Pengaturan
        </h2>
      </div>
      <div class="card-body space-y-6">
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Nama Sekolah</span>
          </label>
          <input
            v-model="schoolName"
            type="text"
            placeholder="Nama Sekolah"
            class="input input-bordered w-full"
          />
        </div>
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Volume</span>
            <span class="label-text-alt">{{ Math.round(volume * 100) }}%</span>
          </label>
          <input
            v-model="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="range range-warning"
          />
        </div>
        <div class="card-actions justify-end">
          <button class="btn btn-primary" @click="saveSettings">
            <Icon icon="line-md:save" class="text-xl" />
            Simpan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
