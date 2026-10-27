# purpledan portfolio

## Current direction

The owner requested an industrial-brutalist treatment while retaining the approved forest green, tall serif name, and supplied avatar render. The homepage is a personal introduction with text references to work. Project screenshots and demos live on the existing case-study pages.

Taste composition retained: The name as a monument, seed 1811475559. The named industrial-brutalist-ui skill was not found in the local skill directories; no claim is made that it was loaded. Taste, Antislop core/UI/mobile/human, and Caveman were used for their relevant scope.

Audience: people evaluating purpledan's Roblox systems and web work.
Dials: ENERGY 3 / RHYTHM 2 / MOTION 3.

## Decisions

- Color: one fixed forest-green identity, requested by the owner. Theme controls and preference logic are removed across all pages.
- Typography: Imbue preserves the owner's approved tall serif identity. Albert Sans carries descriptions and controls.
- Layout: the render and name introduce the developer; the biography supplies context; a compact text index references three real project pages.
- Industrial treatment: flat green fields, oversized type, square controls, and full-width text links give content direct hierarchy.
- Imagery: the homepage uses only the owner's avatar render. No project images, videos, or wiki image band appear there.
- Navigation: existing #projects links lead to the text index. The case-study routes and their galleries remain available.
- Scrollbars: scrollbar chrome is hidden while native wheel, touch, and keyboard scrolling remain available.
- Motion: the render travels at 18% of scroll distance through the hero, capped at the hero's height times 18%. A small image overscan supports the movement. Updates use a passive scroll listener and one requested animation frame, without changing native scroll behavior.
- Accessibility: reduced motion removes the parallax transform and cancels entrance animation. Text remains visible without JavaScript.
- Controls: focus indicators and 44px-or-larger navigation targets remain. Project reference rows are full links.
- Accent: blue remains the single action/focus accent.
- Media states: project galleries retain loading, error, and empty states.

## Copy and section argument

Opening: purpledan. I develop Roblox systems, from cross-server tools to room-aware audio. The supplied avatar render makes the introduction personal. Action: Find my work.

Biography: Code for games. The existing biography and skills explain the developer's background.

Work reference: Find my work. War of the Worlds, Dynamic Reverb Test, and Exodo Wiki are linked by name and a short description. Evidence and footage are available on their respective pages.

Contact: Find me online. The actual Discord handle and existing GitHub, Roblox, and email links provide contact routes.

## Supplied assets

The original me.png is copied unchanged to assets/images/hero-render.png (1774 × 887). Its framing is controlled by .hero-scene in style.css. Font files and SIL Open Font Licenses are in assets/fonts/.

## Explicit user overrides

The request for no project imagery on the homepage supersedes Taste's four-image floor and inline-demo recommendation. The request to remove light/dark controls supersedes the optional-theme guideline. The approved typography remains despite conventional brutalist styles often favoring sans-serif type. No additional assets, sample claims, or placeholder content are needed.
