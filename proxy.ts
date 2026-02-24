import { NextRequest, NextResponse } from "next/server";

const ROOT_ONLY_APP_ROUTES = new Set([
  "settings",
  "messages",
  "iterm",
  "finder",
  "photos",
  "calendar",
  "music",
  "textedit",
  "preview",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return NextResponse.next();
  }

  const [appSegment] = segments;

  if (appSegment === "notes" && segments.length > 2) {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  if (ROOT_ONLY_APP_ROUTES.has(appSegment)) {
    return NextResponse.redirect(new URL(`/${appSegment}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
