import { ImageResponse } from "next/og"

export default async function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          color: "white",
          background: "black",
          width: "100%",
          height: "100%",
          padding: "50px 200px",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        📓 alana goyal
      </div>
    ),
    {
      width: 1200,
      height: 630,
      emoji: "twemoji",
    }
  )
}
