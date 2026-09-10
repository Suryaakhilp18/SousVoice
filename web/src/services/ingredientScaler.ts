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

  const ratio = targetServings / baseServings;

  // 1. If number is directly attached to unit without space, e.g. "500g chicken", "250ml milk"
  const compactMatch = originalText.match(/^([\d.]+)(g|kg|ml|l|oz|lb)\s+(.*)$/i);
  if (compactMatch) {
    const val = parseFloat(compactMatch[1]);
    if (!isNaN(val)) {
      const scaledVal = val * ratio;
      const formattedNum = formatQuantity(scaledVal);
      return `${formattedNum}${compactMatch[2]} ${compactMatch[3]}`;
    }
  }

  // 2. Pattern: starts with quantity (number, fraction, mixed) followed by unit and ingredient name
  // e.g., "2 cups aged Basmati rice", "1/2 tsp red chili powder", "1 1/2 tbsp ghee"
  const leadingMatch = originalText.match(/^([\d./\s]+)\s+([a-zA-Z]+.*)$/);
  if (leadingMatch) {
    const parsed = parseQuantityString(leadingMatch[1]);
    if (parsed) {
      const scaledVal = parsed.value * ratio;
      const formattedNum = formatQuantity(scaledVal);
      const rest = leadingMatch[2].trim();
      return `${formattedNum} ${rest}`;
    }
  }

  // Qualitative ingredients (e.g. "a pinch fine salt", "salt to taste", "for garnish")
  return originalText;
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
