import { useState } from "react";
import { Check, ChevronsUpDown, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrency } from "@/contexts/CurrencyContext";

export function CurrencySelector() {
  const { currentCurrency, supportedCurrencies, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);

  const currencyLabels: { [key: string]: string } = {
    USD: "US Dollar (USD)",
    EUR: "Euro (EUR)",
    AUD: "Australian Dollar (AUD)",
    GBP: "British Pound (GBP)",
    CAD: "Canadian Dollar (CAD)",
    CHF: "Swiss Franc (CHF)",
    NZD: "New Zealand Dollar (NZD)",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-1">
            <CircleDollarSign className="h-4 w-4" />
            <span>{currentCurrency}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[220px]">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandEmpty>No currency found.</CommandEmpty>
          <CommandGroup>
            {supportedCurrencies.map((currency) => (
              <CommandItem
                key={currency}
                value={currency}
                onSelect={(value) => {
                  setCurrency(value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    currentCurrency === currency ? "opacity-100" : "opacity-0"
                  )}
                />
                {currencyLabels[currency] || currency}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default CurrencySelector;