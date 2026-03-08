"use client";
// components/summary/SummaryPanel.tsx

import { useState } from "react";
import { ChevronDown, Sparkles, Loader2, Play, Pause } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { usePlayerStore, useSummaryStore } from "@/store";
import { useSummarizeAudio } from "@/hooks/useAudio";
import { DEMO_EXTRACTED_TEXT } from "@/lib/constants";
import type { DocumentSummary } from "@/types";

type Tab = "text" | "points" | "audio";

function KeyPoint({ point }: { point: { index: number; title: string; body: string } }) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
      >
        <span className="text-[10px] font-700" style={{ color: "var(--accent)", fontWeight: 700, fontFamily: "'Google Sans Mono', monospace" }}>
          {point.index}
        </span>
      </div>
      <div>
        <p className="text-sm font-700 mb-1" style={{ color: "var(--text-primary)", fontWeight: 700 }}>{point.title}</p>
        <p className="text-sm leading-relaxed font-500" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{point.body}</p>
      </div>
    </div>
  );
}

function MiniPlayer({ summary }: { summary: DocumentSummary }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [iid, setIid] = useState<ReturnType<typeof setInterval> | null>(null);
  const duration = Math.round(summary.readingTimeMinutes * 60 * 0.3);

  const toggle = () => {
    if (playing) {
      if (iid) clearInterval(iid);
      setPlaying(false);
    } else {
      setPlaying(true);
      const id = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) { clearInterval(id); setPlaying(false); return 0; }
          return p + 0.5;
        });
      }, 150);
      setIid(id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      <button
        onClick={toggle}
        className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-150"
        style={{ background: "var(--accent)", color: "#fff", border: "none" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
      >
        {playing ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: "1px" }} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-600 mb-1.5 truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
          Audio Summary · {summary.wordCount.toLocaleString()} words condensed
        </p>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
      </div>
      <span className="text-[11px] font-500 flex-shrink-0" style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Google Sans Mono', monospace" }}>
        {formatTime(duration)}
      </span>
    </div>
  );
}

export function SummaryPanel() {
  const { currentAudio } = usePlayerStore();
  const { summaries, status } = useSummaryStore();
  const { mutate: summarize, isPending } = useSummarizeAudio();

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("text");

  if (!currentAudio) return null;

  const summary = summaries[currentAudio.id];
  const summaryStatus = status[currentAudio.id] ?? "idle";
  const isGenerating = isPending || summaryStatus === "generating";

  const tabs: { key: Tab; label: string }[] = [
    { key: "text",   label: "📝 Summary"    },
    { key: "points", label: "⚡ Key Points" },
    { key: "audio",  label: "🎧 Audio"     },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors duration-150"
        style={{
          borderBottom: open ? "1px solid var(--border)" : "none",
          background: "transparent",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
          >
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-700" style={{ color: "var(--text-primary)", fontWeight: 700 }}>AI Summary</h3>
            <p className="text-xs mt-0.5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
              {summary
                ? `${summary.keyPoints.length} key points · ${summary.wordCount.toLocaleString()} words`
                : "Key insights from your document"}
            </p>
          </div>
        </div>
        <ChevronDown
          size={15}
          style={{
            color: "var(--text-muted)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Body */}
      {open && (
        <div className="p-5">
          {/* Idle */}
          {!summary && !isGenerating && (
            <div className="text-center py-10">
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-2xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                <Sparkles size={22} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="text-sm font-600 mb-1" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Generate AI Summary</p>
              <p className="text-xs mb-5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                Key points and condensed audio version powered by Gemini
              </p>
              <button
                onClick={() => summarize({
                  audioId: currentAudio.id,
                  extractedText: currentAudio.extractedText ?? DEMO_EXTRACTED_TEXT,
                  fileName: currentAudio.sourceFileName,
                })}
                className="inline-flex items-center gap-2 text-sm font-700 px-5 py-2.5 rounded-lg transition-all duration-150"
                style={{ background: "var(--accent)", color: "#fff", fontWeight: 700 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
              >
                <Sparkles size={13} /> Generate Summary
              </button>
            </div>
          )}

          {/* Generating */}
          {isGenerating && (
            <div className="text-center py-10">
              <Loader2 size={26} className="mx-auto mb-3 animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-sm font-600" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Analysing with Gemini…</p>
              <p className="text-xs mt-1 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Usually 5–10 seconds</p>
            </div>
          )}

          {/* Ready */}
          {summary && !isGenerating && (
            <>
              {/* Tabs */}
              <div className="flex gap-1.5 mb-5">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="flex-1 py-2 text-sm font-600 rounded-lg transition-all duration-150"
                    style={{
                      fontWeight: 600,
                      background: activeTab === key ? "var(--accent-bg)" : "var(--bg-elevated)",
                      border: `1px solid ${activeTab === key ? "var(--accent-border)" : "var(--border)"}`,
                      color: activeTab === key ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Text */}
              {activeTab === "text" && (
                <div className="space-y-3">
                  <div
                    className="flex gap-3 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                  >
                    <span className="text-xs font-500" style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Google Sans Mono', monospace" }}>
                      {summary.wordCount.toLocaleString()} words · ~{summary.readingTimeMinutes} min read
                    </span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {summary.textSummary.split("\n\n").filter(Boolean).map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed font-500" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{para}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Key points */}
              {activeTab === "points" && (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {summary.keyPoints.map((point) => (
                    <KeyPoint key={point.index} point={point} />
                  ))}
                </div>
              )}

              {/* Audio */}
              {activeTab === "audio" && (
                <div>
                  <p className="text-sm font-500 mb-4" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                    A condensed audio version of the key ideas — ideal for quick review.
                  </p>
                  <MiniPlayer summary={summary} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
