/**
 * Currency conversion utility functions
 */

// Simulated exchange rates (as of May 2025)
// In a real application, these would come from an API
const rates: Record<string, Record<string, number>> = {
  'USD': { 'EUR': 0.92, 'GBP': 0.79, 'AUD': 1.51, 'CAD': 1.36, 'CHF': 0.90, 'NZD': 1.63 },
  'EUR': { 'USD': 1.09, 'GBP': 0.86, 'AUD': 1.64, 'CAD': 1.48, 'CHF': 0.98, 'NZD': 1.77 },
  'GBP': { 'USD': 1.27, 'EUR': 1.16, 'AUD': 1.92, 'CAD': 1.73, 'CHF': 1.14, 'NZD': 2.07 },
  'AUD': { 'USD': 0.66, 'EUR': 0.61, 'GBP': 0.52, 'CAD': 0.90, 'CHF': 0.60, 'NZD': 1.08 },
  'CAD': { 'USD': 0.74, 'EUR': 0.68, 'GBP': 0.58, 'AUD': 1.11, 'CHF': 0.66, 'NZD': 1.20 },
  'CHF': { 'USD': 1.11, 'EUR': 1.02, 'GBP': 0.88, 'AUD': 1.68, 'CAD': 1.51, 'NZD': 1.82 },
  'NZD': { 'USD': 0.61, 'EUR': 0.56, 'GBP': 0.48, 'AUD': 0.93, 'CAD': 0.83, 'CHF': 0.55 }
};

/**
 * Convert a price from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - The source currency
 * @param toCurrency - The target currency
 * @returns The converted amount
 */
export function convertPrice(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Get the conversion rate
  let rate: number;
  
  if (fromCurrency === 'USD') {
    rate = rates['USD'][toCurrency] || 1;
  } else if (toCurrency === 'USD') {
    rate = 1 / (rates['USD'][fromCurrency] || 1);
  } else {
    // Convert via USD as the base currency
    const fromToUSD = 1 / (rates['USD'][fromCurrency] || 1);
    const usdToTarget = rates['USD'][toCurrency] || 1;
    rate = fromToUSD * usdToTarget;
  }
  
  // Calculate the converted price
  return amount * rate;
}

/**
 * Format a price with currency symbol
 * @param price - The price to format
 * @param currency - The currency to use
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(price);
}

/**
 * Get a list of supported currencies
 * @returns Array of currency codes
 */
export function getSupportedCurrencies(): string[] {
  return ["AUD", "USD", "EUR", "GBP", "NZD"];
}