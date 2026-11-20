# Dock magnification reproduction

Compared the original (`e6b916e6`) and patched (`2ec8b8e3`) application in Chrome at 1280×800, with the default 48px Dock icons and default apps. Both were production builds. The isolated original checkout used Webpack and skipped build-time type validation because its generated route types failed with the shared installed Next version; the patched checkout passed the full `npm run check`. This comparison measures layout behavior, not rendering throughput or build-tool performance.

`issue-375-measure.js` runs through the BB browser-automation skill's Puppeteer-compatible `browser` API. Serve the original on port 3011 and patched app on port 3010, then run the script in a new local headless session. Raw output is saved in `issue-375-measurements.json`.

## Reproduced differences

1. Move from x=790 to x=900 at y=748 in 2px increments, waiting 120ms after each move. Read the Dock's actual bounding width. The largest adjacent change was **25.875px before**, versus **0.469px after**. The original collapses to its 568px resting width over the resize divider and expands again on exit. The patched Dock remains magnified while crossing it.
2. Approach x=650, y=748 first from x=400, then from x=850, resetting outside the Dock between attempts. Wait 200ms at each starting point and endpoint. The original Photos target width differs by **4.2489px** (62.0458 vs 57.7969); the patched target width is **57.7969px in both cases**. The original calculation depends on the animated geometry at the time of the move.

These are two specific hover discontinuities. They do **not** demonstrate a general improvement in frame rate, input latency, or every instance of the lag reported in #375. The original broad-sweep recordings were insufficient evidence for that claim.

The focused recording repeats a 2px-step path from x=828 to x=872 and back around the divider, with a visible pointer marker. It is cropped and enlarged for comparison; playback speed is unchanged. Numerical measurements above come from the separate settling test, not the recording.
