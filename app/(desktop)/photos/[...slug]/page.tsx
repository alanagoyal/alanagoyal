import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function PhotosCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/photos" search={getSearchString(searchParams)} />;
}
