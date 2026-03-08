"use client";
// components/upload/FileQueue.tsx

import { useState } from "react";
import { X, Mic, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatFileSize, getFileIcon, getFileTypeColor } from "@/lib/utils";
import { VOICE_OPTIONS, CONVERSION_STEPS } from "@/lib/constants";
import { useFileStore, useSettingsStore } from "@/store";
import { useConvertFile } from "@/hooks/useAudio";
import type { UploadedFile } from "@/types";

function FileRow({ file }: { file: UploadedFile }) {
  const { removeFile } = useFileStore();
  const color = getFileTypeColor(file.type);
  const stepIndex = CONVERSION_STEPS.findIndex((s) => s.key === file.status);
  const isConverting = ["extracting", "cleaning", "synthesizing", "finalizing"].includes(file.status);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{
        background: file.status === "error" ? "rgba(234,67,53,0.05)" : "var(--bg-surface)",
        border: `1px solid ${file.status === "error" ? "rgba(234,67,53,0.25)" : "var(--border)"}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 flex items-center justify-center rounded-lg text-base flex-shrink-0"
        style={{ background: `${color}14`, border: `1px solid ${color}28` }}
      >
        {getFileIcon(file.type)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-600 truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{file.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
          {formatFileSize(file.size)} · {file.type.toUpperCase()}
        </p>
        {isConverting && (
          <div className="mt-1.5">
            <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${file.progress}%`, background: "var(--accent)" }}
              />
            </div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {CONVERSION_STEPS.map((step, i) => (
                <span
                  key={step.key}
                  className="text-[9px] font-600 uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{
                    fontWeight: 600,
                    color:  i < stepIndex ? "var(--green)" : i === stepIndex ? "var(--accent)" : "var(--text-muted)",
                    background: i < stepIndex ? "var(--green-bg)" : i === stepIndex ? "var(--accent-bg)" : "var(--bg-elevated)",
                    border: `1px solid ${i < stepIndex ? "rgba(52,168,83,0.25)" : i === stepIndex ? "var(--accent-border)" : "var(--border)"}`,
                  }}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {file.status === "idle" && (
          <span className="text-xs font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Ready</span>
        )}
        {isConverting && (
          <span className="flex items-center gap-1 text-xs font-600" style={{ color: "var(--accent)", fontWeight: 600 }}>
            <Loader2 size={11} className="animate-spin" /> {file.progress}%
          </span>
        )}
        {file.status === "done" && (
          <span className="flex items-center gap-1 text-xs font-600" style={{ color: "var(--green)", fontWeight: 600 }}>
            <CheckCircle size={12} /> Done
          </span>
        )}
        {file.status === "error" && (
          <span className="flex items-center gap-1 text-xs font-600" style={{ color: "var(--red)", fontWeight: 600 }}>
            <AlertCircle size={12} /> Error
          </span>
        )}
        <button
          onClick={() => removeFile(file.id)}
          className="w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150"
          style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--red)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(234,67,53,0.3)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}

export function FileQueue() {
  const { files } = useFileStore();
  const { defaultVoice } = useSettingsStore();
  const [voice, setVoice] = useState(defaultVoice);
  const { mutate: convert, isPending } = useConvertFile();

  const readyFiles = files.filter((f) => f.status === "idle");
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((f) => <FileRow key={f.id} file={f} />)}

      {readyFiles.length > 0 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-600" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
            {readyFiles.length} file{readyFiles.length > 1 ? "s" : ""} ready
          </p>

          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="text-sm font-500 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>{v.emoji} {v.label}</option>
            ))}
          </select>

          <button
            onClick={() => readyFiles.forEach((file) => convert({ fileId: file.id, file: file.rawFile, voice }))}
            disabled={isPending}
            className="flex items-center gap-2 text-sm font-600 px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600 }}
            onMouseEnter={(e) => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; }}
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Mic size={13} />}
            Convert
          </button>
        </div>
      )}
    </div>
  );
}
