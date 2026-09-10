import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      ...dom.window.navigator,
      mediaDevices: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => {} }],
          active: true,
        }),
      },
    },
    configurable: true,
    writable: true,
  });
} catch {}

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Shim Web Speech API in Node.js for automated interaction tests
let activeSpeakTimeout = null;
global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
  }
};
global.window.speechSynthesis = {
  speak: (utterance) => {
    if (activeSpeakTimeout) clearTimeout(activeSpeakTimeout);
    activeSpeakTimeout = setTimeout(() => {
      utterance.onend?.();
      activeSpeakTimeout = null;
    }, 450);
  },
  cancel: () => {
    if (activeSpeakTimeout) {
      clearTimeout(activeSpeakTimeout);
      activeSpeakTimeout = null;
    }
  },
  resume: () => {},
  getVoices: () => [],
};

import { startMockSession, handleCookMessage, endMockSession } from './src/services/mockSession.ts';
import { useSousVoiceStore } from './src/store/useSousVoiceStore.ts';
import { POPULAR_RECIPES } from './src/data/recipe.ts';
import { extractRecipeFromUrl } from './src/services/recipeExtractor.ts';

// Self-verification script for Dynamic Recipe Ingestion, Conversational Memory, and Interruption
async function runInteractionVerification() {
  console.log('--- STARTING SOUSVOICE MULTI-RECIPE & CONTEXTUAL AI VERIFICATION ---');

  const store = useSousVoiceStore.getState();

  // 1. Initial State Check (Home screen with dynamic recipe selection)
  console.log(`[Step 1] Initial screen: ${store.screen} (Expected: home)`);
  if (store.screen !== 'home') throw new Error('Initial screen mismatch');

  // 2. Select Dynamic Recipe (Hyderabadi Biryani)
  console.log('[Step 2] Dynamically loading Chicken Biryani recipe...');
  store.clearRecipeAndSession(POPULAR_RECIPES.biryani);
  store.setScreen('pre-connect');
  console.log(`[Step 2] Loaded recipe: ${useSousVoiceStore.getState().recipe.name}`);

  // 3. Start Voice Session
  console.log('[Step 3] Triggering startMockSession()...');
  startMockSession();

  const connectState = useSousVoiceStore.getState().screen;
  console.log(`[Step 3] Screen during connect: ${connectState} (Expected: connecting)`);
  if (connectState !== 'connecting') throw new Error('Connecting state mismatch');

  // Wait for connection to resolve and greeting to start speaking
  await new Promise((r) => setTimeout(r, 600));

  const liveState = useSousVoiceStore.getState().screen;
  const voiceState = useSousVoiceStore.getState().voiceState;
  const transcript = useSousVoiceStore.getState().transcript;

  console.log(`[Step 4] Screen after connect: ${liveState} (Expected: live)`);
  console.log(`[Step 4] Voice state: ${voiceState} (Expected: speaking)`);
  console.log(`[Step 4] Initial Greeting: "${transcript[0]?.text.slice(0, 60)}..."`);

  if (liveState !== 'live') throw new Error('Live screen mismatch');
  if (voiceState !== 'speaking') throw new Error('Expected voice state to be speaking initial greeting');
  if (transcript.length === 0) throw new Error('Transcript missing initial greeting');

  // 4. Test Substitution Query: Chicken -> Paneer (Dynamic Contextual AI)
  console.log('[Step 5] Cook asks: "Can I replace chicken with paneer?"');
  handleCookMessage('Can I replace chicken with paneer?');

  await new Promise((r) => setTimeout(r, 550));
  const subReply = useSousVoiceStore.getState().transcript.slice(-1)[0]?.text;
  console.log(`[Step 5] AI Response: "${subReply.slice(0, 80)}..."`);
  if (!subReply.toLowerCase().includes('paneer')) throw new Error('AI response did not reference paneer context');

  // 5. Test Follow-up Question with Conversational Memory: Induction Stove
  console.log('[Step 6] Follow-up Question: "What if I am using an induction stove?"');
  handleCookMessage('What if I am using an induction stove?');

  await new Promise((r) => setTimeout(r, 550));
  const inductionReply = useSousVoiceStore.getState().transcript.slice(-1)[0]?.text;
  console.log(`[Step 6] AI Response: "${inductionReply.slice(0, 80)}..."`);
  if (!inductionReply.toLowerCase().includes('induction')) throw new Error('AI response did not understand induction question');

  // 6. Test Barge-In Interruption Mid-Flight
  // Currently speaking the induction response; cook interrupts!
  console.log('[Step 7] Testing Barge-in: Interrupting mid-speech with "Wait! How much salt again?"');
  handleCookMessage('Wait! How much salt again?');

  const interruptedState = useSousVoiceStore.getState().voiceState;
  const stats = useSousVoiceStore.getState().stats;
  console.log(`[Step 7] Voice state on barge-in: ${interruptedState} (Expected: interrupted)`);
  console.log(`[Step 7] Fenced Interruption count: ${stats.interruptedCount} (Expected: >= 1)`);
  if (interruptedState !== 'interrupted') throw new Error('Interrupted voice state mismatch');
  if (stats.interruptedCount < 1) throw new Error('Stats counter failed to record fenced interruption');

  // Wait for recovery response
  await new Promise((r) => setTimeout(r, 850));
  const saltReply = useSousVoiceStore.getState().transcript.slice(-1)[0]?.text;
  console.log(`[Step 8] AI Recovery Answer: "${saltReply.slice(0, 60)}..."`);

  // 7. Test FIFO Queue: Fire two back-to-back sequential questions without delay
  console.log('[Step 9] Testing FIFO Queue: Firing two sequential questions back-to-back...');
  // Allow salt speech to finish playing and return to listening
  await new Promise((r) => setTimeout(r, 500));

  console.log(' -> Firing Question A: "Can I replace butter with oil?"');
  handleCookMessage('Can I replace butter with oil?');
  console.log(' -> Immediately Firing Question B: "How much garlic?"');
  handleCookMessage('How much garlic?');

  // Verify Question B is queued
  const currentTranscript = useSousVoiceStore.getState().transcript;
  const queuedMsg = currentTranscript.find((m) => m.speaker === 'cook' && m.text === 'How much garlic?');
  console.log(`[Step 9] Question B queued flag: ${queuedMsg?.queued} (Expected: true)`);
  if (!queuedMsg || !queuedMsg.queued) {
    throw new Error('Expected Question B to be queued in FIFO queue');
  }

  // Wait for Question A and Question B to process in sequence
  await new Promise((r) => setTimeout(r, 1300));

  const afterQueueTranscript = useSousVoiceStore.getState().transcript;
  const agentReplies = afterQueueTranscript.filter((m) => m.speaker === 'agent').map((m) => m.text.toLowerCase());
  const hasOilReply = agentReplies.some((r) => r.includes('oil') || r.includes('butter'));
  const hasGarlicReply = agentReplies.some((r) => r.includes('garlic'));

  console.log(`[Step 9] Oil answer present: ${hasOilReply}`);
  console.log(`[Step 9] Garlic answer present: ${hasGarlicReply}`);

  if (!hasOilReply || !hasGarlicReply) {
    throw new Error('FIFO Queue failed: Sequential question was silently swallowed or dropped!');
  }

  // 8. Test Step Navigation: Cook asks "Next step"
  console.log('[Step 10] Testing Step Navigation: Cook asks "Next step"...');
  handleCookMessage('Next step');

  await new Promise((r) => setTimeout(r, 600));
  const activeStep = useSousVoiceStore.getState().currentStep;
  const nextStepReply = useSousVoiceStore.getState().transcript.slice(-1)[0]?.text;
  console.log(`[Step 10] Advanced active step: ${activeStep} (Expected: 2)`);
  console.log(`[Step 10] Step 2 Response: "${nextStepReply?.slice(0, 60)}..."`);

  if (activeStep !== 2) throw new Error(`Expected currentStep to be 2, got ${activeStep}`);
  if (!nextStepReply.includes('Step 2')) throw new Error('Expected response to mention Step 2');

  // 8b. Test Step Navigation with trailing punctuation: "Done."
  console.log('[Step 10b] Testing Step Navigation with trailing punctuation: "Done."...');
  handleCookMessage('Done.');
  await new Promise((r) => setTimeout(r, 600));
  const stepAfterDone = useSousVoiceStore.getState().currentStep;
  console.log(`[Step 10b] Step after "Done.": ${stepAfterDone} (Expected: 3)`);
  if (stepAfterDone !== 3) throw new Error(`Expected currentStep to be 3 after "Done.", got ${stepAfterDone}`);

  // 8c. Test Step Navigation with number word: "Go to step four"
  console.log('[Step 10c] Testing Step Jump with number word: "Go to step four"...');
  handleCookMessage('Go to step four');
  await new Promise((r) => setTimeout(r, 600));
  const stepAfterWord = useSousVoiceStore.getState().currentStep;
  const completed = useSousVoiceStore.getState().completedSteps;
  console.log(`[Step 10c] Step after "Go to step four": ${stepAfterWord} (Expected: 4)`);
  console.log(`[Step 10c] Completed steps: [${completed.join(', ')}] (Expected to contain 1, 2, 3)`);
  if (stepAfterWord !== 4) throw new Error(`Expected currentStep to be 4, got ${stepAfterWord}`);
  if (!completed.includes(1) || !completed.includes(2) || !completed.includes(3)) {
    throw new Error('Preceding steps were not marked completed on step advance');
  }

  // 9. End Session
  console.log('[Step 11] Ending session...');
  endMockSession();

  const endedScreen = useSousVoiceStore.getState().screen;
  console.log(`[Step 11] Screen after ending: ${endedScreen} (Expected: ended)`);
  if (endedScreen !== 'ended') throw new Error('Ended screen mismatch');

  // 10. Test YouTube URL Extraction: Must never be "Watch"
  console.log('[Step 12] Testing YouTube URL extraction resilience...');
  const ytResult = await extractRecipeFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  console.log(`[Step 12] Extracted YouTube Recipe Name: "${ytResult.name}"`);
  if (ytResult.name.toLowerCase() === 'watch') {
    throw new Error('Critical bug: Extracted recipe name is "Watch"');
  }
  if (!ytResult.steps || ytResult.steps.length === 0) {
    throw new Error('Extracted recipe has no cooking steps');
  }

  // 11. Test Serving Scaling: Check ingredients, quantities dict, and step instructions update
  console.log('[Step 13] Testing Serving Scaling Dynamics...');
  const { setServings } = useSousVoiceStore.getState();
  // Double servings from 4 to 8
  setServings(8);
  const scaledRecipe8 = useSousVoiceStore.getState().recipe;
  console.log(`[Step 13] Scaled servings: ${scaledRecipe8.servings} (Expected: 8)`);
  if (scaledRecipe8.servings !== 8) throw new Error('Servings not updated to 8');
  
  // Chicken was 500g in base (4 servings), at 8 it should be 1000g or 1kg
  const chickenIng = scaledRecipe8.ingredients.find((i) => i.toLowerCase().includes('chicken'));
  console.log(`[Step 13] Scaled chicken ingredient: "${chickenIng}"`);
  if (!chickenIng || (!chickenIng.includes('1000g') && !chickenIng.includes('1kg'))) {
    throw new Error('Chicken ingredient quantity was not scaled properly for 8 servings');
  }

  // Check quantities dictionary was scaled
  const chickenQty = scaledRecipe8.quantities?.chicken;
  console.log(`[Step 13] Scaled chicken quantity in dict: "${chickenQty}"`);
  if (!chickenQty || (!chickenQty.includes('1000g') && !chickenQty.includes('1kg'))) {
    throw new Error('recipe.quantities dictionary was not scaled for 8 servings');
  }

  // Compound ingredients: "1 tsp red chili powder & 1/2 tsp turmeric" scaled by 2 => "2 tsp red chili powder & 1 tsp turmeric"
  const spiceIng = scaledRecipe8.ingredients.find((i) => i.includes('red chili powder'));
  console.log(`[Step 13] Scaled compound spice: "${spiceIng}"`);
  if (!spiceIng || !spiceIng.includes('2 tsp red chili powder') || !spiceIng.includes('1 tsp turmeric')) {
    throw new Error('Compound ingredient with & was not scaled properly');
  }

  // Scale down to 2 servings (half of 4)
  setServings(2);
  const scaledRecipe2 = useSousVoiceStore.getState().recipe;
  const chickenQty2 = scaledRecipe2.quantities?.chicken;
  console.log(`[Step 13] Scaled chicken for 2 servings: "${chickenQty2}"`);
  if (!chickenQty2 || !chickenQty2.includes('250g')) {
    throw new Error('recipe.quantities not scaled down properly for 2 servings');
  }

  console.log('--- ALL MULTI-RECIPE, CONTEXTUAL AI, STEP PROGRESSION, BARGE-IN & FIFO QUEUE CHECKS PASSED (100% VERIFIED) ---');
}

runInteractionVerification()
  .then(() => {
    setTimeout(() => {
      process.exit(0);
    }, 150);
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
