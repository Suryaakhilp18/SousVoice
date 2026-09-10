import { useSousVoiceStore } from '../store/useSousVoiceStore';
import { cancelSpeech, speakText, startMicrophone, stopMicrophone, isSpeakingOutLoud } from './speechService';
import { generateContextualAnswer, detectAndExecuteStepNavigation } from './cookingAiService';

let activeTimers: ReturnType<typeof setTimeout>[] = [];
let durationInterval: ReturnType<typeof setInterval>[] = [];
let currentGen = 0;
let isProcessingAnswer = false;
let pendingQuestions: string[] = [];

// Noise debounce timer for VAD
let vadSustainedTimer: ReturnType<typeof setTimeout> | null = null;

const clearAllTimers = () => {
  activeTimers.forEach((t) => clearTimeout(t));
  activeTimers = [];
  if (vadSustainedTimer) {
    clearTimeout(vadSustainedTimer);
    vadSustainedTimer = null;
  }
};

let lastInterruptedTimestamp = 0;

export const startMockSession = async (): Promise<void> => {
  const store = useSousVoiceStore.getState();
  const currentRecipe = store.recipe;

  currentGen++;
  store.setError(null);
  store.setScreen('connecting');
  clearAllTimers();
  cancelSpeech();
  pendingQuestions = [];
  isProcessingAnswer = false;
  lastInterruptedTimestamp = 0;

  const connectTimer = setTimeout(async () => {
    store.setScreen('live');
    store.setVoiceState('idle');

    durationInterval.forEach((i) => clearInterval(i));
    durationInterval = [];
    const durTimer = setInterval(() => {
      useSousVoiceStore.getState().tickDuration();
    }, 1000);
    if (typeof (durTimer as any)?.unref === 'function') {
      (durTimer as any).unref();
    }
    durationInterval.push(durTimer);

    // Request microphone & setup real-time VAD + streaming speech recognition
    await startMicrophone(
      (level) => {
        store.setMicLevel(level);
      },
      (text) => {
        handleCookMessage(text);
      },
      (_interim) => {
        const currentStore = useSousVoiceStore.getState();
        const isSpeaking = currentStore.voiceState === 'speaking' || isSpeakingOutLoud();
        const trimmed = _interim.trim().toLowerCase();

        if (isSpeaking && trimmed.length > 0) {
          // Explicit interrupt keywords fire immediately (no sustain needed)
          const isExplicit =
            trimmed.startsWith('wait') ||
            trimmed.startsWith('stop') ||
            trimmed.startsWith('hold') ||
            trimmed.startsWith('pause') ||
            trimmed.includes('wait!') ||
            trimmed.includes('stop!') ||
            trimmed.startsWith('रुको') ||
            trimmed.startsWith('रुकिए') ||
            trimmed.startsWith('आగు') ||
            trimmed.startsWith('ఆగండి');

          if (isExplicit) {
            if (vadSustainedTimer) {
              clearTimeout(vadSustainedTimer);
              vadSustainedTimer = null;
            }
            triggerInterruption('explicit-stop');
            return;
          }

          // VAD barge-in: require at least 4 meaningful words (≥3 chars each)
          // AND sustain the speech for 500ms before committing — prevents speaker audio echo,
          // ambient noise, or accidental coughs from interrupting the assistant.
          const meaningfulWords = trimmed
            .split(/\s+/)
            .filter((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').length >= 3);

          if (meaningfulWords.length >= 4) {
            if (!vadSustainedTimer) {
              vadSustainedTimer = setTimeout(() => {
                vadSustainedTimer = null;
                // Re-check: still speaking and still enough content?
                const s = useSousVoiceStore.getState();
                if (s.voiceState === 'speaking' || isSpeakingOutLoud()) {
                  triggerInterruption('vad');
                }
              }, 500);
            }
          } else {
            // Not enough words yet — cancel any pending VAD timer
            if (vadSustainedTimer) {
              clearTimeout(vadSustainedTimer);
              vadSustainedTimer = null;
            }
          }
        } else {
          // Assistant is not speaking — cancel any leftover VAD timer
          if (vadSustainedTimer) {
            clearTimeout(vadSustainedTimer);
            vadSustainedTimer = null;
          }
          if (
            trimmed.length > 0 &&
            currentStore.voiceState !== 'user-speaking' &&
            currentStore.voiceState !== 'interrupted'
          ) {
            useSousVoiceStore.getState().setVoiceState('user-speaking');
          }
        }
      }
    );

    // Initial Greeting & Step 1 based on currently loaded recipe and language
    const gen = ++currentGen;
    const lang = store.language || 'en';
    const greetingText =
      lang === 'hi'
        ? `सॉस-वॉइस में आपका स्वागत है! हम ${currentRecipe.servings} लोगों के लिए ${currentRecipe.name} बना रहे हैं। स्टेप 1: ${currentRecipe.steps[0]}`
        : lang === 'te'
        ? `సాస్‌వాయిస్‌కి స్వాగతం! మనం ${currentRecipe.servings} మంది కోసం ${currentRecipe.name} తయారుచేస్తున్నాము. దశ 1: ${currentRecipe.steps[0]}`
        : `Welcome to SousVoice! We're making ${currentRecipe.name} for ${currentRecipe.servings} servings. Step 1: ${currentRecipe.steps[0]}`;

    store.setVoiceState('speaking');
    store.addTranscriptMessage({
      id: `agent-greet-${Date.now()}`,
      speaker: 'agent',
      text: greetingText,
      timestamp: Date.now(),
      isFinal: true,
      interrupted: false,
    });

    speakText(greetingText, () => {
      if (currentGen === gen) {
        useSousVoiceStore.getState().setVoiceState('listening');
        processNextQueuedQuestion();
      }
    }, lang);
  }, 400);

  activeTimers.push(connectTimer);
};

/**
 * Trigger an interruption:
 * Genuine interruption clears the FIFO queue, cuts audio instantly, and bumps the generation counter.
 */
export const triggerInterruption = (reason: 'vad' | 'explicit-stop' = 'vad'): void => {
  const store = useSousVoiceStore.getState();
  currentGen++;
  clearAllTimers();
  cancelSpeech();
  isProcessingAnswer = false;
  lastInterruptedTimestamp = Date.now();

  // Genuine interruption cancels pending follow-ups
  pendingQuestions = [];

  store.markInterrupted(undefined, reason);

  const settleTimer = setTimeout(() => {
    if (useSousVoiceStore.getState().voiceState === 'interrupted') {
      useSousVoiceStore.getState().setVoiceState('listening');
      processNextQueuedQuestion();
    }
  }, 350);
  activeTimers.push(settleTimer);
};

export const handleCookMessage = async (text: string): Promise<void> => {
  if (!text.trim()) return;

  const store = useSousVoiceStore.getState();
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const isSpeaking = store.voiceState === 'speaking' || isSpeakingOutLoud();
  const wasRecentlyInterrupted =
    store.voiceState === 'interrupted' || Date.now() - lastInterruptedTimestamp < 3500;

  const isExplicit =
    lower.startsWith('wait') ||
    lower.startsWith('stop') ||
    lower.startsWith('hold on') ||
    lower.startsWith('pause') ||
    lower.includes('wait!') ||
    lower.includes('stop!');

  // 1. If cook speaks while assistant is speaking, this is a genuine barge-in interruption!
  // Stop speaking immediately, cancel pending stale work, bump generation, mark interrupted.
  if (isSpeaking) {
    currentGen++;
    const gen = currentGen;
    clearAllTimers();
    cancelSpeech();
    isProcessingAnswer = false;
    pendingQuestions = [];
    lastInterruptedTimestamp = Date.now();

    // Mark interrupted immediately in store (records reason & increments counter)
    store.markInterrupted(undefined, isExplicit ? 'explicit-stop' : 'vad');

    // Add interrupting cook message to transcript
    store.addTranscriptMessage({
      id: `cook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker: 'cook',
      text: trimmed,
      timestamp: Date.now(),
      isFinal: true,
      queued: false,
    });

    // Hold 'interrupted' state for 250ms so orb visualizer & Cook see the transition,
    // then smoothly transition to thinking and deliver the recovery answer with interruption acknowledged
    const recoveryTimer = setTimeout(async () => {
      if (currentGen === gen) {
        await executeAnswerGeneration(trimmed, gen, true);
      }
    }, 250);
    activeTimers.push(recoveryTimer);
    return;
  }

  // 2. If an answer is currently in flight (computing/reasoning),
  // queue subsequent questions into FIFO queue rather than dropping or corrupting in-flight state!
  if (isProcessingAnswer) {
    pendingQuestions.push(trimmed);

    // Add to transcript with queued: true
    store.addTranscriptMessage({
      id: `cook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker: 'cook',
      text: trimmed,
      timestamp: Date.now(),
      isFinal: true,
      queued: true,
    });
    return;
  }

  // 3. Normal question flow when listening/idle:
  await answerQuestion(trimmed, wasRecentlyInterrupted || isExplicit);
};

async function answerQuestion(text: string, wasInterrupted: boolean = false): Promise<void> {
  const store = useSousVoiceStore.getState();
  const gen = ++currentGen;

  // Find if this question was already in transcript as queued, and un-queue it
  const existingQueued = store.transcript.find(
    (m) => m.speaker === 'cook' && m.text === text && m.queued
  );
  if (existingQueued) {
    store.updateTranscriptMessage(existingQueued.id, { queued: false });
  } else {
    store.addTranscriptMessage({
      id: `cook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker: 'cook',
      text,
      timestamp: Date.now(),
      isFinal: true,
      queued: false,
    });
  }

  await executeAnswerGeneration(text, gen, wasInterrupted);
}

async function executeAnswerGeneration(text: string, gen: number, wasInterrupted: boolean = false): Promise<void> {
  lastInterruptedTimestamp = 0;
  const store = useSousVoiceStore.getState();
  const currentRecipe = store.recipe;
  const currentStep = store.currentStep;

  // Check step navigation first (updates store.currentStep immediately)
  const navResult = detectAndExecuteStepNavigation(text, currentStep, currentRecipe);

  isProcessingAnswer = true;
  store.setVoiceState('thinking');

  try {
    let replyText =
      navResult.isStepNav && navResult.speechText
        ? navResult.speechText
        : await generateContextualAnswer(
            text,
            store.transcript,
            currentRecipe,
            useSousVoiceStore.getState().currentStep,
            wasInterrupted
          );

    if (wasInterrupted && navResult.isStepNav && navResult.speechText) {
      replyText = `Stopping right there! ${replyText}`;
    }

    if (gen !== currentGen) {
      // Discarded by newer barge-in interruption
      return;
    }

    isProcessingAnswer = false;
    store.setVoiceState('speaking');
    store.addTranscriptMessage({
      id: `agent-resp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      speaker: 'agent',
      text: replyText,
      timestamp: Date.now(),
      isFinal: true,
      interrupted: false,
    });

    speakText(replyText, () => {
      if (currentGen === gen) {
        useSousVoiceStore.getState().setVoiceState('listening');
        // Check FIFO queue for next question
        processNextQueuedQuestion();
      }
    }, store.language || 'en');
  } catch (err) {
    console.error('Cooking AI error:', err);
    isProcessingAnswer = false;
    if (gen === currentGen) {
      store.setVoiceState('listening');
      processNextQueuedQuestion();
    }
  }
}

function processNextQueuedQuestion(): void {
  if (pendingQuestions.length > 0 && !isProcessingAnswer) {
    const nextQuestion = pendingQuestions.shift();
    if (nextQuestion) {
      answerQuestion(nextQuestion);
    }
  }
}

export const endMockSession = (): void => {
  clearAllTimers();
  cancelSpeech();
  stopMicrophone(); // Completely stop browser mic tracks
  pendingQuestions = [];
  isProcessingAnswer = false;

  durationInterval.forEach((i) => clearInterval(i));
  durationInterval = [];

  const store = useSousVoiceStore.getState();
  store.setMicLevel(0);
  store.setVoiceState('idle');
  store.setScreen('ended');
};

export const replayInterruptionTestSequence = async (): Promise<void> => {
  await startMockSession();

  setTimeout(() => {
    handleCookMessage('What can I substitute for buttermilk?');

    setTimeout(() => {
      handleCookMessage('Wait! How much salt again?');
    }, 900);
  }, 1200);
};
