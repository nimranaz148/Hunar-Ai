# Hero assets: prompts for Google Flow

The hero currently uses a flat vector placeholder (`components/landing/Mascot.tsx`). Generate the
real artwork with the prompts below, send the files back, and they replace the placeholder.

## Style bible (paste into every prompt)

> Flat 2D vector cartoon, friendly and confident, in the style of a modern editorial brand
> mascot. Solid flat colour shapes only. **No gradients, no soft shading, no gloss, no 3D render, no
> glow, no texture, no drop shadow, no outlines thicker than 4px.** Limited palette: purple
> `#7B3FE4`, deep plum `#3F1259`, lilac `#CBB2F5`, magenta `#C42A7C`, pink `#EC7FB1`, marigold
> `#F4B630`, cream `#F4EFEA`, soft black `#1E1824`. Warm brown skin tone `#E3A57A`. Simple geometric
> shapes, big readable silhouette, minimal detail, symmetrical friendly face. No text, no logos,
> no watermarks, no extra characters, nothing weird or over-complicated.

## Background (important for the hero)

Always: **plain flat solid `#C42A7C` background, no vignette, no floor, no shadow on the ground.**
That is the hero colour, so the mascot sits straight onto the page. For a version that can be placed
on other colours, repeat the prompt with **solid `#00FF00` green background** and we will key it out.

## Who she is (read before prompting)

Pakistani, modern, working. Research notes: hijab is worn as both faith and style by many younger
Pakistani women; the everyday outfit is a kameez (tunic) with shalwar or trousers and a dupatta;
embellished modest wear is popular. Show that range. **Face always fully uncovered** (no niqab, no
face veil). Do **not** use Indian-coded styling: **no bindi, no sindoor, no sari, no hair bun with
flowers, no mehndi-heavy hands, no temple jewellery.** Warm brown skin, dark brows, a natural smile.

## 1. Hero mascot, stills (4:5 portrait, 2048 x 2560): make both

**1a. Hijabi founder.**
> [Style bible] A Pakistani woman entrepreneur mascot, bust and shoulders, facing the camera, warm
> confident smile, **face fully visible**, large rounded marigold sunglasses, a magenta hijab draped
> neatly over head and shoulders pinned with a small marigold brooch, deep-purple kurta with a thin
> marigold neckline trim. Centered, symmetrical. Background plain flat solid `#C42A7C`.

**1b. Dupatta founder.**
> [Style bible] A Pakistani woman entrepreneur mascot, bust and shoulders, facing the camera, warm
> confident smile, large rounded marigold sunglasses, dark hair centre-parted and worn down, a bright
> pink dupatta draped loosely over the back of her head and both shoulders, small marigold stud
> earrings, deep-purple kurta with a thin marigold neckline trim. **No bindi, no bun.** Centered,
> symmetrical. Background plain flat solid `#C42A7C`.

## 2. Hero mascot, video (the scroll-scrubbed sequence)

16:9 is wrong for this: use **4:5 portrait, 1080 x 1350, 8 seconds, 24 fps, locked-off camera, no
camera movement, no cuts.**

> [Style bible] Same mascot as still 1a (or 1b), static locked camera. 0 to 2s: she is looking down at a
> laptop, sunglasses pushed up on her head. 2 to 4s: she looks up, smiles, slides the sunglasses down
> onto her nose. 4 to 6s: she lifts one hand and gives a small confident wave. 6 to 8s: she settles
> back to the exact pose and expression of the first frame so the loop is seamless. Flat 2D
> animation, solid colour shapes, no gradients, no motion blur. Background plain flat solid `#C42A7C`.

Why this shape: the frames become a canvas image sequence scrubbed by scroll, so a locked camera and
a start frame equal to the end frame make it scrub cleanly in both directions.

## 3. Supporting mascots (still, same bible, 1:1, 1600 x 1600)

Used in stories, mentor and empty-state moments. One prompt each, same background rule.

- **Home baker (hijab):** same style, apron in lilac, holding a tray with three simple round cakes.
- **Tailor / boutique owner:** measuring tape around the neck, small scissors in hand, a dupatta
  swatch in marigold and pink.
- **Skincare founder:** holding a small jar and a dropper bottle, plum hijab, face fully visible.
- **Mentor:** slightly older, round glasses, cream blazer over a plum kurta, dupatta on one shoulder, holding a notebook.
- **Weekly coach:** friendly face with a clipboard showing a simple flat bar chart (four bars, no
  numbers or text).

## 4. Short loops (optional, 1:1, 1080 x 1080, 3 s, 24 fps, locked camera)

- Mascot nods and smiles (idle).
- Mascot ticks a simple flat checkbox with a pen (approval moment).
- Mascot holds up a phone showing a flat calendar grid (content calendar moment).

## What to send back

- Stills as PNG (not JPEG), original resolution.
- Videos as MP4 (H.264), original frame rate, no audio.
- Tell me which prompt each file answers.

## What happens next (already built)

1. `ffmpeg` extracts frames at the video's native rate (capped at 60 fps) to WebP:
   `ffmpeg -i hero.mp4 -vf "fps=24" -c:v libwebp -quality 78 frames/f_%04d.webp`
2. `components/animations/CanvasSequence.tsx` draws the frames on a canvas, driven by a GSAP
   ScrollTrigger scrub (`scrub: 1.4`, same smoothing as the rest of the page).
3. Reduced motion and small screens show the single poster frame instead of the sequence.
4. The existing hero tweens (sunglasses drop, sticker pop, headline lines) already target the
   mascot's layers; with a raster mascot they retarget to the whole image.

## Rejected on sight

Gradients, 3D or "Pixar" rendering, glossy plastic look, realistic skin shading, extra fingers,
text baked into the image, busy backgrounds, more than one character in the hero, anything that
reads as a stock AI illustration.
