# 🍳 SousVoice
### AI-Powered Voice Kitchen Companion

> **A voice-native, multilingual AI cooking companion that guides you step-by-step through any recipe, answers contextual culinary questions in real time, scales servings dynamically without limits, and allows instant hands-free interruption (barge-in) across English, Hindi, and Telugu.**

---

## 🚀 Live Demo

[**Launch SousVoice → https://sousvoice.vercel.app/**](https://sousvoice.vercel.app/)

*Experience real-time, hands-free cooking assistance directly in your browser with zero setup required.*

**GitHub Repository**: [https://github.com/Suryaakhilp18/SousVoice](https://github.com/Suryaakhilp18/SousVoice)

---

## ✨ Why SousVoice?

Cooking is a messy, high-cognitive-load physical task. Your hands are covered in flour, oil, or water; timers are ticking, oil is heating, and your attention is divided between the stove and the prep station.

Traditional recipe websites and generic chatbot assistants fail in the kitchen:
- **Screen Dependency**: Unlocking your phone or scrolling a recipe with wet, sticky hands stains devices and interrupts cooking cadence.
- **The Interruption Problem**: If an assistant begins reading a paragraph-long instruction and you quickly need to ask, *"Wait, how much salt?"*, standard chatbots force you to wait for speech to finish or queue your query after the old response.
- **Acoustic Echo & Clatter**: Splattering oil, running taps, exhaust hoods, and the device speaker's own audio create acoustic feedback loops that confuse speech recognition.
- **Loss of Situational Context**: Asking *"Can I use an induction stove for this?"* requires understanding the *active cooking step*, temperature profile, and ingredient states—not just a generic web search.
- **Language & Metric Barriers**: Millions of cooks naturally think and cook in Indian languages (Hindi, Telugu) or need recipes scaled for family gatherings, which static websites fail to provide.

**SousVoice solves this** by pairing hands-free, continuous conversational speech with **sub-millisecond generation-fenced interruption recovery**, **deep multilingual localization**, and **dynamic serving math**, keeping you focused on the stove.

---

## 🎯 What It Does

- **Dynamic Recipe Ingestion**: Paste any URL from major recipe sites or YouTube, or launch one-click culinary standards (*Hyderabadi Chicken Dum Biryani*, *Paneer Butter Masala*, *Creamy Garlic Penne Pasta*, *Crispy Masala Dosa*, *Shoyu Ramen*, *Classic Fluffy Buttermilk Pancakes*).
- **End-to-End Multilingual Support (English, हिन्दी, తెలుగు)**:
  - Select your preferred language from the homepage or switch mid-cooking with **zero cooking state loss**.
  - Localizes recipe titles, ingredients, indexed steps, quantities, and substitutions in natural, home-style culinary Telugu and Hindi.
  - Native browser speech recognition (`te-IN`, `hi-IN`, `en-US`) with Unicode-aware Indic speech filtering (`\p{L}\p{M}\p{N}`).
  - Truthful TTS status indicators: displays `RIME TTS ACTIVE` for English and `HINDI VOICE ACTIVE` / `TELUGU VOICE ACTIVE` for native Indian speech synthesis.
- **Fully Dynamic Serving Scaling (0 to Infinity)**:
  - Real-time, non-destructive serving adjustments with no artificial upper ceiling (cook for 2, 4, 8, 20, or 100+ guests).
  - Proportional scaling across simple measurements, compound ingredients (*"1 tsp red chili powder & 1/2 tsp turmeric"*), quantities dictionaries, and step instruction texts.
- **Synchronized Step-by-Step Guidance**: Tracks active step, completed milestones, and calculated progress percentages in lockstep.
- **Real-Time Hands-Free Voice Control**: Speak step advancements (*"Next step"*, *"Done"*, *"अगला स्टेप"*, *"తరువాతి దశ"*) without touching the screen.
- **Sub-Millisecond Barge-In / Interruption**: Saying *"Wait"*, *"Stop"*, *"रुको"*, *"ఆగండి"*, or asking an urgent question instantly cuts off active audio output and immediately answers your new question.
- **Acoustic Feedback & Echo Cancellation**: Prevents the assistant from hearing its own voice through device speakers, filtering out false triggers and ambient kitchen noise.
- **Persistent Chat Transcript**: Keeps complete multi-turn conversation history accessible with independent scrollback and a floating *"Jump to latest"* shortcut.
- **FIFO Question Queue**: Gracefully handles back-to-back rapid inquiries in sequential order without dropping cooking state.
- **Context-Aware Culinary Intelligence**: Answers substitutions (*"Can I swap chicken for paneer?"*), heat levels (*"What induction setting for dum?"*), timing, and kitchen troubleshooting with conversational memory.
- **Zero-Barrier Dual Architecture**: Runs client-side in the browser via Web Speech & Web Audio APIs, or connects to the Python LiveKit voice agent.

---

## 🧑‍🍳 How It Works

```
 1. LOAD RECIPE          Paste any recipe link or select a preset dish
       │
       ▼
 2. RECIPE NORMALIZATION Prep time, servings, ingredients, and steps extracted
       │
       ▼
 3. START COOKING        Session initializes, microphone opens, Step 1 read aloud
       │
       ▼
 4. HANDS-FREE GUIDANCE  SousVoice tracks active step & listens for inquiries
       │
 ┌─────┴─────────────────────────────────────────────────────────────┐
 │                                                                   │
 ▼                                                                   ▼
[Step Command: "Next step"]                      [Contextual Query: "How much salt?"]
 Advance step, update progress,                   Retrieve recipe + current step context,
 speak step 2 instruction                        synthesize spoken answer
 │                                                                   │
 └──────────────────────────────┬────────────────────────────────────┘
                                │
                  [User Interrupts Mid-Speech: "Wait!"]
                                │
                                ▼
 5. BARGE-IN FENCING     Monotonic generation ID bumped; audio cancelled immediately;
                         stale response pipelines discarded
                                │
                                ▼
 6. RECOVERY ANSWER      Cook's new inquiry answered with full situational memory
                                │
                                ▼
 7. COMPLETE SESSION     Session summary generated with active duration, turns, & barge-ins
```

---

## 🎙️ Voice & Interruption Experience

### Generation-Fenced Turn Controller
The central engineering challenge of real-time voice in conversational AI is **state invalidation**. If a user interrupts while an assistant is speaking or while an AI lookup is in flight, standard async pipelines will complete the old request and speak stale audio over the user's new question.

SousVoice implements a strict **monotonically increasing generation counter** (`TurnController`):
1. When the assistant starts speaking or triggers a lookup, it tags the task with `currentGen`.
2. When the user interrupts (via keyword or VAD barge-in), `currentGen` is immediately incremented (`gen++`), active audio is aborted, and all pending timeouts are cleared.
3. When any asynchronous operation resolves, it checks `if (taskGen === currentGen)`. Stale operations are discarded silently, guaranteeing that **only the cook's latest intent is ever voiced**.

### Voice Command Center States
The UI features a dedicated, unclipped **Voice Command Center (`VoiceOrbVisualizer`)** with distinct real-time states:
- **`Listening` / `Voice Ready`**: Green emerald aura with active microphone monitoring.
- **`Hearing You...`**: Amber halo responding to live mic levels while the cook speaks.
- **`Thinking...`**: Dashed amber spinner indicating prompt resolution.
- **`Speaking (Rime TTS / Telugu Voice / Hindi Voice)`**: Glowing terracotta hero banner with 7 live bouncing waveform frequency bars and concentric soundwave rings. Truthful status badge reflects the active speech engine.
- **`Interrupted!`**: Crimson alert badge signaling that stale speech was successfully fenced.

---

## 🌐 Multilingual & Scaling Architecture

### 1. Unified Recipe Localization Pipeline
- Located in `src/services/recipeLocalization.ts` and `src/services/localization.ts`.
- Complete natural translations for top global and Indian recipes (Pancakes, Hyderabadi Biryani, Paneer Butter Masala, Penne Pasta, Masala Dosa, Ramen, Pizza, Fried Rice, Tacos, Salmon).
- Preserves numerical measurements, units, cooking temperatures, and times while delivering authentic, conversational phrasing.
- Generic fallback translator (`localizeGenericText`) automatically normalizes procedurally extracted URLs.

### 2. Indic Speech Recognition & Echo Filtering
- Standard ASCII regex (`[^\w\s]`) strips Indian script vowel signs (matras) and characters, causing browser STT to misclassify genuine speech as silence or echo.
- SousVoice uses Unicode-aware property escapes:
  ```ts
  incomingText.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').trim();
  ```
- Dynamic language switching restarts the continuous speech recognition instance with the correct BCP-47 locale (`te-IN`, `hi-IN`, `en-US`) without requiring a page reload or microphone toggle.

### 3. Dynamic Serving Scaler
- Located in `src/services/ingredientScaler.ts`.
- Proportional scaling algorithm calculates exact quantities for any serving target:
  $$\text{scaledQty} = \text{baseQty} \times \frac{\text{targetServings}}{\text{baseServings}}$$
- Formats vulgar fractions ($1/2$, $1/4$, $3/4$), metric units ($g$, $kg$, $ml$, $l$), and imperial units ($tsp$, $tbsp$, $cups$).
- Handles compound ingredients connected with `&` or `and` seamlessly.

---

## 🏗️ System Architecture

```
                      ┌─────────────────────────────────┐
                      │        COOK'S HARDWARE          │
                      │  (Microphone & Device Speaker)  │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │    SousVoice Web Client (Vite)  │
                      │   https://sousvoice.vercel.app  │
                      └────────────────┬────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                     │
            ▼ (Client-Side Real-Time Path)                        ▼ (Server Agent Path)
┌──────────────────────────────────────┐              ┌─────────────────────────┐
│     Client Speech & AI Engine        │              │   Flask Token Server    │
│  - Web Speech API (STT & TTS)        │              │  (scripts/token_server) │
│  - Indic Unicode VAD & Echo Filter   │              └────────────┬────────────┘
│  - In-Browser Generation Fencing     │                           │
│  - Multilingual AI (EN / HI / TE)    │                           ▼
│  - Dynamic Serving Scaler (0 to ∞)   │              ┌─────────────────────────┐
└──────────────────────────────────────┘              │  LiveKit WebRTC Cloud   │
                                                      └────────────┬────────────┘
                                                                   │
                                                      ┌────────────┴────────────┐
                                                      ▼                         ▼
                                             ┌─────────────────┐       ┌────────────────┐
                                             │ Deepgram (STT)  │       │   Rime (TTS)   │
                                             │     nova-3      │       │     mistv2     │
                                             └────────┬────────┘       └────────────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  OpenAI (LLM)   │
                                             │   gpt-4o-mini   │
                                             └─────────────────┘
```

---

## 🧩 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript 5.9, Vite 6 | Snappy single-page application with high-performance rendering |
| **State Management** | Zustand | Centralized reactive store for cooking session, transcript, servings, and language |
| **Styling & UI** | Tailwind CSS, Framer Motion | Smooth layout animations, fluid waveform visuals, and dark/light kitchen themes |
| **Accessibility** | Axe-Core, WCAG 2.1 AA | 100/100 accessibility audit score across 25 verified rules |
| **Multilingual Voice** | Web Speech API, Web Audio API | Multilingual STT (`te-IN`, `hi-IN`, `en-US`), speech synthesis, volume analyser |
| **Cloud Agent** | LiveKit Agents Python SDK | Real-time WebRTC room orchestration and VAD turn management |
| **Speech-to-Text (STT)** | Deepgram (`nova-3`) | Low-latency streaming speech recognition |
| **Text-to-Speech (TTS)** | Rime AI (`mistv2`) & Native TTS | Expressive spoken culinary audio with truthful UI engine reporting |
| **LLM Orchestration** | OpenAI GPT-4o-mini | Cooking step understanding, ingredient substitution, unit math, multilingual Q&A |
| **Hosting & CI/CD** | Vercel | Instant global deployment with automated build validation |

---

## 📁 Repository Structure

```
SousVoice/
├── agent/                         # LiveKit Python Agent (Backend)
│   ├── interruption.py            # TurnController generation-fencing core
│   ├── tools.py                   # Substitution & quantity lookup tools
│   ├── recipe_data.py             # Culinary dataset & fallback tables
│   └── main.py                    # LiveKit agent entrypoint (Deepgram + OpenAI + Rime)
├── scripts/
│   └── token_server.py            # Flask token server for LiveKit room minting
├── tests/
│   └── test_interruption.py       # Offline Python unit tests for turn fencing
├── web/                           # Production Web Client (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomeLanding.tsx            # URL extractor, preset dish selector & language picker
│   │   │   ├── PreConnectScreen.tsx       # Recipe summary, serving scaler & Start Cooking CTA
│   │   │   ├── LiveSessionScreen.tsx      # Dual-column responsive workspace
│   │   │   ├── VoiceOrbVisualizer.tsx     # 220px+ Voice Command Center, waveforms & truthful TTS status
│   │   │   ├── LiveTranscript.tsx         # Scrollable chat history with jump affordance
│   │   │   ├── RecipeContextPanel.tsx     # Dish details, scaled ingredients & substitutions
│   │   │   ├── RecipeProgressRail.tsx     # Interactive step progress rail
│   │   │   ├── KitchenControlBar.tsx      # Mic toggle, end cooking, quick inquiry chips
│   │   │   ├── SessionStatsBadge.tsx      # Realtime duration, turns, and barge-in counters
│   │   │   ├── ConnectingScreen.tsx       # Localized connecting state screen
│   │   │   └── SettingsModal.tsx          # Display theme, language & AI enhancement settings
│   │   ├── services/
│   │   │   ├── cookingAiService.ts        # Multilingual contextual AI prompting & offline fallback engine
│   │   │   ├── ingredientScaler.ts        # Fully dynamic recipe serving scaler
│   │   │   ├── localization.ts            # UI translation dictionary (en, hi, te)
│   │   │   ├── mockSession.ts             # Client-side session & turn engine
│   │   │   ├── recipeExtractor.ts         # Schema.org JSON-LD & YouTube recipe scraper
│   │   │   ├── recipeLocalization.ts      # Complete natural recipe content translations
│   │   │   └── speechService.ts           # Indic Unicode STT, echo cancellation, TTS voice selector
│   │   ├── store/
│   │   │   └── useSousVoiceStore.ts       # Central Zustand state store (single source of truth)
│   │   └── App.tsx                        # Main shell & modal manager
│   ├── test-a11y.js                       # Headless axe-core accessibility audit
│   ├── test-interaction.js                # Headless 16-step interaction, multilingual & scaling test
│   └── package.json
├── requirements.txt               # Python backend dependencies
└── README.md                      # Project documentation
```

---

## ⚙️ Local Development Setup

### 1. Web Application (Client)

The web frontend operates completely standalone in browser mode with full voice interaction:

```bash
# Clone repository
git clone https://github.com/Suryaakhilp18/SousVoice.git
cd SousVoice/web

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open your browser at **`http://localhost:5173`** (or `http://127.0.0.1:5174`).

### 2. Optional: LiveKit Backend Agent

To run the Python LiveKit agent with Deepgram and Rime:

```bash
# From project root
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, RIME_API_KEY, OPENAI_API_KEY, DEEPGRAM_API_KEY

# Start token server
python scripts/token_server.py

# In a separate terminal, launch the agent worker
python -m agent.main dev
```

---

## 🧪 Verification & Quality Assurance

Every release runs through strict verification gates:

```bash
cd web

# 1. Type Check & Production Build
npm run build

# 2. Code Quality & Linting
npm run lint

# 3. Accessibility Compliance (Axe-Core, 100/100)
npm run test:a11y

# 4. End-to-End Headless Interaction, Multilingual & Barge-In Suite
npm run test:interaction
```

### Verified Test Results
- **TypeScript & Vite Build**: Passed cleanly in 10.4s (0 errors, 0 warnings).
- **ESLint**: Passed cleanly.
- **Accessibility**: **100/100** score across 25 rules (0 violations).
- **Interactive Test Suite**: **16/16 steps verified**:
  1. Initial home screen load & language initialization
  2. Dynamic recipe parsing (Biryani, Pasta, Ramen, Dosa, Paneer, Pancakes)
  3. Session connection & Step 1 greeting
  4. Ingredient substitution inquiry (*"Can I replace chicken with paneer?"*)
  5. Equipment setting inquiry (*"What if I am using an induction stove?"*)
  6. Mid-speech barge-in interruption (*"Wait! How much salt again?"*)
  7. Turn fencing & recovery answer generation
  8. FIFO inquiry queue processing (sequential rapid questions without state loss)
  9. Next-step advancement (*"Next step"*, *"Done."*)
  10. Direct step jumps (*"Go to step four"*) with preceding step completion tracking
  11. Session conclusion & performance metrics summary
  12. YouTube URL extraction resilience (prevents generic "Watch" title)
  13. Dynamic serving scaling (proportional ingredient scaling for 8 and 2 servings)
  14. **Telugu Multilingual Pipeline**: localized title, steps, ingredients, Telugu AI response to *"ఉప్పు ఎంత వేయాలి?"*, and Telugu step navigation (*"తరువాతి దశ"*)
  15. **Hindi Multilingual Pipeline**: localized title, steps, ingredients, and Hindi AI response to *"कितना नमक डालना है?"*
  16. **Indic Unicode Echo Filter**: verified Telugu and Hindi speech are never stripped into whitespace or rejected as echo

---

## 🔒 Security & Privacy

- **No Server Audio Storage**: Voice streams are processed in memory and never permanently stored or recorded to disk.
- **Local API Key Storage**: Optional user-provided OpenAI API keys are held exclusively in browser `localStorage` and sent directly to the AI provider—never routed to third-party tracking servers.
- **Explicit Mic Teardown**: Ending a cooking session or navigating away instantly releases all `MediaStreamTrack` audio hardware and closes audio contexts, preventing background microphone listening.

---

## 🔮 Roadmap & Future Improvements

- **Multimodal Computer Vision**: Integrating camera feeds to inspect doneness (e.g., *"Is this onion translucent yet?"*, *"Are these bubbles ready for flipping?"*).
- **Smart Timer Synthesis**: Automatic detection of temporal instructions (*"Simmer for 15 minutes"*) with voice-controlled concurrent kitchen timers.
- **Additional Regional Languages & Dialects**: Expanding to Tamil, Kannada, Bengali, and Spanish.
- **Hardware Foot Pedal Integration**: Bluetooth kitchen pedal support for commercial kitchen stations.

---

## 👥 Authors & Acknowledgments

- **Lead Developer**: Surya Akhil P ([@Suryaakhilp18](https://github.com/Suryaakhilp18))
- **LiveKit Agents**: Real-time WebRTC room transport & audio orchestration.
- **Rime AI**: Natural, low-latency streaming speech synthesis.
- **Deepgram**: Speech-to-text transcription engine.
- **OpenAI**: Conversational reasoning and recipe context comprehension.

---

*Built with passion for home cooks, busy chefs, and seamless voice-native AI.*
