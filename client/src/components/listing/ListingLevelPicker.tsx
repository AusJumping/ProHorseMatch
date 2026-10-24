import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function ListingLevelPicker({ options, selected, onChange }: {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return <div className="space-y-2">
    <p id="listing-level-label" className="text-sm font-semibold text-[#34332f]">Competition level</p>
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-labelledby="listing-level-label" className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-[#dedbd2] bg-transparent py-2 text-left text-sm">
          <span>{selected.length ? selected.join(", ") : "Choose competition levels"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command>
          <CommandInput placeholder="Find a level…" />
          <CommandList className="max-h-64">
            <CommandEmpty>No matching levels.</CommandEmpty>
            <CommandGroup>
              {options.map(option => <CommandItem key={option} value={option} onSelect={() => onChange(selected.includes(option) ? selected.filter(value => value !== option) : [...selected, option])}>
                <Check aria-hidden="true" className={`mr-2 h-4 w-4 ${selected.includes(option) ? "opacity-100" : "opacity-0"}`} />
                {option}<span className="sr-only">{selected.includes(option) ? ", selected" : ", not selected"}</span>
              </CommandItem>)}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    <p className="text-xs text-neutral-500">Select all levels that apply.</p>
  </div>;
}
