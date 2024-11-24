type ParsedIngredient = {
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
  
    return {
      amount,
      unit: normalizedUnit,
      item: item.trim().toLowerCase()
    };
  }
  
  export function formatIngredient(parsed: ParsedIngredient): string {
    const amount = Math.round(parsed.amount * 10) / 10;
    const formattedAmount = amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
    return `${formattedAmount} ${parsed.unit} ${parsed.item}`;
  }
  
  export function consolidateIngredients(ingredients: string[]): string[] {
    const consolidated: { [key: string]: ParsedIngredient } = {};
  
    ingredients.forEach(ingredient => {
      const parsed = parseIngredient(ingredient);
      if (!parsed) {
        // If we can't parse it, keep it as is
        consolidated[ingredient] = {
          amount: 1,
          unit: '',
          item: ingredient
        };
        return;
      }
  
      const key = `${parsed.unit}-${parsed.item}`;
      if (consolidated[key]) {
        consolidated[key].amount += parsed.amount;
      } else {
        consolidated[key] = parsed;
      }
    });
  
    return Object.values(consolidated).map(formatIngredient);
  }