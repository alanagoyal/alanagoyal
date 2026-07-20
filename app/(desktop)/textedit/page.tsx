import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { isSupportedTextEditPath } from "@/lib/file-route-utils";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function TextEditPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  if (!file || !isSupportedTextEditPath(file)) {
    return <AppShellPage appId="textedit" />;
  }
  return <AppShellPage appId="textedit" initialTextEditFile={file} />;
}
