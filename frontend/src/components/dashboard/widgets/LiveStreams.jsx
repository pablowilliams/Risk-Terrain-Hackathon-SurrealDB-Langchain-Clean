import { useState } from "react";

// ── Stream catalogue ──────────────────────────────────────────────────────────
// Uses videoId (direct, most reliable) or channelId (live_stream pattern) as fallback.
const CHANNELS = [
  { name: "BBC News",    videoId: "ZMpkFQbqLO4" },
  { name: "DW News",     videoId: "LuKwFajn37U" },
  { name: "France 24",   channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg" },
  { name: "Al Jazeera",  channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg" },
  { name: "Sky News",    channelId: "UCoMdktPbSTixAyNGwb-UYkQ" },
];

function getEmbedUrl(channel) {
  if (channel.videoId) {
    return `https://www.youtube.com/embed/${channel.videoId}?autoplay=1&mute=1&controls=1&rel=0`;
  }
  return `https://www.youtube.com/embed/live_stream?channel=${channel.channelId}&autoplay=1&mute=1&controls=1&rel=0`;
}

function getChannelKey(channel) {
  return channel.videoId || channel.channelId;
}

// ── LiveStreams ────────────────────────────────────────────────────────────────
// Pure content widget — no container chrome (FloatingWidget provides that).
// Renders channel selector pills and an embedded YouTube live stream.

export default function LiveStreams({ watchlistTickers: _watchlistTickers }) {
  const [activeChannel, setActiveChannel] = useState(null);

  function handleChannelClick(channel) {
    setActiveChannel(prev =>
      prev && getChannelKey(prev) === getChannelKey(channel) ? null : channel
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Channel pills */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 5, padding: "8px 10px",
        borderBottom: activeChannel ? "1px solid rgba(59,130,246,0.08)" : "none",
        flexShrink: 0,
      }}>
        {CHANNELS.map(channel => {
          const key = getChannelKey(channel);
          const isActive = activeChannel && getChannelKey(activeChannel) === key;
          return (
            <button key={key} onClick={() => handleChannelClick(channel)}
              style={{
                background: isActive ? "rgba(239,68,68,0.15)" : "rgba(15,23,42,0.6)",
                border: `1px solid ${isActive ? "rgba(239,68,68,0.45)" : "rgba(59,130,246,0.15)"}`,
                color: isActive ? "#FCA5A5" : "#64748B",
                borderRadius: 20, padding: "3px 10px", fontSize: 8,
                fontFamily: "JetBrains Mono, monospace", letterSpacing: 0.5,
                cursor: "pointer", fontWeight: isActive ? 700 : 400,
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#F8FAFC"; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "rgba(15,23,42,0.6)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.15)"; e.currentTarget.style.color = "#64748B"; }}}
            >
              {isActive && (
                <span style={{
                  width: 5, height: 5, borderRadius: "50%", background: "#EF4444",
                  boxShadow: "0 0 4px #EF4444", display: "inline-block",
                  flexShrink: 0, animation: "pulse 1.5s infinite",
                }} />
              )}
              {channel.name}
            </button>
          );
        })}
      </div>

      {/* Embed player */}
      {activeChannel && (
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", flexShrink: 0 }}>
          <iframe
            key={getChannelKey(activeChannel)}
            src={getEmbedUrl(activeChannel)}
            title={`${activeChannel.name} Live`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              border: "none", display: "block",
            }}
          />
        </div>
      )}

      {/* Empty state when no stream selected */}
      {!activeChannel && (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#334155", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          letterSpacing: 1,
        }}>
          SELECT A CHANNEL
        </div>
      )}
    </div>
  );
}
