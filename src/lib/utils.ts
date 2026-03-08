// ─────────────────────────────────────────────────────────────────────────────
// lib/utils.ts
// Pure utility functions shared across the application.
// ─────────────────────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FileType } from "@/types";

// ─── Tailwind class merging ───────────────────────────────────────────────────

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Time formatting ──────────────────────────────────────────────────────────

/** Format seconds as M:SS or H:MM:SS */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format seconds as a human-readable duration string: "34 min", "1h 12m" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ─── File utilities ───────────────────────────────────────────────────────────

/** Format bytes as KB or MB */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Return an emoji icon for a given FileType */
export function getFileIcon(type: FileType): string {
  const icons: Record<FileType, string> = {
    pdf: "📄",
    docx: "📝",
    pptx: "📊",
    txt: "📃",
  };
  return icons[type] ?? "📎";
}

/** Return a hex color associated with a given FileType */
export function getFileTypeColor(type: FileType): string {
  const colors: Record<FileType, string> = {
    pdf: "#f87171",
    docx: "#60a5fa",
    pptx: "#f5a623",
    txt: "#4ade80",
  };
  return colors[type] ?? "#8b90a0";
}

// ─── ID generation ────────────────────────────────────────────────────────────

/** Generate a simple unique ID. Use crypto.randomUUID() in production. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Document title formatting ────────────────────────────────────────────────

/**
 * Split a filename into an italic part and a regular part.
 * e.g. "ML Lecture — Week 4.pdf" → { italic: "ML Lecture", rest: "Week 4" }
 */
export function formatDocTitle(name: string): {
  italic: string;
  rest: string;
} {
  const clean = name.replace(/\.[^/.]+$/, "");
  const sep = clean.search(/[-—_:]/);
  if (sep > 0 && sep < clean.length - 1) {
    return {
      italic: clean.slice(0, sep).trim(),
      rest: clean.slice(sep + 1).trim(),
    };
  }
  return { italic: clean, rest: "" };
}

// ─── Relative time ─────────────────────────────────────────────────────────────

/** Return a human-readable relative timestamp: "just now", "3h ago", etc. */
export function relativeTime(ts: number): string {
  const diffS = (Date.now() - ts) / 1000;
  if (diffS < 60) return "just now";
  if (diffS < 3600) return `${Math.floor(diffS / 60)}m ago`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)}h ago`;
  return `${Math.floor(diffS / 86400)}d ago`;
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

/**
 * Generate a pseudo-random but smooth waveform height array.
 * Each value is 0–1. Used to render the visual waveform bars.
 */
export function generateWaveformBars(count: number): number[] {
  const bars: number[] = [];
  let prev = 0.5;
  for (let i = 0; i < count; i++) {
    const delta = (Math.random() - 0.5) * 0.3;
    prev = Math.max(0.15, Math.min(1, prev + delta));
    bars.push(prev);
  }
  return bars;
}

// ─── Base64 ───────────────────────────────────────────────────────────────────

/** Read a File and return its base64-encoded content (without the data: prefix). */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}
