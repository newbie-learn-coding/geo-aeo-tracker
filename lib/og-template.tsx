import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export function buildOgImage({
  title,
  subtitle,
  pills,
}: {
  title: string;
  subtitle: string;
  pills?: string[];
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #050810 0%, #0a0f1c 50%, #0d1424 100%)",
          fontFamily: "system-ui, sans-serif",
          padding: "60px",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(61,127,252,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(157,151,244,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            display: "flex",
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "26px",
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            marginTop: "20px",
            display: "flex",
          }}
        >
          {subtitle}
        </div>

        {/* Provider pills */}
        {pills && pills.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "40px",
              justifyContent: "center",
            }}
          >
            {pills.map((pill) => (
              <div
                key={pill}
                style={{
                  padding: "10px 24px",
                  borderRadius: "999px",
                  background: "rgba(61,127,252,0.15)",
                  border: "1px solid rgba(61,127,252,0.3)",
                  color: "#3D7FFC",
                  fontSize: "18px",
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {pill}
              </div>
            ))}
          </div>
        )}

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
            }}
          >
            aitracking.io
          </div>
        </div>
      </div>
    ),
    ogSize,
  );
}
