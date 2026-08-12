import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirectIfUnsupportedOnMobile } from "@/lib/desktop/route-guards";
import { getPreviewMetadataFromPath } from "@/lib/preview-utils";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  await redirectIfUnsupportedOnMobile("preview");

  const { file } = await searchParams;
  if (!file || !getPreviewMetadataFromPath(file)) {
    return <AppShellPage appId="preview" />;
  }
  return <AppShellPage appId="preview" initialPreviewFile={file} />;
}
