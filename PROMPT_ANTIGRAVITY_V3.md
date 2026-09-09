# SousVoice — Antigravity Master Prompt V3 (Fix + Advanced Upgrade)

Paste this whole prompt into Antigravity, pointed at the existing `web/` project. It
builds on the current app (multi-recipe support, `cookingAiService.ts`,
`recipeExtractor.ts`, `HomeLanding.tsx`) — do not start over, and do not change the
Python `agent/` backend or its LiveKit/Deepgram/Rime pipeline.

---

## 0. Ground rules

- This is an **incremental upgrade**, not a rewrite. Keep every file that isn't named
  below untouched. Preserve `useSousVoiceStore.ts`'s existing state shape unless a task
  explicitly says to extend it.
- After every task, run `npm run build`, `npm run lint`, `npm run test:a11y`, and
  `npm run test:interaction`. All four must exit 0 with no errors before moving to the
  next task. If `test:interaction` hangs, check whether you introduced a new
  `window.setInterval`/`window.setTimeout` whose ID is later cleared with the bare
  global `clearInterval`/`clearTimeout` — that mismatch only matters in the Node/jsdom
  test harness (not in a real browser), so add a matching `window.clearX` in the same
  scope where the timer was created, or just use plain (non-`window.`) timers throughout
  the codebase for consistency.
- Do not add any new external CORS proxy dependency, and do not remove the existing
  fallback recipe used when extraction fails.

## 1. Fix: real bug — sequential follow-up questions can silently swallow answers

**Root cause:** `mockSession.ts`'s `handleCookMessage` fences every call with a
`generation` counter and discards a resolved answer whenever `currentGen` has moved on
(`if (gen !== currentGen) return`). This is correct for a genuine interruption but also
fires for an ordinary second question asked before the first answer finished generating —
the first answer is silently dropped, never shown, never spoken, with no error.

**Required fix — replace the discard-on-newer-message model with a small FIFO queue:**

- Add a `pendingQuestions: string[]` queue (module-level state in `mockSession.ts`, or
  lifted into the store if you'd rather have it inspectable from the UI).
- `handleCookMessage(text)` always appends the cook's message to the transcript
  immediately (as today). Then:
  - If nothing is currently being answered (`isProcessingAnswer === false`), start
    answering `text` right away, exactly as today.
  - If an answer is already in flight, **push `text` onto `pendingQuestions` instead of
    starting a second `generateContextualAnswer` call** — don't drop it, don't cancel the
    in-flight one.
  - When an in-flight answer resolves normally (not discarded by a real interruption),
    add it to the transcript and speak it as today, then check `pendingQuestions`: if
    non-empty, immediately start answering the next queued question (`shift()`).
- Keep the **existing** discard behavior only for a genuine interruption: when
  `triggerInterruption()` fires (VAD barge-in, or an explicit "stop"/"wait" utterance
  detected mid-speech), clear `pendingQuestions` entirely and bump `currentGen` as today
  — a real interruption should drop stale work, a same-breath follow-up question should
  not.
- Surface the queue state in the UI: while a question is queued (not yet being
  answered), show it in the transcript with a small "queued" badge or a subtly dimmed
  bubble (similar treatment to the existing "interrupted" struck-through bubble, but a
  neutral color, not crimson) so the cook can see their question was heard and is coming
  up next, not ignored.
- Add a regression test in `test-interaction.js` that asks two unrelated questions back
  to back with no wait in between, and asserts **both** answers eventually appear in the
  transcript, in order, referencing both original questions' subjects.

This is the single most important fix — it's what makes multi-turn conversation feel
connected instead of lossy, and it will only get more visible once `cookingAiService.ts`
is replaced by a real (slower) LLM call in Task 4.

## 2. Fix: microphone left running after session ends

`endMockSession()` doesn't call `stopMicrophone()` (exported from `speechService.ts` but
never invoked anywhere). Add `stopMicrophone()` to `endMockSession()`, and to any other
session-teardown path (e.g. an unmount effect on `LiveSessionScreen`, and
`endLiveKitSession()` for parity, even though LiveKit's own `room.disconnect()` already
releases its own mic track). Reset `micLevel` to 0 alongside it. Verify with a quick
manual test: start a mock session, end it, and confirm (via the browser's mic
indicator/tab icon) that the microphone is no longer active.

## 3. Fix: lint errors in `recipeExtractor.ts`

`parsePastedRecipe`'s regexes escape `.` and `)` inside character classes
(`[\.\)]`), which ESLint's `no-useless-escape` correctly flags — inside `[...]` those
characters don't need escaping. Change every `[\.\)]` to `[.)]` in that function
(3 occurrences). Confirm `npm run lint` is clean afterward.

## 4. Advanced feature: real accuracy via an actual LLM, with graceful fallback

`cookingAiService.ts`'s keyword-matched responses are impressively broad for a mock, but
they're still pattern matching — ask anything slightly off-script and you get the generic
fallback. Wire in a real model call while preserving instant offline demoability:

