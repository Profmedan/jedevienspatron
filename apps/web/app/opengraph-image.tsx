import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JE DEVIENS PATRON — Jeu sérieux de comptabilité et gestion d'entreprise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#020617",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 10% 20%, rgba(34,211,238,0.18) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(245,158,11,0.12) 0%, transparent 40%)",
          }}
        />
        {/* Label */}
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#67e8f9",
            marginBottom: 24,
          }}
        >
          Pierre Médan · Jeu sérieux
        </p>
        {/* Title */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f8fafc",
            lineHeight: 1,
            marginBottom: 28,
            maxWidth: 820,
          }}
        >
          JE DEVIENS PATRON
        </h1>
        {/* Subtitle */}
        <p
          style={{
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          Comprendre la comptabilité et la gestion d'entreprise en jouant — guidé pas à pas.
        </p>
        {/* Tags */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Comptabilité", "Gestion", "Jeu sérieux", "4 univers métier"].map((tag) => (
            <span
              key={tag}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                padding: "8px 20px",
                fontSize: 15,
                color: "#e2e8f0",
                fontWeight: 500,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        {/* Domain */}
        <p
          style={{
            position: "absolute",
            bottom: 48,
            right: 80,
            fontSize: 16,
            color: "#475569",
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          jedevienspatron.fr
        </p>
      </div>
    ),
    { ...size }
  );
}
