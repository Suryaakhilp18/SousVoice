# SousVoice — Project Documentation

A hands-free cooking assistant built for the **Rime / DataForge hackathon
challenge** ("Build a voice-native product"). This document is the single
source of truth for the whole project: what it is, why it's built the way
it is, how every file fits together, how to run and verify it, and what's
left to do.

Companion documents in this repo: `README.md` (submission-facing summary),
`RIME_EVIDENCE.md` (the hard-voice-claim acceptance test and result),
`PROMPT_ANTIGRAVITY.md` (the brief for building the not-yet-built web
frontend).

---

## 1. Why this project, and why this problem

This repo was built after comparing two DataForge hackathon tracks:

- **Pathway track** — explain a frontier AI research concept (tied to the
  Dragon Hatchling / BDH architecture) as an interactive educational
  artifact, judged heavily on research correctness and live technical
  defense.
- **Rime track** — build a voice-native product that solves one hard,
  clearly-defined voice engineering problem, judged on product necessity
  of voice, engineering difficulty, Rime integration, and reproducible
  evidence.

The Rime track was chosen as the better fit: a clearer, more falsifiable
scope; a rubric that rewards a working, well-scoped prototype over deep
specialized research fluency; and an acceptance-test-first structure that
maps naturally onto ordinary software testing practice.

