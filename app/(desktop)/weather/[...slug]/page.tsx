import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function WeatherCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("weather");

  return <RouteRedirect basePath="/weather" search={getSearchString(searchParams)} />;
}
