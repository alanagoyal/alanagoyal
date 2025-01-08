import { ImageResponse } from "next/og";

export async function GET() {

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
          fontFamily: "SF Pro Text",
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
                backgroundColor: "#34C759",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <svg width="100" height="100" viewBox="0 0 181 180" fill="white" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="95.7162" cy="89.4925" rx="74.2836" ry="62.4925"/>
                <path d="M104.026 54.7652L77.0083 57.6049C50.8965 60.3493 31.6836 81.1646 34.0937 104.095L34.7171 110.027C38.6688 147.624 25.0764 153.021 21.3517 153.413C43.2039 151.116 52.5018 142.711 54.9409 140.048C63.7983 145.251 74.7835 147.797 86.36 146.58L113.376 143.741C139.488 140.996 158.702 120.181 156.292 97.2499L155.669 91.3186C153.259 68.3866 130.136 52.0209 104.026 54.7652Z"/>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "white", fontSize: "48px", fontWeight: 500 }}>
                alana goyal
              </span>
              <span style={{ color: "#8E8E93", fontSize: "32px", display: "flex", alignItems: "center", gap: "8px" }}>
                messages
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