"use client";
// components/upload/DropZone.tsx

import { useRef, useState, useCallback } from "react";
import { Upload, FileText } from "lucide-react";
import { validateFileUpload, getFileType } from "@/lib/schemas";
import { useFileStore } from "@/store";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

const FILE_TYPES = ["PDF", "DOCX", "PPTX", "TXT"];

export function DropZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { addFile } = useFileStore();

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      let added = 0;
      for (const file of Array.from(fileList)) {
        const { valid, error } = validateFileUpload(file);
        if (!valid) { toast.error(error ?? "Invalid file"); continue; }
        addFile({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: getFileType(file),
          rawFile: file,
          status: "idle",
          progress: 0,
          addedAt: Date.now(),
        });
        added++;
      }
      if (added > 0) toast.success(`${added} file${added > 1 ? "s" : ""} added`);
    },
    [addFile]
  );

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragActive(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragActive(false); processFiles(e.dataTransfer.files);
  }, [processFiles]);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files); e.target.value = "";
  }, [processFiles]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="relative rounded-2xl cursor-pointer select-none transition-all duration-200"
      style={{
        background: isDragActive ? "var(--accent-bg)" : "var(--bg-surface)",
        border: `1.5px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
        padding: "20px 24px",
      }}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-200"
          style={{
            background: isDragActive ? "var(--accent-bg)" : "var(--bg-elevated)",
            border: `1px solid ${isDragActive ? "var(--accent-border)" : "var(--border)"}`,
          }}
        >
          {isDragActive
            ? <FileText size={20} style={{ color: "var(--accent)" }} />
            : <Upload size={20} style={{ color: "var(--text-muted)" }} />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-700 leading-snug" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            {isDragActive ? "Drop to upload" : "Drop your document here"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            or click to browse · {FILE_TYPES.join(", ")} · up to 50 MB
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="flex-shrink-0 flex items-center gap-1.5 text-sm font-600 px-4 py-2 rounded-lg transition-all duration-150"
          style={{ background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
        >
          <Upload size={13} /> Choose File
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.pptx,.txt"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
