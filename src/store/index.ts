"use client";
// ─────────────────────────────────────────────────────────────────────────────
// store/index.ts
// All Zustand stores in one file for simplicity.
//
// Stores:
//   useFileStore     — upload queue & conversion status (session only)
//   useLibraryStore  — converted audio items (persisted to localStorage)
//   usePlayerStore   — audio playback state (session only)
//   useSummaryStore  — generated AI summaries (session only)
//   useSettingsStore — user preferences (persisted to localStorage)
// ─────────────────────────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import type {
  UploadedFile,
  ConvertedAudio,
  DocumentSummary,
  AppSettings,
  ConversionStatus,
  LibraryItem,
} from "@/types";

// ─── File Store ───────────────────────────────────────────────────────────────

type FileStore = {
  files: UploadedFile[];
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (id: string, status: ConversionStatus, progress?: number) => void;
  setFileError: (id: string, error: string) => void;
  clearAll: () => void;
};

export const useFileStore = create<FileStore>()(
  devtools(
    (set) => ({
      files: [],
      addFile: (file) => set((s) => ({ files: [...s.files, file] })),
      removeFile: (id) => set((s) => ({ files: s.files.filter((f) => f.id !== id) })),
      updateFileStatus: (id, status, progress) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, status, progress: progress ?? f.progress } : f
          ),
        })),
      setFileError: (id, error) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, status: "error", error } : f
          ),
        })),
      clearAll: () => set({ files: [] }),
    }),
    { name: "audify/files" }
  )
);

// ─── Library Store ────────────────────────────────────────────────────────────
// Persisted — survives page refresh.

type LibraryStore = {
  items: LibraryItem[];
  addAudio: (audio: ConvertedAudio) => void;
  addSummary: (audioId: string, summary: DocumentSummary) => void;
  removeItem: (audioId: string) => void;
  clearLibrary: () => void;
};

const DEMO_ITEMS: LibraryItem[] = [
  {
    audio: {
      id: "demo-1",
      sourceFileId: "src-1",
      sourceFileName: "Machine Learning — Week 4 Lecture.pdf",
      sourceFileType: "pdf",
      audioUrl: "",
      durationSeconds: 2040,
      voice: "Neural (Default)",
      createdAt: Date.now() - 86400000 * 2,
    },
  },
  {
    audio: {
      id: "demo-2",
      sourceFileId: "src-2",
      sourceFileName: "Biology 101 — Cell Division.pptx",
      sourceFileType: "pptx",
      audioUrl: "",
      durationSeconds: 1320,
      voice: "Female — Clear",
      createdAt: Date.now() - 86400000 * 5,
    },
  },
  {
    audio: {
      id: "demo-3",
      sourceFileId: "src-3",
      sourceFileName: "Organic Chemistry — Reaction Mechanisms.pdf",
      sourceFileType: "pdf",
      audioUrl: "",
      durationSeconds: 4320,
      voice: "British — Warm",
      createdAt: Date.now() - 86400000 * 9,
    },
  },
];

export const useLibraryStore = create<LibraryStore>()(
  devtools(
    persist(
      (set) => ({
        items: DEMO_ITEMS,
        addAudio: (audio) => set((s) => ({ items: [{ audio }, ...s.items] })),
        addSummary: (audioId, summary) =>
          set((s) => ({
            items: s.items.map((item) =>
              item.audio.id === audioId ? { ...item, summary } : item
            ),
          })),
        removeItem: (audioId) =>
          set((s) => ({
            items: s.items.filter((item) => item.audio.id !== audioId),
          })),
        clearLibrary: () => set({ items: [] }),
      }),
      { name: "audify-library" }
    ),
    { name: "audify/library" }
  )
);

// ─── Player Store ─────────────────────────────────────────────────────────────

type PlayerStore = {
  currentAudio: ConvertedAudio | null;
  playbackState: "idle" | "playing" | "paused";
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  isMuted: boolean;
  loadAudio: (audio: ConvertedAudio) => void;
  togglePlay: () => void;
  setCurrentTime: (t: number) => void;
  setVolume: (v: number) => void;
  setSpeed: (s: number) => void;
  toggleMute: () => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set) => ({
      currentAudio: null,
      playbackState: "idle",
      currentTime: 0,
      duration: 0,
      volume: 80,
      speed: 1.0,
      isMuted: false,
      loadAudio: (audio) =>
        set({
          currentAudio: audio,
          playbackState: "paused",
          currentTime: 0,
          duration: audio.durationSeconds,
        }),
      togglePlay: () =>
        set((s) => ({
          playbackState: s.playbackState === "playing" ? "paused" : "playing",
        })),
      setCurrentTime: (t) => set({ currentTime: t }),
      setVolume: (v) => set({ volume: v }),
      setSpeed: (s) => set({ speed: s }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      reset: () =>
        set({ currentAudio: null, playbackState: "idle", currentTime: 0, duration: 0 }),
    }),
    { name: "audify/player" }
  )
);

// ─── Summary Store ────────────────────────────────────────────────────────────

type SummaryStore = {
  summaries: Record<string, DocumentSummary>;
  status: Record<string, "idle" | "generating" | "done" | "error">;
  setSummary: (audioId: string, summary: DocumentSummary) => void;
  setStatus: (audioId: string, status: "idle" | "generating" | "done" | "error") => void;
};

export const useSummaryStore = create<SummaryStore>()(
  devtools(
    (set) => ({
      summaries: {},
      status: {},
      setSummary: (audioId, summary) =>
        set((s) => ({
          summaries: { ...s.summaries, [audioId]: summary },
          status: { ...s.status, [audioId]: "done" },
        })),
      setStatus: (audioId, status) =>
        set((s) => ({ status: { ...s.status, [audioId]: status } })),
    }),
    { name: "audify/summaries" }
  )
);

// ─── Settings Store ───────────────────────────────────────────────────────────
// Persisted — survives page refresh.

const DEFAULT_SETTINGS: AppSettings = {
  autoSummarize: true,
  keepInLibrary: true,
  skipTitleSlides: false,
  defaultSpeed: 1.0,
  defaultVoice: "neural",
};

type SettingsStore = AppSettings & {
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,
        update: (patch) => set((s) => ({ ...s, ...patch })),
        reset: () => set(DEFAULT_SETTINGS),
      }),
      { name: "audify-settings" }
    ),
    { name: "audify/settings" }
  )
);
