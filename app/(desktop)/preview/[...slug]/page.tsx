import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function PreviewCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/preview" search={getSearchString(searchParams)} />;
}
