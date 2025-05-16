import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import axios from "axios";

// Types for our context
interface CurrencyContextType {
  currentCurrency: string;
  supportedCurrencies: string[];
  isLoading: boolean;
  setCurrentCurrency: (currency: string) => void;
  convertPrice: (price: number, fromCurrency: string) => Promise<number>;
  formatPrice: (price: number, currency?: string) => string;
}

// Create context with default values
const CurrencyContext = createContext<CurrencyContextType>({
  currentCurrency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "NZD"],
  isLoading: false,
  setCurrentCurrency: () => {},
  convertPrice: async () => 0,
  formatPrice: () => "",
});

// Create provider component
export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // List of supported currencies
  const supportedCurrencies = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "NZD"];

  // Cache for exchange rates to avoid unnecessary API calls
  const exchangeRateCache: Record<string, number> = {};

  // Function to convert price from one currency to another
  const convertPrice = useCallback(async (price: number, fromCurrency: string): Promise<number> => {
    // If currencies are the same, no conversion needed
    if (fromCurrency === currentCurrency) {
      return price;
    }
    
    setIsLoading(true);
    
    try {
      const cacheKey = `${fromCurrency}_${currentCurrency}`;
      
      // Check if we have a cached rate
      if (exchangeRateCache[cacheKey]) {
        const convertedPrice = price * exchangeRateCache[cacheKey];
        setIsLoading(false);
        return convertedPrice;
      }
      
      // For demo purposes, we're using simulated exchange rates
      // In a production app, you would use a real currency API
      // Example: const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      
      // Simulated exchange rates (as of May 2025)
      const simulatedRates: Record<string, Record<string, number>> = {
        'USD': { 'EUR': 0.92, 'GBP': 0.79, 'AUD': 1.51, 'CAD': 1.36, 'CHF': 0.90, 'NZD': 1.63 },
        'EUR': { 'USD': 1.09, 'GBP': 0.86, 'AUD': 1.64, 'CAD': 1.48, 'CHF': 0.98, 'NZD': 1.77 },
        'GBP': { 'USD': 1.27, 'EUR': 1.16, 'AUD': 1.92, 'CAD': 1.73, 'CHF': 1.14, 'NZD': 2.07 },
        'AUD': { 'USD': 0.66, 'EUR': 0.61, 'GBP': 0.52, 'CAD': 0.90, 'CHF': 0.60, 'NZD': 1.08 },
        'CAD': { 'USD': 0.74, 'EUR': 0.68, 'GBP': 0.58, 'AUD': 1.11, 'CHF': 0.66, 'NZD': 1.20 },
        'CHF': { 'USD': 1.11, 'EUR': 1.02, 'GBP': 0.88, 'AUD': 1.68, 'CAD': 1.51, 'NZD': 1.82 },
        'NZD': { 'USD': 0.61, 'EUR': 0.56, 'GBP': 0.48, 'AUD': 0.93, 'CAD': 0.83, 'CHF': 0.55 }
      };
      
      // Get the conversion rate
      let rate: number;
      
      if (fromCurrency === 'USD') {
        rate = simulatedRates['USD'][currentCurrency] || 1;
      } else if (currentCurrency === 'USD') {
        rate = 1 / (simulatedRates['USD'][fromCurrency] || 1);
      } else {
        // Convert via USD as the base currency
        const fromToUSD = 1 / (simulatedRates['USD'][fromCurrency] || 1);
        const usdToTarget = simulatedRates['USD'][currentCurrency] || 1;
        rate = fromToUSD * usdToTarget;
      }
      
      // Cache the rate
      exchangeRateCache[cacheKey] = rate;
      
      // Calculate the converted price
      const convertedPrice = price * rate;
      
      setIsLoading(false);
      return convertedPrice;
    } catch (error) {
      console.error("Error converting currency:", error);
      setIsLoading(false);
      return price; // Return original price on error
    }
  }, [currentCurrency, exchangeRateCache]);

  // Format price with currency symbol
  const formatPrice = useCallback((price: number, currency?: string): string => {
    const currencyToUse = currency || currentCurrency;
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(price);
  }, [currentCurrency]);

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        supportedCurrencies,
        isLoading,
        setCurrentCurrency,
        convertPrice,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the currency context
export const useCurrency = () => useContext(CurrencyContext);