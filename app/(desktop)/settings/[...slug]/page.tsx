import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function SettingsCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/settings" search={getSearchString(searchParams)} />;
}
