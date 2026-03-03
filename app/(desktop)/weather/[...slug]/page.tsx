import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function WeatherCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/weather" search={getSearchString(searchParams)} />;
}
