import { ImageResponse } from "next/og";

export const alt = "Pro Voleybol — Sultanlar Ligi, 1. Lig ve 2. Lig Canlı Skor ve Puan Durumu";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0C0A10 0%, #171221 55%, #361622 100%)",
          color: "#FBF7F0",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "10px 22px",
              borderRadius: "999px",
              background: "rgba(245, 184, 61, 0.16)",
              border: "1px solid rgba(245, 184, 61, 0.45)",
              color: "#F5B83D",
              fontSize: "22px",
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            TVF PROFESYONEL KADINLAR VOLEYBOL LİGLERİ
          </div>
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#D8CEC2",
            }}
          >
            pro-volley.onrender.com
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Pro Voleybol
          </div>
          <div
            style={{
              fontSize: "32px",
              fontWeight: 500,
              lineHeight: 1.35,
              color: "#E4DBD0",
              maxWidth: "960px",
            }}
          >
            Vodafone Sultanlar Ligi, Arabica Coffee House Kadınlar 1. Ligi ve Uzman Posta Kadınlar 2. Ligi canlı puan durumu, fikstür ve sonuçlar.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            borderTop: "1px solid rgba(245, 184, 61, 0.25)",
            paddingTop: "28px",
            fontSize: "22px",
            fontWeight: 700,
            color: "#F5B83D",
          }}
        >
          <span>Vodafone Sultanlar Ligi</span>
          <span style={{ color: "#B81D3A" }}>•</span>
          <span>Kadınlar 1. Ligi (A &amp; B)</span>
          <span style={{ color: "#B81D3A" }}>•</span>
          <span>Kadınlar 2. Ligi (16 Grup)</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
