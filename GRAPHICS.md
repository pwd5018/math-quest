# Graphics and animation

Math Quest can support a rich, animated storybook world with ordinary browser APIs. This pass keeps the existing React interface and uses original SVG artwork, CSS animation and locally synthesized Web Audio. There is no game engine, runtime image service, tracking or new rendering dependency.

## Current visual layer

- Layered terrain, shore depth, grass texture, snowy peaks, shaded forest canopies, mushroom cottages and a lighthouse. The river runs through both shores, with the trail crossing a wooden bridge. Pip's walking route remains entirely on the east bank.
- Sunbeams, cloud drift, water shimmer, birds, a butterfly, atmospheric motes and three sky palettes.
- Pip has shaded fur/fabric, eye glints and blush, blinking, breathing, stepping feet, a moving scarf and bounded mouse gaze. Five intentional moves are available: hops, twirl, stars, dance and wave. Correct answers retain their raised-paw cheer.
- Original popcorn, picnic and dice illustrations; custom rewards use a wrapped-gift illustration with the parent's chosen symbol. Badges have metal shading and ribbons. Dressing-room lighting frames the character without blocking controls.
- Calm stops ambient animation; Still and the operating system's reduced-motion preference stop all animated movement. Decorations ignore pointer input. Buttons remain accessible independently of illustrations. Cosmetic actions never earn coins.

## Pip's voice

`src/lib/pipVoice.ts` creates a deterministic 0.48-second two-syllable creature squeak. The AudioContext is created only after an explicit click/keyboard activation. Audio never plays automatically for answers. Soft, Extra chirpy and Off are saved cosmetic settings; the header mute stops an active or pending sound immediately. A shared cooldown prevents overlapping squeaks. Unsupported or blocked audio leaves the visual interaction working. This is a creature chirp, not recorded dialogue or speech synthesis.

Use `npm.cmd run voice:preview` to write an optional WAV to `artifacts/pips-squeak.wav`. The preview exports the soft waveform; the browser additionally applies a low-pass filter. No microphone permission, audio asset download or speech API is needed.

## How far the browser can go

The next step in this same rendering approach could include more articulated character poses, richer hand-drawn art, short narrative scenes and more reactive scenery. Asset quality and animation choreography matter more than adding an engine at this stage. Transform/opacity animation and small, bounded decorative sets keep the work manageable; SVG filters, large repaint regions and excessive particles should be profiled before expansion.

Canvas 2D is an option for larger particle systems or sprite animation. WebGL can provide full 3D terrain, lighting, shaders and skeletal animation inside a web app, but would add a renderer, 3D assets and device/fallback work. Those are future options, not implemented features. See the primary [Web Animations documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API), [Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) and [WebGL documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API).

Desktop and phone-sized browser layout checks are recorded in VALIDATION.md. Physical iOS/Android testing, GPU/frame-time profiling, battery measurements and human speaker listening have not been performed. No specific frame-rate target is claimed.
