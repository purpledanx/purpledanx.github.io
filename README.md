# purpledan portfolio

A minimal portfolio with a short introduction, direct project links, and a small animated background. Project pages have scrollable image and video galleries.

## Run locally

Serve this directory with any static server. GitHub Pages serves the files as-is; there is no build step. The homepage is plain HTML. Its decorative background uses `hero-react.js` and pinned React and Paper Design imports from esm.sh. A static gradient remains if the shader cannot load or the visitor prefers reduced motion.

The homepage and published project pages include Open Graph and X card metadata. Their 1200 × 630 PNG previews live in `assets/images/`. The SVG assets are used for on-page controls; the PNGs are used for sharing, since social crawlers generally expect a raster image. When adding a project, update its canonical URL, description, title, and preview image metadata to match the new page.

The SVG theme control shares its saved preference with the project pages. The default is dark. Project media uses native video controls and does not autoplay.

## Add a project

1. Copy `projects/_template.html` to `projects/your-project.html`.
2. Replace the title, description, category, summary, role, technologies, overview, and contribution list.
3. Put screenshots in `assets/images/` and recordings in `assets/videos/`.
4. In `.gallery-track`, duplicate or remove a complete `<figure class="gallery-slide">` for each example. Images and videos can appear in any order. Replace the example paths, image alt text, video labels, and captions. The template's video is an existing Exodo recording for demonstration only.
5. Set the external project link and the next-project link. Remove the template's `noindex` meta tag when ready to publish.
6. Copy a `.project-row` in `index.html` and update its title, description, and link.

Image slide:

```html
<figure class="gallery-slide">
  <img
    src="../assets/images/example.png"
    alt="Describe what the screenshot shows"
    loading="lazy"
  />
  <figcaption>A short explanation of this example.</figcaption>
</figure>
```

Video slide:

```html
<figure class="gallery-slide">
  <video controls playsinline preload="metadata" aria-label="Describe the demo">
    <source src="../assets/videos/example.mp4" type="video/mp4" />
    <a href="../assets/videos/example.mp4">Download the video</a>.
  </video>
  <figcaption>What to look for in this recording.</figcaption>
</figure>
```

The shared script calculates gallery counts and button states. Visitors can swipe, scroll horizontally, use the buttons, or focus the gallery and use left/right arrow keys. Videos pause when navigating away from their slide. Nothing auto-advances. Native video controls retain their keyboard behavior. Media remains scrollable without JavaScript.

`style.css` contains the responsive layout and both palettes. `script.js` manages galleries and the saved theme preference. Pages include their footer directly so they also work without a server. `footer.html` is a reference snippet; changing it does not automatically update pages.

## Checks

Check local links and media paths when adding a project. Preview at mobile and desktop widths, navigate all slides, play videos, and try both themes before publishing.
