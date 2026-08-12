import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function ITermCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("iterm");

  return <RouteRedirect basePath="/iterm" search={getSearchString(searchParams)} />;
}
