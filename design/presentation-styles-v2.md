# Presentation styles v2 — catalog plan and visual contract

Status: implementation proposal for local use; the six stylesheet choices are available for pilot lessons, but are not teacher-approved visual standards for lesson-series migration.

## Model

- `lesson_type` is the pedagogical purpose (`new-knowledge` / `practice`).
- `presentation_mode` is the delivery form (`slides` / `none`).
- `appearance.style` selects a reusable visual grammar for slides.
- `appearance.palette` selects a source-backed ColorBrewer-derived role set. A style must not encode the lesson purpose, topic, or colour palette.
- `data-layout` and components express a slide's instructional function; they are not whole-deck styles.

## Catalog

| Style | Visual grammar | Best fit | Source treatment |
|---|---|---|---|
| `museum` | Quiet gallery hierarchy; object-scale media, generous neutral space, restrained labels and fine rules | Art, artefacts, material culture, visual comparison | Neutral, uncluttered source field; identification stays separate from interpretation |
| `editorial` | Typographic narrative; strong title/section hierarchy, deliberate columns and concise accent rules | Explanatory arguments, political change, connected claims | Source remains a distinct, readable block; never turn every point into a headline |
| `atlas` | Spatial hierarchy; maximum useful map area, clear region/route evidence and restrained locator labels | Exploration, territory, movement, place-based comparison | No decorative map-like background, fake boundaries, or caption that shrinks a full-screen map |
| `chronicle` | Time-led sequence; explicit dates/periods, continuous process and turning-point hierarchy | Chronology, cause/change, campaigns and multi-stage processes | Dates and places are evidence labels; sequence is not flattened into equal cards |
| `source-lab` | Inquiry hierarchy; neutral source, observation/inference/claim kept distinct, questions visibly separated | Source reading, evidence evaluation, corroboration | No faux handwriting, aged paper, decorative annotations, or answer-revealing callouts |
| `reportage` | Human-scale narrative; place/time anchors, large documentary media, short attributed voices and varied scene rhythm | Biographies, lived experience, local case studies and multiple perspectives | Preserve source neutrality and rights; no sensationalism, especially for war or mass violence |

All six styles support both lesson types. Age calibration changes scale, density and activity complexity, not the style's palette or a cloned visual skin.

## Approved palettes

Use only palettes present in `design/presentation-palettes-v1.json` for new lessons. The listed defaults are light, readable, and non-cream; the same palette may serve more than one style because the stylesheet—not a colour name—defines the visual grammar.

| Style | Default | Alternatives |
|---|---|---|
| `museum` | `evidence-grey` | `civic-paired` |
| `editorial` | `conflict-map` | `civic-debate`, `civic-paired` |
| `atlas` | `land-sea` | `conflict-map`, `civic-paired` |
| `chronicle` | `conflict-map` | `land-sea`, `civic-paired` |
| `source-lab` | `evidence-grey` | `conflict-map`, `civic-paired` |
| `reportage` | `vivid-dark2` | `civic-paired`, `land-sea` |

Legacy palette names remain accepted for existing packages; do not silently recolour or migrate those lessons as part of this catalogue change.

## Shared visual rules

- Flat colour fields only: no gradients, faux parchment, generated map textures, or decorative diagrams that could be mistaken for evidence.
- Use existing semantic slide purposes/layouts and components. Styles adjust hierarchy and component treatment; they do not invent content or change the 1280×720 canvas.
- Keep source media neutral, large, accessible, and legally attributed. Do not shrink maps or long source excerpts to fit decoration.
- Keep body text in readable ink; reserve accent colours for hierarchy, never as the sole signal.
- Maintain projector contrast, Polish diacritics, keyboard/touch behavior, reduced-motion support, and print behavior.
- A style must visibly change the deck's composition/typographic grammar—not merely change background or accent colour.

## Pilot and promotion

The catalogue change makes these options available for deliberate pilot use; it does not migrate active lessons. Before adopting a new style as a series default, pilot complete lessons in two age bands and different evidence types, inspect the fresh contact sheets and full-resolution critical slides, and obtain explicit teacher acceptance. Keep the Grade IV cutout direction as a separate local candidate until its pilot receives that acceptance; do not register it by analogy alone.
