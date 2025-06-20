import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2 } from "lucide-react";

interface CurrencyRateProps {
  baseCurrency: string;
}

export function CurrencyRate({ baseCurrency = "USD" }: CurrencyRateProps) {
  const { supportedCurrencies, convertPrice, formatPrice } = useCurrency();
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRates() {
      setLoading(true);
      const newRates: Record<string, number> = {};
      
      try {
        // We'll use a fixed amount for demonstration
        const baseAmount = 100;
        
        // Our context already handles conversion to the current selected currency
        const converted = await convertPrice(baseAmount, baseCurrency);
        
        // For simplicity, just show the conversion rate for the selected currency
        supportedCurrencies.forEach(currency => {
          if (currency !== baseCurrency) {
            // Apply a simulated rate - this would normally come from the API
            // In a real implementation, this would be replaced by actual currency rates
            newRates[currency] = baseAmount * 
              (currency === 'EUR' ? 0.92 : 
               currency === 'GBP' ? 0.79 : 
               currency === 'AUD' ? 1.51 : 
               currency === 'CAD' ? 1.36 : 
               currency === 'CHF' ? 0.90 : 
               currency === 'NZD' ? 1.63 : 1);
          }
        });
      } catch (error) {
        console.error('Error fetching rates:', error);
      }
      
      setRates(newRates);
      setLoading(false);
    }
    
    fetchRates();
  }, [baseCurrency, convertPrice, supportedCurrencies]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          Current Exchange Rates
          <div className="text-sm font-normal text-muted-foreground mt-1">
            Base: {baseCurrency}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading rates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(rates).map(([currency, rate]) => (
              <div 
                key={currency} 
                className="p-2 rounded-md bg-muted flex items-center justify-between"
              >
                <span className="font-medium">{currency}</span>
                <span className="text-sm">
                  {formatPrice(rate, currency).replace(/[^0-9.,]/g, '')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CurrencyRate;