- Add an optional `VITE_OPENAI_API_KEY` (or reuse whatever the backend already uses) env
  var. When present, `generateContextualAnswer` should call a real chat completion
  endpoint, passing: the recipe as structured JSON (name, ingredients, steps,
  substitutions, quantities, cuisine, times), the last ~6 turns of transcript as
  conversation history (so pronoun/context follow-ups like "what about that" resolve
  correctly), and the new question. Keep responses short (2–4 sentences) and
  cooking-instruction-toned — pass a system prompt that says as much.
  - Handle timeouts and API errors by falling back to the existing keyword-matched
    engine as-is — never show an error to the cook, always answer with *something*
    relevant.
- When the key is absent (offline demo / hackathon judging without network), keep
  today's keyword engine as the entire behavior — no regression for the no-key path.
- Add a small "Powered by live AI" vs "Offline demo mode" indicator near the
  `RimeAttributionFooter` so it's clear which mode is active.

## 5. Advanced feature: richer, more informative interruption handling

Beyond the queueing fix in Task 1, make the interruption UX itself communicate more:

- When a barge-in happens, show *what* was interrupted, not just that something was:
  keep the interrupted agent bubble's text ( struck-through, as today) but add a small
  inline "you can still ask this later" affordance — clicking the struck-through bubble
  re-queues that exact question.
  - Distinguish two barge-in causes visually: VAD-detected speech vs. an explicit
    "stop"/"wait"/"hold on" utterance (already partially detected via
    `triggerInterruption(reason)` — thread `reason` through to the transcript entry, e.g.
    `interruptedReason: 'vad' | 'explicit-stop'`, and show a slightly different tag for
    each ("Cut off" vs "You said wait")).
- Cap how aggressively VAD triggers a barge-in: right now any mic level over the
  threshold while `voiceState === 'speaking'` interrupts, which will false-trigger on
  background kitchen noise (running water, a fan, a knock at the door). Require the
  level to stay above threshold for ~150–200ms (a tiny debounce) before firing
  `triggerInterruption`, so a single loud clatter doesn't cut off the assistant
  mid-sentence.

## 6. Advanced feature: continuous, natural conversational flow

This is what "voice feature should keep speaking/engaging continuously" is really asking
for — not that TTS should run after the session visibly ends, but that turns should feel
like one ongoing conversation instead of isolated one-shot Q&A:

- After the assistant finishes speaking an answer, don't just fall silent back to
  `listening` — if the answer resolved a substitution/quantity/troubleshooting question,
  have it end with a short, natural bridge back to the active step ("...so you're all set
  — back to step 3 whenever you're ready.") rather than a bare fact, so the cook isn't
  left wondering if they should say something. `cookingAiService.ts` already does some of
  this (see its item 10, "conversational continuity") — extend that pattern to the other
  answer branches, not just the pronoun-check fallback.
- Keep short-term memory genuinely load-bearing, not just detected: when
  `generateContextualAnswer` sees "it"/"that"/"this", resolve the pronoun to the actual
  ingredient/step from the last 1–2 turns and answer *that*, rather than the generic
  "continuing with X" filler it returns today. This requires passing the actual last
  agent-answer topic (not just checking that a previous cook message existed) into the
  prompt/keyword logic.
- Once Task 1's queue lands, this stops feeling like separate transactions and starts
  feeling like a real back-and-forth, which is most of what "continuous" means here.

## 7. Advanced UI polish — rich, higher-quality interface

The current kitchen-dark aesthetic and the 6-state voice orb are a good foundation. Raise
the ceiling:

- **Home/landing screen** (`HomeLanding.tsx`): the four-step "how it works" grid and
  dish-pill quick launch are good; add a subtle looping ambient animation to the hero
  (e.g. a slow particle/steam drift behind the title) so the landing screen doesn't feel
  static next to the animated live session.
- **Recipe context panel**: currently a static summary bar. Make it expandable/collapsible
  to reveal the full ingredient list and all steps at a glance (a quick reference without
  leaving the live session), with the currently-active step visually highlighted in that
  expanded list.
- **Live transcript**: add subtle grouping — consecutive agent messages that logically
  belong to one exchange (e.g., an answer plus its natural continuation) should visually
  cluster rather than each being a fully separate bubble.
- **Motion consistency**: audit all `framer-motion` transitions for a single shared easing
  curve and duration scale (e.g. `easeOut`, 0.2–0.3s for micro-interactions, 0.4s for
  screen transitions) — right now durations are hand-picked per component
  (0.25s, 0.35s, 0.9s, 1.5s, 2.5s, 4s) with no obvious system; consolidate into a small
  shared `motionTokens.ts` and reference it everywhere so the whole app reads as one
  coherent motion language.
- **Empty/loading states**: `HomeLanding`'s URL extraction already has a loading spinner;
  make sure every async action (mic permission request, LiveKit connect, recipe fetch)
  has a matching, visually consistent loading treatment — no bare blank states.

## 8. Verification checklist (run before calling this done)

- [ ] `npm run build` — 0 errors
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run test:a11y` — 0 violations
- [ ] `npm run test:interaction` — passes, including the new back-to-back-questions
      regression test from Task 1, and exits cleanly (no hang)
- [ ] Manual check: start a mock session, ask two questions with no pause between them,
      confirm both answers appear in order
- [ ] Manual check: end a session, confirm the mic indicator turns off
- [ ] Manual check: trigger a genuine interruption (speak while the assistant is
      mid-sentence) and confirm the queue from a prior follow-up is correctly cleared,
      not answered late
