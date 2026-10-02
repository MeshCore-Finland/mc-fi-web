# Documentation screenshots

Keep screenshots in Git alongside the instructions they illustrate. Store originals here; Astro generates display-sized WebP variants into the build output, which is not committed.

Use descriptive, stable filenames, for example:

```text
mobile-app/en/repeater-settings.png
web/en/channel-settings.png
mobile-app/fi/channel-settings.png
```

The language directory describes the UI shown in the image, not the language of the article. Import the same image in Finnish and English articles when it illustrates both. Add a Finnish UI variant only when it helps the reader.

Prefer PNG for crisp interface text, crop unnecessary margins, and retain enough detail for the full-size view. Replace the file when the UI changes; Git keeps its earlier versions. Avoid committing multiple device resolutions, generated thumbnails or large screen recordings. Videos can live outside the repository if we add them later.

Use the `Screenshot` component with descriptive alt text and a localized caption. Its default display width is 360px for phone screens; use `width={720}` for desktop UI. Image dimensions preserve layout space, loading is lazy, and clicking the image or caption link opens the original.

See the authoring example in the root README. Git LFS is deliberately not required for this prototype; reconsider storage only if the image history becomes a practical problem.
