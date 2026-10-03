<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { JadwalEntry } from '../types/schedule';

const entry = defineModel<JadwalEntry>({ required: true });

defineProps<{
    soundFiles: string[];
    isImporting: boolean;
    isPreviewing: boolean;
}>();

const emit = defineEmits<{
    save: [];
    cancel: [];
    import: [file: File];
    "toggle-preview": [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const openFilePicker = () => {
    fileInput.value?.click();
};

const handleFileSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
        emit('import', file);
    }
};
</script>

<template>
    <td>
        <input
            v-model="entry.waktu"
            type="text"
            placeholder="07:00"
            class="input input-sm input-bordered w-20"
            @keyup.enter="emit('save')"
        />
    </td>
    <td>
        <input
            v-model="entry.kegiatan"
            type="text"
            placeholder="Jam Pertama"
            class="input input-sm input-bordered w-40"
            @keyup.enter="emit('save')"
        />
    </td>
    <td>
        <div class="join">
            <input
                v-model="entry.suara"
                type="text"
                list="daftar-file-suara"
                placeholder="jamke_1.mp3"
                class="input input-sm input-bordered join-item w-40"
            />
            <button
                type="button"
                class="btn btn-sm btn-outline join-item"
                :disabled="isImporting"
                title="Impor file .mp3 ke folder lonceng"
                @click="openFilePicker"
            >
                <Icon icon="line-md:folder-plus" class="text-lg" />
            </button>
            <button
                type="button"
                class="btn btn-sm btn-outline join-item"
                :disabled="!entry.suara"
                :title="isPreviewing ? 'Hentikan pratinjau' : 'Putar suara'"
                @click="emit('toggle-preview')"
            >
                <Icon :icon="isPreviewing ? 'line-md:pause' : 'line-md:play'" class="text-lg" />
            </button>
        </div>
        <datalist id="daftar-file-suara">
            <option v-for="name in soundFiles" :key="name" :value="name" />
        </datalist>
        <input
            ref="fileInput"
            type="file"
            accept=".mp3,audio/mpeg"
            class="hidden"
            @change="handleFileSelected"
        />
        <div v-if="entry.suara && soundFiles.length && !soundFiles.includes(entry.suara)" class="text-error text-xs mt-1">
            File suara tidak ada di folder lonceng
        </div>
    </td>
    <td>
        <div class="flex gap-1">
            <button class="btn btn-success btn-xs" @click="emit('save')">Simpan</button>
            <button class="btn btn-ghost btn-xs" @click="emit('cancel')">Batal</button>
        </div>
    </td>
</template>
