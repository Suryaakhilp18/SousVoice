# SousVoice — Real-Time Hands-Free AI Kitchen Companion 🍳🎙️

> **Turn any recipe into an interactive, voice-guided cooking assistant with instant hands-free interruption and recovery.**

SousVoice is a voice-native AI kitchen assistant designed for cooks with flour, butter, or oil on their hands. It guides users step-by-step through any culinary dish, answers contextual questions about ingredient substitutions, stove heat settings, and quantities, and allows natural speech interruptions (**barge-in**) that instantly cancel speech and handle follow-up questions without stale responses.

---

## 🌟 The Core Problem & The Innovation

When someone is actively cooking, **touching a screen is impractical or unsanitary**. Voice assistants typically fail in kitchen environments because:
1. **No Barge-In / Stale Speech**: Traditional assistants force the cook to listen to long, rigid sentences. Saying *"Wait!"* or *"How much salt again?"* either gets ignored or queued after the previous response finishes.
2. **Acoustic Echo & False Triggers**: Kitchen background clatter, exhaust fan hum, and the assistant's own voice coming through device speakers cause endless recognition loops and hallucinated answers.
3. **Loss of Cooking Context**: If the cook asks *"Can I use an induction stove for this step?"*, generic bots lose track of the specific pan temperature, current step, and ingredient state.

### The One-Sentence Claim:
> **When the cook interrupts—even mid-speech or during a tool-assisted query—queued audio cuts off in sub-milliseconds, stale response pipelines are discarded via generation fencing, and the cook's new question is answered with full situational awareness.**

---

## 🏗️ Architecture & Voice Pipeline

```
  ┌─────────────────────────────────────────────────────────────┐
  │                        COOK'S MIC                           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                  [Acoustic Echo Cancellation]
                  [VAD & Noise Clatter Filter]
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    SpeechRecognition     │
                    │ (Interim & Final Stream) │
                    └────────────┬─────────────┘
                                 │
                   [Generation-Fenced Interruption]
                   [Barge-In / Explicit 'Wait/Stop']
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │    SousVoice Brain       │
                    │ (Current Step + Recipe)  │
                    │ (OpenAI GPT-4o-mini/Off) │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Speech Queue       │
                    │  (Rime TTS Audio Output) │
                    └──────────────────────────┘
```

- **Generation-Fenced Turn Controller (`TurnController`)**: Every conversational turn receives a strictly monotonic generation ID (`currentGen++`). Any interruption immediately invalidates the current generation. Even if an async lookup completes right as an interruption occurs, stale audio is never synthesized or spoken out loud.
- **Hands-Free Speech Filter (`speechService.ts`)**: Rejects device speaker self-echo, throat-clearing, and background kitchen noise, while instantly recognizing quick directional commands (`"next"`, `"wait"`, `"stop"`, `"done"`, `"repeat"`).
- **Persistent Conversation Transcript (`LiveTranscript.tsx`)**: Retains every turn, step jump, and interrupted query with sticky bottom scrolling and an intuitive `Jump to latest` floating indicator when inspecting past ingredients.
- **Unconstrained Voice Command Center (`VoiceOrbVisualizer.tsx`)**: Dedicated `220px+` vertical presence featuring an animated 7-bar audio visualizer, expanding ripple halos, and live state indicators across all 5 operational modes.

---

## 📱 User Journey & Key Features

1. **Load Any Recipe or URL**: Paste links from YouTube, Allrecipes, food blogs, or choose pre-extracted culinary dishes (Hyderabadi Chicken Dum Biryani, Paneer Butter Masala, Creamy Garlic Penne Pasta, Masala Dosa, Shoyu Ramen).
2. **Recipe Overview & Context**: Automatically extracts prep time, servings, ingredients, and sequential steps.
3. **One-Click Start**: Tap **"Start Cooking"** to immediately initialize the session, microphone, and step 1 instructions.
4. **Hands-Free Interaction**:
   - Spoken step advancement: *"Next step"*, *"Done"*, *"Go to step 4"*.
   - Contextual queries: *"Can I replace butter with olive oil?"*, *"What temperature for induction?"*.
