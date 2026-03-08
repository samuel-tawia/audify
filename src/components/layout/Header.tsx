"use client";
// ─────────────────────────────────────────────────────────────────────────────
// components/layout/Header.tsx
// Top navigation bar with logo and action buttons.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Settings, Library } from "lucide-react";
import { SettingsModal } from "@/components/ui/SettingsModal";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between py-8 mb-12 border-b border-[#272b3a]">
        {/* Logo */}
        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl font-bold text-[#eef0f5] tracking-tight">
            Audify
          </span>
          <span className="text-[#f5a623] text-3xl leading-none select-none">·</span>
          <span
            className="font-mono text-[11px] font-medium text-[#f5a623] rounded-full px-3 py-1 uppercase tracking-wider"
            style={{
              background: "rgba(245,166,35,0.12)",
              border: "1px solid rgba(245,166,35,0.2)",
            }}
          >
            Beta
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8b90a0] rounded-md transition-all duration-200 hover:text-[#eef0f5]"
            style={{ border: "1px solid #272b3a", background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#1f2435";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2e3445";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#272b3a";
            }}
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8b90a0] rounded-md transition-all duration-200 hover:text-[#eef0f5]"
            style={{ border: "1px solid #272b3a", background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#1f2435";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#2e3445";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#272b3a";
            }}
          >
            <Library size={14} />
            Library
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
