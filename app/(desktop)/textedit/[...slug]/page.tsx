import { getSearchString, type SearchParams } from "@/lib/route-utils";
import { RouteRedirect } from "@/components/route-redirect";

type PageProps = {
  searchParams?: SearchParams;
};

export default function TextEditCatchAllPage({ searchParams }: PageProps) {
  return <RouteRedirect basePath="/textedit" search={getSearchString(searchParams)} />;
}
