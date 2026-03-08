import { useState, useEffect } from "react";

const STORAGE_KEY = "riskterrain-settings";

const TIMEZONES = [
  { value: "local", label: "LOCAL" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST" },
  { value: "America/Chicago", label: "CST" },
  { value: "America/Los_Angeles", label: "PST" },
  { value: "Europe/London", label: "GMT" },
  { value: "Europe/Berlin", label: "CET" },
  { value: "Asia/Tokyo", label: "JST" },
  { value: "Asia/Shanghai", label: "CST (CN)" },
];

const DATE_FORMATS = [
  { value: "relative", label: "RELATIVE" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const THEMES = [
  { value: "blue", label: "BLUE", color: "#3B82F6" },
  { value: "amber", label: "AMBER", color: "#F59E0B" },
  { value: "emerald", label: "EMERALD", color: "#10B981" },
  { value: "violet", label: "VIOLET", color: "#8B5CF6" },
];

const DEFAULTS = { timezone: "local", dateFormat: "relative", theme: "blue" };

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULTS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    const theme = THEMES.find(t => t.value === settings.theme);
    if (theme) {
      document.documentElement.style.setProperty("--rt-accent", theme.color);
    }
  }, [settings]);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const currentTheme = THEMES.find(t => t.value === settings.theme) || THEMES[0];

  // Format current time according to settings
  const now = new Date();
  let timeStr;
  try {
    if (settings.timezone === "local") {
      timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } else {
      timeStr = now.toLocaleTimeString(undefined, {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: settings.timezone,
      });
    }
  } catch {
    timeStr = now.toLocaleTimeString();
  }

  let dateStr;
  const d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear();
  const pad = (n) => String(n).padStart(2, "0");
  switch (settings.dateFormat) {
    case "MM/DD/YYYY": dateStr = `${pad(m)}/${pad(d)}/${y}`; break;
    case "DD/MM/YYYY": dateStr = `${pad(d)}/${pad(m)}/${y}`; break;
    case "YYYY-MM-DD": dateStr = `${y}-${pad(m)}-${pad(d)}`; break;
    default: dateStr = "Just now";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
      {/* Timezone */}
      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{
          color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2, marginBottom: 6, fontWeight: 700,
        }}>TIMEZONE</div>
        <select
          value={settings.timezone}
          onChange={e => update("timezone", e.target.value)}
          style={{
            width: "100%", background: "rgba(15,23,42,0.8)",
            border: `1px solid ${currentTheme.color}30`,
            color: "#F8FAFC", borderRadius: 4, padding: "5px 8px",
            fontSize: 9, fontFamily: "JetBrains Mono, monospace",
            outline: "none", cursor: "pointer",
            appearance: "none", WebkitAppearance: "none",
          }}
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value} style={{ background: "#0A0F1E" }}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Format */}
      <div style={{ padding: "6px 12px" }}>
        <div style={{
          color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2, marginBottom: 6, fontWeight: 700,
        }}>DATE FORMAT</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {DATE_FORMATS.map(fmt => {
            const active = settings.dateFormat === fmt.value;
            return (
              <button
                key={fmt.value}
                onClick={() => update("dateFormat", fmt.value)}
                style={{
                  background: active ? `${currentTheme.color}20` : "rgba(15,23,42,0.6)",
                  border: `1px solid ${active ? `${currentTheme.color}60` : "rgba(100,116,139,0.2)"}`,
                  color: active ? currentTheme.color : "#64748B",
                  padding: "3px 8px", borderRadius: 3, cursor: "pointer",
                  fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                  fontWeight: active ? 700 : 400, transition: "all 0.15s",
                  letterSpacing: 0.5,
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = `${currentTheme.color}40`;
                    e.currentTarget.style.color = "#94A3B8";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.borderColor = "rgba(100,116,139,0.2)";
                    e.currentTarget.style.color = "#64748B";
                  }
                }}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Accent */}
      <div style={{ padding: "6px 12px" }}>
        <div style={{
          color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2, marginBottom: 6, fontWeight: 700,
        }}>ACCENT THEME</div>
        <div style={{ display: "flex", gap: 8 }}>
          {THEMES.map(t => {
            const active = settings.theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => update("theme", t.value)}
                title={t.label}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: active ? `${t.color}20` : "rgba(15,23,42,0.6)",
                  border: `2px solid ${active ? t.color : "rgba(100,116,139,0.2)"}`,
                  cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.borderColor = `${t.color}60`;
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.borderColor = "rgba(100,116,139,0.2)";
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: t.color,
                  boxShadow: active ? `0 0 10px ${t.color}80` : "none",
                  transition: "box-shadow 0.15s",
                }} />
              </button>
            );
          })}
        </div>
        <div style={{
          marginTop: 6, display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: 2,
            background: currentTheme.color,
            boxShadow: `0 0 6px ${currentTheme.color}60`,
          }} />
          <span style={{
            color: currentTheme.color, fontSize: 8,
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700, letterSpacing: 1,
          }}>{currentTheme.label}</span>
        </div>
      </div>

      {/* Live Preview */}
      <div style={{
        marginTop: "auto", padding: "8px 12px",
        borderTop: `1px solid ${currentTheme.color}15`,
        background: `${currentTheme.color}05`,
      }}>
        <div style={{
          color: "#475569", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 2, marginBottom: 5, fontWeight: 700,
        }}>PREVIEW</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            color: currentTheme.color, fontSize: 13,
            fontFamily: "JetBrains Mono, monospace", fontWeight: 800,
          }}>{timeStr}</span>
          <span style={{
            color: "#64748B", fontSize: 9,
            fontFamily: "JetBrains Mono, monospace",
          }}>{dateStr}</span>
        </div>
        <div style={{
          color: "#334155", fontSize: 7, fontFamily: "JetBrains Mono, monospace",
          marginTop: 3, letterSpacing: 0.5,
        }}>
          {settings.timezone === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : settings.timezone}
        </div>
      </div>
    </div>
  );
}
