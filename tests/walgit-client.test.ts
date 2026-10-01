import assert from "node:assert/strict";
import test from "node:test";
import { createWalgitBrowser, readWalgitConfig, walgitErrorMessage } from "../lib/walgit-client";
import { WALGIT_DIR, parseWalgitPath } from "../lib/walgit-path";
import { getPreviewMetadataFromPath } from "../lib/preview-utils";
import { getFinderPathSegments } from "../lib/finder-path";

const sha = "a".repeat(40);
const repoPath = `${WALGIT_DIR}/alana/demo`;
const json = (body: unknown) => Response.json(body);

test("configuration is opt-in, validates origins and keeps owner/repo identities", () => {
  assert.equal(readWalgitConfig(), null);
  assert.deepEqual(readWalgitConfig("https://git.example.com", "alana/demo, other/demo, alana/demo"), {
    base: "https://git.example.com", repos: ["alana/demo", "other/demo"],
  });
  for (const base of ["http://git.example.com", "https://user:secret@git.example.com", "https://git.example.com/path", "https://git.example.com?token=secret"]) {
    assert.throws(() => readWalgitConfig(base, "alana/demo"));
  }
  for (const repos of ["", "demo", "../demo", "alana/..", "alana/demo/path"]) {
    assert.throws(() => readWalgitConfig("https://git.example.com", repos));
  }
});

test("Walgit navigation is isolated from GitHub and does not invent binary URLs", () => {
  assert.equal(parseWalgitPath("/Users/alanagoyal/Projects/demo/README.md"), null);
  assert.deepEqual(parseWalgitPath(`${repoPath}/docs/hello world.md`), {
    owner: "alana", repo: "alana/demo", filePath: "docs/hello world.md",
  });
  assert.equal(parseWalgitPath(`${repoPath}/../secrets`), null);
  assert.equal(getPreviewMetadataFromPath(`${repoPath}/image.png`), null);
  assert.equal(getFinderPathSegments(repoPath)[1].label, "Walgit");
});

test("only configured repositories appear; tree and blob reads use the same default-head SHA", async () => {
  const calls: string[] = [];
  const browser = createWalgitBrowser("https://git.example.com", "alana/demo,other/demo", async (url, init) => {
    calls.push(String(url));
    assert.equal(init?.credentials, "omit");
    assert.equal((init?.headers as Record<string, string>).Authorization, undefined);
    if (String(url).endsWith("/refs")) return json({ head: { name: "refs/heads/trunk", sha } });
    if (String(url).includes("/tree/")) return json({ entries: [
      { name: "docs", type: "tree" }, { name: "README.md", type: "blob" }, { name: "submodule", type: "commit" },
    ] });
    return json({ contents: "hello from walgit" });
  });
  assert.deepEqual((await browser.list(WALGIT_DIR)).map(item => item.name), ["alana", "other"]);
  assert.deepEqual(await browser.list(`${WALGIT_DIR}/alana`), [{ name: "demo", type: "dir", path: repoPath }]);
  assert.equal(calls.length, 0);
  await assert.rejects(browser.list(`${WALGIT_DIR}/private/repo`), /not configured/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await browser.list(repoPath), [
    { name: "docs", type: "dir", path: `${repoPath}/docs` },
    { name: "README.md", type: "file", path: `${repoPath}/README.md` },
  ]);
  assert.equal(await browser.text(`${repoPath}/docs/hello world.md`), "hello from walgit");
  assert.deepEqual(calls, [
    "https://git.example.com/alana/demo/api/refs",
    `https://git.example.com/alana/demo/api/tree/${sha}`,
    `https://git.example.com/alana/demo/api/blob/${sha}/docs/hello%20world.md`,
  ]);
});

test("cold-server SSE produces progress and the final text result", async () => {
  const notices: string[] = [];
  const browser = createWalgitBrowser("https://git.example.com", "alana/demo", async url => {
    if (String(url).endsWith("/refs")) return json({ head: { sha } });
    const body = new ReadableStream({ start(controller) {
      const encoder = new TextEncoder();
      // Split a packet across chunks, like an actual network response.
      controller.enqueue(encoder.encode('event: notice\ndata: {"text":"Loading index"}\n\nevent: res'));
      controller.enqueue(encoder.encode('ult\ndata: {"contents":"streamed text"}\n\n'));
      controller.close();
    } });
    return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
  });
  assert.equal(await browser.text(`${repoPath}/README.md`, {
    onProgress: packet => { if (packet.kind === "notice") notices.push(packet.text); },
  }), "streamed text");
  assert.deepEqual(notices, ["Loading index"]);
});

test("empty repos, binary files and oversized files have explicit outcomes", async () => {
  const empty = createWalgitBrowser("https://git.example.com", "alana/demo", async () => json({ head: null }));
  assert.deepEqual(await empty.list(repoPath), []);
  for (const [blob, message] of [[{ binary: true }, /binary/], [{ too_large: true }, /limit/], [{}, /no file contents/]] as const) {
    const browser = createWalgitBrowser("https://git.example.com", "alana/demo", async url => String(url).endsWith("/refs") ? json({ head: { sha } }) : json(blob));
    await assert.rejects(browser.text(`${repoPath}/file`), message);
  }
  const browser = createWalgitBrowser("https://git.example.com", "alana/demo", async url => String(url).endsWith("/refs") ? json({ head: { sha } }) : json({ contents: "" }));
  assert.equal(await browser.text(`${repoPath}/empty.txt`), "");
});

test("auth failures do not prompt or retry; cancellation reaches the SDK", async () => {
  let requests = 0;
  const browser = createWalgitBrowser("https://git.example.com", "alana/demo", async () => {
    requests++;
    return new Response("Unauthorized", { status: 401 });
  });
  await assert.rejects(browser.list(repoPath), error => {
    assert.equal(walgitErrorMessage(error), "This Walgit repository is not publicly readable.");
    return true;
  });
  assert.equal(requests, 1);
  const controller = new AbortController();
  controller.abort();
  const cancelled = createWalgitBrowser("https://git.example.com", "alana/demo", async (_url, init) => {
    assert.equal(init?.signal, controller.signal);
    init?.signal?.throwIfAborted();
    return json({});
  });
  await assert.rejects(cancelled.list(repoPath, { signal: controller.signal }), { name: "AbortError" });
});
