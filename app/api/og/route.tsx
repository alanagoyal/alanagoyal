import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "notes";
  const emoji = searchParams.get("emoji") || "";

  const decodedTitle = title ? decodeURIComponent(title) : "new note";
  const truncatedTitle = decodedTitle.length > 50 ? decodedTitle.slice(0, 47) + "..." : decodedTitle;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "relative",
          fontFamily: "-apple-system, SF Pro Display, SF Pro Text",
          backgroundColor: "black",
        }}
      >
        <div
          style={{
            backgroundColor: "#2C2C2E",
            borderRadius: "48px",
            width: "800px",
            padding: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              style={{
                width: "160px",
                height: "160px",
                position: "relative",
                borderRadius: "36px",
                overflow: "hidden",
                display: "flex",
                backgroundColor: "#FFCC00",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "33.333%",
                  width: "100%",
                  height: "66.667%",
                  backgroundColor: "white",
                  padding: "16px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-around",
                  }}
                >
                  <div style={{ borderTop: "2px solid #D1D1D6" }} />
                  <div style={{ borderTop: "2px solid #D1D1D6" }} />
                  <div style={{ borderTop: "2px solid #D1D1D6" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "white", fontSize: "48px", fontWeight: 500 }}>
                alana goyal
              </span>
              <span style={{ color: "#8E8E93", fontSize: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                {emoji} {truncatedTitle}
              </span>
            </div>
          </div>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "32px",
              backgroundColor: "#3A3A3C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#8E8E93">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "60px",
              height: "60px",
              background: "#2C2C2E",
              clipPath: "polygon(0 0, 100% 0, 100% 100%)",
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}