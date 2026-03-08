// ─────────────────────────────────────────────────────────────────────────────
// lib/schemas.ts
// Zod schemas used for runtime validation on both client and server.
// Every API route validates its input against these schemas before processing.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

export const ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx", "txt"] as const;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── File type ────────────────────────────────────────────────────────────────
export const fileTypeSchema = z.enum(["pdf", "docx", "pptx", "txt"]);

// ─── API: /api/convert ────────────────────────────────────────────────────────
export const convertRequestSchema = z.object({
  fileBase64: z.string().min(1, "File data is required"),
  fileName: z.string().min(1).max(255),
  fileType: fileTypeSchema,
  voice: z.string().min(1),
});

// ─── API: /api/summarize ─────────────────────────────────────────────────────
export const summarizeRequestSchema = z.object({
  audioId: z.string().min(1),
  extractedText: z.string().min(10, "Text is too short to summarize"),
  fileName: z.string().min(1),
});

// ─── App settings ─────────────────────────────────────────────────────────────
export const appSettingsSchema = z.object({
  autoSummarize: z.boolean().default(true),
  keepInLibrary: z.boolean().default(true),
  skipTitleSlides: z.boolean().default(false),
  defaultSpeed: z.number().min(0.5).max(3.0).default(1.0),
  defaultVoice: z.string().default("neural"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validates a File object before it enters the upload queue.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as never)) {
    return { valid: false, error: `Unsupported file type .${ext ?? "unknown"}` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds the ${MAX_FILE_SIZE_MB} MB size limit`,
    };
  }
  return { valid: true };
}

/**
 * Derives the FileType enum value from a File's extension.
 */
export function getFileType(file: File): "pdf" | "docx" | "pptx" | "txt" {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "pptx") return "pptx";
  return "txt";
}
