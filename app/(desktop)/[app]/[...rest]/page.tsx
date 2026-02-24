import { notFound, redirect } from "next/navigation";

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

type PageProps = {
  params: Promise<{ app: string; rest: string[] }>;
};

export default async function InvalidNestedAppRoutePage({ params }: PageProps) {
  const { app } = await params;

  if (app === "notes") {
    redirect("/notes");
  }

  if (ROOT_ONLY_APP_ROUTES.has(app)) {
    redirect(`/${app}`);
  }

  notFound();
}
