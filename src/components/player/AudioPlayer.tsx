"use client";
// components/player/AudioPlayer.tsx
// Plays real MP3 via <audio> element when Google Cloud TTS has generated audio.
// Falls back to Web Speech API when audioUrl is empty (browser TTS mode).

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Download, Share2, Sparkles, X,
} from "lucide-react";
import { formatTime, formatDuration, generateWaveformBars, formatDocTitle } from "@/lib/utils";
import { usePlayerStore } from "@/store";
import { PLAYBACK_SPEEDS } from "@/lib/constants";
import { DEMO_EXTRACTED_TEXT } from "@/lib/constants";
import { downloadAudio } from "@/hooks/useAudio";
import { toast } from "sonner";

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ isPlaying }: { isPlaying: boolean }) {
  const { currentTime, duration, setCurrentTime } = usePlayerStore();
  const ref = useRef<HTMLDivElement>(null);
  const bars = useMemo(() => generateWaveformBars(70), []);
  const [animOffset, setAnimOffset] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => setAnimOffset((o) => (o + 1) % 70), 80);
    return () => clearInterval(id);
  }, [isPlaying]);

  const progress = duration > 0 ? currentTime / duration : 0;
  const playedCount = Math.floor(progress * bars.length);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !duration) return;
    const rect = ref.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setCurrentTime(pct * duration);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="h-12 rounded-xl overflow-hidden cursor-pointer relative"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div className="absolute inset-0 flex items-center gap-[2px] px-3">
        {bars.map((h, i) => {
          const isPlayed  = i < playedCount;
          const isCurrent = i === playedCount;
          const anim = isPlaying && !isPlayed && !isCurrent
            ? Math.max(0.15, h + Math.sin((i + animOffset) * 0.4) * 0.15)
            : h;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all duration-75"
              style={{
                minWidth: "2px",
                height: `${anim * 100}%`,
                background: isPlayed ? "var(--accent)" : isCurrent ? "var(--text-primary)" : "var(--border)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Web Speech Hook (fallback) ───────────────────────────────────────────────

function useWebSpeech() {
  const uttRef    = useRef<SpeechSynthesisUtterance | null>(null);
  const startRef  = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const { setCurrentTime } = usePlayerStore();

  const chunkText = (text: string): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    const chunks: string[] = [];
    let current = "";
    for (const s of sentences) {
      if ((current + s).length > 200) { if (current) chunks.push(current.trim()); current = s; }
      else current += s;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  };

  const speak = useCallback((
    text: string, speed: number, volume: number, isMuted: boolean,
    onEnd: () => void, startFromSeconds = 0,
  ) => {
    window.speechSynthesis.cancel();
    offsetRef.current = startFromSeconds;
    const charsPerSec = 14 * speed;
    const startChar = Math.floor(startFromSeconds * charsPerSec);
    const slicedText = text.slice(startChar) || text;
    const chunks = chunkText(slicedText);
    let chunkIndex = 0;
    startRef.current = Date.now();

    const ticker = setInterval(() => {
      const elapsed = offsetRef.current + (Date.now() - startRef.current) / 1000;
      setCurrentTime(elapsed);
    }, 500);

    const speakChunk = () => {
      if (chunkIndex >= chunks.length) { clearInterval(ticker); onEnd(); return; }
      const utt = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utt.rate   = Math.max(0.1, Math.min(10, speed));
      utt.volume = isMuted ? 0 : volume / 100;
      utt.pitch  = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google"))
        ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
      if (preferred) utt.voice = preferred;
      utt.onend = () => { chunkIndex++; speakChunk(); };
      utt.onerror = (e) => { if (e.error !== "interrupted") { clearInterval(ticker); onEnd(); } };
      uttRef.current = utt;
      window.speechSynthesis.speak(utt);
    };

    speakChunk();
    return () => { clearInterval(ticker); window.speechSynthesis.cancel(); };
  }, [setCurrentTime]);

  const pause  = useCallback(() => window.speechSynthesis.pause(),  []);
  const resume = useCallback(() => window.speechSynthesis.resume(), []);
  const cancel = useCallback(() => { window.speechSynthesis.cancel(); uttRef.current = null; }, []);

  return { speak, pause, resume, cancel };
}

// ─── Main Player ──────────────────────────────────────────────────────────────

export function AudioPlayer({ onSummarize }: { onSummarize?: () => void }) {
  const {
    currentAudio, playbackState, currentTime, duration,
    volume, speed, isMuted,
    setCurrentTime, setVolume, setSpeed, toggleMute, reset,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speedIdx, setSpeedIdx] = useState(PLAYBACK_SPEEDS.indexOf(speed));
  const { speak, pause: wsPause, resume: wsResume, cancel: wsCancel } = useWebSpeech();
  const wsCleanupRef = useRef<(() => void) | null>(null);

  const isPlaying    = playbackState === "playing";
  const hasRealAudio = !!(currentAudio?.audioUrl);
  const getText      = () => currentAudio?.extractedText ?? DEMO_EXTRACTED_TEXT;

  // ── Setup real <audio> element ──────────────────────────────────────────────
  useEffect(() => {
    if (!hasRealAudio || !currentAudio?.audioUrl) return;
    const audio = new Audio(currentAudio.audioUrl);
    audioRef.current = audio;
    audio.volume = isMuted ? 0 : volume / 100;
    audio.playbackRate = speed;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      usePlayerStore.setState({ playbackState: "paused", currentTime: 0 });
      toast.success("Finished!");
    });
    audio.addEventListener("loadedmetadata", () => {
      if (audio.duration && isFinite(audio.duration)) {
        usePlayerStore.setState({ duration: audio.duration });
      }
    });

    return () => { audio.pause(); audio.src = ""; audioRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudio?.id, currentAudio?.audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - currentTime) > 1.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // ── Play / Pause ────────────────────────────────────────────────────────────
  const handleTogglePlay = useCallback(async () => {
    if (!currentAudio) return;
    if (hasRealAudio && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        usePlayerStore.setState({ playbackState: "paused" });
      } else {
        audioRef.current.currentTime = currentTime;
        await audioRef.current.play().catch(console.error);
        usePlayerStore.setState({ playbackState: "playing" });
      }
    } else {
      if (isPlaying) {
        wsPause();
        usePlayerStore.setState({ playbackState: "paused" });
      } else {
        if (playbackState === "paused" && window.speechSynthesis.paused) {
          wsResume();
        } else {
          if (wsCleanupRef.current) wsCleanupRef.current();
          wsCleanupRef.current = speak(getText(), speed, volume, isMuted,
            () => { usePlayerStore.setState({ playbackState: "paused" }); toast.success("Finished reading!"); },
            currentTime) ?? null;
        }
        usePlayerStore.setState({ playbackState: "playing" });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudio, isPlaying, hasRealAudio, playbackState, speed, volume, isMuted, currentTime]);

  // ── Skip ───────────────────────────────────────────────────────────────────
  const handleSkipBack = useCallback(() => {
    const t = Math.max(0, currentTime - 15);
    setCurrentTime(t);
    if (hasRealAudio && audioRef.current) { audioRef.current.currentTime = t; }
    else if (isPlaying) { wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
      wsCleanupRef.current = speak(getText(), speed, volume, isMuted, () => usePlayerStore.setState({ playbackState: "paused" }), t) ?? null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, isPlaying, hasRealAudio, speed, volume, isMuted]);

  const handleSkipForward = useCallback(() => {
    const t = Math.min(duration, currentTime + 30);
    setCurrentTime(t);
    if (hasRealAudio && audioRef.current) { audioRef.current.currentTime = t; }
    else if (isPlaying) { wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
      wsCleanupRef.current = speak(getText(), speed, volume, isMuted, () => usePlayerStore.setState({ playbackState: "paused" }), t) ?? null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration, isPlaying, hasRealAudio, speed, volume, isMuted]);

  // ── Speed ──────────────────────────────────────────────────────────────────
  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % PLAYBACK_SPEEDS.length;
    const ns = PLAYBACK_SPEEDS[next];
    setSpeedIdx(next); setSpeed(ns);
    if (hasRealAudio && audioRef.current) { audioRef.current.playbackRate = ns; }
    else if (isPlaying) { wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
      wsCleanupRef.current = speak(getText(), ns, volume, isMuted, () => usePlayerStore.setState({ playbackState: "paused" }), currentTime) ?? null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedIdx, hasRealAudio, isPlaying, volume, isMuted, currentTime]);

  // ── Mute ───────────────────────────────────────────────────────────────────
  const handleToggleMute = useCallback(() => {
    toggleMute();
    if (hasRealAudio && audioRef.current) { audioRef.current.volume = isMuted ? volume / 100 : 0; }
    else if (isPlaying) { wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
      wsCleanupRef.current = speak(getText(), speed, volume, !isMuted, () => usePlayerStore.setState({ playbackState: "paused" }), currentTime) ?? null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealAudio, isPlaying, isMuted, speed, volume, currentTime]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
    reset();
  }, [wsCancel, reset]);

  useEffect(() => { return () => { wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current(); }; }, [wsCancel]);
  useEffect(() => {
    wsCancel(); if (wsCleanupRef.current) wsCleanupRef.current();
    usePlayerStore.setState({ playbackState: "paused", currentTime: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAudio?.id]);

  if (!currentAudio) return null;

  const { italic, rest } = formatDocTitle(currentAudio.sourceFileName);

  return (
    <div className="rounded-2xl p-5 animate-slide-up" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1 mr-3">
          <h2 className="text-base font-700 leading-snug truncate" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
            <em className="not-italic" style={{ color: "var(--accent)" }}>{italic}</em>
            {rest && <span style={{ color: "var(--text-primary)" }}> — {rest}</span>}
          </h2>
          <p className="text-xs mt-0.5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
            {formatDuration(duration)} · {currentAudio.voice} · {currentAudio.sourceFileType.toUpperCase()}
            {hasRealAudio && <span style={{ color: "var(--green)" }}> · Cloud TTS ✓</span>}
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => downloadAudio(currentAudio.audioUrl, currentAudio.sourceFileName, currentAudio.extractedText, currentAudio.voice)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }} title="Download MP3">
            <Download size={12} />
          </button>
          <button onClick={handleReset}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-muted)" }} title="Close">
            <X size={12} />
          </button>
        </div>
      </div>

      <Waveform isPlaying={isPlaying} />

      <div className="flex justify-between text-[11px] font-500 mt-1.5 mb-4" style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Google Sans Mono', monospace" }}>
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Mode badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-500"
        style={{
          background: hasRealAudio ? "var(--green-bg)" : "var(--accent-bg)",
          border: `1px solid ${hasRealAudio ? "rgba(52,168,83,0.25)" : "var(--accent-border)"}`,
          color: "var(--text-secondary)", fontWeight: 500,
        }}>
        <span>{hasRealAudio ? "🎵" : "🔊"}</span>
        {hasRealAudio
          ? "Google Cloud TTS · Neural voice · Download enabled"
          : "Browser TTS · Add GOOGLE_TTS_API_KEY to .env.local for cloud audio"}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5 mb-4">
        <button onClick={handleSkipBack} className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
          style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }} title="Back 15s">
          <SkipBack size={14} />
        </button>
        <button onClick={handleTogglePlay} className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-150"
          style={{ background: "var(--accent)", color: "#fff", border: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: "2px" }} />}
        </button>
        <button onClick={handleSkipForward} className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150"
          style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }} title="Forward 30s">
          <SkipForward size={14} />
        </button>
        <button onClick={cycleSpeed} className="text-xs font-700 px-2.5 py-1.5 rounded-lg transition-all duration-150"
          style={{ fontWeight: 700, border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontFamily: "'Google Sans Mono', monospace" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-bg)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)"; }}>
          {speed.toFixed(2).replace(".00", "")}×
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleToggleMute} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input type="range" min={0} max={100} value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseInt(e.target.value))} className="flex-1 cursor-pointer" />
        <span className="text-[11px] font-500 w-7 text-right" style={{ color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Google Sans Mono', monospace" }}>
          {isMuted ? "0" : volume}%
        </span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        {[
          { icon: Sparkles, label: "Summary", action: onSummarize, accent: true },
          { icon: Download, label: "Download", action: () => downloadAudio(currentAudio.audioUrl, currentAudio.sourceFileName, currentAudio.extractedText, currentAudio.voice), accent: false },
          { icon: Share2,   label: "Share",    action: () => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }, accent: false },
        ].map(({ icon: Icon, label, action, accent }) => (
          <button key={label} onClick={action}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-600 transition-all duration-150"
            style={{ fontWeight: 600, background: accent ? "var(--accent-bg)" : "var(--bg-elevated)", border: `1px solid ${accent ? "var(--accent-border)" : "var(--border)"}`, color: accent ? "var(--accent)" : "var(--text-secondary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent ? "var(--accent)" : "var(--bg-hover)"; if (accent) (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent ? "var(--accent-bg)" : "var(--bg-elevated)"; if (accent) (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>
    </div>
  );
}
