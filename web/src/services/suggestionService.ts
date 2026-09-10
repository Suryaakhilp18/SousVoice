// suggestionService.ts - Recipe-Aware & Localized 6 to 8 Contextual Suggestions

import type { Recipe } from '../types';
import type { SupportedLanguage } from './localization';

export interface SuggestionChip {
  id: string;
  label: string;
  textToSubmit: string;
  isInterrupt?: boolean;
  emoji: string;
}

/**
 * Dynamically generates 6 to 8 highly relevant kitchen inquiries based on the active recipe and selected language.
 */
export function getContextualSuggestions(
  recipe: Recipe,
  currentStep: number,
  language: SupportedLanguage = 'en'
): SuggestionChip[] {
  const recipeName = recipe.name || 'this dish';
  const totalSteps = recipe.steps.length;
  const isFinalStep = currentStep >= totalSteps;

  // Extract primary ingredient names for smart substitution suggestions
  const firstIngredient = recipe.ingredients[0] || 'chicken';
  const cleanFirstIng = firstIngredient.replace(/^[\d./\s]+(g|kg|cups?|tbsp|tsp|pinch|large|ml|l|oz|lb)?\s*/i, '').replace(/\(.*\)/g, '').trim().split(' ')[0] || 'ingredient';

  if (language === 'hi') {
    return [
      {
        id: 'hi-sub',
        label: `क्या मैं ${cleanFirstIng} बदल सकता हूँ?`,
        textToSubmit: `क्या मैं ${cleanFirstIng} की जगह कुछ और इस्तेमाल कर सकता हूँ?`,
        emoji: '🔄',
      },
      {
        id: 'hi-salt',
        label: 'रुको! कितना नमक डालना है?',
        textToSubmit: 'रुको! इस रेसिपी में कितना नमक डालना है?',
        isInterrupt: true,
        emoji: '⚡',
      },
      {
        id: 'hi-next',
        label: isFinalStep ? 'रेसिपी पूरी हो गई?' : 'अगला स्टेप बताएं',
        textToSubmit: isFinalStep ? 'क्या रेसिपी पूरी हो गई?' : 'अगला स्टेप बताएं',
        emoji: '⏩',
      },
      {
        id: 'hi-heat',
        label: 'इंडक्शन स्टोव पर आंच कितनी रखें?',
        textToSubmit: 'इंडक्शन चूल्हे पर इस स्टेप के लिए कितनी आंच रखें?',
        emoji: '🔥',
      },
      {
        id: 'hi-spice',
        label: 'अगर तीखा ज्यादा हो जाए तो क्या करें?',
        textToSubmit: 'अगर तीखा ज्यादा हो जाए तो कैसे कम करें?',
        emoji: '🌶️',
      },
      {
        id: 'hi-doneness',
        label: 'कैसे पता चलेगा कि यह पक गया है?',
        textToSubmit: 'मुझे कैसे पता चलेगा कि यह स्टेप सही से पक गया है?',
        emoji: '⏱️',
      },
      {
        id: 'hi-repeat',
        label: 'वर्तमान स्टेप दोबारा बोलें',
        textToSubmit: 'वर्तमान स्टेप फिर से बताएं',
        emoji: '🔁',
      },
      {
        id: 'hi-servings',
        label: 'सामग्री की मात्रा फिर से बताएं',
        textToSubmit: 'इस डिश के लिए जरूरी सामग्री की सही मात्रा क्या है?',
        emoji: '⚖️',
      },
    ];
  }

  if (language === 'te') {
    return [
      {
        id: 'te-sub',
        label: `నేను ${cleanFirstIng} బదులుగా ఏమి వాడవచ్చు?`,
        textToSubmit: `నేను ${cleanFirstIng} బదులుగా వేరేది ఏదైనా వాడవచ్చా?`,
        emoji: '🔄',
      },
      {
        id: 'te-salt',
        label: 'ఆగండి! ఎంత ఉప్పు వేయాలి?',
        textToSubmit: 'ఆగండి! ఇందులో ఎంత ఉప్పు వేయాలో మళ్ళీ చెప్పండి?',
        isInterrupt: true,
        emoji: '⚡',
      },
      {
        id: 'te-next',
        label: isFinalStep ? 'వంట పూర్తయిందా?' : 'తరువాతి దశ చెప్పండి',
        textToSubmit: isFinalStep ? 'వంట పూర్తయిందా?' : 'తరువాతి దశ చెప్పండి',
        emoji: '⏩',
      },
      {
        id: 'te-heat',
        label: 'ఇండక్షన్ పొయ్యిపై మంట ఎంత ఉంచాలి?',
        textToSubmit: 'ఈ దశకు ఇండక్షన్ స్టవ్‌పై ఎంత హీట్ సెట్టింగ్ పెట్టాలి?',
        emoji: '🔥',
      },
      {
        id: 'te-spice',
        label: 'కారం ఎక్కువైతే ఏమి చేయాలి?',
        textToSubmit: 'కారం ఎక్కువైతే ఎలా సరిచేయాలి?',
        emoji: '🌶️',
      },
      {
        id: 'te-doneness',
        label: 'ఇది ఉడికిందని ఎలా తెలుస్తుంది?',
        textToSubmit: 'ఇది సరిగ్గా ఉడికిందో లేదో ఎలా చెక్ చేయాలి?',
        emoji: '⏱️',
      },
      {
        id: 'te-repeat',
        label: 'ప్రస్తుత సూచన మళ్ళీ చదవండి',
        textToSubmit: 'ఈ దశ సూచనను మళ్ళీ వివరించండి',
        emoji: '🔁',
      },
      {
        id: 'te-quantities',
        label: 'పదార్థాల కొలతలు చెప్పండి',
        textToSubmit: 'ఈ రెసిపీకి అవసరమైన పదార్థాల కొలతలు ఏమిటి?',
        emoji: '⚖️',
      },
    ];
  }

  // Default English contextual suggestions (6 to 8 smart questions)
  return [
    {
      id: 'en-sub',
      label: `Replace ${cleanFirstIng} with something else?`,
      textToSubmit: `What can I substitute for ${cleanFirstIng} in ${recipeName}?`,
      emoji: '🔄',
    },
    {
      id: 'en-salt',
      label: 'Wait! How much salt again?',
      textToSubmit: 'Wait, how much salt should I add for this step?',
      isInterrupt: true,
      emoji: '⚡',
    },
    {
      id: 'en-next',
      label: isFinalStep ? 'Is the recipe finished?' : 'Next step please',
      textToSubmit: isFinalStep ? 'Is this recipe completely done?' : 'Next step please',
      emoji: '⏩',
    },
    {
      id: 'en-heat',
      label: 'Induction heat settings for this step?',
      textToSubmit: `What induction cooktop setting should I use for step ${currentStep}?`,
      emoji: '🔥',
    },
    {
      id: 'en-spice',
      label: 'What if it becomes too spicy?',
      textToSubmit: 'How can I fix the dish if it turns out too spicy or salty?',
      emoji: '🌶️',
    },
    {
      id: 'en-doneness',
      label: 'How do I know when it is done?',
      textToSubmit: `How can I tell when step ${currentStep} is cooked through properly?`,
      emoji: '⏱️',
    },
    {
      id: 'en-repeat',
      label: 'Repeat current instruction',
      textToSubmit: `Can you repeat step ${currentStep} for me?`,
      emoji: '🔁',
    },
    {
      id: 'en-servings',
      label: `Scaled quantities for ${recipe.servings} servings?`,
      textToSubmit: `Can you remind me of the scaled ingredient quantities for ${recipe.servings} servings?`,
      emoji: '⚖️',
    },
  ];
}
