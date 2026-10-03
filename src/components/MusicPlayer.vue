<script setup lang="ts">
    import { Icon } from "@iconify/vue";

    defineProps<{
        listLagu: { name: string }[];
        folderAudio: string;
        currentId: number | null;
        isPlaying: boolean;
        progressLagu: number;
    }>();

    const emit = defineEmits<{
        "update:folderAudio": [value: string];
        play: [folder: string, idx: number];
        prev: [];
        next: [];
        toggle: [];
        stop: [];
    }>();
</script>

<template>
    <div class="card bg-white shadow-lg col-span-8">
        <div class="card-header bg-sky-100 p-4 rounded-t-lg flex items-center justify-between">
            <h2 class="font-bold text-xl flex items-center gap-1">
                <Icon icon="line-md:folder-music-twotone" />
                Musik
            </h2>
            <select
                name="musik"
                id="musik"
                class="select select-sm"
                :value="folderAudio"
                @change="emit('update:folderAudio', ($event.target as HTMLSelectElement).value)">
                <option value="" disabled>Pilih Musik</option>
                <option value="lagunasional">Lagu Nasional</option>
                <option value="religi">Audio Islami</option>
                <option value="pramuka">Lagu Pramuka</option>
            </select>
        </div>
        <div class="card-body p-0 max-h-[70vh] overflow-auto">
            <ul class="list bg-base-100 rounded-box shadow-md">
                <li v-for="(lagu, l) in listLagu" :key="l" class="list-row" :class="{ 'bg-sky-200': currentId === l }">
                    <div>
                        <div
                            class="flag h-8 w-8 rounded-full bg-linear-to-b from-red-500 from-50% to-50% to-white-500 shadow-lg" />
                    </div>
                    <div>
                        {{ lagu.name.split(".")[0] }}
                        <br />
                        <progress
                            class="progress progress-success w-100"
                            :value="progressLagu"
                            max="100"
                            v-if="currentId === l && isPlaying" />
                    </div>
                    <button
                        class="btn btn-square btn-primary btn-sm"
                        @click="emit('play', folderAudio, l)"
                        :disabled="currentId === l && isPlaying">
                        <Icon icon="line-md:play" class="text-xl" />
                    </button>
                </li>
                <li v-if="!listLagu.length" class="list-row">
                    <div class="text-center text-gray-400 w-full">Tidak ada lagu</div>
                </li>
            </ul>
        </div>
    </div>
</template>
