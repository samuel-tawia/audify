"use client";
// components/layout/Sidebar.tsx

import { useState, useEffect } from "react";
import { Library, Settings, Sun, Moon, Upload, Headphones } from "lucide-react";
import { SettingsModal } from "@/components/ui/SettingsModal";

type Props = {
  activeSection?: "upload" | "library";
  onSectionChange?: (s: "upload" | "library") => void;
};

export function Sidebar({ activeSection = "upload", onSectionChange }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("audify-theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("audify-theme", next ? "dark" : "light");
  };

  const navItems = [
    { key: "upload" as const,  icon: Upload,    label: "Convert"  },
    { key: "library" as const, icon: Library,   label: "Library"  },
  ];

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px var(--accent-bg)" }}
            >
              <Headphones size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display text-lg font-700 leading-none" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                Audify
              </p>
              <p className="text-[10px] font-600 uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
                Beta
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ key, icon: Icon, label }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => onSectionChange?.(key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
                style={{
                  background: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  border: active ? "1px solid var(--accent-border)" : "1px solid transparent",
                  fontWeight: active ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span className="text-sm">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-5 space-y-1" style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150"
            style={{ color: "var(--text-secondary)", background: "transparent", border: "1px solid transparent", fontWeight: 500 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <Settings size={17} strokeWidth={2} />
            <span className="text-sm">Settings</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{ color: "var(--text-secondary)", background: "transparent", border: "1px solid transparent", fontWeight: 500 }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
          >
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
              <span className="text-sm">{isDark ? "Dark mode" : "Light mode"}</span>
            </div>
            {/* Toggle pill */}
            <div
              className="relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0"
              style={{ background: isDark ? "var(--accent)" : "var(--border)" }}
            >
              <div
                className="absolute top-[3px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-all duration-200"
                style={{ left: isDark ? "19px" : "3px" }}
              />
            </div>
          </button>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
