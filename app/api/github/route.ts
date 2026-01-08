import { NextRequest, NextResponse } from "next/server";
import {
  fetchUserRepos,
  fetchRepoTree,
  fetchFileContent,
  getRepoNames,
} from "@/lib/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");

  try {
    switch (type) {
      case "repos": {
        const repos = await fetchUserRepos();
        return NextResponse.json({
          repos: getRepoNames(repos),
          details: repos.map((r) => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
          })),
        });
      }

      case "tree": {
        if (!repo) {
          return NextResponse.json(
            { error: "repo parameter required" },
            { status: 400 }
          );
        }
        const tree = await fetchRepoTree(repo);
        return NextResponse.json({ tree });
      }

      case "file": {
        if (!repo || !path) {
          return NextResponse.json(
            { error: "repo and path parameters required" },
            { status: 400 }
          );
        }
        const content = await fetchFileContent(repo, path);
        return NextResponse.json({ content });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type. Use: repos, tree, or file" },
          { status: 400 }
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    if (message.includes("not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
