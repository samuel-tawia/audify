"use client";
// hooks/useAudio.ts
// TanStack Query mutation hooks for convert, TTS synthesis, and summarize.
//
// useConvertFile     — extracts text, then calls Google Cloud TTS for real audio
// useSummarizeAudio  — calls /api/summarize (Gemini) for AI summary

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileToBase64, generateId } from "@/lib/utils";
import { getFileType } from "@/lib/schemas";
import { DEMO_EXTRACTED_TEXT } from "@/lib/constants";
import {
  useFileStore,
  useLibraryStore,
  usePlayerStore,
  useSummaryStore,
} from "@/store";
import type { ConvertedAudio, DocumentSummary } from "@/types";

// ─── Convert File (text extraction + Google Cloud TTS) ────────────────────────

export function useConvertFile() {
  const { updateFileStatus, setFileError } = useFileStore();
  const { addAudio } = useLibraryStore();
  const { loadAudio } = usePlayerStore();

  return useMutation({
    mutationFn: async ({
      fileId,
      file,
      voice,
    }: {
      fileId: string;
      file: File;
      voice: string;
    }) => {
      // Step 1 — encode file
      updateFileStatus(fileId, "extracting", 15);
      const fileBase64 = await fileToBase64(file);
      const fileType = getFileType(file);

      // Step 2 — extract text via /api/convert
      updateFileStatus(fileId, "cleaning", 35);
      const convertRes = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64, fileName: file.name, fileType, voice }),
      });

      if (!convertRes.ok) {
        const err = await convertRes.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error ?? "Text extraction failed");
      }

      const convertData = await convertRes.json();
      if (!convertData.success) throw new Error(convertData.error ?? "Extraction failed");

      const extractedText: string = convertData.extractedText ?? DEMO_EXTRACTED_TEXT;

      // Step 3 — synthesize audio with Google Cloud TTS
      updateFileStatus(fileId, "synthesizing", 60);
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractedText, voice, speed: 1.0 }),
      });

      let audioUrl = "";
      let durationSeconds = convertData.durationSeconds ?? 1200;

      if (ttsRes.ok) {
        const ttsData = await ttsRes.json();
        if (ttsData.success && ttsData.audioBase64) {
          // Build a blob URL the browser <audio> element can play directly
          const bytes = Uint8Array.from(atob(ttsData.audioBase64), (c) => c.charCodeAt(0));
          const mimeType = ttsData.mimeType ?? "audio/wav";
          const blob = new Blob([bytes], { type: mimeType });
          audioUrl = URL.createObjectURL(blob);
          durationSeconds = ttsData.durationSeconds ?? durationSeconds;
        }
      } else {
        // TTS failed — fall back to browser speech silently, notify user
        const errData = await ttsRes.json().catch(() => ({}));
        console.warn("[TTS] falling back to browser speech:", errData.error);
        toast.warning("Cloud TTS unavailable — using browser speech", {
          description: errData.error ?? "Check your GOOGLE_TTS_API_KEY",
        });
      }

      // Step 4 — finalise
      updateFileStatus(fileId, "finalizing", 90);
      await new Promise((r) => setTimeout(r, 500));
      updateFileStatus(fileId, "done", 100);

      const audio: ConvertedAudio = {
        id: convertData.audioId ?? generateId(),
        sourceFileId: fileId,
        sourceFileName: file.name,
        sourceFileType: fileType,
        audioUrl,                   // real blob URL if TTS succeeded, "" otherwise
        durationSeconds,
        voice,
        createdAt: Date.now(),
        extractedText,
      };

      return audio;
    },

    onSuccess: (audio) => {
      addAudio(audio);
      loadAudio(audio);
      const hasRealAudio = !!audio.audioUrl;
      toast.success("Conversion complete!", {
        description: hasRealAudio
          ? `${audio.sourceFileName} is ready — real audio generated`
          : `${audio.sourceFileName} ready (browser TTS mode)`,
      });
    },

    onError: (error: Error, { fileId }) => {
      setFileError(fileId, error.message);
      toast.error("Conversion failed", { description: error.message });
    },
  });
}

// ─── Summarize Audio ──────────────────────────────────────────────────────────

export function useSummarizeAudio() {
  const { setSummary, setStatus } = useSummaryStore();
  const { addSummary } = useLibraryStore();

  return useMutation({
    mutationFn: async ({
      audioId,
      extractedText,
      fileName,
    }: {
      audioId: string;
      extractedText: string;
      fileName: string;
    }) => {
      setStatus(audioId, "generating");

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioId, extractedText, fileName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error ?? "Summarization failed");
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Summarization failed");

      return data.summary as DocumentSummary;
    },

    onSuccess: (summary) => {
      setSummary(summary.audioId, summary);
      addSummary(summary.audioId, summary);
      toast.success("Summary ready!", {
        description: `${summary.keyPoints.length} key points extracted`,
      });
    },

    onError: (error: Error, { audioId }) => {
      setStatus(audioId, "error");
      toast.error("Summary failed", { description: error.message });
    },
  });
}

// ─── Download helper ──────────────────────────────────────────────────────────
// Works whether audio came from Cloud TTS (blob URL) or browser TTS (no URL).
// If no blob URL exists, re-calls /api/tts on demand to generate the MP3.

export async function downloadAudio(
  audioUrl: string,
  fileName: string,
  extractedText?: string,
  voice?: string,
) {
  const baseName = fileName.replace(/\.[^/.]+$/, "") + ".wav";

  // Case 1 — we already have a blob URL from Cloud TTS, just trigger download
  if (audioUrl) {
    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      triggerDownload(blob, baseName);
      toast.success("Download started!");
    } catch {
      toast.error("Download failed — try again");
    }
    return;
  }

  // Case 2 — no blob URL (browser TTS fallback), call /api/tts now to generate MP3
  if (!extractedText) {
    toast.error("Nothing to download yet — convert a document first");
    return;
  }

  const toastId = toast.loading("Generating MP3 for download…");

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: extractedText, voice: voice ?? "neural", speed: 1.0 }),
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.audioBase64) {
      toast.dismiss(toastId);
      toast.error("Download failed", {
        description: data.error ?? "Check your GOOGLE_TTS_API_KEY in .env.local",
      });
      return;
    }

    const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const mimeType = data.mimeType ?? "audio/wav";
    const blob = new Blob([bytes], { type: mimeType });
    triggerDownload(blob, baseName.replace(".mp3", ".wav"));
    toast.dismiss(toastId);
    toast.success("Download started!");
  } catch (e) {
    toast.dismiss(toastId);
    toast.error("Download failed — check your API key and try again");
  }
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
