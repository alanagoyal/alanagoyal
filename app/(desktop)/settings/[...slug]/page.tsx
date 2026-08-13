import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function SettingsCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("settings");

  return <RouteRedirect basePath="/settings" search={getSearchString(searchParams)} />;
}
