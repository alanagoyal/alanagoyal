import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function FinderCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("finder");

  return <RouteRedirect basePath="/finder" search={getSearchString(searchParams)} />;
}
