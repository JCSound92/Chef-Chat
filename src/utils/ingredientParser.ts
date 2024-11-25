export type ParsedIngredient = {
  amount: number;
  unit: string;
  item: string;
};

const UNITS = [
  'cup', 'cups',
  'tablespoon', 'tablespoons', 'tbsp',
  'teaspoon', 'teaspoons', 'tsp',
  'pound', 'pounds', 'lb', 'lbs',
  'ounce', 'ounces', 'oz',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'pinch', 'pinches',
  'whole', 'large', 'medium', 'small'
];

const UNIT_CONVERSIONS: { [key: string]: string } = {
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'pound': 'lb',
  'pounds': 'lb',
  'lbs': 'lb',
  'ounce': 'oz',
  'ounces': 'oz',
  'gram': 'g',
  'grams': 'g',
  'kilogram': 'kg',
  'kilograms': 'kg',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'liter': 'l',
  'liters': 'l',
  'cup': 'cups'
};

// Common singular/plural mappings
const ITEM_NORMALIZATIONS: { [key: string]: string } = {
  'egg': 'eggs',
  'clove': 'cloves',
  'onion': 'onions',
  'tomato': 'tomatoes',
  'potato': 'potatoes',
  'carrot': 'carrots',
  'apple': 'apples',
  'banana': 'bananas',
  'pepper': 'peppers',
  'clove of garlic': 'cloves of garlic',
  'garlic clove': 'garlic cloves'
};

function normalizeItem(item: string): string {
  // Remove leading/trailing spaces and convert to lowercase
  item = item.trim().toLowerCase();

  // Check direct matches first
  if (ITEM_NORMALIZATIONS[item]) {
    return ITEM_NORMALIZATIONS[item];
  }

  // Handle basic pluralization rules
  if (item.endsWith('y')) {
    // Handle words ending in 'y' (e.g., berry -> berries)
    return item.replace(/y$/, 'ies');
  } else if (item.endsWith('ch') || item.endsWith('sh') || item.endsWith('s') || 
             item.endsWith('x') || item.endsWith('z')) {
    // Handle words ending in ch, sh, s, x, z
    return item + 'es';
  } else {
    // Default to adding 's'
    return item + 's';
  }
}

export function parseIngredient(ingredient: string): ParsedIngredient | null {
  // Convert fractions to decimals
  ingredient = ingredient.replace(/(\d+)\/(\d+)/g, (match, num, den) => 
    (parseFloat(num) / parseFloat(den)).toString()
  );

  // Match patterns like "2 cups" or "2.5 large onions"
  const match = ingredient.match(
    new RegExp(`^(\\d*\\.?\\d+)\\s*(${UNITS.join('|')})?\\s*(.+)$`, 'i')
  );

  if (!match) return null;

  const [, amountStr, unit, item] = match;
  const amount = parseFloat(amountStr);

  if (isNaN(amount)) return null;

  // Normalize the unit
  const normalizedUnit = unit ? UNIT_CONVERSIONS[unit.toLowerCase()] || unit.toLowerCase() : '';

  // Normalize the item name to its plural form for consistency
  const normalizedItem = normalizeItem(item);

  return {
    amount,
    unit: normalizedUnit,
    item: normalizedItem
  };
}

export function formatIngredient(parsed: ParsedIngredient): string {
  const amount = Math.round(parsed.amount * 10) / 10;
  const formattedAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
  
  // Handle singular/plural forms based on amount
  let formattedItem = parsed.item;
  if (amount === 1) {
    // Convert plural back to singular for amount of 1
    Object.entries(ITEM_NORMALIZATIONS).forEach(([singular, plural]) => {
      if (parsed.item === plural) {
        formattedItem = singular;
      }
    });
    
    // Handle basic plural to singular conversion if no direct match found
    if (formattedItem === parsed.item) {
      if (formattedItem.endsWith('ies')) {
        formattedItem = formattedItem.replace(/ies$/, 'y');
      } else if (formattedItem.endsWith('es')) {
        formattedItem = formattedItem.replace(/es$/, '');
      } else if (formattedItem.endsWith('s')) {
        formattedItem = formattedItem.replace(/s$/, '');
      }
    }
  }

  return `${formattedAmount} ${parsed.unit} ${formattedItem}`.trim();
}

export function consolidateIngredients(ingredients: string[]): string[] {
  const consolidated: { [key: string]: ParsedIngredient } = {};

  ingredients.forEach(ingredient => {
    const parsed = parseIngredient(ingredient);
    if (!parsed) {
      // If we can't parse it, keep it as is
      consolidated[ingredient.toLowerCase()] = {
        amount: 1,
        unit: '',
        item: ingredient.toLowerCase()
      };
      return;
    }

    // Create a key that combines unit and normalized item for proper grouping
    const key = `${parsed.unit}-${parsed.item}`;
    if (consolidated[key]) {
      consolidated[key].amount += parsed.amount;
    } else {
      consolidated[key] = parsed;
    }
  });

  return Object.values(consolidated)
    .map(formatIngredient)
    .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
}