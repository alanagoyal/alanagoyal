import { RouteRedirect } from "@/components/route-redirect";
import { getSearchString, type SearchParams } from "@/lib/route-utils";

interface PageProps { searchParams?: SearchParams }

export default function GamesCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/games" search={getSearchString(searchParams)} />;
}
