"use client";
// components/player/LibraryGrid.tsx

import { Trash2, Play } from "lucide-react";
import { formatDuration, relativeTime, getFileIcon, getFileTypeColor } from "@/lib/utils";
import { useLibraryStore, usePlayerStore } from "@/store";
import type { LibraryItem } from "@/types";

function LibraryCard({ item, onPlay }: { item: LibraryItem; onPlay: () => void }) {
  const { removeItem } = useLibraryStore();
  const color = getFileTypeColor(item.audio.sourceFileType);

  return (
    <div
      onClick={onPlay}
      className="group rounded-xl p-4 cursor-pointer transition-all duration-200"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-border)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.background = "var(--bg-surface)";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div
          className="w-8 h-8 flex items-center justify-center rounded-lg text-base flex-shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}28` }}
        >
          {getFileIcon(item.audio.sourceFileType)}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className="w-6 h-6 flex items-center justify-center rounded-md transition-all duration-150"
            style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          >
            <Play size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeItem(item.audio.id); }}
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
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-700 leading-snug line-clamp-2 mb-1" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
        {item.audio.sourceFileName.replace(/\.[^/.]+$/, "")}
      </h4>
      <p className="text-[11px] font-500 mb-3" style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Google Sans Mono', monospace" }}>
        {item.audio.sourceFileType.toUpperCase()} · {relativeTime(item.audio.createdAt)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-600 rounded-full px-2.5 py-1"
          style={{
            fontWeight: 600,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontFamily: "'Google Sans Mono', monospace",
          }}
        >
          ⏱ {formatDuration(item.audio.durationSeconds)}
        </span>

        {item.summary && (
          <span
            className="text-[10px] font-600 rounded-full px-2 py-0.5"
            style={{
              fontWeight: 600,
              color: "var(--accent)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            ✦ Summary
          </span>
        )}
      </div>
    </div>
  );
}

export function LibraryGrid() {
  const { items, clearLibrary } = useLibraryStore();
  const { loadAudio } = usePlayerStore();

  if (items.length === 0) return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-sm font-600" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No items yet</p>
      <p className="text-xs mt-1 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Convert a document to see it here</p>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-600" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={clearLibrary}
          className="flex items-center gap-1.5 text-xs font-600 transition-colors duration-150"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--red)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
        >
          <Trash2 size={11} /> Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((item) => (
          <LibraryCard
            key={item.audio.id}
            item={item}
            onPlay={() => loadAudio(item.audio)}
          />
        ))}
      </div>
    </div>
  );
}
