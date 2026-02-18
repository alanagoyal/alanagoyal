import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { detectInitialIsMobile } from "@/lib/server/device-detect";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function TextEditPage({ searchParams }: PageProps) {
  const initialIsMobile = await detectInitialIsMobile();
  const { file } = await searchParams;
  return <AppShellPage appId="textedit" initialTextEditFile={file} initialIsMobile={initialIsMobile} />;
}