Within the Rime track, the brief lists several candidate "hard voice
problems" (perceived response time, interruption & recovery, tool-work
continuity, pronunciation, multilingual, telephony, expressive identity,
evaluation/benchmarking). **Interruption and recovery** was selected
because the brief supplies a concrete, literal acceptance-test template for
it (the "full-duplex test example"), which made it possible to write a
precise, falsifiable, offline-reproducible test *before* writing the
product code — exactly the discipline the brief asks for ("How to prove
the claim: write the acceptance test before the demo").

## 2. Product definition

**Product:** SousVoice, a hands-free cooking assistant that reads recipe
steps aloud and answers questions about the recipe in progress.

**Target user and situation:** someone actively cooking with wet, floury,
or otherwise occupied hands, following a recipe read aloud step by step.
They need to interrupt naturally and often — "wait, how much salt again?",
"what can I use instead of buttermilk?", "skip ahead" — without touching a
screen.

**Why voice is essential, not decorative:** a chatbot with a play button
fails this user outright. They cannot tap a screen with batter on their
hands, and they cannot wait for the assistant to finish a sentence, or a
slow background lookup, before correcting it. Removing voice does not
degrade this product — it eliminates the use case entirely. This is the
brief's own bar for a valid submission ("if removing speech leaves the
product mostly intact, voice is not doing enough").

**The one-sentence, falsifiable claim this project exists to prove:**

> When the cook interrupts SousVoice mid-response — including while a slow
> ingredient-substitution lookup is still in flight — queued audio stops
> immediately, the stale lookup result is never spoken, and the cook's new
> question is answered instead, using only what they actually asked.

This sentence is falsifiable: if a stale substitution result were ever
spoken after being superseded, or if audio kept playing past an
interruption, the claim would be false. `tests/test_interruption.py`
exists specifically to try to falsify it, repeatedly, offline.

## 3. Architecture

```
                         ┌─────────────────────────────┐
  cook's phone/tablet    │        LiveKit room          │
  (mic + speaker,        │  (WebRTC realtime transport) │
   web/ UI — built,      │                               │
   not yet wired to a    │                               │
   live room)            │                               │
        ┄ ┄ ┄ ┄ ┄ ┄ ┄ ┄ ▶│                               │
                         └───────────────┬───────────────┘
                                         │
                                         ▼
                              agent/main.py
                              LiveKit AgentSession
                    ┌─────────────┬─────────────┬─────────────┐
                    │  STT        │  LLM        │  TTS        │
                    │  Deepgram   │  OpenAI     │  Rime        │
                    │  nova-3     │  gpt-4o-mini│  (primary,   │
                    │             │  + 2 tools  │   only, no   │
                    │             │             │   fallback)  │
                    └─────────────┴──────┬──────┴─────────────┘
                                         │
                                         ▼
                          agent/interruption.py
                          TurnController (generation fencing)
                    ┌─────────────────────────────────────────┐
                    │ every user turn (incl. barge-in) bumps a  │
                    │ generation id; stale TTS + tool tasks are │
                    │ cancelled/discarded, never spoken/acted on│
                    └─────────────────────────────────────────┘
                                         │
                                         ▼
                          agent/tools.py + recipe_data.py
                    lookup_substitution (slow, injectable delay)
                    lookup_quantity (fast, control case)
```

`scripts/token_server.py` sits beside this, minting LiveKit room-join
tokens so any standard LiveKit frontend can join the same room as the
running agent. The custom `web/` app (React + Vite, described in §14) is
now built and independently verified via its own mock-mode simulation,
but is not yet wired to actually consume these tokens or connect to a
real LiveKit room — that wiring is the next step (§16). Until then, the
hosted LiveKit Agents Playground is the way to join a real live session.

### Design principle: the hard-engineering claim is decoupled from LiveKit/Rime

`TurnController` (the class that actually implements interruption &
recovery) has **zero dependencies** on LiveKit, Rime, the network, or any
external service. It only knows about generation ids, `asyncio.Task`s, and
coroutines. `agent/main.py` wires it into the real LiveKit `AgentSession`;
`tests/test_interruption.py` wires it into fake, in-process coroutines with
controllable timing. This is what makes the core claim testable in
under a second, with no API keys, rather than only "provable" by a fragile
live demo.

## 4. Repository structure

```
DaraForge/
├── README.md                  Submission-facing summary (user, claim,
│                               architecture, setup, config, limitations)
├── DOCUMENTATION.md            This file — full project documentation
├── RIME_EVIDENCE.md            The hard voice claim, acceptance test,
│                               procedure, result, limitations
├── PROMPT_ANTIGRAVITY.md       Original brief for building web/ (superseded)
├── PROMPT_ANTIGRAVITY_V2.md    Advanced-UI brief (superseded — see §14)
├── LICENSE                     MIT (this project's own code)
├── requirements.txt             Python dependencies (agent + token server)
├── .env.example                 All required environment variables
├── .gitignore
├── agent/
│   ├── __init__.py
│   ├── interruption.py         TurnController — the core hard-engineering
│   │                            contribution (generation-fenced tool
│   │                            calls + TTS playback)
│   ├── main.py                  Live LiveKit Agent: STT/LLM/TTS wiring,
│   │                            SousVoice system prompt, two function
│   │                            tools, TurnController integration
│   ├── tools.py                  lookup_substitution (slow, injectable
│   │                            delay) and lookup_quantity (fast)
│   └── recipe_data.py            Sample recipe, substitution table,
│                                quantity table (hand-authored, small)
├── tests/
│   ├── __init__.py
│   └── test_interruption.py      Offline, no-API-key acceptance test for
│                                the hard voice claim (3 tests)
├── scripts/
│   ├── run_tests.sh              Convenience wrapper for the test suite
│   └── token_server.py            Flask server minting LiveKit tokens
└── web/                          React/Vite frontend — built, see §14
    ├── README.md                  Frontend-specific docs, verification log
    ├── src/
    │   ├── types.ts                 AgentState, TranscriptLine, Recipe...
    │   ├── data/recipe.ts            Mirrors agent/recipe_data.py by hand
    │   ├── store/sessionStore.ts      Zustand store (screen/state/transcript)
    │   ├── mock/mockEngine.ts          Scripted session simulation
    │   └── components/                 VoiceOrb, Transcript, RecipeRail,
    │                                   SessionStats, Controls, ThemeToggle,
    │                                   RimeFooter, and the five screens
    └── public/                      Manifest + icons (PWA scaffolding)
```

## 5. Module reference

### `agent/interruption.py` — `TurnController`

The core data structures:

- `generation: int` — monotonically increasing counter; the "fence".
- `SpokenEvent` — a dataclass record of `(generation, text, timestamp)`
  for everything actually spoken; this is the ground-truth transcript used
  to verify stale content never reaches the user.

The core methods:

- `new_turn() -> int` — called the instant the user starts speaking,
  including a barge-in interruption. **Synchronous and cheap on purpose**
  (must not await I/O): increments `generation`, cancels the current
  in-flight TTS task if any, and cancels every tracked tool task belonging
  to any *older* generation. Returns the new generation id.
- `run_tool(gen, coro) -> Optional[Any]` — runs a tool coroutine tagged
  with generation `gen`. If the task is cancelled (a `new_turn()` call
  fenced it out), or if it happens to finish right as a newer generation
  started (a race the cancellation didn't win in time), the result is
  discarded and `None` is returned. Only a result whose generation is
  still current when it resolves is ever handed back to the caller.
- `speak(gen, text, tts_coro) -> bool` — plays (or, in tests, simulates)
  TTS for `text` under generation `gen`. Returns `False` without playing
  anything if `gen` is already stale when called. If cancelled mid-flight,
  returns `False`. Only on genuine, still-current completion is the event
  appended to `spoken_log` and `True` returned.

Instrumentation for testing/observability: `cancelled_tool_count` and
`discarded_stale_results` counters, incremented whenever fencing actually
discards something — used by the test suite to assert that cancellation
is really happening, not merely that behavior looks correct by coincidence.

### `agent/tools.py`

- `lookup_substitution(ingredient, delay_seconds=None)` — simulates a slow
  external API (e.g. a real ingredient-substitution/nutrition service).
  Delay defaults to `LOOKUP_DELAY_SECONDS` env var (2.5s), or can be passed
  explicitly (used by the test suite for precise timing control). This is
  the tool most likely to still be in flight when the user interrupts —
  deliberately, since it's the one the acceptance test targets.
- `lookup_quantity(ingredient)` — a fast (~50ms) lookup used both as a
  normal-path tool and as the "new turn's own tool call should complete
  normally" control case in testing.

### `agent/recipe_data.py`

`RECIPE` (name, servings, ordered step strings), `SUBSTITUTIONS` (ingredient
→ substitution text), `QUANTITIES` (ingredient → amount text). Intentionally
small and hand-authored — this is a voice-engineering hackathon submission,
not a recipe database product.

### `agent/main.py`

Wires everything into a real `livekit.agents` pipeline:

- `SousVoiceAgent(Agent)` — the LLM system prompt (recipe context,
  instructions to keep turns short and to prioritize the cook's latest
  question over anything mid-sentence) plus two `@function_tool()`
  methods, `substitute_ingredient` and `get_quantity`, each of which reads
  `self._turns.generation` at call time and routes through
  `TurnController.run_tool` so a stale result becomes an explicit
  "superseded, do not mention this" string rather than leaking into the
  LLM's next utterance.
- `entrypoint(ctx)` — connects to the LiveKit room, builds an
  `AgentSession` with Deepgram STT (`nova-3`), OpenAI LLM (`gpt-4o-mini`),
  Rime TTS (`mistv2` / `abbie` / `eng`, all env-configurable), and
  `allow_interruptions=True` for LiveKit's own local-playback cancellation.
  A `user_state_changed` handler calls `turns.new_turn()` the instant the
  cook starts speaking (LiveKit's own barge-in signal), which is what
  actually triggers the fencing described above during a live session.

### `scripts/token_server.py`

A minimal Flask app exposing `GET /token?room=&identity=`, returning a
signed LiveKit JWT plus the `LIVEKIT_URL`, so any standard LiveKit
frontend can join the agent's room without a bespoke signaling backend.

### `tests/test_interruption.py`

Three `unittest.IsolatedAsyncioTestCase` tests, all offline, no network, no
API keys, using a `FakeTTS` class (`asyncio.sleep`-based) standing in for
real Rime playback duration:

1. **`test_stale_lookup_and_audio_are_discarded_on_interrupt`** — the
   literal brief acceptance-test scenario: start a slow substitution
   lookup + filler TTS, interrupt after 0.2s with a different fast
   request, assert the interrupt fence is sub-10ms, the stale filler audio
   never completes, the stale substitution result is `None`, the new
   request's answer is spoken, and the spoken transcript contains only the
   new answer.
2. **`test_uninterrupted_turn_completes_and_is_spoken_normally`** — control
   case guarding against a trivial "cancel everything" implementation:
   an uninterrupted turn must complete and be spoken exactly as normal.
3. **`test_second_interruption_only_cancels_stale_work`** — three turns in
   a row, each interrupting the last; asserts both earlier lookups are
   discarded and only the final turn's fast result is ever returned.

Run with `python3 -m unittest tests.test_interruption -v` or
`bash scripts/run_tests.sh`. Last verified result (see `RIME_EVIDENCE.md`
for the full record):

```
Ran 3 tests in 0.582s
OK
```

## 7. Setup and running

```bash
# 1. Environment
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in real LIVEKIT_/RIME_/OPENAI_/DEEPGRAM_ keys

# 2. Offline evidence test (no keys needed)
bash scripts/run_tests.sh

# 3. Live agent (needs all keys in .env)
python -m agent.main dev

# 4. Token server, in a second terminal (needed to connect any frontend)
python scripts/token_server.py

# 5. Connect a frontend
# Today: open https://agents-playground.livekit.io, point it at your
# LIVEKIT_URL, and join with a token from GET localhost:8000/token.
# Planned: the custom web/ app — see PROMPT_ANTIGRAVITY.md.
```

## 8. Configuration reference (`.env`)

| Variable | Purpose | Default |
|---|---|---|
| `LIVEKIT_URL` | LiveKit project WebSocket URL | — (required) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit project credentials | — (required) |
| `RIME_API_KEY` | Rime TTS credential | — (required) |
| `RIME_MODEL` | Rime TTS model | `mistv2` |
| `RIME_SPEAKER` | Rime voice | `abbie` |
| `RIME_LANG` | Rime language | `eng` |
| `OPENAI_API_KEY` | LLM credential | — (required) |
| `DEEPGRAM_API_KEY` | STT credential | — (required) |
| `LOOKUP_DELAY_SECONDS` | Artificial delay injected into `lookup_substitution`, for reproducing the stress test on demand | `2.5` |

`RIME_MODEL`/`RIME_SPEAKER`/`RIME_LANG` are centralized here specifically
so the exact shipped Rime configuration stays auditable against
`RIME_EVIDENCE.md` and `README.md` rather than hardcoded in multiple
places.

## 9. What's live, simulated, and precomputed (evidence discipline)

- **Live** (requires real API keys, not yet run in this environment):
  `agent/main.py` end to end — real STT, real LLM tool-routing, real Rime
  streaming TTS, real LiveKit transport and barge-in detection.
- **Simulated, confined to tests**: `FakeTTS` in
  `tests/test_interruption.py` stands in for real Rime audio *duration*
  using `asyncio.sleep`; never used in `agent/main.py`.
- **Fixed artificial delay, not a real API**: `lookup_substitution`'s
  configurable sleep stands in for a real ingredient-substitution service.
  Disclosed explicitly in `RIME_EVIDENCE.md`; the fencing logic itself is
  delay-agnostic, so this substitution doesn't weaken the correctness
  claim, only the (separately disclosed) claim about real network timing.
- **Nothing** in this repo presents a precomputed or cached model output
  as if it were a live result.

## 10. Submission checklist status (against the Rime brief)

| Requirement | Status |
|---|---|
| Public artifact URL, no sign-in | Not yet — no hosted demo deployed |
| Public source repository | This repo (local; not yet pushed/public) |
| Working code judges can inspect | ✅ `agent/`, `tests/`, `scripts/` |
| README (claim, user, architecture, live/precomputed split, reproduce, credits/licenses) | ✅ `README.md` |
| `RIME_EVIDENCE.md` (claim, acceptance test, procedure, result, limitations) | ✅ |
| Environment example, placeholders only | ✅ `.env.example` |
| Recorded demo (≤4–5 min) | Not yet produced |
| ≥3 recent primary sources (2022–2026) cited beside technical claims | Not yet added |
| Source/license record for reused components | Partially — see §10 below; needs a dedicated section |
| AI assistance disclosure | ✅ in `README.md` |
| Working demo link/recording | Not yet — no live keys run in this environment |
| Custom web frontend | Not yet built — `PROMPT_ANTIGRAVITY.md` is the spec for it |

## 11. Third-party components, sources, and licenses

| Component | Role | License |
|---|---|---|
| [LiveKit Agents](https://docs.livekit.io/agents/) | Realtime transport, orchestration, barge-in detection | Apache-2.0 |
| [Rime](https://docs.rime.ai/) | Text-to-speech, sole spoken-output channel | Commercial API (per Rime terms) |
| [Deepgram](https://developers.deepgram.com/) | Speech-to-text | Commercial API (per Deepgram terms) |
| [OpenAI](https://platform.openai.com/docs) | LLM (tool-routing + response generation) | Commercial API (per OpenAI terms) |
| [Flask](https://flask.palletsprojects.com/) | Token server | BSD-3-Clause |
| This project's own code (`agent/`, `tests/`, `scripts/`) | — | MIT, see `LICENSE` |

No model weights, datasets, third-party graphics, or fonts are bundled.
Recipe/substitution content in `agent/recipe_data.py` is original,
hand-authored for this demo.

## 12. Known limitations

- Live end-to-end pipeline (real STT → LLM → Rime, over a real LiveKit
  room) has not yet been exercised with real API keys in this
  environment; only the offline `TurnController` logic is verified.
- No custom frontend yet — see `PROMPT_ANTIGRAVITY.md` for the full build
  spec; today, connecting requires the hosted LiveKit Agents Playground.
- `lookup_substitution`'s delay is a fixed sleep, not real network
  latency variance.
- Recipe/substitution data is a small hand-authored table, not a real
  ingredient database or nutrition API.
- No telephony, multilingual, pronunciation-tuning, or benchmarking work —
  explicitly out of scope for the interruption & recovery problem this
  submission targets.
- No recorded demo video yet.
- Primary-source citations (the brief asks for ≥3 recent papers/sources
  tied to technical claims) have not yet been added anywhere in the repo.

## 13. Roadmap / next steps, in priority order

1. Run `agent/main.py` against real LiveKit/Rime/OpenAI/Deepgram keys and
   repeat the `RIME_EVIDENCE.md` procedure live (interrupt mid-lookup,
   mid-TTS) to capture real timing numbers, not just the offline proof.
2. Build `web/` per `PROMPT_ANTIGRAVITY.md` so the demo doesn't depend on
   the hosted Playground.
3. Record the ≤5-minute submission demo (normal flow, the interruption
   stress case, the result, and which speech provider is active, per the
   brief's own demo checklist).
4. Add primary-source citations for the interruption/recovery and
   voice-latency claims.
5. Push the repo to a public host and fill in the "public artifact URL" /
   "public source repository" checklist rows above.

## 14. AI assistance disclosure

This entire codebase — agent logic, tests, and documentation, including
this file — was drafted with AI assistance (Claude) based on the
challenge brief and the LiveKit/Rime documentation it links to. No
third-party code was forked. Every component, in particular
`agent/interruption.py`'s generation-fencing scheme and its test suite, has
been reviewed and is understood and defensible line by line, per the
brief's technical-ownership requirement.
