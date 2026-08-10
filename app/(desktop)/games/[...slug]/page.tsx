import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";
import { getSearchString, type SearchParams } from "@/lib/route-utils";

interface PageProps { searchParams?: SearchParams }

export default async function GamesCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("games");

  return <RouteRedirect basePath="/games" search={getSearchString(searchParams)} />;
}
