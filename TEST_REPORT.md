# SousVoice — Test Report (current DataForge/web build)

Tested the live app currently in `DataForge/web` (the Antigravity-built version with
multi-recipe support, `cookingAiService.ts`, and `recipeExtractor.ts`). All checks below
were run against the actual current source, first on-device, then in a clean sandbox
after an environment issue on-device forced that move (explained in Finding 1).

## Results at a glance

| Check | Result |
|---|---|
| TypeScript build (`tsc -b && vite build`) | **Pass** — 0 errors |
| ESLint (`eslint .`) | **6 errors found → fixed → 0 errors** |
| Accessibility audit (`test-a11y.js`, axe-core) | **Pass** — 0 violations, 100/100 (after a hang fix, see Finding 2) |
| Interaction/interruption test (`test-interaction.js`) | **Ran to completion, all assertions passed** — but exposed Finding 3, a real correctness bug the assertions don't catch |

## Finding 1 — `node_modules` inside the OneDrive-synced folder makes builds unreliable (environment, not code)

Running `npm run build` / `eslint` / the test scripts directly in `DataForge/web` on your
machine was extremely slow (single builds took 1–2 minutes; `npm install` repeatedly timed
out) and at one point a plain `require('jsdom')` hung indefinitely — not a code bug, jsdom
never even started evaluating. Copying the exact same source into a plain (non-OneDrive)
folder, the identical build finished in **5 seconds** and the identical test suite in
**4.6 seconds**.

This points at OneDrive: `node_modules` for this project is ~28,000+ small files, and
OneDrive's sync/placeholder-file handling adds heavy per-file overhead (and can outright
stall on a file it hasn't finished syncing). This will keep causing random slowness,
mysterious hangs, and flaky installs the longer you work in this folder.

**Recommended fix:** either move the project (or at least exclude `web/node_modules` and
`web/dist`) from OneDrive sync — right-click the folder → "Always keep on this device" is
not enough; you want "Free up space"/exclude, or better, keep the working copy outside any
OneDrive/Dropbox/iCloud-synced path and let git (or a manual copy) be what syncs it,
not a cloud-storage client watching every file write.

## Finding 2 — `test-a11y.js` could hang on a real build (fixed)

The script opened `dist/index.html` with `runScripts: 'dangerously'` and
`resources: 'usable'`, which made jsdom actually **execute the built app bundle** and let
it make real network calls (Google Fonts, and now `recipeExtractor.ts`'s
`allorigins.win` proxy fetch) — heavy, slow, and prone to hanging, for a script whose only
job is a static accessibility audit. Fixed by loading the HTML without script execution;
the audit result didn't change (still 0 violations).

## Finding 3 — real bug: a follow-up question can silently swallow the previous answer

This is the most important finding, and it's exactly the "connective flow of follow-up
conversation" problem you flagged.

`mockSession.ts` fences answers with a `generation` counter: every call to
`handleCookMessage` bumps `currentGen`, and when `generateContextualAnswer` finally
resolves, it checks `if (gen !== currentGen) return` — silently discarding the answer if
a *newer* message arrived in the meantime. That's the right idea for a genuine barge-in
(user interrupts mid-speech, discard the stale reply). But it currently fires for **any**
later message, including a normal follow-up asked once the first answer is already
in flight — even if the assistant had finished speaking and was just idly "thinking".

Traced with real recipe data:

1. Cook asks "Can I replace chicken with paneer?" → `generateContextualAnswer` starts
   (gen 2), takes ~250ms.
2. Before that resolves, the cook asks a second, unrelated follow‑up ("What if I'm using
   an induction stove?") → `currentGen` becomes 3.
3. The paneer answer finishes and is discarded (`gen 2 !== currentGen 3`) — **the cook
   never sees or hears the paneer substitution answer at all.** Only the induction answer
   comes through.

With the current 250ms mock latency this is rare but reproducible; with a real LLM call
(likely 800ms–3s), this will happen constantly in normal use — every time someone asks a
second question before the first has been answered, the first answer vanishes with no
error, no retry, and no indication anything was dropped. This is very different from
losing a reply because you genuinely spoke over the assistant, and users will read it as
"the assistant ignores half of what I say."

**Recommended fix (also in the Antigravity prompt below):** only discard a pending answer
when the interruption is genuine (VAD-detected speech, or an explicit "wait/stop" barge-in
while the assistant is actively speaking) — not merely because another question arrived
while the previous one was still being generated. A small FIFO queue of pending questions,
processed one at a time (and cleared only by a real interruption), fixes this without
touching the generation-fencing that correctly handles actual barge-ins.

## Finding 4 — microphone/VAD loop was never stopped on session end (fixed)

`endMockSession()` cleared timers and cancelled speech, but never called
`stopMicrophone()` (which exists in `speechService.ts` and is exported, but wasn't called
from anywhere). In a real browser this means clicking "End Session" leaves the mic stream,
the volume-level polling loop, and the `SpeechRecognition` instance running in the
background — the mic stays hot after the session visually ends. Fixed by calling
`stopMicrophone()` (and resetting `micLevel` to 0) in `endMockSession`.

## Finding 5 — bundle size / minor

The production JS bundle is ~909 KB (257 KB gzipped) — Vite's own warning threshold.
Not urgent, but as `cookingAiService.ts` / `recipeExtractor.ts` grow, worth splitting the
home/recipe-extraction screen from the live-session screen with `React.lazy` so the initial
load stays light.

## Finding 6 — `recipeExtractor.ts`'s live URL fetch depends on a public, rate-limited proxy

Fetching arbitrary recipe URLs goes through `https://api.allorigins.win/raw?url=...`, a
free public CORS proxy with no SLA — it can rate-limit, go down, or return blocked/garbled
HTML with no warning beyond a generic error. It's a reasonable stopgap for a hackathon demo,
but it's the biggest risk to "give an accurate answer" for anything other than the five
pre-registered dishes (biryani, paneer, pasta, dosa, ramen), which bypass the proxy
entirely via keyword matching. Worth flagging to judges/users as a known limitation, and
addressed in the Antigravity prompt.

## What's already solid

- Interruption fencing for genuine barge-ins (VAD-triggered) works, including the
  visual "interrupted" flash timing fix (a 350ms hold before falling through to
  "thinking") — this was a real bug in an earlier build and it's now correctly handled.
- Multi-recipe support (5 pre-loaded dishes + URL/paste extraction) is a strong,
  demo-friendly feature.
- Accessibility: 0 axe-core violations against the live-session DOM shell (transcript,
  progress rail, controls all correctly labeled).
- Zero TypeScript / build errors once the escape-character lint issues were fixed.
