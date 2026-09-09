# SousVoice — Web Client

Hands-free kitchen voice assistant frontend for the DaraForge Rime hackathon
submission. React 18 + TypeScript + Vite + Tailwind, talking to the
`agent/` LiveKit voice pipeline in the repo root (Deepgram STT → OpenAI LLM →
Rime TTS), with a fully offline Mock Mode for demoing without any API keys.

## Getting started

```bash
npm install
npm run dev
```

By default the app boots in **Mock Mode** unless `VITE_MOCK_MODE=false` is
set (see `.env.example`) — Mock Mode drives the whole voice-state machine,
transcript, and barge-in interruption flow entirely in the browser using the
Web Speech API, so it needs no backend, no LiveKit project, and no model
keys to try.

To talk to the real backend instead:

1. Copy `.env.example` to `.env.local` and set `VITE_MOCK_MODE=false`.
2. From the repo root, start the token server: `python scripts/token_server.py`.
3. Start the LiveKit agent: `python -m agent.main`.
4. `npm run dev` and open the app — it connects to LiveKit, subscribes to the
   agent's audio track, and mirrors its `lk.agent.state` participant
   attribute into the same 6-state voice visualizer Mock Mode uses.

## Scripts

- `npm run dev` — start the Vite dev server.
- `npm run build` — type-check (`tsc -b`) and produce a production build in `dist/`.
- `npm run lint` — ESLint over the whole project.
- `npm run preview` — serve the built `dist/` locally.
- `npm run test:a11y` — runs `test-a11y.js`, an axe-core accessibility audit
  against the built `dist/index.html` shell plus a representative live-session
  DOM snapshot (transcript, progress rail, controls). Exits non-zero on any
  violation.
- `npm run test:interaction` — runs `test-interaction.js`, a headless
  (jsdom) walk through the Mock Mode state machine: connect → greeting →
  a slow substitution lookup → a barge-in interruption mid-lookup → recovery
  → end of session. Asserts on `useSousVoiceStore` state and the transcript's
  `interrupted` flags at each step.

## Architecture

- `src/store/useSousVoiceStore.ts` — single Zustand store for screen/voice
  state, transcript, recipe progress, session stats, theme, and settings.
- `src/services/mockSession.ts` — offline conversation engine used by Mock
  Mode: keyword-routed responses (substitution lookup, quantity lookup, step
  progression, general fallback), a generation counter that discards stale
  timers on interruption, and a scripted replay of the acceptance-test
  interruption sequence from `RIME_EVIDENCE.md`.
- `src/services/livekitSession.ts` — real LiveKit `Room` connection: token
  fetch, audio track subscription, agent voice-state derivation from
  `isSpeaking` / `lk.agent.state`, transcription handling, reconnect logic.
- `src/services/speechService.ts` — browser-native TTS (`speechSynthesis`)
  and STT (`SpeechRecognition`) plus `AudioContext`/`AnalyserNode`-based
  mic-level metering used for Mock Mode's voice-activity-detected barge-in.
- `src/components/` — `PreConnectScreen`, `ConnectingScreen`,
  `LiveSessionScreen` (composing `VoiceOrbVisualizer`, `RecipeProgressRail`,
  `LiveTranscript`, `SessionStatsBadge`, `KitchenControlBar`),
  `EndedSummaryScreen`, `SettingsModal`, `RimeAttributionFooter`.
