import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { isMobileRequest } from "@/lib/is-mobile-request";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function WeatherCatchAllPage({ searchParams }: PageProps) {
  const initialIsMobile = await isMobileRequest();
  if (initialIsMobile) {
    return redirect("/");
  }

  return <RouteRedirect basePath="/weather" search={getSearchString(searchParams)} />;
}
