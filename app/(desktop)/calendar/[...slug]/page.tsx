import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function CalendarCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/calendar" search={getSearchString(searchParams)} />;
}
