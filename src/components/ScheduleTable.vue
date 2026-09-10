<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { JadwalEntry } from '../types/schedule';

defineProps<{
  jadwals: JadwalEntry[];
}>();

const emit = defineEmits<{
  play: [fileName: string]
}>();
</script>

<template>
  <div class="card bg-white shadow-lg">
    <div class="card-header p-4 bg-sky-100 rounded-t-lg">
      <h3 class="card-title text-xl font-bold flex items-center gap-2">
        <Icon icon="line-md:calendar" />
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
          <tr v-for="(jdw, j) in jadwals" :key="j">
            <td>{{ j + 1 }}</td>
            <td>{{ jdw.waktu }}</td>
            <td>{{ jdw.kegiatan }}</td>
            <td>
              <button
                v-if="jdw.suara"
                class="btn btn-square btn-ghost"
                @click="emit('play', jdw.suara)"
              >
                <Icon icon="line-md:bell-twotone" class="text-xl" />
              </button>
            </td>
          </tr>
          <tr v-if="!jadwals.length">
            <td colspan="4" class="text-center text-gray-400">Tidak ada jadwal</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
