# Graphics and animation

Math Quest combines an SVG/CSS storybook world with an original real-time 3D Pip rendered through Three.js. React, the math interface and locally synthesized Web Audio are retained. All model geometry, clothing and accessories are constructed locally; there are no remote model/texture downloads, runtime image services or tracking.

## Real-time 3D Pip — October 29, 2026

`pipScene.ts` builds an articulated mesh character with a rounded head/body, projecting muzzle, beveled ears, cheek tufts, curved two-tone tail, layered eyes, physical clothing/accessories, lighting and a shadow-receiving ground. This is an original procedural character with joint groups, rather than an imported skinned model or a rendered image sequence. All four outfits, accents, hats and glasses remain available.

`pipRenderer.ts` owns one lazy-loaded WebGL renderer. It renders each visible scene into a transparent, per-view Canvas 2D surface, so the profile, map, studio thumbnails, pocket preview and answer/end celebrations share one GPU context. Geometry and material resources are disposed when views are replaced or unmounted. The renderer limits its source surface to 512 × 512 and schedules animated views at up to 30 updates per second; these are implementation bounds, not measured device-performance guarantees. Offscreen views and hidden documents pause. Static thumbnails render on change, and Still mode renders only on changes or deliberate turning.

Drag horizontally to turn a companion through any angle; vertical touch gestures remain available for scrolling. With its play button focused, Left/Right turn it and Home resets the view. Dragging does not also activate a special move. Clicking or Enter/Space plays the saved hop, full turn, star shower, dance or wave; correct answers use a cheer. Playful adds breathing, blinks, gaze and ear/tail motion. Calm keeps ambient movement stopped and permits a small intentional head movement; Still and OS reduced-motion requests suppress animated movement while keeping static expressive poses. An unavailable/lost WebGL context or failed renderer import displays the retained SVG Pip with an explicit illustrated-fallback label on interactive companions. Forced context-loss and physical-device acceptance have not been executed.

## Current visual layer

- Layered terrain, shore depth, grass texture, snowy peaks, shaded forest canopies, mushroom cottages and a lighthouse. The river runs through both shores, with the trail crossing a wooden bridge. Pip's walking route remains entirely on the east bank.
- Sunbeams, cloud drift, water shimmer, birds, a butterfly, atmospheric motes and three sky palettes.
- Pip has dimensional fur-colored surfaces and fabric, eye glints, blinking, breathing, ear/tail motion and bounded mouse gaze. Five intentional moves are available: hops, twirl, stars, dance and wave. Correct answers retain their raised-paw cheer.
- Original popcorn, picnic and dice illustrations; custom rewards use a wrapped-gift illustration with the parent's chosen symbol. Badges have metal shading and ribbons. Dressing-room lighting frames the character without blocking controls.
- Calm stops ambient animation; Still and the operating system's reduced-motion preference stop all animated movement. Decorations ignore pointer input. Buttons remain accessible independently of illustrations. Cosmetic actions never earn coins.

## Pip's voice

`src/lib/pipVoice.ts` creates a deterministic 0.48-second two-syllable creature squeak. The AudioContext is created only after an explicit click/keyboard activation. Audio never plays automatically for answers. Soft, Extra chirpy and Off are saved cosmetic settings; the header mute stops an active or pending sound immediately. A shared cooldown prevents overlapping squeaks. Unsupported or blocked audio leaves the visual interaction working. This is a creature chirp, not recorded dialogue or speech synthesis.

Use `npm.cmd run voice:preview` to write an optional WAV to `artifacts/pips-squeak.wav`. The preview exports the soft waveform; the browser additionally applies a low-pass filter. No microphone permission, audio asset download or speech API is needed.

## How far the browser can go

The next step in this same rendering approach could include more articulated character poses, richer hand-drawn art, short narrative scenes and more reactive scenery. Asset quality and animation choreography matter more than adding an engine at this stage. Transform/opacity animation and small, bounded decorative sets keep the work manageable; SVG filters, large repaint regions and excessive particles should be profiled before expansion.

Pip now uses WebGL geometry and lighting. Terrain, rewards and ending backgrounds remain SVG/CSS. A full 3D island and an externally authored skinned character with detailed fur are separate future upgrades. See the primary [Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer), [Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) and [WebGL documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API).

Desktop and phone-sized browser layout checks are recorded in VALIDATION.md. Physical iOS/Android testing, GPU/frame-time profiling, battery measurements and human speaker listening have not been performed. No specific frame-rate target is claimed.
