import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function ITermCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/iterm" search={getSearchString(searchParams)} />;
}
