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
          fontFamily: "sans-serif",
        }}
      >
        <img
          width="1200"
          height="630"
          src="https://base-case-images.s3.us-west-1.amazonaws.com/og-blank.png"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontSize: 60,
              fontWeight: "bold",
              color: "white",
              margin: 0,
            }}
          >
            alana goyal
          </p>
          <p
            style={{
              fontSize: 36,
              color: "#96959B",
              margin: 0,
              marginTop: 10,
              maxWidth: 1000, 
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {emoji} {truncatedTitle}
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}