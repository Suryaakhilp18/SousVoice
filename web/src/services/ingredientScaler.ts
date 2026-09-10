// ingredientScaler.ts - Robust recipe scaling without cumulative floating-point errors

export interface ScaledRecipeResult {
  servings: number;
  ingredients: string[];
  quantities: Record<string, string>;
  totalTime?: string;
  prepTime?: string;
  cookTime?: string;
}

/**
 * Parses numeric and fraction values like "500", "2.5", "1/2", "1 1/2", "3/4"
 */
function parseQuantityString(str: string): { value: number; rawUnit: string } | null {
  const trimmed = str.trim();
  // Match mixed number e.g. "1 1/2" or "2 1/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)(.*)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) {
      return { value: whole + num / den, rawUnit: mixedMatch[4].trim() };
    }
  }

  // Match simple fraction e.g. "1/2", "3/4"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)(.*)$/);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    if (den !== 0) {
      return { value: num / den, rawUnit: fracMatch[3].trim() };
    }
  }

  // Match decimals and integers e.g. "500g", "2 cups", "1.5"
  const numMatch = trimmed.match(/^([\d.]+)\s*(.*)$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val)) {
      return { value: val, rawUnit: numMatch[2].trim() };
    }
  }

  return null;
}

/**
 * Nicely format a scaled number to clean fractions/decimals (e.g. 1.5 -> "1 1/2", 0.25 -> "1/4", 250 -> "250")
 */
export function formatQuantity(num: number): string {
  if (num === 0) return '0';
  if (isNaN(num) || !isFinite(num)) return '0';

  // For very small quantities, round to 2 decimals
  if (num < 0.1) {
    return (Math.round(num * 100) / 100).toString();
  }

  const tolerance = 0.04;
  const whole = Math.floor(num);
  const frac = num - whole;

  const fractionMap: [number, string][] = [
    [0.25, '1/4'],
    [0.333, '1/3'],
    [0.5, '1/2'],
    [0.666, '2/3'],
    [0.75, '3/4'],
    [0.125, '1/8'],
  ];

  for (const [val, str] of fractionMap) {
    if (Math.abs(frac - val) <= tolerance) {
      return whole > 0 ? `${whole} ${str}` : str;
    }
  }

  // If close to next integer
  if (Math.abs(frac - 1) <= tolerance) {
    return (whole + 1).toString();
  }
  if (frac <= tolerance) {
    return whole.toString();
  }

  // Otherwise format with max 2 decimals, strip trailing zeros
  const rounded = Math.round(num * 10) / 10;
  return rounded.toString();
}

/**
 * Scales an ingredient string like "500g chicken", "2 cups rice", "1 pinch salt"
 */
/**
 * Words representing fractions or numbers in English recipe text
 */
