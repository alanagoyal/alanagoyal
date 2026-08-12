import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function TextEditCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("textedit");

  return <RouteRedirect basePath="/textedit" search={getSearchString(searchParams)} />;
}
