import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Heart } from "lucide-react";
import type { Horse, Match } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHorseHeight, isRecentlyAdded } from "@/components/browse/presentation";
import { ownsHorse } from "@shared/horsePermissions";

interface BrowseHorseGridProps {
  currentUserId?: number;
  horses?: Horse[];
  matches?: Match[];
  pendingSaveIds: Set<number>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onToggleSaved: (horseId: number, isSaved: boolean) => Promise<boolean>;
}

function HorsePhoto({ horse }: { horse: Horse }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const photo = horse.photos?.find((item) => Boolean(item?.trim()));
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [photo]);

  return (
    <div className="relative aspect-[1.42/1] overflow-hidden rounded-[1.1rem] bg-[#e8e7e3]">
      {photo && !failed ? (
        <>
          {!loaded ? <div className="absolute inset-0 motion-safe:animate-pulse bg-[#e3e2de]" aria-hidden="true" /> : null}
          <img
            src={photo}
            alt={`${horse.name}, horse for sale`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover motion-safe:transition-opacity motion-safe:duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#e8e7e3] px-5 text-center text-sm text-[#57564f]">
          <span className="h-8 w-8 rounded-full border border-[#c9c8c1]" aria-hidden="true" />
          <span>Photo unavailable</span>
        </div>
      )}
      {isRecentlyAdded(horse.created_at) ? (
        <span className="absolute left-4 top-4 rounded-full bg-[#cdac6e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
          New
        </span>
      ) : null}
    </div>
  );
}

function HorseListing({
  horse,
  isSaved,
  isPending,
  isOwnerHorse,
  onToggleSaved,
}: {
  horse: Horse;
  isSaved: boolean;
  isPending: boolean;
  isOwnerHorse: boolean;
  onToggleSaved: (horseId: number, isSaved: boolean) => Promise<boolean>;
}) {
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);

  useEffect(() => {
    if (optimisticSaved === isSaved) setOptimisticSaved(null);
  }, [isSaved, optimisticSaved]);

  const saved = optimisticSaved ?? isSaved;
  const discipline = horse.disciplines?.[0] || "Discipline unlisted";
  const level = horse.levels?.[0];
  const age = horse.age === null || horse.age === undefined ? null : `${horse.age}yo`;
  const sex = horse.sex ? horse.sex.charAt(0).toUpperCase() + horse.sex.slice(1).toLowerCase() : null;
  const heightHands = horse.height_hands as number | string | null | undefined;
  const height = heightHands === "young_horse"
    ? "Young horse"
    : heightHands === null || heightHands === undefined || heightHands === ""
      ? null
      : formatHorseHeight(heightHands);
  const colour = horse.colour ? horse.colour.charAt(0).toUpperCase() + horse.colour.slice(1).toLowerCase() : null;
  const details = [[age, sex].filter(Boolean).join(" "), height, colour].filter(Boolean).join(" · ");
  const sire = horse.sire?.trim();
  const damSire = horse.dam_sire?.trim();
  const pedigree = sire && damSire
    ? `${sire} x ${damSire}`
    : sire
      ? `By ${sire}`
      : damSire
        ? `Dam Sire: ${damSire}`
        : null;
  return (
    <article className="group relative min-w-0">
      <Link
        href={`/horse/${horse.id}`}
        aria-label={`View ${horse.name}'s profile`}
        className="absolute inset-0 z-0 rounded-[1.2rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
      />
      <div className="relative z-10 pointer-events-none">
        <div className="relative">
          <HorsePhoto horse={horse} />
          {!isOwnerHorse ? <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={saved ? `Remove ${horse.name} from saved horses` : `Save ${horse.name}`}
            aria-pressed={saved}
            disabled={isPending}
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              if (isPending) return;
              const nextState = !saved;
              setOptimisticSaved(nextState);
              const success = await onToggleSaved(horse.id, saved);
              if (!success) setOptimisticSaved(null);
            }}
            className={`pointer-events-auto absolute right-4 top-4 h-11 w-11 rounded-full border border-black/5 bg-background/95 shadow-sm transition-transform motion-safe:duration-200 hover:scale-105 hover:bg-background disabled:opacity-60 ${
              saved ? "text-[#2b2b2b]" : "text-[#3d3b35]"
            }`}
          >
            <Heart className={`h-[1.15rem] w-[1.15rem] ${saved ? "fill-[#cdac6e]" : ""}`} strokeWidth={1.8} />
          </Button> : null}
        </div>
        <div className="px-1 pb-1 pt-4">
          <h2 className="font-accent text-[1.25rem] font-bold leading-tight tracking-[-0.025em] text-foreground transition-colors group-hover:text-secondary">
            {horse.name}
          </h2>
          {pedigree ? (
            <p data-horse-pedigree className="mt-1 truncate text-xs leading-relaxed text-muted-foreground" title={pedigree}>
              {pedigree}
            </p>
          ) : null}
          <p className="mt-2 truncate text-[0.82rem] font-medium leading-relaxed text-foreground/80">
            {discipline}{level ? ` · ${level}` : ""}
          </p>
          {details ? <p className="mt-1 truncate text-[0.78rem] leading-relaxed text-muted-foreground">{details}</p> : null}
          <Link
            href={`/horse/${horse.id}`}
            className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.02em] text-secondary hover:underline"
            aria-label={`View ${horse.name}`}
          >
            View horse <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BrowseHorsePreview({ horse }: { horse: Horse }) {
  const discipline = horse.disciplines?.[0] || "Discipline unlisted";
  const level = horse.levels?.[0];
  const age = horse.age === null || horse.age === undefined ? null : `${horse.age}yo`;
  const sex = horse.sex ? horse.sex.charAt(0).toUpperCase() + horse.sex.slice(1).toLowerCase() : null;
  const heightHands = horse.height_hands as number | string | null | undefined;
  const height = heightHands === "young_horse"
    ? "Young horse"
    : heightHands === null || heightHands === undefined || heightHands === ""
      ? null
      : formatHorseHeight(heightHands);
  const colour = horse.colour ? horse.colour.charAt(0).toUpperCase() + horse.colour.slice(1).toLowerCase() : null;
  const details = [[age, sex].filter(Boolean).join(" "), height, colour].filter(Boolean).join(" · ");
  const sire = horse.sire?.trim();
  const damSire = horse.dam_sire?.trim();
  const pedigree = sire && damSire ? `${sire} x ${damSire}` : sire ? `By ${sire}` : damSire ? `Dam Sire: ${damSire}` : null;
  return (
    <article className="group relative min-w-0">
      <div className="relative">
        <HorsePhoto horse={horse} />
        <Button type="button" variant="ghost" size="icon" disabled aria-label="Save horse (preview only; no changes will be made)"
          className="absolute right-4 top-4 h-11 w-11 rounded-full border border-black/5 bg-background/95 text-[#3d3b35] opacity-70 shadow-sm">
          <Heart className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.8} />
        </Button>
      </div>
      <div className="px-1 pb-1 pt-4">
        <h2 className="font-accent text-[1.25rem] font-bold leading-tight tracking-[-0.025em] text-foreground">{horse.name || "Your horse"}</h2>
        {pedigree ? <p data-horse-pedigree className="mt-1 truncate text-xs leading-relaxed text-muted-foreground" title={pedigree}>{pedigree}</p> : null}
        <p className="mt-2 truncate text-[0.82rem] font-medium leading-relaxed text-foreground/80">{discipline}{level ? ` · ${level}` : ""}</p>
        {details ? <p className="mt-1 truncate text-[0.78rem] leading-relaxed text-muted-foreground">{details}</p> : null}
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.02em] text-secondary">View horse <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
      </div>
    </article>
  );
}