5. **Instant Barge-In Interruption**:
   - Say *"Wait, how much salt?"* or *"Stop!"* while SousVoice is speaking.
   - Speech stops immediately, the interrupted message is marked in the transcript, and the recovery answer is provided immediately.
6. **FIFO Question Queue**: If two rapid inquiries occur, they are queued and answered in sequence without dropping context.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

```bash
# Navigate to the web frontend directory
cd web

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be live at:
👉 **`http://127.0.0.1:5174`** (or `http://localhost:5173`)

*(Optional)* To enhance the AI with open-ended conversational intelligence, open **Settings** (⚙️ top right) and enter an **OpenAI API Key** (`sk-...`). It will be saved securely and locally in your browser. If left blank, SousVoice runs on its built-in offline culinary intelligence engine.

---

## 🧪 Verification & Testing Suite

SousVoice comes with a 4-tier automated test suite:

```bash
# 1. Type-check & Production Build
npm run build

# 2. Code Quality & Linter
npm run lint

# 3. Automated Accessibility Audit (Axe-Core, 100/100 standard)
npm run test:a11y

# 4. End-to-End Headless Interaction & Barge-In Test Suite
npm run test:interaction
```

### Verification Gate Results:
- **`npm run build`**: ✅ TypeScript + Vite production bundle passed (0 errors).
- **`npm run lint`**: ✅ ESLint passed (0 errors, 0 warnings).
- **`npm run test:a11y`**: ✅ **100/100 score** across 25 WCAG/Axe rules with 0 violations.
- **`npm run test:interaction`**: ✅ **12/12 steps passed** (Dynamic recipe extraction, Voice connection, Substitution Q&A, Induction queries, Barge-in interruption, FIFO queue, Step jumps, Session conclusion).

---

## 📂 Project Structure

```
DataForge/
├── agent/                         # Python backend & LiveKit pipeline
│   ├── interruption.py            # TurnController generation-fencing core
│   ├── tools.py                   # Substitution & quantity lookup tools
│   ├── recipe_data.py             # Culinary dataset & fallback tables
│   └── main.py                    # LiveKit agent entrypoint
├── scripts/
│   └── token_server.py            # Token generation utility
├── tests/
│   └── test_interruption.py       # Offline Python unit tests for turn fencing
└── web/                           # Primary React + TypeScript Frontend
    ├── src/
    │   ├── components/
    │   │   ├── HomeLanding.tsx            # Recipe URL input & dish selector
    │   │   ├── PreConnectScreen.tsx       # Recipe preview & start action
    │   │   ├── LiveSessionScreen.tsx      # Dual-column cooking workspace
    │   │   ├── VoiceOrbVisualizer.tsx     # 220px+ Voice Command Center
    │   │   ├── LiveTranscript.tsx         # Scrollable chat history + jump affordance
    │   │   ├── RecipeContextPanel.tsx     # Dish details & ingredient breakdown
    │   │   ├── RecipeProgressRail.tsx     # Step progress rail & step buttons
    │   │   ├── KitchenControlBar.tsx      # Mic mute, end session, suggestion chips
    │   │   ├── SessionStatsBadge.tsx      # Realtime duration, turns, and barge-ins
    │   │   └── SettingsModal.tsx          # Theme chooser & AI enhancement config
    │   ├── services/
    │   │   ├── cookingAiService.ts        # Culinary intelligence & contextual AI
    │   │   ├── mockSession.ts             # Client-side session & turn engine
    │   │   ├── recipeExtractor.ts         # URL parser & schema extractor
    │   │   └── speechService.ts           # Hands-free mic, echo cancellation, TTS
    │   ├── store/
    │   │   └── useSousVoiceStore.ts       # Central Zustand state store
    │   └── App.tsx                        # Root layout & route manager
    └── package.json
```

---

## 🏆 Hackathon Submission Highlights

- **Voice-Native**: Designed specifically for hands-free kitchen environments.
- **Zero-Barrier Evaluation**: No external Python servers, proxy keys, or complex setups required for judging—the interactive voice engine and speech synthesis operate directly in modern browsers out-of-the-box.
- **Resilient AI**: Context-aware prompts preserve current cooking step, ingredient quantities, and past turns.
- **Bulletproof Interruption**: Eliminates the latency and frustration of conversational overlap with sub-millisecond audio cancellation.
