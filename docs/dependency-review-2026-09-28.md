# Dependency review — September 28, 2026

Reviewed the dependency-health email against the current committed lockfile and the npm advisory database. The email reported eight CVEs across four packages but did not list their identifiers or the analyzed commit. Its dashboard could not be inspected with the available browser tools, so an exact one-to-one reconciliation is unavailable. The findings below come from the current repository, not the email's aggregate counts.

## Patched

| Package | Locked version change | Assessment |
| --- | --- | --- |
| `next` | 16.3.0 → 16.3.6 | Patches the Windows-hosted RCE advisory and the AVIF image-optimization RCE advisory. Windows deployment is a prerequisite for the former. Image optimization remains enabled in this repository, even though Photos currently uses `unoptimized`; patch the framework instead of relying on those call sites. |
| `sharp` | 0.35.3 → 0.35.5 | Updates the vulnerable libheif image-processing dependency and platform binaries used by Next.js. |
| `qs` | 6.15.3 → 6.16.0 | Patches parsing denial-of-service issues under Braintrust's Express/body-parser dependencies. This app does not directly run that Express server; updating is inexpensive defense in depth. |
| `fast-uri` | 3.1.5 → 3.1.8 | Patches URI canonicalization and host-confusion issues under Braintrust's AJV dependency. No direct application use as an outbound-request security boundary was found. |
| `js-yaml` | 4.3.1 → 4.3.2 | Patches merge-source CPU exhaustion in the ESLint toolchain. Development exposure, not an application request handler. |
| `browserslist` | 4.23.0 → 4.29.2 | Patches unbounded query-cache growth and unsafe custom-stats handling in the CSS build toolchain. No untrusted browser queries or custom stats are accepted by this app. |
| `baseline-browser-mapping` | 2.10.0 → 2.11.26 | Patches process termination on invalid input in the Next.js/build dependency tree. |

The lockfile also refreshes associated SWC helpers/binaries, libvips binaries, browser compatibility data, and Browserslist update tooling. The only direct dependency range changed is Next.js; no major upgrades or new overrides were introduced.

## Remaining advisory: Tiptap

`npm audit` still reports 27 moderate package entries, all propagated from **one** advisory: [GHSA-cp6q-959q-f8rh](https://github.com/advisories/GHSA-cp6q-959q-f8rh). These are not 27 distinct vulnerabilities. Tiptap v2 remains in the affected version range; the published patch is in v3.30.4.

The vulnerable helper can turn an untrusted own `__proto__` key into inherited executable DOM attributes. The current editor in `components/apps/messages/message-input.tsx` uses fixed StarterKit/Mention schemas, static `HTMLAttributes`, and an explicit mention renderer with fixed attribute keys. It does not merge arbitrary imported attribute objects. A Node smoke test confirmed that the installed schema discards JSON-origin `__proto__` and `onerror` attributes while retaining legitimate mention IDs and labels.

No exploitable path was found in the current configuration. This is a reachability assessment, **not** a claim that Tiptap v2 is patched. Defer the major editor migration; reassess before adding dynamic attributes, custom document imports, or extensions that merge untrusted objects. The schema smoke test does not prove every browser/editor behavior safe.

## Other email findings

Outdated-version counts, release inactivity, and small maintainer counts are maintenance signals rather than demonstrated application defects. The email's `remark-gfm` maintainer count and `next-themes` inactivity claims do not establish a vulnerability or broken behavior. Keep these dependencies and avoid unrelated major upgrades in this security patch.

## Validation

- Clean `npm ci` succeeded with Node 24.21.0.
- `npm run check` passed: lint (six existing warnings, no errors), all 178 Node tests, TypeScript, and the production build. The build used the existing checkout's public Supabase URL/anon configuration; no credentials were added to this repository.
- Production-server HTTP smoke checks returned 200 for `/`, `/messages`, and `/photos`.
- The production `/_next/image` endpoint successfully resized `public/messages.png` to a 64px WebP; a separate Sharp decode/resize/encode check passed.
- The Tiptap schema check described above passed. No interactive browser verification was possible because browser control was unavailable.
- `npm audit --audit-level=high` passed. Full audit counts fell from 54 affected package entries (2 critical, 21 high, 31 moderate) to 27 moderate entries from the single deferred Tiptap advisory. A default `npm audit` still exits nonzero for that advisory.
- `git diff --check` passed.

## References

- [Next.js Windows-hosted RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36)
- [Next.js AVIF image optimization RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)
- [Sharp/libheif](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)
- [qs bracket/comma parsing](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [qs isBuffer denial of service](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g)
- [fast-uri IDN](https://github.com/advisories/GHSA-5jgf-p345-68v8), [IPv6](https://github.com/advisories/GHSA-f65p-4m7j-42xc), [hostname decoding](https://github.com/advisories/GHSA-fph4-wmhf-6fwf), [scheme normalization](https://github.com/advisories/GHSA-jqff-g426-hqxp)
- [js-yaml merge sources](https://github.com/advisories/GHSA-2883-xcg3-v3hh)
- [Browserslist cache growth](https://github.com/advisories/GHSA-c83g-rgw3-j3cx), [custom stats](https://github.com/advisories/GHSA-73wf-gq98-2v4g)
- [baseline-browser-mapping invalid input](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv)
