// ─────────────────────────────────────────────────────────────────────────────
// types/index.ts
// Central TypeScript type definitions for the entire application.
// ─────────────────────────────────────────────────────────────────────────────

// Supported file extensions
export type FileType = "pdf" | "docx" | "pptx" | "txt";

// All possible states during file conversion pipeline
export type ConversionStatus =
  | "idle"        // just uploaded, waiting
  | "queued"      // in queue
  | "extracting"  // reading text from file
  | "cleaning"    // stripping formatting noise
  | "synthesizing"// generating audio
  | "finalizing"  // encoding & wrapping up
  | "done"        // complete
  | "error";      // failed

// A voice option shown in the voice selector dropdown
export type VoiceOption = {
  id: string;
  label: string;
  emoji: string;
  description: string;
};

// A file that has been added to the upload queue
export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: FileType;
  rawFile: File;
  status: ConversionStatus;
  progress: number;  // 0–100
  error?: string;
  addedAt: number;   // timestamp
};

// A successfully converted audio item
export type ConvertedAudio = {
  id: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceFileType: FileType;
  audioUrl: string;           // empty string until real TTS is wired up
  durationSeconds: number;
  voice: string;
  createdAt: number;
  extractedText?: string;     // raw text extracted from the document
};

// ─── Summary ─────────────────────────────────────────────────────────────────

export type SummaryStatus = "idle" | "generating" | "done" | "error";

export type KeyPoint = {
  index: number;
  title: string;
  body: string;
};

export type DocumentSummary = {
  id: string;
  audioId: string;
  textSummary: string;
  keyPoints: KeyPoint[];
  audioSummaryUrl?: string;
  wordCount: number;
  readingTimeMinutes: number;
  generatedAt: number;
};

// ─── Player ──────────────────────────────────────────────────────────────────

export type PlaybackState = "idle" | "playing" | "paused";

export type PlayerState = {
  currentAudio: ConvertedAudio | null;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  isMuted: boolean;
};

// ─── Library ─────────────────────────────────────────────────────────────────

export type LibraryItem = {
  audio: ConvertedAudio;
  summary?: DocumentSummary;
};

// ─── API shapes ───────────────────────────────────────────────────────────────

export type ConvertRequest = {
  fileBase64: string;
  fileName: string;
  fileType: FileType;
  voice: string;
};

export type ConvertResponse = {
  success: boolean;
  audioId?: string;
  extractedText?: string;
  durationSeconds?: number;
  audioUrl?: string;
  error?: string;
};

export type SummarizeRequest = {
  audioId: string;
  extractedText: string;
  fileName: string;
};

export type SummarizeResponse = {
  success: boolean;
  summary?: DocumentSummary;
  error?: string;
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export type AppSettings = {
  autoSummarize: boolean;
  keepInLibrary: boolean;
  skipTitleSlides: boolean;
  defaultSpeed: number;
  defaultVoice: string;
};
