import { AppShellPage } from "@/lib/desktop/app-shell-page";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function TextEditPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  return <AppShellPage appId="textedit" initialTextEditFile={file} />;
}
