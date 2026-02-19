import { redirect } from "next/navigation";
import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { getIsMobileRequest } from "@/lib/device/get-is-mobile-request";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const isMobile = await getIsMobileRequest();
  if (isMobile) redirect("/notes");

  const { file } = await searchParams;
  return <AppShellPage appId="preview" initialPreviewFile={file} />;
}
