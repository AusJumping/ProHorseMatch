#!/bin/bash

# Add "Under $5,000" option to min price
sed -i '281 i \                                        <SelectItem value="1">\n                                          {form.watch("currency") === "USD" ? "Under $5,000" : \n                                           form.watch("currency") === "GBP" ? "Under £5,000" : \n                                           form.watch("currency") === "AUD" ? "Under A$5,000" : \n                                           "Under €5,000"}\n                                        </SelectItem>' client/src/pages/add-horse.tsx

# Remove any "Over $500,000" option from max price (around line 649)
sed -i '/value="999999"/,+5d' client/src/pages/add-horse.tsx

