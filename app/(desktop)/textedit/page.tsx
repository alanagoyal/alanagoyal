import { AppShellPage } from "@/lib/desktop/app-shell-page";
import { redirect } from "next/navigation";
import { isSupportedTextEditPath } from "@/lib/file-route-utils";

type PageProps = {
  searchParams: Promise<{ file?: string }>;
};

export default async function TextEditPage({ searchParams }: PageProps) {
  const { file } = await searchParams;
  if (!file || !isSupportedTextEditPath(file)) {
    return redirect("/finder");
  }
  return <AppShellPage appId="textedit" initialTextEditFile={file} />;
}
