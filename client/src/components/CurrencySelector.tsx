import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CurrencySelectorProps {
  defaultValue?: string;
  onChange?: (value: string) => void;
  showLabel?: boolean;
  className?: string;
}

export function CurrencySelector({ 
  defaultValue, 
  onChange, 
  showLabel = true,
  className = "" 
}: CurrencySelectorProps) {
  const { currentCurrency, supportedCurrencies, setCurrentCurrency } = useCurrency();

  // Handle currency change
  const handleCurrencyChange = (value: string) => {
    setCurrentCurrency(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <Label htmlFor="currency-selector" className="text-sm font-medium mb-2 block">
          Currency
        </Label>
      )}
      <Select 
        defaultValue={defaultValue || currentCurrency} 
        onValueChange={handleCurrencyChange}
      >
        <SelectTrigger id="currency-selector" className="w-full bg-neutral-100 border border-neutral-200 rounded-lg">
          <SelectValue placeholder="Select Currency" />
        </SelectTrigger>
        <SelectContent>
          {supportedCurrencies.map((currency) => (
            <SelectItem key={currency} value={currency}>
              {currency}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}