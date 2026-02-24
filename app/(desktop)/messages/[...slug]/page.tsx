import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function MessagesCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/messages" search={getSearchString(searchParams)} />;
}
