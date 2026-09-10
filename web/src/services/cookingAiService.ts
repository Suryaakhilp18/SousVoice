import type { Recipe, TranscriptMessage } from '../types';

/**
 * Intelligent Contextual Cooking Assistant Engine
 * 
 * - Real OpenAI chat completion when VITE_OPENAI_API_KEY is provided
 * - Graceful instant fallback to dynamic culinary knowledge base
 * - Pronoun & short-term conversational context tracking ("it", "this", "that")
 * - Natural continuity bridging back to active step
 */
import { useSousVoiceStore } from '../store/useSousVoiceStore';

export function getOpenAiApiKey(): string {
  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem('sousvoice_openai_api_key');
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  }
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) || '';
}

export function isLiveAiConfigured(): boolean {
  const apiKey = getOpenAiApiKey();
  return Boolean(apiKey && apiKey !== 'changeme');
}

export interface StepNavResult {
  isStepNav: boolean;
  newStep?: number;
  speechText?: string;
}

/**
 * Detects step navigation voice commands and directly updates store step progression.
 */
export function detectAndExecuteStepNavigation(
  question: string,
  currentStep: number,
  recipe: Recipe
): StepNavResult {
  const total = recipe.steps.length;
  const q = question.toLowerCase().trim();
  // Strip punctuation and normalize whitespace
  const cleanQ = q
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const currentLang = useSousVoiceStore.getState().language || 'en';

  // 1. Advance to Next Step (English, Hindi, Telugu)
  const isNext =
    cleanQ === 'next' ||
    cleanQ === 'next step' ||
    cleanQ === 'next please' ||
    cleanQ === 'next step please' ||
    cleanQ === 'continue' ||
    cleanQ === 'move on' ||
    cleanQ === 'proceed' ||
    cleanQ === 'done' ||
    cleanQ === 'done with this' ||
    cleanQ === 'done with step' ||
    cleanQ === 'finished' ||
    cleanQ === 'completed' ||
    cleanQ === 'step completed' ||
    cleanQ === 'ready' ||
    cleanQ === 'ready for next' ||
    cleanQ === 'ready for the next step' ||
    cleanQ === 'i am done' ||
    cleanQ === "i'm done" ||
    cleanQ === 'i am finished' ||
    cleanQ === "i'm finished" ||
    cleanQ === 'i finished' ||
    cleanQ === 'i completed this' ||
    cleanQ.includes('next step') ||
    cleanQ.includes('next please') ||
    cleanQ.includes('what is next') ||
    cleanQ.includes("what's next") ||
    cleanQ.includes('what to do next') ||
    cleanQ.includes('what should i do next') ||
    cleanQ.includes('go to next') ||
    cleanQ.includes('move to next') ||
    cleanQ.includes('ready for next') ||
    cleanQ.includes('done with this step') ||
    cleanQ.includes('finished this step') ||
    cleanQ.includes('finished with this step') ||
    // Hindi
    cleanQ === 'अगला' ||
    cleanQ === 'अगला स्टेप' ||
    cleanQ === 'आगे बढ़ो' ||
    cleanQ === 'आगे' ||
    cleanQ === 'हो गया' ||
    cleanQ === 'पूरा हो गया' ||
    cleanQ === 'तैयार' ||
    cleanQ.includes('अगला स्टेप') ||
    cleanQ.includes('आगे क्या करना') ||
    cleanQ.includes('हो गया') ||
    // Telugu
    cleanQ === 'తరువాత' ||
    cleanQ === 'తరువాతి దశ' ||
    cleanQ === 'ముందుకు' ||
    cleanQ === 'పూర్తయింది' ||
    cleanQ === 'అయిపోయింది' ||
    cleanQ.includes('తరువాతి దశ') ||
    cleanQ.includes('తరువాత ఏమిటి') ||
    cleanQ.includes('పూర్తయింది');

  if (isNext) {
    if (currentStep >= total) {
      const completionText =
        currentLang === 'hi'
          ? `आपने ${recipe.name} के सभी ${total} स्टेप्स पूरे कर लिए हैं! आपकी डिश परोसने के लिए तैयार है।`
          : currentLang === 'te'
          ? `మీరు ${recipe.name} యొక్క అన్ని ${total} దశలను పూర్తి చేశారు! మీ వంటకం సిద్ధంగా ఉంది.`
          : `You have completed all ${total} steps of ${recipe.name}! Your dish is ready to serve. Enjoy your meal!`;

      return {
        isStepNav: true,
        newStep: total,
        speechText: completionText,
      };
    }

    const nextStep = currentStep + 1;
    useSousVoiceStore.getState().setCurrentStep(nextStep);
    useSousVoiceStore.getState().markStepCompleted(currentStep);

    const nextText =
      currentLang === 'hi'
        ? `स्टेप ${nextStep}: ${recipe.steps[nextStep - 1]}`
        : currentLang === 'te'
        ? `దశ ${nextStep}: ${recipe.steps[nextStep - 1]}`
        : `Moving to Step ${nextStep}: ${recipe.steps[nextStep - 1]}`;

    return {
      isStepNav: true,
      newStep: nextStep,
      speechText: nextText,
    };
  }

  // 2. Go to Previous Step
  const isPrev =
    cleanQ === 'previous' ||
    cleanQ === 'previous step' ||
    cleanQ === 'go back' ||
    cleanQ === 'back' ||
    cleanQ === 'last step' ||
    cleanQ.includes('previous step') ||
    cleanQ.includes('go back a step') ||
    cleanQ.includes('what was the previous step') ||
    // Hindi
    cleanQ === 'पिछला' ||
    cleanQ === 'पिछला स्टेप' ||
    cleanQ === 'पीछे' ||
    cleanQ.includes('पिछला स्टेप') ||
    cleanQ.includes('पीछे जाओ') ||
    // Telugu
    cleanQ === 'మునుపటి' ||
    cleanQ === 'మునుపటి దశ' ||
    cleanQ === 'వెనుకకు' ||
    cleanQ.includes('మునుపటి దశ') ||
    cleanQ.includes('వెనుకకు వెళ్ళు');

  if (isPrev) {
    const prevStep = Math.max(1, currentStep - 1);
    useSousVoiceStore.getState().setCurrentStep(prevStep);

    const prevText =
      currentLang === 'hi'
        ? `स्टेप ${prevStep} पर वापस जा रहे हैं: ${recipe.steps[prevStep - 1]}`
        : currentLang === 'te'
        ? `మునుపటి దశ ${prevStep}కి వెళ్తున్నాము: ${recipe.steps[prevStep - 1]}`
        : `Going back to Step ${prevStep}: ${recipe.steps[prevStep - 1]}`;

    return {
      isStepNav: true,
      newStep: prevStep,
      speechText: prevText,
    };
  }

  // 3. Jump to Specific Step (digits or words)
  const wordMap: Record<string, number> = {
    one: 1, first: 1, एक: 1, पहला: 1, ఒకటి: 1, మొదటి: 1,
    two: 2, second: 2, दो: 2, दूसरा: 2, రెండు: 2, రెండవ: 2,
    three: 3, third: 3, तीन: 3, तीसरा: 3, మూడు: 3, మూడవ: 3,
    four: 4, fourth: 4, चार: 4, चौथा: 4, నాలుగు: 4, నాల్గవ: 4,
    five: 5, fifth: 5, पाँच: 5, پانچ: 5, पांचवा: 5, ఐదు: 5, ఐదవ: 5,
    six: 6, sixth: 6, छह: 6, छठा: 6, ఆరు: 6, ఆరవ: 6,
    seven: 7, seventh: 7, सात: 7, सातवां: 7, ఏడు: 7, ఏడవ: 7,
    eight: 8, eighth: 8, आठ: 8, आठवां: 8, ఎనిమిది: 8, ఎనిమిదవ: 8,
    nine: 9, ninth: 9, नौ: 9, नौवां: 9, తొమ్మిది: 9, తొమ్మిదవ: 9,
    ten: 10, tenth: 10, दस: 10, दसवां: 10, పది: 10, పదవ: 10,
  };

  let target: number | null = null;
  const digitMatch = cleanQ.match(/\b(?:step|स्टेप|దశ|go to step|jump to step|move to step)\s*([1-9]|10)\b/i);
  if (digitMatch && digitMatch[1]) {
    target = parseInt(digitMatch[1], 10);
  } else {
    for (const [w, n] of Object.entries(wordMap)) {
      if (
        cleanQ === `step ${w}` ||
        cleanQ.includes(`step ${w}`) ||
        cleanQ.includes(`go to step ${w}`) ||
        cleanQ.includes(`jump to step ${w}`) ||
        cleanQ.includes(`move to step ${w}`) ||
        cleanQ === `${w} step` ||
        cleanQ.includes(`the ${w} step`) ||
        cleanQ === `स्टेप ${w}` ||
        cleanQ.includes(`स्टेप ${w}`) ||
        cleanQ === `దశ ${w}` ||
        cleanQ.includes(`దశ ${w}`)
      ) {
        target = n;
        break;
      }
    }
  }

  if (target !== null && target >= 1 && target <= total) {
    useSousVoiceStore.getState().setCurrentStep(target);
    const jumpText =
      currentLang === 'hi'
        ? `स्टेप ${target}: ${recipe.steps[target - 1]}`
        : currentLang === 'te'
        ? `దశ ${target}: ${recipe.steps[target - 1]}`
        : `Step ${target}: ${recipe.steps[target - 1]}`;

    return {
      isStepNav: true,
      newStep: target,
      speechText: jumpText,
    };
  }

  // 4. Repeat Current Step
  const isRepeat =
    cleanQ === 'repeat' ||
    cleanQ === 'repeat step' ||
    cleanQ === 'say again' ||
    cleanQ === 'say that again' ||
    cleanQ.includes('repeat the step') ||
    cleanQ.includes('repeat that') ||
    cleanQ.includes('read again') ||
    cleanQ.includes('read this step again') ||
    cleanQ.includes('what step are we on') ||
    cleanQ.includes('what is the current step') ||
    cleanQ.includes('what am i doing now') ||
    cleanQ.includes('where are we') ||
    // Hindi
    cleanQ === 'दोबारा' ||
    cleanQ === 'फिर से बोलो' ||
    cleanQ === 'फिर से बताओ' ||
    cleanQ.includes('दोबारा बोलो') ||
    cleanQ.includes('फिर से') ||
    // Telugu
    cleanQ === 'మళ్ళీ చెప్పండి' ||
    cleanQ === 'మరోసారి' ||
    cleanQ.includes('మళ్ళీ చెప్పండి') ||
    cleanQ.includes('మరోసారి చెప్పండి');

  if (isRepeat) {
    const repeatText =
      currentLang === 'hi'
        ? `स्टेप ${currentStep}: ${recipe.steps[currentStep - 1] || recipe.steps[0]}`
        : currentLang === 'te'
        ? `దశ ${currentStep}: ${recipe.steps[currentStep - 1] || recipe.steps[0]}`
        : `Step ${currentStep}: ${recipe.steps[currentStep - 1] || recipe.steps[0]}`;

    return {
      isStepNav: true,
      newStep: currentStep,
      speechText: repeatText,
    };
  }

  return { isStepNav: false };
}

