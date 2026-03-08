"use client";
// components/ui/SettingsModal.tsx

import { X } from "lucide-react";
import { useSettingsStore } from "@/store";
import { PLAYBACK_SPEEDS, VOICE_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";

type Props = { open: boolean; onClose: () => void };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
      style={{ background: checked ? "var(--accent)" : "var(--border)" }}
    >
      <span
        className="absolute top-[3px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-all duration-200"
        style={{ left: checked ? "21px" : "3px" }}
      />
    </button>
  );
}

export function SettingsModal({ open, onClose }: Props) {
  const settings = useSettingsStore();
  if (!open) return null;

  const TOGGLES = [
    { label: "Auto-summarise on upload",  hint: "Generate summary after conversion",     key: "autoSummarize"  as const },
    { label: "Keep files in library",     hint: "Save converted audio to your library",  key: "keepInLibrary"  as const },
    { label: "Skip title slides",         hint: "Ignore slide headers during conversion", key: "skipTitleSlides"as const },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md mx-4 rounded-2xl p-6 animate-slide-up"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-700" style={{ color: "var(--text-primary)", fontWeight: 700 }}>Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Toggles */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          {TOGGLES.map(({ label, hint, key }) => (
            <div key={key} className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div>
                <p className="text-sm font-600" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{label}</p>
                <p className="text-xs mt-0.5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>{hint}</p>
              </div>
              <Toggle checked={settings[key]} onChange={(v) => settings.update({ [key]: v })} />
            </div>
          ))}
        </div>

        {/* Selects */}
        <div className="mt-1">
          <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div>
              <p className="text-sm font-600" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Default speed</p>
              <p className="text-xs mt-0.5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Playback rate for new tracks</p>
            </div>
            <select
              value={settings.defaultSpeed}
              onChange={(e) => settings.update({ defaultSpeed: parseFloat(e.target.value) })}
              className="text-sm font-600 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
              style={{
                fontWeight: 600,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                fontFamily: "'Google Sans Mono', monospace",
              }}
            >
              {PLAYBACK_SPEEDS.map((s) => (
                <option key={s} value={s}>{s.toFixed(2).replace(".00", "")}×</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-sm font-600" style={{ color: "var(--text-primary)", fontWeight: 600 }}>Default voice</p>
              <p className="text-xs mt-0.5 font-500" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Voice for new conversions</p>
            </div>
            <select
              value={settings.defaultVoice}
              onChange={(e) => settings.update({ defaultVoice: e.target.value })}
              className="text-sm font-600 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
              style={{
                fontWeight: 600,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => { onClose(); toast.success("Settings saved"); }}
          className="w-full mt-4 py-2.5 rounded-lg text-sm font-700 transition-all duration-150"
          style={{ background: "var(--accent)", color: "#fff", fontWeight: 700 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--accent)")}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
