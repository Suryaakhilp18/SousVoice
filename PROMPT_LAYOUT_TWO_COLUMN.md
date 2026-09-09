# SousVoice — Antigravity Prompt: Split the Live Session into a Two-Column Layout

Paste this into Antigravity. It's a **layout-only** change to one file
(`web/src/components/LiveSessionScreen.tsx`) plus small width/spacing tweaks in the
children it renders — no state, store, service, or logic changes anywhere.

## Problem

`LiveSessionScreen.tsx` currently stacks everything in one narrow vertical column
(`max-w-2xl`, `flex flex-col`): recipe context panel → voice orb → stats badge →
progress rail → transcript → controls. On any screen wider than a phone this wastes
horizontal space and forces a lot of scrolling to see the transcript while cooking.

## Required layout

Split the live session into two side-by-side columns on medium screens and wider,
stacking back to the current single column on narrow/mobile screens:

- **Left column — "what's happening" (status side):** `RecipeContextPanel`,
  `VoiceOrbVisualizer`, `SessionStatsBadge`, `RecipeProgressRail`, stacked vertically in
  that order, narrower than the right column.
- **Right column — "the conversation" (interaction side):** `LiveTranscript` (grown to
  fill the column's remaining height) with `KitchenControlBar` pinned below it, wider
  than the left column since it holds the most information-dense content.

Concretely, in `LiveSessionScreen.tsx`:

```tsx
return (
  <div className="flex-1 w-full max-w-6xl mx-auto py-2 grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
    {/* Left column: status */}
    <div className="flex flex-col gap-3.5 lg:sticky lg:top-4">
      <RecipeContextPanel />
      <VoiceOrbVisualizer state={voiceState} micLevel={micLevel} />
      <SessionStatsBadge stats={stats} />
      <RecipeProgressRail
        currentStep={currentStep}
        completedSteps={completedSteps}
        onSelectStep={setCurrentStep}
      />
    </div>

    {/* Right column: conversation */}
    <div className="flex flex-col gap-3.5 min-h-0">
      <LiveTranscript transcript={transcript} />
      <KitchenControlBar
        isMuted={isMuted}
        isMockMode={isMockMode}
        onToggleMute={toggleMute}
        onEndSession={handleEndSession}
        onSimulateCook={isMockMode ? handleSimulateCook : undefined}
      />
    </div>
  </div>
);
```

Notes on getting the alignment actually right (this is where most attempts go wrong):

- Use `grid-cols-[minmax(0,380px)_1fr]` (not two flexible fractions) so the left column
  has a firm max width and doesn't grow to match the transcript's height-driven width —
  it should read as a narrower sidebar, not a second equal column.
- Add `lg:sticky lg:top-4` to the left column only, so on a tall session (long
  transcript) the status column stays in view while the transcript scrolls — this is
  the single biggest visual improvement a two-column layout should deliver, don't skip
  it.
- `LiveTranscript`'s own fixed height (currently `h-72 sm:h-80`) should become
  `flex-1 min-h-[24rem]` inside the two-column layout so it actually fills the available
  vertical space next to the (typically taller) left column's stacked cards, instead of
  leaving a gap under a short fixed-height box.
- Raise the outer wrapper's `max-w-2xl` to something like `max-w-6xl` — the two-column
  layout needs materially more horizontal room than the old single-column one, and
  capping it too tight will just cram both columns together.
- Keep `grid-cols-1` (no `lg:` prefix) as the base — below the `lg` breakpoint this must
  collapse back to exactly today's single stacked column, in the same order, so mobile
  is unaffected.
- `RimeAttributionFooter` (rendered by `App.tsx` just below `LiveSessionScreen`, not
  inside it) should stay full-width beneath both columns — don't pull it into either
  column.

## Verification

- `npm run build` and `npm run lint` — 0 errors.
- Resize the browser (or use dev tools' responsive mode) across the `lg` breakpoint
  (1024px) and confirm: below it, single column, current order, current widths; at or
  above it, the two columns described above, left column visibly narrower than right,
  left column staying in place while a long transcript scrolls past it.
- With a short transcript (2–3 turns), confirm the right column doesn't leave a large
  empty gap under a stub-height transcript box — it should still roughly match the left
  column's height.