export default function BrowseHorseGrid({
  currentUserId,
  horses,
  matches = [],
  pendingSaveIds,
  isLoading,
  isError,
  onRetry,
  onToggleSaved,
}: BrowseHorseGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 md:gap-x-7 md:gap-y-9 lg:grid-cols-3 2xl:grid-cols-4" aria-label="Loading horses">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-4">
            <Skeleton className="aspect-[1.42/1] w-full rounded-[1.1rem] bg-[#e8e7e3]" />
            <Skeleton className="h-6 w-2/3 bg-[#e8e7e3]" />
            <Skeleton className="h-4 w-full bg-[#e8e7e3]" />
            <Skeleton className="h-5 w-1/3 bg-[#e8e7e3]" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <section className="flex min-h-[25rem] flex-col items-center justify-center rounded-[1.25rem] bg-[#f0efeb] px-6 py-14 text-center">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-secondary">A brief pause</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">We couldn’t load the listings.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Your filters are still here. Try again when you’re ready.</p>
        <Button onClick={onRetry} className="mt-6 rounded-full px-6">Retry search</Button>
      </section>
    );
  }

  if (!horses?.length) {
    return (
      <section className="flex min-h-[25rem] flex-col items-center justify-center rounded-[1.25rem] bg-[#f0efeb] px-6 py-14 text-center">
        <p className="font-accent text-xs font-bold uppercase tracking-[0.18em] text-secondary">0 horses found</p>
        <h2 className="mt-3 font-display text-3xl text-foreground">Nothing in this range just yet.</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Try widening your filters. The right match may be one small change away.</p>
      </section>
    );
  }

  const likedHorseIds = new Set(matches.filter((match) => match.is_liked).map((match) => match.horse_id));
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-7 md:grid-cols-2 md:gap-x-7 md:gap-y-9 lg:grid-cols-3 2xl:grid-cols-4">
      {horses.map((horse) => (
        <HorseListing
          key={horse.id}
          horse={horse}
          isSaved={likedHorseIds.has(horse.id)}
          isPending={pendingSaveIds.has(horse.id)}
          isOwnerHorse={currentUserId === undefined || ownsHorse(currentUserId, horse)}
          onToggleSaved={onToggleSaved}
        />
      ))}
    </div>
  );
}