export function isHaltCommand(question: string): boolean {
  const cleanQ = question
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If question contains culinary inquiry keywords, it's an interrupted question, not a pure pause!
  const hasQuestionIntent =
    cleanQ.includes('how much') ||
    cleanQ.includes('how many') ||
    cleanQ.includes('how long') ||
    cleanQ.includes('what') ||
    cleanQ.includes('why') ||
    cleanQ.includes('where') ||
    cleanQ.includes('which') ||
    cleanQ.includes('can i') ||
    cleanQ.includes('substitut') ||
    cleanQ.includes('replace') ||
    cleanQ.includes('salt') ||
    cleanQ.includes('heat') ||
    cleanQ.includes('step') ||
    cleanQ.includes('ingredient');

  if (hasQuestionIntent) return false;

  return (
    cleanQ === 'wait' ||
    cleanQ === 'stop' ||
    cleanQ === 'hold on' ||
    cleanQ === 'pause' ||
    cleanQ === 'pause cooking' ||
    cleanQ === 'wait please' ||
    cleanQ === 'stop please' ||
    cleanQ === 'pause please' ||
    cleanQ === 'hold on please' ||
    cleanQ === 'give me a second' ||
    cleanQ === 'give me a minute' ||
    cleanQ === 'hang on' ||
    cleanQ === 'one second' ||
    cleanQ === 'wait a second' ||
    cleanQ === 'wait a minute' ||
    cleanQ === 'wait a bit' ||
    cleanQ === 'just a second' ||
    cleanQ === 'just a minute'
  );
}