const WORD_NUMBER_MAP: Record<string, number> = {
  half: 0.5,
  'half a': 0.5,
  'a half': 0.5,
  quarter: 0.25,
  'a quarter': 0.25,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

/**
 * Scales a single quantity segment like "500g chicken", "1/2 tsp turmeric", "4 large ripe tomatoes", "half a teaspoon baking soda"
 */
function scaleSingleQuantitySegment(
  segment: string,
  ratio: number
): string {
  const trimmed = segment.trim();
  if (!trimmed) return segment;

  // Check for phrases like "half a teaspoon", "a quarter cup"
  const wordMatch = trimmed.match(/^(half a|a half|half|a quarter|quarter)\s+([a-zA-Z]+.*)$/i);
  if (wordMatch) {
    const val = WORD_NUMBER_MAP[wordMatch[1].toLowerCase()] || 0.5;
    const scaledVal = val * ratio;
    return `${formatQuantity(scaledVal)} ${wordMatch[2].trim()}`;
  }

  // 1. If number is directly attached to unit without space, e.g. "500g chicken", "250ml milk"
  const compactMatch = trimmed.match(/^([\d.]+)(g|kg|ml|l|oz|lb)\b\s*(.*)$/i);
  if (compactMatch) {
    const val = parseFloat(compactMatch[1]);
    if (!isNaN(val)) {
      const scaledVal = val * ratio;
      const formattedNum = formatQuantity(scaledVal);
      return compactMatch[3]
        ? `${formattedNum}${compactMatch[2]} ${compactMatch[3]}`
        : `${formattedNum}${compactMatch[2]}`;
    }
  }

  // 2. Pattern: starts with quantity (number, fraction, mixed) followed by unit or ingredient
  // e.g., "2 cups aged Basmati rice", "1/2 tsp red chili powder", "1 1/2 tbsp ghee", "4 large ripe tomatoes"
  const leadingMatch = trimmed.match(/^([\d./\s]+)\s+([a-zA-Z]+.*)$/);
  if (leadingMatch) {
    const parsed = parseQuantityString(leadingMatch[1]);
    if (parsed) {
      const scaledVal = parsed.value * ratio;
      const formattedNum = formatQuantity(scaledVal);
      const rest = leadingMatch[2].trim();
      return `${formattedNum} ${rest}`;
    }
  }

  return segment;
}

/**
 * Scales an ingredient string like:
 * - "500g chicken"
 * - "2 cups rice"
 * - "1 tsp red chili powder & 1/2 tsp turmeric"
 * - "4 large ripe tomatoes & 2 medium onions"
 * - "1 pinch fine salt"
 */
export function scaleIngredientText(
  originalText: string,
  targetServings: number,
  baseServings: number
): string {
  if (baseServings <= 0 || targetServings < 0) return originalText;
  if (targetServings === 0) {
    // 0 servings requested: scale scalable amounts to 0, preserve qualitative hints
    const match = originalText.match(/^([\d./\s]+)\s*([a-zA-Z]+.*)$/);
    if (match) {
      const parsed = parseQuantityString(match[1]);
      if (parsed) {
        return `0 ${match[2]}`.trim();
      }
    }
    return originalText;
  }

  if (targetServings === baseServings) {
    return originalText;
  }

  const ratio = targetServings / baseServings;

  // Handle compound ingredients connected with " & " (e.g. "1 tsp red chili powder & 1/2 tsp turmeric")
  if (originalText.includes(' & ')) {
    const parts = originalText.split(' & ');
    const scaledParts = parts.map((part) => scaleSingleQuantitySegment(part, ratio));
    return scaledParts.join(' & ');
  }

  return scaleSingleQuantitySegment(originalText, ratio);
}

/**
 * Intelligently scales measurement amounts inside recipe instruction steps.
 * E.g. "Whisk 1 cup flour, 1 tablespoon sugar, 1 teaspoon baking powder, half a teaspoon baking soda, and a pinch of salt"
 * For targetServings = 4 (base 2):
 * -> "Whisk 2 cups flour, 2 tablespoons sugar, 2 teaspoons baking powder, 1 teaspoon baking soda, and a pinch of salt"
 */
export function scaleStepText(
  originalStep: string,
  targetServings: number,
  baseServings: number
): string {
  if (baseServings <= 0 || targetServings <= 0 || targetServings === baseServings) {
    return originalStep;
  }

  const ratio = targetServings / baseServings;

  let scaled = originalStep;

  // Replace word fractions e.g. "half a teaspoon", "half a cup", "a quarter cup"
  scaled = scaled.replace(
    /\b(half a|a half|a quarter|quarter)\s+(cup|tablespoon|tbsp|teaspoon|tsp)\b/gi,
    (_match, fracWord, unit) => {
      const val = fracWord.toLowerCase().includes('quarter') ? 0.25 : 0.5;
      const scaledVal = val * ratio;
      const formatted = formatQuantity(scaledVal);
      const isPlural = scaledVal > 1 && !unit.endsWith('s') && !['tbsp', 'tsp'].includes(unit.toLowerCase());
      return `${formatted} ${unit}${isPlural ? 's' : ''}`;
    }
  );

  // Replace numeric amounts with cooking units:
  // e.g. "1 cup", "2 cups", "1/2 teaspoon", "1 1/2 tbsp", "500g", "6 cups"
  const unitRegex = /\b(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(cups?|tablespoons?|tbsp|teaspoons?|tsp|g|kg|ml|oz|lbs?|pieces?)\b/gi;

  scaled = scaled.replace(unitRegex, (match, qtyStr, unit) => {
    const parsed = parseQuantityString(qtyStr);
    if (!parsed || isNaN(parsed.value)) return match;

    const scaledVal = parsed.value * ratio;
    const formattedNum = formatQuantity(scaledVal);

    // Adjust pluralization of cup/tablespoon/teaspoon
    let finalUnit = unit;
    const lowerUnit = unit.toLowerCase();
    if (['cup', 'cups', 'tablespoon', 'tablespoons', 'teaspoon', 'teaspoons'].includes(lowerUnit)) {
      const baseUnit = lowerUnit.replace(/s$/, '');
      finalUnit = scaledVal > 1 ? `${baseUnit}s` : baseUnit;
    }

    return `${formattedNum} ${finalUnit}`;
  });

  return scaled;
}

/**
 * Intelligent time calculation:
 * Scaling portions does not linearly scale cooking duration (boiling water or baking takes fixed physics time).
 * Prep time scales with sqrt of serving ratio; cook time has a minimal buffer.
 */
export function calculateScaledTime(
  originalTimeStr: string | undefined,
  targetServings: number,
  baseServings: number
): string {
  if (!originalTimeStr || baseServings <= 0) return originalTimeStr || '30 min';
  if (targetServings === baseServings) return originalTimeStr;
  if (targetServings === 0) return '0 min';

  // Parse minutes or hours
  let totalMinutes = 0;
  const hrMatch = originalTimeStr.match(/(\d+)\s*hr/i);
  const minMatch = originalTimeStr.match(/(\d+)\s*min/i);
  if (hrMatch) totalMinutes += parseInt(hrMatch[1], 10) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1], 10);

  if (totalMinutes === 0) return originalTimeStr;

  const ratio = targetServings / baseServings;
  // Sub-linear time scaling: Fixed thermal base (70%) + quantity dependent portion (30%) * sqrt(ratio)
  const scaledMinutes = Math.round(totalMinutes * (0.7 + 0.3 * Math.sqrt(ratio)));
  const safeMinutes = Math.max(5, scaledMinutes);

  if (safeMinutes >= 60) {
    const hrs = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }
  return `${safeMinutes} min`;
}
