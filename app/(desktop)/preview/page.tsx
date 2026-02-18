import { AppShellPage } from "@/lib/desktop/app-shell-page";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function PreviewPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  return <AppShellPage appId="preview" initialPreviewFile={file} />;
}
