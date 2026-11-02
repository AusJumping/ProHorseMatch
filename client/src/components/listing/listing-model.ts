export type ListingMode = "create" | "edit";
export type ListingStep = "photos" | "facts" | "pedigree" | "description" | "price" | "preview";
export type ListingData = {
  name: string; owner_id: number; location_country: string; location_radius_km: number;
  disciplines: string[]; other_disciplines: string[]; levels: string[]; breeds: string[];
  age: number | undefined; height_hands: number | "young_horse" | undefined; height_cm?: number;
  sex: string; colour: string; sire: string; dam: string; dam_sire: string;
  education_level: string; characteristics: string[]; description: string; additional_info: string;
  photos: string[]; videos: string[]; price_min: number | undefined; price_max: number | undefined; currency: string;
};
export type BuyerHorsePresentation = {
  name: string;
  disciplines?: string[] | null;
  levels?: string[] | null;
  age: number | null;
  sex?: string | null;
  height_hands?: number | "young_horse" | null;
  colour?: string | null;
  breeds?: string[] | null;
  location_country?: string | null;
  sire?: string | null;
  dam?: string | null;
  dam_sire?: string | null;
  description?: string | null;
  additional_info?: string | null;
  education_level?: string | null;
  photos?: string[] | null;
};

export function getBuyerDetailFields(horse: BuyerHorsePresentation): [string, string][] {
  return [
    ["Discipline", horse.disciplines?.filter(Boolean).join(", ") || ""],
    ["Level", horse.levels?.filter(Boolean).join(", ") || ""],
    ["Age", horse.age === 1 ? "Yearling" : `${horse.age} years`],
    ["Sex", horse.sex || ""],
    ["Height", horse.height_hands ? `${horse.height_hands} hands` : "Not specified"],
    ["Colour", horse.colour || ""],
    ["Breed", horse.breeds?.filter(Boolean).join(", ") || ""],
    ["Country", horse.location_country || ""],
  ];
}

export function getBuyerPedigree(horse: BuyerHorsePresentation): [string, string][] {
  return [["Sire", horse.sire], ["Dam", horse.dam], ["Dam sire", horse.dam_sire]]
    .filter((item): item is [string, string] => Boolean(item[1]?.trim()));
}

export const AGE_OPTIONS_CREATE = Array.from({ length: 21 }, (_, index) => index);
export const AGE_OPTIONS_EDIT = Array.from({ length: 17 }, (_, index) => index);
const heightValues = (maximumWhole: number) => Array.from({ length: (maximumWhole - 13) * 4 + 1 }, (_, index) => {
  const whole = 13 + Math.floor(index / 4);
  const fraction = index % 4;
  return Number(`${whole}.${fraction}`);
});
export const HEIGHT_OPTIONS_CREATE = heightValues(18);
export const HEIGHT_OPTIONS_EDIT = heightValues(18).concat([18.1, 18.2, 18.3]);

export function freshListing(ownerId: number): ListingData {
  return {
    name: "", owner_id: ownerId, location_country: "", location_radius_km: 0,
    disciplines: [], other_disciplines: [], levels: [], breeds: [], age: undefined,
    height_hands: undefined, height_cm: undefined, sex: "", colour: "", sire: "", dam: "", dam_sire: "",
    education_level: "", characteristics: [], description: "", additional_info: "",
    photos: [], videos: [], price_min: undefined, price_max: undefined, currency: "AUD",
  };
}

// Drafts and fetched horses can contain metadata; only existing form fields
// belong in a create/update request (never id, created_at or featured_order).
export function editableListingValues(values: ListingData): ListingData {
  const allowed = Object.keys(freshListing(values.owner_id));
  return Object.fromEntries(allowed.map(key => [key, values[key as keyof ListingData]])) as ListingData;
}

export function validateListingStep(mode: ListingMode, values: ListingData, step: ListingStep): string[] {
  const errors: string[] = [];
  if (step === "photos" && mode === "create" && values.photos.length < 1) errors.push("Add at least one photo of your horse.");
  if (step === "facts") {
    if (values.name.length < 2 || values.name.length > 50) errors.push("Enter a horse name between 2 and 50 characters.");
    if (mode === "create" && !Number.isFinite(values.owner_id)) errors.push("Your account could not be verified for this listing.");
    if (!values.location_country) errors.push("Choose a country.");
    if (!values.disciplines.length) errors.push("Choose a primary discipline.");
    if (mode === "create" && !values.levels.length) errors.push("Choose at least one competition level.");
    if (!values.breeds.length) errors.push("Choose at least one breed.");
    if (!Number.isFinite(values.age) || values.age === undefined || values.age < 0 || values.age > 30) errors.push("Choose a valid age.");
    if (values.height_hands !== "young_horse" && (typeof values.height_hands !== "number" || !Number.isFinite(values.height_hands) || values.height_hands < 10 || values.height_hands > 20)) errors.push("Choose a valid height.");
    if (values.height_cm !== undefined && !Number.isFinite(values.height_cm)) errors.push("Enter a valid height in centimetres.");
    if (!Number.isFinite(values.location_radius_km)) errors.push("Enter a valid location radius.");
    if (!values.sex) errors.push("Choose a sex.");
    if (mode === "create" && !values.colour) errors.push("Choose a colour.");
    if (mode === "create" && !values.education_level) errors.push("Choose an education level.");
  }
  if (step === "description" && mode === "create" && values.description.length < 1) errors.push("Add a description before continuing.");
  if (step === "price") {
    const minimum = mode === "create" ? 1 : 0;
    const minPrice = values.price_min === undefined && mode === "edit" ? 0 : values.price_min;
    const maxPrice = values.price_max === undefined && mode === "edit" ? 0 : values.price_max;
    if (!Number.isFinite(minPrice) || minPrice === undefined || minPrice < minimum) errors.push("Choose a valid minimum price.");
    if (!Number.isFinite(maxPrice) || maxPrice === undefined || maxPrice < minimum) errors.push("Choose a valid maximum price.");
    if (Number.isFinite(minPrice) && Number.isFinite(maxPrice) && minPrice !== undefined && maxPrice !== undefined && maxPrice < minPrice) errors.push("Maximum price must be at least the minimum price.");
    if (!values.currency) errors.push("Choose a currency.");
  }
  if (step === "preview" && mode === "create" && !values.photos.length) errors.push("Add at least one photo before publishing.");
  return errors;
}

export function validateListing(mode: ListingMode, values: ListingData): { step: ListingStep; message: string } | null {
  for (const step of ["photos", "facts", "description", "price", "preview"] as ListingStep[]) {
    const message = validateListingStep(mode, values, step)[0];
    if (message) return { step, message };
  }
  return null;
}
