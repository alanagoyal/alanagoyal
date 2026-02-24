import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirect } from "next/navigation";
import { getPreviewMetadataFromPath } from "@/lib/preview-utils";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  if (!file || !getPreviewMetadataFromPath(file)) {
    return redirect("/finder");
  }
  return <AppShellPage appId="preview" initialPreviewFile={file} />;
}