export async function generateContextualAnswer(
  userQuestion: string,
  history: TranscriptMessage[],
  recipe: Recipe,
  currentStepIndex: number = 1,
  wasInterrupted: boolean = false
): Promise<string> {
  let answer = '';
  const apiKey = getOpenAiApiKey();

  // 1. If OpenAI API key is present, attempt live LLM inference with graceful fallback
  if (isLiveAiConfigured()) {
    try {
      const liveAnswer = await callOpenAi(userQuestion, history, recipe, currentStepIndex, apiKey);
      if (liveAnswer) answer = liveAnswer;
    } catch (err) {
      console.warn('Live LLM call failed or timed out, falling back to local reasoning:', err);
    }
  }

  // 2. Offline / Local Cooking Intelligence Engine
  if (!answer) {
    answer = generateLocalContextualAnswer(userQuestion, history, recipe, currentStepIndex);
  }

  // If cook interrupted assistant mid-speech, acknowledge stopping first before delivering answer
  if (wasInterrupted && answer) {
    const lower = answer.toLowerCase();
    if (
      !lower.startsWith('stopping') &&
      !lower.startsWith('paused') &&
      !lower.startsWith('holding') &&
      !lower.startsWith('got it, stopping')
    ) {
      answer = `Stopping right there! ${answer}`;
    }
  }

  return answer;
}

