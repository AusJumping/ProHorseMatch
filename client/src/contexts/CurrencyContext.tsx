import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { convertPrice as convertCurrency, formatPrice as formatCurrencyPrice, getSupportedCurrencies } from "@/lib/currencyConverter";

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
  supportedCurrencies: getSupportedCurrencies(),
  isLoading: false,
  setCurrentCurrency: () => {},
  convertPrice: async () => 0,
  formatPrice: () => "",
});

// Create provider component
interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: string;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ 
  children, 
  initialCurrency = "AUD" 
}) => {
  const [currentCurrency, setCurrentCurrency] = useState<string>(initialCurrency);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // List of supported currencies
  const supportedCurrencies = getSupportedCurrencies();

  // Function to convert price from one currency to another
  const convertPrice = useCallback(async (price: number, fromCurrency: string): Promise<number> => {
    // If currencies are the same, no conversion needed
    if (fromCurrency === currentCurrency) {
      return price;
    }
    
    setIsLoading(true);
    
    try {
      // Use our utility function
      const convertedPrice = convertCurrency(price, fromCurrency, currentCurrency);
      
      // Simulate a brief loading period to show the loading state
      // In a real app with an API call, this would not be needed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setIsLoading(false);
      return convertedPrice;
    } catch (error) {
      console.error("Error converting currency:", error);
      setIsLoading(false);
      return price; // Return original price on error
    }
  }, [currentCurrency]);

  // Format price with currency symbol
  const formatPrice = useCallback((price: number, currency?: string): string => {
    const currencyToUse = currency || currentCurrency;
    return formatCurrencyPrice(price, currencyToUse);
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