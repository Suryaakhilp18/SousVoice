# RIME_EVIDENCE.md

## Hard voice claim

When the cook interrupts SousVoice mid-response -- including while a slow
ingredient-substitution lookup is still in flight -- queued Rime audio
stops immediately (sub-10ms fence), the stale lookup result is never spoken
or acted on, and the cook's new question is answered using only what they
actually asked. Nothing the assistant was mid-sentence on ever resumes or
leaks into the new answer.

This is the "Interruption and recovery" hard voice problem from the
challenge brief, applied to a hands-busy cooking scenario: a cook with wet
or full hands frequently talks over the assistant ("wait, how much salt?",
"actually what can I use instead of buttermilk?") and needs the correction
to land immediately, not after the assistant finishes its current sentence
or a pending lookup resolves.

## Acceptance test (defined before the demo)

Directly follows the brief's own full-duplex test template:

1. Start a turn that triggers a **slow** tool call (`substitute_ingredient`,
   fixed artificial delay via `LOOKUP_DELAY_SECONDS`, default 2.5s) while
   the agent is also speaking a filler line ("Let me check that for
   you...").
2. Partway through (0.2s in, well before either the filler audio or the
   lookup finishes), the cook interrupts and asks a **different** question
   (a fast ingredient-quantity lookup).
3. Verify all of the following:
   - Queued audio for the superseded turn stops promptly and is never
     marked as completed/spoken (target: fence applied in <10ms; the
     filler audio must never reach `ran_to_completion`).
   - The new instruction is processed as its own, independent turn.
   - The stale substitution result -- once it eventually resolves in the
     background -- is discarded, never spoken, and never referenced.
   - The superseded tool call is recorded as cancelled/reconciled
     (`cancelled_tool_count` increments).
   - The final spoken transcript contains only the answer to what the cook
     actually asked last.
4. Control case: an **uninterrupted** turn must still complete and be
   spoken normally, and a chain of three back-to-back interruptions must
   only ever discard the two stale lookups, never the final one -- guarding
   against a trivial "cancel everything, always" implementation passing
   step 3 by accident.

## Procedure (exactly reproducible, no API keys required)

The claim is implemented in `agent/interruption.py`'s `TurnController`
(generation-fenced tool calls and TTS playback) and exercised directly by
`tests/test_interruption.py`, with a `FakeTTS` standing in for real Rime
playback latency using a plain `asyncio.sleep` (i.e. real wall-clock
timing behavior, no audio device or network needed to prove the
cancellation logic and timing are correct).

```
python3 -m unittest tests.test_interruption -v
# or: bash scripts/run_tests.sh
```

## Result

```
test_second_interruption_only_cancels_stale_work ... ok
test_stale_lookup_and_audio_are_discarded_on_interrupt ... ok
test_uninterrupted_turn_completes_and_is_spoken_normally ... ok

Ran 3 tests in 0.582s
OK
```

Measured interrupt-to-fence latency in the test run: **under 0.01s**
(assert threshold; actual observed value is effectively the cost of one
Python function call, not a sleep). Both stale artifacts -- the 1.0s filler
TTS clip and the 2.5s substitution lookup -- are confirmed never spoken and
never returned to the caller.

## Limitations / evidence level

- This test proves the *control logic* (fencing, cancellation, discard-on-
  stale) is correct and timing-accurate. It does **not** by itself measure
  real network/STT/LLM/Rime-streaming latency, which requires live API
  keys and a live LiveKit room -- that path is `agent/main.py`, wired
  through LiveKit's `AgentSession` with `allow_interruptions=True` for
  local playback cancellation, and `TurnController` layered on top for the
  tool-call and transcript fencing LiveKit does not track for you.
- The delay in `lookup_substitution` is a fixed artificial sleep standing
  in for a real external API in the demo/test; in production it would be
  network latency to a real substitution/nutrition service, which is
  variable rather than fixed. The fencing logic is delay-agnostic (it does
  not depend on knowing the delay in advance), so this substitution does
  not weaken the claim, but it is disclosed here rather than left implicit.
- `mistv2`/`abbie`/`eng` are the Rime model/speaker/language configured by
  default (see `.env.example`, `README.md`); swapping them does not change
  the interruption behavior, which lives entirely in the orchestration
  layer, not in the TTS model.
