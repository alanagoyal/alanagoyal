import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { detectInitialIsMobile } from "@/lib/server/device-detect";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const initialIsMobile = await detectInitialIsMobile();
  const { file } = await searchParams;
  return <AppShellPage appId="preview" initialPreviewFile={file} initialIsMobile={initialIsMobile} />;
}
