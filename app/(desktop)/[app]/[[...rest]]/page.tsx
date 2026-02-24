import { notFound, redirect } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getShellAppIdFromPathname } from "@/lib/shell-routing";

const UNKNOWN_APP_FALLBACK = "__unknown__";

type PageProps = {
  params: Promise<{ app: string; rest?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryString(searchParams: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.append(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
    }
  }

  const search = query.toString();
  return search ? `?${search}` : "";
}

export default async function AppFallbackPage({ params, searchParams }: PageProps) {
  const { app, rest } = await params;
  const queryString = getQueryString(await searchParams);
  const resolvedAppId = getShellAppIdFromPathname(`/${app}`, UNKNOWN_APP_FALLBACK);

  if (resolvedAppId === UNKNOWN_APP_FALLBACK) {
    notFound();
  }

  if (app !== resolvedAppId || (rest && rest.length > 0)) {
    redirect(`/${resolvedAppId}${queryString}`);
  }

  return <AppShellPage appId={resolvedAppId} />;
}
