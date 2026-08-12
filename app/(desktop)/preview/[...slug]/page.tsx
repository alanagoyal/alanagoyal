import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";

type PageProps = {
  searchParams?: SearchParams;
};

export default async function PreviewCatchAllPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("preview");

  return <RouteRedirect basePath="/preview" search={getSearchString(searchParams)} />;
}
