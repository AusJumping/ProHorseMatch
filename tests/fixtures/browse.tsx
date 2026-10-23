// Isolated component fixture, never imported by the app or connected to its API.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { CurrencyProvider } from "../../client/src/contexts/CurrencyContext";
import BrowseHorseGrid from "../../client/src/components/browse/BrowseHorseGrid";
import BrowseQuickFilters, { type QuickFilterValues } from "../../client/src/components/browse/BrowseQuickFilters";
import type { Horse, Match } from "../../shared/schema";

const listings = ["Arden", "Bellamy", "Caspian"].map((name, index) => ({
  id: index + 1, name, photos: ["/horse.jpg"], disciplines: [["Jumping", "Dressage", "Eventing"][index]],
  age: 6 + index, height_hands: 16.2, location_country: "Australia",
  price_min: 50000 + index * 25000, price_max: 50000 + index * 25000, currency: "AUD",
  created_at: index === 0 ? new Date() : new Date(Date.now() - 10 * 86400000),
})) as Horse[];

function Fixture() {
  const [filters, setFilters] = useState<QuickFilterValues>({
    disciplines: [], price_min: null, price_max: null, height_min: null, height_max: null,
    age_min: null, age_max: null, currency: "AUD",
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const mode = new URLSearchParams(window.location.search).get("state");
  const shown = listings.filter((horse) => (
    (!filters.disciplines.length || filters.disciplines.includes(horse.disciplines[0])) &&
    (filters.price_min === null || horse.price_max >= filters.price_min) &&
    (filters.price_max === null || horse.price_min <= filters.price_max) &&
    (filters.age_min === null || horse.age >= filters.age_min) &&
    (filters.age_max === null || horse.age <= filters.age_max) &&
    (filters.height_min === null || (horse.height_hands ?? 0) >= filters.height_min) &&
    (filters.height_max === null || (horse.height_hands ?? 0) <= filters.height_max)
  ));
  return (
    <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 16px", background: "white" }}>
      <p style={{ fontSize: 12, marginBottom: 20 }}>Component test only · Fictional horses · No database or account access</p>
      <h1 className="mb-7 font-display text-3xl">Find your next great horse.</h1>
      <BrowseQuickFilters
        activeFilters={filters}
        onDisciplineToggle={(discipline) => setFilters((previous) => ({
          ...previous, disciplines: previous.disciplines.includes(discipline) ? [] : [discipline],
        }))}
        onApplyRange={(key, range) => setFilters((previous) => ({
          ...previous, [`${key}_min`]: range?.[0] ?? null, [`${key}_max`]: range?.[1] ?? null,
        }))}
      />
      <p className="mb-5" aria-live="polite">{mode === "empty" ? 0 : shown.length} horses</p>
      <BrowseHorseGrid
        horses={mode === "empty" ? [] : shown} matches={matches} pendingSaveIds={new Set()}
        isLoading={mode === "loading"} isError={mode === "error"}
        onRetry={() => window.location.assign("/")}
        onToggleSaved={async (id, isSaved) => {
          setMatches((previous) => [...previous.filter((match) => match.horse_id !== id), {
            id, horse_id: id, is_liked: !isSaved,
          } as Match]);
          return true;
        }}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<CurrencyProvider><Fixture /></CurrencyProvider>);
