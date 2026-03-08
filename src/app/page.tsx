"use client";
// app/page.tsx

import { useState } from "react";
import { usePlayerStore, useSummaryStore } from "@/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { DropZone } from "@/components/upload/DropZone";
import { FileQueue } from "@/components/upload/FileQueue";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { SummaryPanel } from "@/components/summary/SummaryPanel";
import { LibraryGrid } from "@/components/player/LibraryGrid";
import { useSummarizeAudio } from "@/hooks/useAudio";
import { DEMO_EXTRACTED_TEXT } from "@/lib/constants";

export default function HomePage() {
  const { currentAudio } = usePlayerStore();
  const { summaries } = useSummaryStore();
  const { mutate: summarize } = useSummarizeAudio();
  const [section, setSection] = useState<"upload" | "library">("upload");

  const handleSummarize = () => {
    if (!currentAudio) return;
    if (summaries[currentAudio.id]) return;
    summarize({
      audioId: currentAudio.id,
      extractedText: currentAudio.extractedText ?? DEMO_EXTRACTED_TEXT,
      fileName: currentAudio.sourceFileName,
    });
  };

  return (
    <div className="app-shell">
      <Sidebar activeSection={section} onSectionChange={setSection} />

      <main className="main-content animate-fade-in">
        {section === "upload" ? (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
            {/* Left column */}
            <div className="space-y-5">
              {/* Page title */}
              <div>
                <h1 className="font-display text-2xl font-700 leading-tight" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                  Convert to Audio
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  Upload a document and listen on the go
                </p>
              </div>

              <DropZone />
              <FileQueue />

              {/* Player — shows when a file is converted */}
              {currentAudio && <AudioPlayer onSummarize={handleSummarize} />}
            </div>

            {/* Right column — Summary (larger) */}
            <div className="space-y-5">
              {currentAudio ? (
                <SummaryPanel />
              ) : (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                  >
                    <span className="text-xl">✦</span>
                  </div>
                  <p className="text-sm font-600" style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                    AI Summary
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Upload and convert a document to generate key insights
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-700" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                Library
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                Your converted audio files
              </p>
            </div>
            <LibraryGrid />
          </div>
        )}
      </main>
    </div>
  );
}
