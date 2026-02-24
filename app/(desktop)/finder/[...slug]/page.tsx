import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function FinderCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/finder" search={getSearchString(searchParams)} />;
}
