import { ImageResponse } from "next/og";

/** Share-card size used by Facebook, WhatsApp, LinkedIn, X and others. */
export const OG_SIZE = { width: 1200, height: 630 };

const C = { deep: "#0d1129", wall: "#13497f", cream: "#fff6ea", coral: "#f79a6b", sky: "#5cc3f0", sponge: "#f2c14e" };

/**
 * Branded share card: eyebrow, big title, a row of fact chips, and the
 * OpenDive Atlas wordmark with a stylised seabed.
 */
export function ogCard({
  eyebrow,
  title,
  subtitle,
  chips = [],
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  chips?: string[];
}) {
  const size = title.length > 34 ? 64 : title.length > 22 ? 76 : 88;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, ${C.wall} 0%, ${C.deep} 100%)`,
          color: C.cream,
          padding: "64px 72px 104px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, color: C.sky, letterSpacing: 2, textTransform: "uppercase" }}>{eyebrow}</div>
          <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.05, color: C.cream, maxWidth: 1050 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 32, color: "rgba(255,246,234,0.85)", maxWidth: 1050 }}>{subtitle}</div>}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 10 }}>
              {chips.slice(0, 5).map((c) => (
                <div
                  key={c}
                  style={{
                    fontSize: 26,
                    padding: "8px 20px",
                    borderRadius: 999,
                    background: "rgba(255,246,234,0.12)",
                    border: "1px solid rgba(255,246,234,0.3)",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, letterSpacing: 6, fontWeight: 600 }}>OPENDIVE</div>
            <div style={{ fontSize: 20, letterSpacing: 16, color: C.coral }}>ATLAS</div>
          </div>
          <div style={{ fontSize: 26, color: "rgba(255,246,234,0.75)" }}>opendiveatlas.org</div>
        </div>
        {/* Seabed */}
        <svg
          width="1200"
          height="70"
          viewBox="0 0 1200 70"
          style={{ position: "absolute", left: 0, bottom: 0 }}
        >
          <path d="M0 46 108 40 204 47 312 34 432 42 564 28 672 38 792 25 912 36 1032 22 1200 30V70H0Z" fill={C.sponge} opacity="0.9" />
        </svg>
      </div>
    ),
    OG_SIZE,
  );
}
