# purpledan portfolio

Just a collection of things I've built over the years. Contains pages for my projects with scrollable image and video slides on them for presentation. 

# project stuff
Styles live in style.css and portfolio.css; navigation, filters, clipboard and gallery behavior live in script.js. The homepage shows selected work, while work.html lists all documented projects. The projects folder includes a template page for adding work.

The site serves static HTML, CSS and JavaScript. The homepage glass sculpture is a small React Three Fiber scene using Drei's MeshTransmissionMaterial, bundled locally in assets/js/glass-scene.js. Its editable source is src/glass-scene.jsx. Drag to turn the sculpture, or focus it and use arrow keys; Home, Escape and Reset view restore the composition. It stays still between inputs, and reduced motion shows a static view. After changing the scene, run `npm ci` once and `npm run build` to update the bundle and linked license notice. Serving the checked-in site needs no build or runtime CDN. Dependency notices are in assets/js/glass-scene.LICENSES.txt and the generated LEGAL file.

# running it
Go to https://purpledanx.github.io

