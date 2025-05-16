import axios from 'axios';

// Define supported currencies
export const supportedCurrencies = ['USD', 'EUR', 'AUD', 'GBP', 'CAD', 'CHF', 'NZD'];

// Interface for exchange rates
interface ExchangeRates {
  [key: string]: number;
  timestamp: number;
}

// Cache to store exchange rates with timestamp
let ratesCache: ExchangeRates | null = null;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetch current exchange rates from API
 */
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRates> => {
  try {
    // Check if we have a valid cache
    if (
      ratesCache && 
      ratesCache.timestamp && 
      Date.now() - ratesCache.timestamp < CACHE_DURATION
    ) {
      return ratesCache;
    }

    // If no valid cache, fetch from API
    const response = await axios.get(
      `https://api.exchangerate.host/latest?base=${baseCurrency}`
    );

    if (response.data && response.data.rates) {
      // Update cache with timestamp
      ratesCache = {
        ...response.data.rates,
        timestamp: Date.now()
      };
      return ratesCache;
    }

    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Fallback to hardcoded rates if API fails
    const fallbackRates: ExchangeRates = {
      USD: 1,
      EUR: 0.92,
      AUD: 1.51,
      GBP: 0.79,
      CAD: 1.36,
      CHF: 0.90,
      NZD: 1.63,
      timestamp: Date.now()
    };
    
    return fallbackRates;
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await fetchExchangeRates('USD');
    
    // Convert from source currency to USD (if not already USD)
    const amountInUSD = fromCurrency === 'USD' 
      ? amount 
      : amount / rates[fromCurrency];
    
    // Convert from USD to target currency
    const convertedAmount = toCurrency === 'USD' 
      ? amountInUSD 
      : amountInUSD * rates[toCurrency];
    
    return parseFloat(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount; // Return original amount if conversion fails
  }
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
};