export interface JadwalEntry {
  waktu: string;
  kegiatan: string;
  suara?: string;
}

export interface AudioStatus {
  text: string;
  id: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isDragging: boolean;
}

export type DisplayView = 'bel' | 'settings' | 'editor';
