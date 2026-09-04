import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than shipped as a file so it always matches the brand copy.
 * Links get pasted into WhatsApp constantly in this market, and a link with no
 * preview card looks like spam.
 */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fdfaf5",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, color: "#b4614f", letterSpacing: 2 }}>
            HANDMADE · MADE TO ORDER
          </div>
          <div
            style={{
              fontSize: 82,
              color: "#23201d",
              marginTop: 24,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Gifts that carry your story
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#7a716a", marginTop: 28, maxWidth: 860 }}>
            Pencil portraits, customised mugs &amp; personalised photo frames — delivered across
            India.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Set in type rather than pulling the logo file: this card is
              rendered at build time, where fetching an asset is fragile. */}
          <div style={{ display: "flex", fontSize: 40, color: "#23201d" }}>
            <span>Twinkle</span>
            <span style={{ color: "#cf8577" }}>Gifts</span>
            <span>You</span>
          </div>
          <div style={{ fontSize: 30, color: "#7a716a" }}>{site.domain}</div>
        </div>
      </div>
    ),
    size,
  );
}