async function callOpenAi(
  question: string,
  history: TranscriptMessage[],
  recipe: Recipe,
  currentStepIndex: number,
  apiKey: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const lang = useSousVoiceStore.getState().language || 'en';
    const langInstruction =
      lang === 'hi'
        ? 'IMPORTANT: You MUST reply entirely in natural, fluent, conversational Hindi (हिंदी). Use clear, authentic culinary Hindi without robot jargon.'
        : lang === 'te'
        ? 'IMPORTANT: You MUST reply entirely in natural, fluent, conversational Telugu (తెలుగు). Use clear, authentic culinary Telugu without robot jargon.'
        : 'Reply in natural, encouraging English suitable for spoken audio.';

    const recentMessages = history.slice(-6).map((m) => ({
      role: m.speaker === 'cook' ? 'user' : 'assistant',
      content: m.text,
    }));

    const systemPrompt = `You are SousVoice, a hands-free culinary voice assistant guiding a cook through the recipe "${recipe.name}" (Yields ${recipe.servings} servings, ${recipe.totalTime || recipe.cookTime || '30 min'}).
Active step: Step ${currentStepIndex} ("${recipe.steps[currentStepIndex - 1] || recipe.steps[0]}").
Ingredients: ${recipe.ingredients.join(', ')}.
Substitutions: ${JSON.stringify(recipe.substitutions || {})}.
Quantities: ${JSON.stringify(recipe.quantities || {})}.
Target Language: ${lang.toUpperCase()}.

Instructions:
1. ${langInstruction}
2. Answer the cook's question concisely in 2 to 3 sentences suitable for speech output.
3. Resolve pronouns like "it", "this", "that" to the ingredient or step previously discussed.
4. If answering a substitution, equipment question, or troubleshooting question, end with a brief bridge back to the current step.
5. Do not invent steps or ingredients not in the recipe. Speak in a friendly, culinary-expert tone.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentMessages,
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 160,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content || null;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

function generateLocalContextualAnswer(
  userQuestion: string,
  history: TranscriptMessage[],
  recipe: Recipe,
  currentStepIndex: number
): string {
  const lang = useSousVoiceStore.getState().language || 'en';
  const q = userQuestion.toLowerCase().trim();
  const rName = recipe.name;
  const steps = recipe.steps;
  const ingredients = recipe.ingredients;
  const activeStepNum = currentStepIndex || 1;
  const activeStepText = steps[activeStepNum - 1] || steps[0];

  // History context
  const lastAgentMsg = [...history].reverse().find((m) => m.speaker === 'agent')?.text.toLowerCase() || '';

  // 0. EXPLICIT STOP / WAIT / PAUSE COMMANDS
  if (isHaltCommand(userQuestion) || q.includes('रुको') || q.includes('आगండి')) {
    if (lang === 'hi') {
      return `बिल्कुल, यहीं रुक रहे हैं! आप आराम से करें, मैंने ऑडियो रोक दिया है। जब आप तैयार हों तो 'अगला स्टेप' कहें।`;
    }
    if (lang === 'te') {
      return `తప్పకుండా, ఇక్కడే ఆగుతున్నాను! ఆడియో ఆపబడింది. మీరు సిద్ధంగా ఉన్నప్పుడు 'తరువాతి దశ' అని చెప్పండి.`;
    }
    return `Stopping right there! Take your time, I'm paused. Let me know when you're ready or ask any question.`;
  }

  // 1. INGREDIENT SUBSTITUTION QUERIES
  if (
    q.includes('substitut') ||
    q.includes('replace') ||
    q.includes('instead of') ||
    q.includes("don't have") ||
    q.includes('dont have') ||
    q.includes('run out of')
  ) {
    // Specific match in recipe substitutions table
    for (const [ing, sub] of Object.entries(recipe.substitutions || {})) {
      if (q.includes(ing.toLowerCase())) {
        return `For ${ing} in ${rName}, you can substitute ${sub}`;
      }
    }

    // Contextual Substitutions: Chicken -> Paneer / Tofu
    if (q.includes('chicken') && (q.includes('paneer') || q.includes('vegetarian') || q.includes('replace'))) {
      return `For chicken in ${rName}, you can substitute Paneer (500g) or firm tofu! Coat the paneer gently with your marinade spices, and cook on low heat for 15 to 20 minutes so the cubes remain tender and juicy.`;
    }

    if (q.includes('paneer') && (q.includes('tofu') || q.includes('vegan'))) {
      return `Yes, extra-firm tofu works as a direct 1:1 substitute for paneer in ${rName}. Press the tofu for 15 minutes to remove excess water, then cube and lightly sear before adding to the gravy.`;
    }

    if (q.includes('buttermilk')) {
      return `For buttermilk, whisk 1 cup of whole milk with 1 tablespoon of fresh lemon juice or white vinegar. Let it rest for 5 minutes until curdled, then use 1:1.`;
    }

    if (q.includes('butter') || q.includes('ghee')) {
      return `You can substitute butter or ghee with an equal amount of neutral cooking oil (such as avocado, sunflower, or canola oil), or melted coconut oil.`;
    }

    if (q.includes('baking powder')) {
      return `For baking powder, substitute 1/4 teaspoon baking soda plus 1/2 teaspoon cream of tartar for every teaspoon of baking powder called for.`;
    }

    if (q.includes('yogurt') || q.includes('curd')) {
      return `For yogurt in ${rName}, substitute with an equal amount of sour cream, unsweetened coconut yogurt, or Greek yogurt thinned with a splash of milk.`;
    }

    if (q.includes('cream')) {
      return `For cream, blend 1/2 cup of soaked raw cashews with 1/2 cup warm water until velvety smooth, or whisk 1 cup whole milk with 1 tablespoon butter and 1 tsp cornstarch.`;
    }

    if (q.includes('egg') || q.includes('eggs')) {
      return `For eggs in this recipe, use 3 tablespoons of aquafaba (chickpea water) whisked until frothy, or 1/4 cup unsweetened applesauce per egg.`;
    }

    if (q.includes('sugar')) {
      return `You can substitute sugar with honey, pure maple syrup, or agave nectar at a 3/4 to 1 ratio, slightly reducing other liquids by 1 tablespoon.`;
    }

    // Generic match against recipe ingredients
    const matchedIng = ingredients.find((i) => q.includes(i.toLowerCase().split(' ')[0]));
    if (matchedIng) {
      return `To substitute ${matchedIng} in ${rName}, use a similar aromatic or mild vegetable, or omit if it's an optional seasoning.`;
    }

    return `For ${rName}, you can substitute with a similar texture ingredient. Let me know which ingredient you're missing and I'll suggest the best ratio!`;
  }

  // 2. COOKING EQUIPMENT & SITUATIONAL: INDUCTION STOVE / OVEN / AIR FRYER
  if (
    q.includes('induction') ||
    q.includes('electric stove') ||
    q.includes('air fryer') ||
    q.includes('oven')
  ) {
    if (q.includes('induction')) {
      return `When cooking ${rName} on an induction cooktop, induction heats the base intensely with no ambient side heat. Use a heavy magnetic pot or an induction diffuser plate. Keep the power setting on medium-low (around 400W–600W or setting 3/10) for gentle simmering and dum to prevent burning the bottom.`;
    }
    if (q.includes('air fryer')) {
      return `For an air fryer with ${rName}, set the temperature 25°F (15°C) lower than standard stovetop or oven temps, and check doneness about 20% earlier.`;
    }
    if (q.includes('oven')) {
      return `To adapt ${rName} for the oven, preheat to 350°F (175°C). Cover your oven-safe Dutch oven tightly with foil and lid, and bake for 30 to 40 minutes.`;
    }
  }

  // 3. TIME / DURATION QUERIES ("How long should I cook this / it?")
  if (
    q.includes('how long') ||
    q.includes('cooking time') ||
    q.includes('cook time') ||
    q.includes('how many minutes') ||
    q.includes('how much time') ||
    q.includes('when to flip')
  ) {
    // Check if active step has time indications
    const timeMatch = activeStepText.match(/\b(\d+(?:\s*to\s*\d+)?\s*(?:minutes?|mins?|seconds?|secs?|hours?))\b/i);
    if (timeMatch && timeMatch[1]) {
      return `For Step ${activeStepNum}, cook for approximately ${timeMatch[1]}. Keep an eye on your heat and look for the step's visual cues!`;
    }

    const cookTime = recipe.cookTime || '20 to 30 minutes';
    const totalTime = recipe.totalTime || '40 minutes';
    return `For ${rName}, the active cooking time is ${cookTime}, with a total recipe time of approximately ${totalTime}.`;
  }

  // 4. QUANTITIES & MEASUREMENTS ("How much salt / butter / rice?")
  if (
    q.includes('how much') ||
    q.includes('quantity') ||
    q.includes('amount') ||
    q.includes('measure') ||
    q.includes('how many')
  ) {
    // Check exact quantities dict first
    for (const [item, qty] of Object.entries(recipe.quantities || {})) {
      if (q.includes(item.toLowerCase())) {
        return `This recipe calls for ${qty} of ${item} for ${recipe.servings} servings.`;
      }
    }

    // Search ingredients list
    const found = ingredients.find((i) => {
      const words = i.toLowerCase().split(' ');
      return words.some((w) => w.length > 3 && q.includes(w));
    });
    if (found) {
      return `The recipe calls for: ${found}.`;
    }

    if (q.includes('salt')) {
      return `This recipe recommends 1 to 2 teaspoons of salt to taste. Season gradually and taste before final simmering.`;
    }

    if (q.includes('garlic')) {
      return `This recipe calls for 1 to 2 tablespoons of freshly minced garlic or paste.`;
    }

    if (q.includes('oil') || q.includes('butter')) {
      return `Use 2 to 3 tablespoons of oil or melted butter for greasing and sautéing.`;
    }

    return `For ${recipe.servings} servings of ${rName}, check the ingredients panel for exact measurements, or ask about any specific item!`;
  }

  // 5. TEMPERATURE & HEAT QUESTIONS ("How hot?", "What temperature?")
  if (
    q.includes('temperature') ||
    q.includes('how hot') ||
    q.includes('what heat') ||
    q.includes('flame') ||
    q.includes('degrees')
  ) {
    if (activeStepText.toLowerCase().includes('medium heat')) {
      return `Keep your stove or griddle on medium heat. A drop of water flicked on the surface should sizzle and evaporate within 2 seconds when it's ready.`;
    }
    if (activeStepText.toLowerCase().includes('low heat') || activeStepText.toLowerCase().includes('dum')) {
      return `Use low heat (or low flame). On induction, use 200W to 400W so the ingredients simmer gently without scorching.`;
    }
    if (activeStepText.toLowerCase().includes('high heat') || activeStepText.toLowerCase().includes('boil')) {
      return `Use medium-high heat to bring liquids to a boil, then immediately reduce as instructed in the step.`;
    }
    return `For ${rName}, maintain medium heat for consistent browning and cooking through without burning.`;
  }

  // 6. CULINARY TECHNIQUE & TEXTURE CUES (Lumps, whisking, consistency)
  if (
    q.includes('lump') ||
    q.includes('whisk') ||
    q.includes('batter') ||
    q.includes('consistency') ||
    q.includes('smooth') ||
    q.includes('bubble')
  ) {
    if (q.includes('lump') || q.includes('smooth') || q.includes('batter')) {
      return `A few lumps in batter are completely fine and expected! Overmixing develops gluten, making pancakes or baked goods dense and rubbery. Stir until dry flour is just moistened.`;
    }
    if (q.includes('bubble')) {
      return `When bubbles form on the surface and the edges look set and matte (about 2 to 3 minutes), that's your cue to slide a spatula underneath and flip!`;
    }
    if (q.includes('whisk')) {
      return `Whisking dry ingredients aerates the flour and evenly distributes the baking powder and salt, ensuring an even rise.`;
    }
  }

  // 7. SPICE & SEASONING ADJUSTMENTS
  if (
    q.includes('less spicy') ||
    q.includes('spiciness') ||
    q.includes('too spicy') ||
    q.includes('mild')
  ) {
    return `To make ${rName} milder, reduce any red chili powder by half and omit fresh green chilies. Adding a spoonful of yogurt, cream, or butter will also mellow the heat.`;
  }

  // 8. TROUBLESHOOTING KITCHEN ACCIDENTS
  if (q.includes('too salty') || q.includes('salty')) {
    return `If it's too salty, peel and drop in a raw potato wedge for 10 minutes to absorb excess salt, or balance with a splash of cream, unsalted milk, or lemon juice.`;
  }
  if (q.includes('undercooked') || q.includes('raw inside') || q.includes('hard rice')) {
    return `If the outside is browning too fast but the center is raw, lower the heat to medium-low and cover with a lid or foil for 3 to 4 minutes to trap steam.`;
  }
  if (q.includes('too thick') || q.includes('too dry')) {
    return `Whisk in 1 to 2 tablespoons of warm milk, water, or broth at a time until the mixture reaches your desired flowing consistency.`;
  }
  if (q.includes('sticking') || q.includes('stuck')) {
    return `If sticking to the pan, ensure your pan is fully preheated before pouring, and apply a thin layer of butter or neutral oil between batches.`;
  }

  // 9. SCALING SERVINGS
  if (q.includes('double') || q.includes('for 6') || q.includes('for 8') || q.includes('halve')) {
    if (q.includes('double') || q.includes('for 6') || q.includes('for 8')) {
      return `To scale ${rName} up from ${recipe.servings} servings, double all ingredients 1:1. Cook in batches rather than overcrowding your pan so heat distributes evenly.`;
    }
    return `To halve ${rName}, divide all ingredient measurements by 2. Cooking times remain about the same, but use a slightly smaller pan to prevent liquid from evaporating too fast.`;
  }

  // 10. PRONOUN RESOLUTION (Contextual)
  if (q.includes('this') || q.includes('that') || q.includes('it')) {
    if (lastAgentMsg.includes('paneer')) {
      return `Regarding the paneer: simmer gently for just 15 to 20 minutes so it absorbs the aromatic gravy while staying soft and melt-in-the-mouth.`;
    }
    if (lastAgentMsg.includes('buttermilk')) {
      return `Regarding the buttermilk: letting it rest with acid for 5 minutes activates the leavening agent for extra fluffiness.`;
    }
    if (lastAgentMsg.includes('induction')) {
      return `On induction cooktops, remember that heating concentrates in the middle, so stir occasionally to distribute heat evenly.`;
    }
    if (lastAgentMsg.includes('salt')) {
      return `Regarding salt: start conservative, as reducing sauces concentrate saltiness naturally as water evaporates.`;
    }
  }

  // 11. INGREDIENTS LIST QUERY
  if (q.includes('ingredient') || q.includes('what do i need') || q.includes('what is needed') || q.includes('सामग्री') || q.includes('పదార్థాలు')) {
    return `${rName} calls for: ${ingredients.join(', ')}. You can tap the Recipe Context drawer above to see every item.`;
  }

  // 12. DYNAMIC MATCH AGAINST RECIPE CONTENT
  // Search the recipe steps for substantive culinary keywords (at least 2 matching words or specific ingredient/action nouns)
  const stopWords = new Set([
    'what', 'when', 'where', 'make', 'cook', 'this', 'that', 'with', 'from', 'have', 'need', 'tell', 'about', 'just', 'some', 'please', 'know', 'doing', 'right', 'there', 'here', 'look', 'good', 'sure', 'yeah', 'okay'
  ]);
  const substantiveWords = q
    .split(/\s+/)
    .map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ''))
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  if (substantiveWords.length >= 2) {
    for (let i = 0; i < steps.length; i++) {
      const stepText = steps[i];
      const stepLower = stepText.toLowerCase();
      const matchCount = substantiveWords.filter((w) => stepLower.includes(w)).length;
      if (matchCount >= 2 || (matchCount >= 1 && substantiveWords.length === 1)) {
        return `Regarding that in Step ${i + 1}: ${stepText}`;
      }
    }
  }

  // 13. CLARIFICATION FALLBACK (Avoid bluff/hallucinated answers on noise)
  // If the query couldn't be matched with high confidence, give a helpful prompt rather than a random guess:
  if (lang === 'hi') {
    return `मुझे आपकी बात पूरी तरह समझ नहीं आई। क्या आप सामग्री, पकाने के समय या तापमान के बारे में पूछना चाहते हैं? या 'अगला स्टेप' बोलें।`;
  }
  if (lang === 'te') {
    return `మీరు చెప్పింది స్పష్టంగా వినపడలేదు. పదార్థాలు, సమయం లేదా తదుపరి దశ గురించి మళ్ళీ అడగండి, లేదా 'తరువాతి దశ' అని చెప్పండి.`;
  }
  return `I didn't quite catch that. You can ask about ingredients, cooking time, heat levels, or say "next step" when you're ready!`;
}
