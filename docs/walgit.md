# Walgit in Finder: setup and project notes

Research and implementation notes, October 1, 2026. Source checkout reviewed:
[`tobi/walgit` at `80e9a20`](https://github.com/tobi/walgit/tree/80e9a20b29e29aefd16a4dae6f8e274cce85cca5).
This integration targets that API; Walgit is pre-1.0 and its API can change.

## What this site integration does

Finder → Projects gains a **Walgit** folder when configured. It contains only
explicitly selected public repositories, grouped by owner. Existing GitHub
repositories retain their paths. The internal Walgit namespace is
`/Users/alanagoyal/Projects/@walgit/owner/repo`; `@` cannot occur in a GitHub
repository name, so the two sources cannot collide.

Directories load one level at a time. The adapter reads the default branch from
`refs()` rather than assuming `main`, then addresses trees and blobs by that
commit SHA. It retains that SHA for 60 seconds to keep successive reads coherent
and avoid repeatedly resolving refs. A later read resolves again; this is browsing
the default branch, not a permanent historical snapshot. Text files open in
TextEdit, including direct TextEdit links. Edits are local browser copies; saving
does not publish to Walgit. Only GET requests are made.

Walgit entries in visited folders become searchable in that Finder window. There
is no background recursive scan, and Recents' remote history remains GitHub-only.
Empty repositories show an empty directory. Submodules are omitted because their
entries reference another repository rather than browsable files in this tree.

## Enable it

1. Run a Walgit server separately with a browser-trusted HTTPS certificate and a
   public sample repository. It needs an object-storage backend and its own
   deployment; this PR does not deploy that infrastructure.
2. Enable anonymous reads on the server and add the exact website origin to
   `server.cors_origins`. For local development, also add `http://localhost:3097`
   (or your actual development port). The ordinary `/api` lane supports CORS too.
   Keep write/admin access authenticated. Walgit's `auth.mode = "none"` grants
   write/admin access to everyone and is restricted to loopback; it is not the
   public server configuration. OIDC mode requires anonymous reads to be disabled,
   so it does not support this anonymous demo configuration.
3. Set these in the site's local or deployment environment:

   ```dotenv
   NEXT_PUBLIC_WALGIT_URL="https://git.example.com"
   NEXT_PUBLIC_WALGIT_REPOS="alana/demo"
   ```

   The URL must be an HTTPS origin with no path, credentials, query, or fragment.
   Repositories are comma-separated `owner/name` pairs. These values are public
   and bundled into the website. Do not put a token in either value.
4. Rebuild/restart the site. Open Finder → Projects → Walgit → alana → demo.
   Push new content with ordinary Git to update the source; allow up to 60 seconds
   for the adapter's default-head resolution to expire.

With no Walgit URL, the folder is hidden and no Walgit requests are made. Missing
repository configuration surfaces a useful error inside the folder. Public access
is enforced by the Walgit server, not by this frontend's repository selection.

The SDK's bearer lane is explicitly selected **without a token**. It omits cookies
and sends no Authorization header, so signed-in visitors do not accidentally
browse through their private Walgit session. Interactive sign-in is disabled.
Calls go directly from browser to Walgit: there is no website proxy or server
credential. CORS failures and network outages show a connection message;
401/403 responses explain that the repository is not publicly readable.

## Findings from working with Walgit

- **Durability lives in object storage.** The manifest's conditional update commits
  a push after its immutable pack/index/log objects have been uploaded. Hosts are
  replaceable caches. The architecture focuses on large repos served by machines
  whose local storage cannot hold the whole repository; it is not primarily an
  optimization for millions of tiny repositories.
  [Goals](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/GOAL.md),
  [architecture](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/AGENTS.md).
- **The browsing API is designed for external tools.** `owner/repo` precedes the
  API lane in URLs. `refs()` is a cheap default-head lookup; tree reads are directory
  listings, not recursive trees. GitHub's adapter uses a recursive repository tree,
  so substituting responses directly would not work.
  [API contract](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/web/API.md).
- **Cold responses can be streams.** JSON endpoints may return an SSE envelope
  with progress and a terminal result/error. Treating every successful response as
  JSON would fail on cold repositories. The upstream SDK already handles this;
  Finder displays its notice packets and aborts navigation requests when leaving.
  [SDK guide](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/web/sdk/README.md).
- **SHA-addressed responses are immutable.** Resolving the branch once and reading
  objects by SHA makes the server/browser cache useful and prevents a tree/file
  pair from silently reading different branch tips during the short browsing window.
  Ref-dependent calls revalidate instead.
  [Caching rules](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/web/API.md#2a-caching--the-wire-contract).
- **Binary browsing is a real API gap for this site.** Blob responses contain either
  UTF-8 text, `binary: true`, or `too_large: true`. The documented text limit is
  2 MiB. Even `?raw` returns metadata for binary/oversized files. There is no binary
  file URL in this API that we can pass to Preview. Finder therefore explains the
  limitation rather than generating a broken URL. SVG is text and opens as source.
  [Blob contract](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/web/API.md),
  [implementation](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/crates/walgit-server/src/web/api.rs).
- **This does not replace GitHub's collaboration layer.** Walgit's goals leave
  reviews, issues, and CI to other systems. For this site, the value is trying a new
  repository source and publishing experiments through the desktop interface.
  [Project scope](https://github.com/tobi/walgit/blob/80e9a20b29e29aefd16a4dae6f8e274cce85cca5/GOAL.md).

A concrete upstream contribution suggested by this integration is an authenticated,
read-only binary download API with explicit size/range/cache behavior. It would
allow image/PDF previews without cloning. This is a finding, not a verified claim
that no issue or PR already proposes it.

## SDK provenance and validation

`lib/vendor/walgit/repos.ts` is an unchanged copy of the dependency-free upstream
SDK from the pinned commit above, with its MIT license alongside it. Vendoring
keeps this site's build reproducible and avoids executing a mutable remote script.
Update the source and provenance together after checking the API contract.

Adapter tests cover configuration, namespace isolation, default branches other
than `main`, SHA reuse, directory mapping, submodules, empty repos, streamed cold
responses, empty text, binary/oversized blobs, authentication errors, and cancellation.
Browser verification uses a controlled API fixture; a deployed Walgit server still
needs live TLS, CORS, storage, and Git-push verification before the source is enabled.
