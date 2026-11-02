# purpledan portfolio

Just a collection of things I've built over the years. Contains pages for my projects with scrollable image and video slides on them for presentation. 

# project stuff
Styles live in style.css and portfolio.css; navigation, filters, clipboard and gallery behavior live in script.js. The homepage shows selected work, while work.html lists all documented projects. The projects folder includes a template page for adding work.

The site serves static HTML, CSS and JavaScript. Its centered headline, oversized curved lens, vertical hero navigation and black staggered gallery follow the supplied Monopo/Refero references. Inter is bundled locally with its OFL license. The homepage opens with a brief greeting that fades into the hero; clicks and taps do not skip it or activate links underneath. Keyboard and scrolling input dismiss it, while deep links, restored navigation and reduced motion skip it. The hero uses an original WebGL shader in src/hero-atmosphere.js: flowing sage/gold contours, layered refraction, moving lens and mouse response. It renders a static view with reduced motion and stops drawing offscreen or in a hidden tab. An original SVG remains available without WebGL or JavaScript.

src/site-motion.js bundles Lenis 1.3.27 for smooth wheel scrolling and section links throughout the site. Touch scrolling and horizontal media galleries remain native. Section links preserve the hash, browser history and target focus. Reduced motion disables Lenis and decorative motion. Lenis CSS and its MIT license are included locally in assets/js.

Run `npm ci` once and `npm run build` after changing either motion source. Commit the generated assets/js/hero-atmosphere.js, site-motion.js and site-motion.css along with source changes. Serving the site needs no build or runtime CDN. Earlier glass scene source and dependency notices remain in the repository but are not loaded by the site.

# running it
Go to https://purpledanx.github.io

