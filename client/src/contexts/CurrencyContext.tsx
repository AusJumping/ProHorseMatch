import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supportedCurrencies, convertCurrency, formatPrice } from '@/lib/currencyConverter';

interface CurrencyContextType {
  currentCurrency: string;
  supportedCurrencies: string[];
  setCurrency: (currency: string) => void;
  convertPrice: (amount: number, fromCurrency: string) => Promise<number>;
  formatPrice: (amount: number, currency?: string) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
  defaultCurrency?: string;
}

export const CurrencyProvider = ({ 
  children, 
  defaultCurrency = 'USD' 
}: CurrencyProviderProps) => {
  const [currentCurrency, setCurrentCurrency] = useState<string>(
    localStorage.getItem('preferredCurrency') || defaultCurrency
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Save currency preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferredCurrency', currentCurrency);
  }, [currentCurrency]);

  // Set currency function
  const setCurrency = (currency: string) => {
    if (supportedCurrencies.includes(currency)) {
      setCurrentCurrency(currency);
    }
  };

  // Convert price function
  const convert = async (amount: number, fromCurrency: string): Promise<number> => {
    if (amount <= 0) return 0;
    
    setIsLoading(true);
    try {
      const convertedAmount = await convertCurrency(amount, fromCurrency, currentCurrency);
      return convertedAmount;
    } catch (error) {
      console.error('Error in context conversion:', error);
      return amount;
    } finally {
      setIsLoading(false);
    }
  };

  // Format price with current currency
  const format = (amount: number, currency?: string): string => {
    return formatPrice(amount, currency || currentCurrency);
  };

  // Value to provide
  const value = {
    currentCurrency,
    supportedCurrencies,
    setCurrency,
    convertPrice: convert,
    formatPrice: format,
    isLoading
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use the currency context
export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};