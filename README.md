# SousVoice

A hands-free cooking assistant built for the Rime / DataForge hackathon
challenge ("Build a voice-native product"). Rime provides all spoken
output; the hard voice problem tackled is **interruption and recovery**.

## The user and the problem

The target user is someone actively cooking -- hands wet, floury, or full
-- who is following a recipe read aloud step by step. They frequently need
to interrupt: "wait, how much salt again?", "actually, what can I use
instead of buttermilk?", "skip ahead to the next step." A chatbot with a
play button fails this user outright: they cannot tap a screen with batter
on their hands, and they cannot wait for the assistant to finish a sentence
or a slow lookup before correcting it. **Removing voice does not just
degrade this product, it eliminates the use case.**

## The one-sentence claim

When the cook interrupts -- including while a slow ingredient-substitution
lookup is still in flight -- queued audio stops immediately, the stale
lookup result is never spoken, and the cook's actual new question is
answered instead.

See `RIME_EVIDENCE.md` for the exact acceptance test, procedure, and
result.

## Architecture

```
 cook's mic ── LiveKit room ── AgentSession
                                  ├─ STT: Deepgram (nova-3)
                                  ├─ LLM: OpenAI (gpt-4o-mini) + 2 tools
                                  ├─ TTS: Rime (primary spoken output)
                                  └─ TurnController (agent/interruption.py)
                                        generation-fenced tool calls + speech
```

- **`agent/interruption.py`** -- `TurnController`: the actual hard-
  engineering contribution. Every user turn (including a barge-in
  interruption) gets a monotonically increasing generation id. Starting a
  new turn synchronously (a) cancels any in-flight TTS playback task and
  (b) cancels/tracks any in-flight tool-call tasks from older generations.
  Tool results and TTS completions are only honored if their generation is
  still current when they resolve -- so even a result that finishes right
  as an interruption lands is discarded, not just one that gets cancelled
  in time. This class has zero dependencies on LiveKit, Rime, or the
  network, which is what makes it independently, offline testable.
- **`agent/tools.py`** -- `lookup_substitution` (slow, injectable delay --
  the tool most likely to be caught mid-flight by an interruption) and
  `lookup_quantity` (fast, used as the control/new-turn tool in the test).
- **`agent/recipe_data.py`** -- a small hand-authored recipe and
  substitution/quantity table. This is a hackathon voice product, not a
  recipe database product; the content is intentionally minimal.
- **`agent/main.py`** -- the live LiveKit `Agent`/`AgentSession` wiring:
  Deepgram STT, OpenAI LLM, Rime TTS, `allow_interruptions=True` for local
  playback cancellation, and the `TurnController` layered on top for the
  tool-call and "what was actually said" transcript fencing that LiveKit
  itself does not track.
- **`tests/test_interruption.py`** -- the reproducible acceptance test
  (see `RIME_EVIDENCE.md`). Runs with zero API keys and zero network
  access in well under a second.
- **`scripts/token_server.py`** -- mints LiveKit room-join tokens so a
  standard frontend (e.g. the hosted LiveKit Agents Playground) can join
  the same room as the running agent, without building a bespoke web
  client.

## What's live vs. precomputed vs. simulated

- **Live** (requires API keys, see below): `agent/main.py` end-to-end --
  real STT, real LLM tool-routing, real Rime streaming TTS, real LiveKit
  transport and barge-in detection.
- **Simulated, not live**: the `FakeTTS` class in
  `tests/test_interruption.py` stands in for real Rime playback duration
  using `asyncio.sleep`, so the interruption-timing test can run offline.
  It is clearly named and confined to the test file; it is never used in
  `agent/main.py`.
- **Fixed artificial delay, not a real API**: `lookup_substitution`'s
  `LOOKUP_DELAY_SECONDS` stands in for a real ingredient-substitution
  API's network latency, disclosed in `RIME_EVIDENCE.md`.
- Nothing in this submission uses precomputed/cached model outputs
  presented as live.

## Rime configuration (exact shipped path)

| | |
|---|---|
| Model | `mistv2` (`RIME_MODEL`) |
| Speaker | `abbie` (`RIME_SPEAKER`) |
| Language | `eng` (`RIME_LANG`) |
| Integration | `livekit-plugins-rime`, streamed as the `AgentSession` TTS |
| Transport | LiveKit realtime room (WebRTC), via `LIVEKIT_URL` |
| Fallback | none configured -- Rime is the only TTS path; if Rime is
| | unreachable the agent surfaces an error rather than silently
| | switching providers |

Model/speaker/language are read from environment variables
(`.env`, see `.env.example`) so the exact combination used in a given demo
run is auditable rather than hardcoded across multiple places.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real LIVEKIT_/RIME_/OPENAI_/DEEPGRAM_ keys
```

Run the offline evidence test (no keys needed):

```bash
bash scripts/run_tests.sh
# or: python3 -m unittest tests.test_interruption -v
```

Run the live agent (needs all keys in `.env`):

```bash
python -m agent.main dev
```

Connect a frontend to talk to it — the custom web UI now lives in `web/`
(see `web/README.md`):

```bash
cd web
npm install
cp .env.example .env.local   # VITE_MOCK_MODE=true by default
npm run dev
```

With `VITE_MOCK_MODE=true` (the default) it runs a full scripted session —
including the interruption/recovery sequence below — with zero API keys
and no backend running, which is the fastest way to see the whole UI work.
Wiring it to the real agent (`VITE_MOCK_MODE=false`, via
`scripts/token_server.py`) is tracked as a next step in `web/README.md` —
not yet done. Until then, the hosted LiveKit Agents Playground
(https://agents-playground.livekit.io, joined with a token from
`GET localhost:8000/token`) remains the way to talk to a live agent
session.

## Known limitations

- The live path has not been run against real Rime/OpenAI/Deepgram keys in
  this environment (none were provided at build time); the interruption/
  recovery *logic* is proven offline (see `RIME_EVIDENCE.md`), but real
  network/streaming latency numbers for the full pipeline are not yet
  measured. Re-running `agent/main.py` with real keys and repeating the
  `RIME_EVIDENCE.md` procedure live (interrupting mid-lookup, mid-TTS) is
  the natural next step.
- A custom web frontend now exists (`web/`), verified end-to-end via its
  mock mode (0 build errors, 0 lint errors, 0 accessibility violations —
  see `web/README.md`). It is not yet wired to the real LiveKit agent
  (`VITE_MOCK_MODE=false` is a placeholder path); until that's done, the
  hosted LiveKit Agents Playground remains the way to talk to a live
  session.
- Substitution/quantity data is a small hand-authored table, not a real
  ingredient database or nutrition API.
- No telephony, multilingual, or pronunciation-tuning work is included --
  out of scope for the interruption & recovery problem this submission
  targets.

## AI assistance disclosure

This codebase (agent logic, tests, docs) was drafted with AI assistance
(Claude) based on the challenge brief and the LiveKit/Rime documentation
linked from it. No third-party code was forked. All logic, especially
`agent/interruption.py`'s generation-fencing scheme and its test, was
reviewed and is understood and defensible line-by-line.

## Credits and licenses

- [LiveKit Agents](https://docs.livekit.io/agents/) -- realtime transport
  and orchestration (Apache-2.0).
- [Rime](https://docs.rime.ai/) -- text-to-speech, primary spoken output.
- [Deepgram](https://developers.deepgram.com/) -- speech-to-text.
- [OpenAI](https://platform.openai.com/docs) -- LLM.
- This project's own code: MIT, see `LICENSE`.
