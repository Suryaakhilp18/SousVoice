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
    const lang = useSousVoiceStore.getState().language || 'en';
    const lower = answer.toLowerCase();
    const interruptPrefix =
      lang === 'hi'
        ? 'रुकिए! '
        : lang === 'te'
        ? 'ఆగండి! '
        : 'Stopping right there! ';

    if (
      !lower.startsWith('stopping') &&
      !lower.startsWith('paused') &&
      !lower.startsWith('holding') &&
      !lower.startsWith('got it, stopping') &&
      !lower.startsWith('रुकिए') &&
      !lower.startsWith('ఆగండి')
    ) {
      answer = `${interruptPrefix}${answer}`;
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
    q.includes('run out of') ||
    q.includes('बदले') ||
    q.includes('जगह') ||
    q.includes('नहीं है') ||
    q.includes('బదులుగా') ||
    q.includes('మార్చవచ్చా') ||
    q.includes('లేకపోతే')
  ) {
    // Specific match in recipe substitutions table
    for (const [ing, sub] of Object.entries(recipe.substitutions || {})) {
      if (q.includes(ing.toLowerCase())) {
        if (lang === 'hi') return `${rName} में ${ing} के बदले आप ${sub} का उपयोग कर सकते हैं।`;
        if (lang === 'te') return `${rName} లో ${ing} కు బదులుగా మీరు ${sub} ఉపయోగించవచ్చు.`;
        return `For ${ing} in ${rName}, you can substitute ${sub}`;
      }
    }

    // Contextual Substitutions: Chicken -> Paneer / Tofu
    if (
      q.includes('chicken') ||
      q.includes('चिकन') ||
      q.includes('చికెన్') ||
      ((q.includes('paneer') || q.includes('पनीर') || q.includes('పనీర్')) && (q.includes('substitut') || q.includes('replace') || q.includes('बदले') || q.includes('బదులుగా')))
    ) {
      if (lang === 'hi') {
        return `${rName} में चिकन की जगह आप 500 ग्राम पनीर या फर्म टोफू डाल सकते हैं! पनीर को मैरिनेड मसालों में लपेटें और धीमी आंच पर 15 से 20 मिनट पकाएं ताकि पनीर एकदम रसीला और मुलायम रहे।`;
      }
      if (lang === 'te') {
        return `${rName} లో చికెన్‌కు బదులుగా 500 గ్రాముల పనీర్ లేదా గట్టి టోఫు వాడవచ్చు! పనీర్ ముక్కలను మసాలాలో నెమ్మదిగా కలిపి, తక్కువ మంటపై 15 నుండి 20 నిమిషాలు ఉడికిస్తే ముక్కలు మృదువుగా ఉంటాయి.`;
      }
      return `For chicken in ${rName}, you can substitute Paneer (500g) or firm tofu! Coat the paneer gently with your marinade spices, and cook on low heat for 15 to 20 minutes so the cubes remain tender and juicy.`;
    }

    if (q.includes('paneer') && (q.includes('tofu') || q.includes('vegan'))) {
      if (lang === 'hi') {
        return `हां, ${rName} में पनीर की जगह आप फर्म टोफू 1:1 अनुपात में इस्तेमाल कर सकते हैं। टोफू का अतिरिक्त पानी निकाल लें और हल्का सा सेककर ग्रेवी में मिलाएं।`;
      }
      if (lang === 'te') {
        return `అవును, ${rName} లో పనీర్‌కు బదులుగా టోఫు వాడవచ్చు. టోఫులోని నీటిని పిండేసి, చిన్న ముక్కలుగా కోసి లైట్‌గా వేయించి గ్రేవీలో కలపండి.`;
      }
      return `Yes, extra-firm tofu works as a direct 1:1 substitute for paneer in ${rName}. Press the tofu for 15 minutes to remove excess water, then cube and lightly sear before adding to the gravy.`;
    }

    if (q.includes('buttermilk') || q.includes('छाछ') || q.includes('మజ్జిగ')) {
      if (lang === 'hi') {
        return `बटरमिल्क (छाछ) के लिए 1 कप दूध में 1 चम्मच नींबू का रस या सिरका मिलाएं। 5 मिनट रहने दें और फिर 1:1 अनुपात में इस्तेमाल करें।`;
      }
      if (lang === 'te') {
        return `మజ్జిగ కోసం 1 కప్పు పాలలో 1 టేబుల్ స్పూన్ నిమ్మరసం లేదా వెనిగర్ కలిపి 5 నిమిషాలు పక్కన పెట్టండి, అది విరిగిన తర్వాత వాడండి.`;
      }
      return `For buttermilk, whisk 1 cup of whole milk with 1 tablespoon of fresh lemon juice or white vinegar. Let it rest for 5 minutes until curdled, then use 1:1.`;
    }

    if (q.includes('butter') || q.includes('ghee') || q.includes('घी') || q.includes('మక్ఖన్') || q.includes('వెన్న') || q.includes('నెయ్యి')) {
      if (lang === 'hi') {
        return `मक्खन या घी के बदले आप उतनी ही मात्रा में तेल (सनफ्लावर या कनोला) या पिघला हुआ नारियल तेल इस्तेमाल कर सकते हैं।`;
      }
      if (lang === 'te') {
        return `వెన్న లేదా నెయ్యికి బదులుగా సమాన పరిమాణంలో వంట నూనె లేదా కొబ్బరి నూనెను ఉపయోగించవచ్చు.`;
      }
      return `You can substitute butter or ghee with an equal amount of neutral cooking oil (such as avocado, sunflower, or canola oil), or melted coconut oil.`;
    }

    if (q.includes('baking powder')) {
      if (lang === 'hi') {
        return `बेकिंग पाउडर के बदले हर एक चम्मच के लिए 1/4 चम्मच बेकिंग सोडा और 1/2 चम्मच क्रीम ऑफ टार्टर का उपयोग करें।`;
      }
      if (lang === 'te') {
        return `బేకింగ్ పౌడర్‌కు బదులుగా 1/4 టీస్పూన్ బేకింగ్ సోడా మరియు 1/2 టీస్పూన్ నిమ్మరసం లేదా టార్టార్ ఉపయోగించవచ్చు.`;
      }
      return `For baking powder, substitute 1/4 teaspoon baking soda plus 1/2 teaspoon cream of tartar for every teaspoon of baking powder called for.`;
    }

    if (q.includes('yogurt') || q.includes('curd') || q.includes('दही') || q.includes('పెరుగు')) {
      if (lang === 'hi') {
        return `दही (yogurt) के बदले आप उतनी ही मात्रा में मलाई (sour cream) या थोड़ा दूध मिलाकर गाढ़ा ग्रीक योगर्ट इस्तेमाल कर सकते हैं।`;
      }
      if (lang === 'te') {
        return `పెరుగుకు బదులుగా పుల్లటి క్రీమ్ లేదా కొద్దిగా పాలు కలిపిన చిక్కటి పెరుగును ఉపయోగించవచ్చు.`;
      }
      return `For yogurt in ${rName}, substitute with an equal amount of sour cream, unsweetened coconut yogurt, or Greek yogurt thinned with a splash of milk.`;
    }

    if (q.includes('sugar') || q.includes('चीनी') || q.includes('చక్కెర') || q.includes('పంచదార')) {
      if (lang === 'hi') {
        return `चीनी के बदले आप 3/4 अनुपात में शहद, मेपल सिरप या गुड़ का उपयोग कर सकते हैं।`;
      }
      if (lang === 'te') {
        return `చక్కెరకు బదులుగా 3/4 నిష్పత్తిలో తేనె లేదా బెల్లం ఉపయోగించవచ్చు.`;
      }
      return `You can substitute sugar with honey, pure maple syrup, or agave nectar at a 3/4 to 1 ratio, slightly reducing other liquids by 1 tablespoon.`;
    }

    // Generic match against recipe ingredients
    const matchedIng = ingredients.find((i) => q.includes(i.toLowerCase().split(' ')[0]));
    if (matchedIng) {
      if (lang === 'hi') return `${rName} में ${matchedIng} के बदले कोई समान सामग्री प्रयोग करें, या इसे छोड़ भी सकते हैं।`;
      if (lang === 'te') return `${rName} లో ${matchedIng} కు బదులుగా సారూప్యమైన పదార్థాన్ని ఉపయోగించండి లేదా ఐచ్ఛికమైతే వదిలివేయండి.`;
      return `To substitute ${matchedIng} in ${rName}, use a similar aromatic or mild vegetable, or omit if it's an optional seasoning.`;
    }

    if (lang === 'hi') return `${rName} में आप समान बनावट वाली सामग्री से बदल सकते हैं। बताइए कौन सी सामग्री कम है, मैं सही विकल्प बताऊंगा!`;
    if (lang === 'te') return `${rName} లో మీరు ఇలాంటి పదార్థాన్ని మార్చవచ్చు. ఏ పదార్థం లేదో చెబితే సరైన కొలత చెబుతాను!`;
    return `For ${rName}, you can substitute with a similar texture ingredient. Let me know which ingredient you're missing and I'll suggest the best ratio!`;
  }

  // 2. COOKING EQUIPMENT & SITUATIONAL: INDUCTION STOVE / OVEN / AIR FRYER
  if (
    q.includes('induction') ||
    q.includes('electric stove') ||
    q.includes('air fryer') ||
    q.includes('oven') ||
    q.includes('इंडक्शन') ||
    q.includes('इन्डक्शन') ||
    q.includes('ఇండక్షన్')
  ) {
    if (q.includes('induction') || q.includes('इंडक्शन') || q.includes('इन्डक्शन') || q.includes('ఇండక్షన్')) {
      if (lang === 'hi') {
        return `इंडक्शन पर ${rName} बनाते समय बेस बहुत तेज़ी से गर्म होता है। भारी तले के बर्तन का उपयोग करें और आंच को मध्यम-धीमी (400W–600W) पर रखें ताकि अवांछित रूप से नीचे से जले नहीं।`;
      }
      if (lang === 'te') {
        return `ఇండక్షన్ పొయ్యిపై ${rName} వండేటప్పుడు, వేడి నేరుగా అడుగు భాగంలో ఎక్కువ ఉంటుంది. మందపాటి గిన్నె వాడండి మరియు అడుగంటకుండా మంటను 400W–600W (మీడియం-తక్కువ) లో ఉంచండి.`;
      }
      return `When cooking ${rName} on an induction cooktop, induction heats the base intensely with no ambient side heat. Use a heavy magnetic pot or an induction diffuser plate. Keep the power setting on medium-low (around 400W–600W or setting 3/10) for gentle simmering and dum to prevent burning the bottom.`;
    }
    if (q.includes('air fryer')) {
      if (lang === 'hi') return `एयर फ्रायर में ${rName} के लिए तापमान सामान्य से 15°C कम रखें और 20% पहले ही जांच लें।`;
      if (lang === 'te') return `ఎయిర్ ఫ్రైయర్‌లో ${rName} కోసం సాధారణం కంటే 15°C తక్కువ ఉష్ణోగ్రత వద్ద ఉంచి, ముందే ఒకసారి తనిఖీ చేయండి.`;
      return `For an air fryer with ${rName}, set the temperature 25°F (15°C) lower than standard stovetop or oven temps, and check doneness about 20% earlier.`;
    }
    if (q.includes('oven')) {
      if (lang === 'hi') return `ओवन में ${rName} के लिए 175°C (350°F) पर प्रीहीट करें, बर्तन को अच्छे से ढककर 30 से 40 मिनट तक बेक करें।`;
      if (lang === 'te') return `ఓవెన్‌లో ${rName} కోసం 175°C వద్ద ప్రీహీట్ చేసి, గిన్నెను మూతతో గట్టిగా మూసి 30 నుండి 40 నిమిషాలు బేక్ చేయండి.`;
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
    q.includes('when to flip') ||
    q.includes('సమయం') ||
    q.includes('ఎంత సేపు') ||
    q.includes('कितना समय') ||
    q.includes('पकाने का समय')
  ) {
    const timeMatch = activeStepText.match(/\b(\d+(?:\s*to\s*\d+)?\s*(?:minutes?|mins?|seconds?|secs?|hours?|నిమిషాలు|मिनट))\b/i);
    if (timeMatch && timeMatch[1]) {
      if (lang === 'hi') {
        return `स्टेप ${activeStepNum} के लिए लगभग ${timeMatch[1]} तक पकाएं। आंच पर नज़र रखें और निर्देशानुसार संकेत देखें!`;
      }
      if (lang === 'te') {
        return `దశ ${activeStepNum} కోసం సుమారు ${timeMatch[1]} పాటు ఉడికించండి. మంటను గమనిస్తూ ఉండండి!`;
      }
      return `For Step ${activeStepNum}, cook for approximately ${timeMatch[1]}. Keep an eye on your heat and look for the step's visual cues!`;
    }

    const cookTime = recipe.cookTime || '20 to 30 minutes';
    const totalTime = recipe.totalTime || '40 minutes';
    if (lang === 'hi') {
      return `${rName} के लिए पकाने का समय लगभग ${cookTime} है, और कुल समय लगभग ${totalTime} लगेगा।`;
    }
    if (lang === 'te') {
      return `${rName} కోసం పకానా సమయం సుమారు ${cookTime}, మరియు మొత్తం సమయం సుమారు ${totalTime}.`;
    }
    return `For ${rName}, the active cooking time is ${cookTime}, with a total recipe time of approximately ${totalTime}.`;
  }

  // 4. QUANTITIES & MEASUREMENTS ("How much salt / butter / rice?")
  if (
    q.includes('how much') ||
    q.includes('quantity') ||
    q.includes('amount') ||
    q.includes('measure') ||
    q.includes('how many') ||
    q.includes('ఎంత') ||
    q.includes('కొలత') ||
    q.includes('పరిమాణం') ||
    q.includes('कितना') ||
    q.includes('कितनी') ||
    q.includes('मात्रा') ||
    q.includes('salt') ||
    q.includes('नमक') ||
    q.includes('ఉప్పు') ||
    q.includes('garlic') ||
    q.includes('लहसुन') ||
    q.includes('వెల్లుల్లి')
  ) {
    // Check exact quantities dict first
    for (const [item, qty] of Object.entries(recipe.quantities || {})) {
      if (q.includes(item.toLowerCase())) {
        if (lang === 'hi') return `इस रेसिपी में ${recipe.servings} लोगों के लिए ${item} की मात्रा ${qty} है।`;
        if (lang === 'te') return `ఈ రెసిపీలో ${recipe.servings} మందికి ${item} పరిమాణం ${qty}.`;
        return `This recipe calls for ${qty} of ${item} for ${recipe.servings} servings.`;
      }
    }

    if (q.includes('salt') || q.includes('नमक') || q.includes('ఉప్పు')) {
      if (lang === 'hi') {
        return `इस रेसिपी में स्वादानुसार 1 से 2 छोटी चम्मच नमक डालने की सलाह दी जाती है। थोड़ा-थोड़ा करके डालें और चख लें।`;
      }
      if (lang === 'te') {
        return `ఈ రెసిపీలో రుచికి సరిపడా 1 నుండి 2 టీస్పూన్లు ఉప్పు వేయాలి. కొద్దికొద్దిగా వేసి రుచి చూసుకోండి.`;
      }
      return `This recipe recommends 1 to 2 teaspoons of salt to taste. Season gradually and taste before final simmering.`;
    }

    if (q.includes('garlic') || q.includes('लहसुन') || q.includes('వెల్లుల్లి')) {
      if (lang === 'hi') {
        return `इस रेसिपी में 1 से 2 बड़े चम्मच अदरक-लहसुन का पेस्ट चाहिए।`;
      }
      if (lang === 'te') {
        return `ఈ రెసిపీకి 1 నుండి 2 టేబుల్ స్పూన్లు అల్లం వెల్లుల్లి పేస్ట్ అవసరం.`;
      }
      return `This recipe calls for 1 to 2 tablespoons of freshly minced garlic or paste.`;
    }

    if (q.includes('oil') || q.includes('butter') || q.includes('तेल') || q.includes('मक्खन') || q.includes('నెయ్యి') || q.includes('నూనె')) {
      if (lang === 'hi') {
        return `सब्जियां भूनने या तड़के के लिए 2 से 3 बड़े चम्मच तेल या मक्खन का प्रयोग करें।`;
      }
      if (lang === 'te') {
        return `వేయించడానికి మరియు కలపడానికి 2 నుండి 3 టేబుల్ స్పూన్లు నూనె లేదా వెన్న ఉపయోగించండి.`;
      }
      return `Use 2 to 3 tablespoons of oil or melted butter for greasing and sautéing.`;
    }

    // Search ingredients list
    const found = ingredients.find((i) => {
      const words = i.toLowerCase().split(' ');
      return words.some((w) => w.length > 3 && q.includes(w));
    });
    if (found) {
      if (lang === 'hi') return `रेसिपी के अनुसार: ${found}।`;
      if (lang === 'te') return `రెసిపీ ప్రకారం: ${found}.`;
      return `The recipe calls for: ${found}.`;
    }

    if (lang === 'hi') {
      return `${recipe.servings} लोगों के लिए सटीक माप रेसिपी पैनल में देखें, या किसी विशेष सामग्री के बारे में पूछें!`;
    }
    if (lang === 'te') {
      return `${recipe.servings} మందికి ఖచ్చితమైన కొలతలు రెసిపీ ప్యానెల్‌లో చూడండి, లేదా నిర్దిష్ట పదార్థం గురించి అడగండి!`;
    }
    return `For ${recipe.servings} servings of ${rName}, check the ingredients panel for exact measurements, or ask about any specific item!`;
  }

  // 5. TEMPERATURE & HEAT QUESTIONS ("How hot?", "What temperature?")
  if (
    q.includes('temperature') ||
    q.includes('how hot') ||
    q.includes('what heat') ||
    q.includes('flame') ||
    q.includes('degrees') ||
    q.includes('మంట') ||
    q.includes('వేడి') ||
    q.includes('ఆంచ్') ||
    q.includes('आंच') ||
    q.includes('तापमान')
  ) {
    if (activeStepText.toLowerCase().includes('medium heat') || activeStepText.includes('మీడియం') || activeStepText.includes('मध्यम')) {
      if (lang === 'hi') {
        return `आंच को मध्यम (मीडियम) रखें। पैन पर पानी की बूंद छिड़कने पर वह 2 सेकंड में छनछनाकर उड़नी चाहिए।`;
      }
      if (lang === 'te') {
        return `స్టవ్ లేదా పాన్‌ను మీడియం మంటపై ఉంచండి. నీటి చుక్క వేస్తే 2 సెకన్లలో ఆవిరైపోవాలి.`;
      }
      return `Keep your stove or griddle on medium heat. A drop of water flicked on the surface should sizzle and evaporate within 2 seconds when it's ready.`;
    }
    if (activeStepText.toLowerCase().includes('low heat') || activeStepText.toLowerCase().includes('dum') || activeStepText.includes('धीमी') || activeStepText.includes('సన్నని')) {
      if (lang === 'hi') {
        return `धीमी आंच (दम के लिए) का प्रयोग करें। इंडक्शन पर 200W से 400W रखें ताकि नीचे से जले नहीं।`;
      }
      if (lang === 'te') {
        return `సన్నని మంట (సిమ్) పై ఉంచండి. ఇండక్షన్‌లో అయితే 200W నుండి 400W మధ్య ఉంచండి.`;
      }
      return `Use low heat (or low flame). On induction, use 200W to 400W so the ingredients simmer gently without scorching.`;
    }
    if (activeStepText.toLowerCase().includes('high heat') || activeStepText.toLowerCase().includes('boil') || activeStepText.includes('तेज़') || activeStepText.includes('ఎక్కువ')) {
      if (lang === 'hi') {
        return `उबालने के लिए मध्यम-तेज़ आंच रखें, फिर निर्देशानुसार तुरंत कम कर दें।`;
      }
      if (lang === 'te') {
        return `మరిగించడానికి మంటను కాస్త ఎక్కువ చేసి, మరిగిన వెంటనే తగ్గించండి.`;
      }
      return `Use medium-high heat to bring liquids to a boil, then immediately reduce as instructed in the step.`;
    }

    if (lang === 'hi') return `${rName} के लिए सही रंग और पकने के लिए मध्यम आंच बनाए रखें।`;
    if (lang === 'te') return `${rName} కోసం సరైన రంగు మరియు సమానంగా ఉడకడానికి మీడియం మంటను ఉంచండి.`;
    return `For ${rName}, maintain medium heat for consistent browning and cooking through without burning.`;
  }

  // 6. CULINARY TECHNIQUE & TEXTURE CUES (Lumps, whisking, consistency)
  if (
    q.includes('lump') ||
    q.includes('whisk') ||
    q.includes('batter') ||
    q.includes('consistency') ||
    q.includes('smooth') ||
    q.includes('bubble') ||
    q.includes('ఉండలు') ||
    q.includes('గాంఠ్') ||
    q.includes('బుడగలు')
  ) {
    if (q.includes('lump') || q.includes('smooth') || q.includes('batter') || q.includes('ఉండలు') || q.includes('గాంఠ్')) {
      if (lang === 'hi') {
        return `बैटर में हल्की गांठें (lumps) रहना बिल्कुल सामान्य है! ज्यादा फेंटने से बनावट सख्त हो जाती है। बस सूखा आटा गीला होने तक ही मिलाएं।`;
      }
      if (lang === 'te') {
        return `పిండి మిశ్రమంలో చిన్న చిన్న ఉండలు ఉన్నా పర్వాలేదు! ఎక్కువగా కలిపితే గట్టిగా వస్తాయి. పిండి తడిసేంత వరకు మాత్రమే కలపండి.`;
      }
      return `A few lumps in batter are completely fine and expected! Overmixing develops gluten, making pancakes or baked goods dense and rubbery. Stir until dry flour is just moistened.`;
    }
    if (q.includes('bubble') || q.includes('బుడగలు')) {
      if (lang === 'hi') {
        return `जब सतह पर बुलबुले बनने लगें और किनारे सूखे दिखने लगें (2 से 3 मिनट), तब पलटने का सही समय है!`;
      }
      if (lang === 'te') {
        return `పైభాగంలో బుడగలు వచ్చి అంచులు వేగినట్లు కనిపించినప్పుడు (2-3 నిమిషాల్లో), తిప్పి రెండో వైపు కాల్చండి!`;
      }
      return `When bubbles form on the surface and the edges look set and matte (about 2 to 3 minutes), that's your cue to slide a spatula underneath and flip!`;
    }
    if (q.includes('whisk')) {
      if (lang === 'hi') return `सूखी सामग्री को फेंटने से बेकिंग पाउडर और नमक समान रूप से मिल जाते हैं।`;
      if (lang === 'te') return `పొడి పదార్థాలను కలపడం వల్ల బేకింగ్ పౌడర్ మరియు ఉప్పు సమానంగా కలుస్తాయి.`;
      return `Whisking dry ingredients aerates the flour and evenly distributes the baking powder and salt, ensuring an even rise.`;
    }
  }

  // 7. SPICE & SEASONING ADJUSTMENTS
  if (
    q.includes('less spicy') ||
    q.includes('spiciness') ||
    q.includes('too spicy') ||
    q.includes('mild') ||
    q.includes('కారం') ||
    q.includes('తీపి') ||
    q.includes('तीखा') ||
    q.includes('मिर्च')
  ) {
    if (lang === 'hi') {
      return `${rName} को कम तीखा बनाने के लिए लाल मिर्च पाउडर आधा कर दें और हरी मिर्च न डालें। थोड़ा दही या मक्खन मिलाने से भी तीखापन कम हो जाता है।`;
    }
    if (lang === 'te') {
      return `${rName} కారం తగ్గించడానికి కారం పొడిని సగానికి తగ్గించండి మరియు పచ్చిమిర్చి వేయకండి. కొద్దిగా పెరుగు లేదా వెన్న కలిపితే కారం తగ్గుతుంది.`;
    }
    return `To make ${rName} milder, reduce any red chili powder by half and omit fresh green chilies. Adding a spoonful of yogurt, cream, or butter will also mellow the heat.`;
  }

  // 8. TROUBLESHOOTING KITCHEN ACCIDENTS
  if (
    q.includes('too salty') ||
    q.includes('salty') ||
    q.includes('ఉప్పగా') ||
    q.includes('ఎక్కువ ఉప్పు') ||
    q.includes('ज्यादा नमक') ||
    q.includes('नमकीन')
  ) {
    if (lang === 'hi') {
      return `अगर नमक ज्यादा हो गया है, तो एक कच्चा आलू छीलकर 10 मिनट के लिए डाल दें, वह अतिरिक्त नमक सोख लेगा। या थोड़ा क्रीम, दूध या नींबू का रस मिला लें।`;
    }
    if (lang === 'te') {
      return `ఉప్పు ఎక్కువైతే, ఒక పచ్చి బంగాళాదుంప ముక్కను 10 నిమిషాలు వేసి ఉంచండి, అది అదనపు ఉప్పును పీల్చుకుంటుంది. లేదా కొద్దిగా పాలు, క్రీమ్ లేదా నిమ్మరసం కలపండి.`;
    }
    return `If it's too salty, peel and drop in a raw potato wedge for 10 minutes to absorb excess salt, or balance with a splash of cream, unsalted milk, or lemon juice.`;
  }

  if (
    q.includes('sticking') ||
    q.includes('stuck') ||
    q.includes('అంటుకుంటుంది') ||
    q.includes('चिपक')
  ) {
    if (lang === 'hi') {
      return `अगर चिपक रहा है, तो सुनिश्चित करें कि पैन अच्छे से गर्म हो और हर बार थोड़ा तेल या घी लगाएं।`;
    }
    if (lang === 'te') {
      return `పాన్‌కు అంటుకుంటుంటే, పాన్ బాగా వేడెక్కిన తర్వాతే వేయండి మరియు ప్రతిసారీ కొద్దిగా నూనె లేదా వెన్న రాయండి.`;
    }
    return `If sticking to the pan, ensure your pan is fully preheated before pouring, and apply a thin layer of butter or neutral oil between batches.`;
  }

  if (q.includes('undercooked') || q.includes('raw inside') || q.includes('hard rice') || q.includes('కచ్చా')) {
    if (lang === 'hi') return `अगर बाहर से पक गया है पर अंदर से कच्चा है, तो आंच धीमी करें और ढक्कन लगाकर 3 से 4 मिनट भाप में पकने दें।`;
    if (lang === 'te') return `లోపల పచ్చిగా ఉంటే, మంటను తగ్గించి మూతపెట్టి 3 నుండి 4 నిమిషాలు ఆవిరిపై ఉడకనివ్వండి.`;
    return `If the outside is browning too fast but the center is raw, lower the heat to medium-low and cover with a lid or foil for 3 to 4 minutes to trap steam.`;
  }

  if (q.includes('too thick') || q.includes('too dry') || q.includes('చిక్కగా') || q.includes('गाढ़ा')) {
    if (lang === 'hi') return `मिश्रण में 1 से 2 चम्मच गुनगुना दूध या पानी मिलाएं जब तक सही गाढ़ापन न आ जाए।`;
    if (lang === 'te') return `సరైన స్థితి వచ్చేవరకు 1 లేదా 2 టేబుల్ స్పూన్లు గోరువెచ్చని పాలు లేదా నీరు కలపండి.`;
    return `Whisk in 1 to 2 tablespoons of warm milk, water, or broth at a time until the mixture reaches your desired flowing consistency.`;
  }

  // 9. SCALING SERVINGS
  if (q.includes('double') || q.includes('for 6') || q.includes('for 8') || q.includes('halve') || q.includes('డబుల్') || q.includes('दोगुना')) {
    if (lang === 'hi') {
      return `${rName} को ${recipe.servings} लोगों के लिए सामग्री की मात्रा के अनुसार आसानी से बनाया जा सकता है। सामग्री को एक साथ ठूंसने के बजाय बैचों में पकाएं।`;
    }
    if (lang === 'te') {
      return `${rName} ను ${recipe.servings} మందికి తగినట్లుగా పదార్థాల కొలతలు స్వయంచాలకంగా లెక్కించబడతాయి. ఒకేసారి కాకుండా బ్యాచ్‌లుగా వండండి.`;
    }
    return `To scale ${rName} up from ${recipe.servings} servings, double all ingredients 1:1. Cook in batches rather than overcrowding your pan so heat distributes evenly.`;
  }

  // 10. PRONOUN RESOLUTION (Contextual)
  if (q.includes('this') || q.includes('that') || q.includes('it') || q.includes('ఇది') || q.includes('యహ్') || q.includes('వహ్')) {
    if (lastAgentMsg.includes('paneer') || lastAgentMsg.includes('पनीर') || lastAgentMsg.includes('పనీర్')) {
      if (lang === 'hi') return `पनीर के बारे में: इसे 15 से 20 मिनट ही धीमी आंच पर पकाएं ताकि यह मुलायम बना रहे।`;
      if (lang === 'te') return `పనీర్ గురించి: ముక్కలు మృదువుగా ఉండటానికి తక్కువ మంటపై 15-20 నిమిషాలు మాత్రమే ఉడికించండి.`;
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
  if (
    q.includes('ingredient') ||
    q.includes('what do i need') ||
    q.includes('what is needed') ||
    q.includes('सामग्री') ||
    q.includes('పదార్థాలు')
  ) {
    if (lang === 'hi') {
      return `${rName} के लिए आवश्यक सामग्री: ${ingredients.join(', ')}। आप ऊपर रेसिपी पैनल में भी देख सकते हैं।`;
    }
    if (lang === 'te') {
      return `${rName} కు కావలసిన పదార్థాలు: ${ingredients.join(', ')}. మీరు పైన ఉన్న రెసిపీ ప్యానెల్‌లో కూడా చూడవచ్చు.`;
    }
    return `${rName} calls for: ${ingredients.join(', ')}. You can tap the Recipe Context drawer above to see every item.`;
  }

  // 12. DYNAMIC MATCH AGAINST RECIPE CONTENT
  const stopWords = new Set([
    'what', 'when', 'where', 'make', 'cook', 'this', 'that', 'with', 'from', 'have', 'need', 'tell', 'about', 'just', 'some', 'please', 'know', 'doing', 'right', 'there', 'here', 'look', 'good', 'sure', 'yeah', 'okay'
  ]);
  const substantiveWords = q
    .split(/\s+/)
    .map((w) => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ''))
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  if (substantiveWords.length >= 1) {
    for (let i = 0; i < steps.length; i++) {
      const stepText = steps[i];
      const stepLower = stepText.toLowerCase();
      const matchCount = substantiveWords.filter((w) => stepLower.includes(w)).length;
      if (matchCount >= 1) {
        if (lang === 'hi') return `स्टेप ${i + 1} के बारे में: ${stepText}`;
        if (lang === 'te') return `దశ ${i + 1} గురించి: ${stepText}`;
        return `Regarding that in Step ${i + 1}: ${stepText}`;
      }
    }
  }

  // 13. CLARIFICATION FALLBACK (Avoid bluff/hallucinated answers on noise)
  if (lang === 'hi') {
    return `मुझे आपकी बात पूरी तरह समझ नहीं आई। क्या आप सामग्री, पकाने के समय या तापमान के बारे में पूछना चाहते हैं? या 'अगला स्टेप' बोलें।`;
  }
  if (lang === 'te') {
    return `మీరు చెప్పింది స్పష్టంగా వినపడలేదు. పదార్థాలు, సమయం లేదా తదుపరి దశ గురించి మళ్ళీ అడగండి, లేదా 'తరువాతి దశ' అని చెప్పండి.`;
  }
  return `I didn't quite catch that. You can ask about ingredients, cooking time, heat levels, or say "next step" when you're ready!`;
}
