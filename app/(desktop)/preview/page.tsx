import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getPreviewMetadataFromPath } from "@/lib/preview-utils";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  if (!file || !getPreviewMetadataFromPath(file)) {
    return <AppShellPage appId="preview" />;
  }
  return <AppShellPage appId="preview" initialPreviewFile={file} />;
}
