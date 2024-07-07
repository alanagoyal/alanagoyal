import { ImageResponse } from "next/og";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const title = slug
    ? slug.startsWith("new-note")
      ? "notes"
      : slug.replace(/-/g, " ")
    : "notes";

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
          src="https://res.cloudinary.com/djp21wtxm/image/upload/v1720369498/i1200x630-Zf2lOvCxwvos_bzybpu.png"
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
            }}
          >
            {title}
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