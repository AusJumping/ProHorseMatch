import type { Horse } from "@shared/schema";
import type { ReactNode } from "react";
import { getBuyerDetailFields, getBuyerPedigree } from "@/components/listing/listing-model";

export function HorseIdentity({ horse, className = "" }: { horse: Horse; className?: string }) {
  const pedigree = getBuyerPedigree(horse);
  const sire = pedigree.find(([label]) => label === "Sire")?.[1];
  const damSire = pedigree.find(([label]) => label === "Dam sire")?.[1];

  return (
    <div className={className}>
      <h1 className="break-words font-accent text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl">{horse.name}</h1>
      {(sire || damSire) && (
        <p className="mt-1.5 text-sm font-medium leading-snug text-neutral-600">
          {sire && damSire
            ? <>{sire} <span className="mx-1 text-[#a38448]">×</span> {damSire}</>
            : `${sire ? `Sire · ${sire}` : `Dam sire · ${damSire}`}`}
        </p>
      )}
    </div>
  );
}

function ListingCard({
  title,
  children,
  className = "",
  testId,
  titleId,
  sectionId,
  ariaLabel,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  testId?: string;
  titleId?: string;
  sectionId?: string;
  ariaLabel?: string;
}) {
  return (
    <section id={sectionId} data-testid={testId} aria-label={ariaLabel} aria-labelledby={titleId} className={`rounded-xl border border-[#e8e3d8] bg-white px-4 py-4 shadow-[0_2px_10px_rgba(78,65,43,0.035)] sm:px-5 ${className}`}>
      <h2 id={titleId} className="font-accent text-base font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}

export function HorseListingSections({
  horse,
  isOwner = false,
  pedigreeSectionId,
}: {
  horse: Horse;
  isOwner?: boolean;
  pedigreeSectionId?: string;
}) {
  const details = getBuyerDetailFields(horse).filter(([, value]) =>
    Boolean(value?.trim()) && !value.startsWith("Not specified") && !value.startsWith("null ")
  );
  const pedigree = getBuyerPedigree(horse);
  const sire = pedigree.find(([label]) => label === "Sire");
  const dam = pedigree.find(([label]) => label === "Dam");
  const damSire = pedigree.find(([label]) => label === "Dam sire");

  return (
    <div className="space-y-3.5">
      <ListingCard title="Key facts" testId="horse-key-facts" ariaLabel="Horse details">
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] font-medium tracking-wide text-neutral-500">{label}</dt>
              <dd className="mt-0.5 break-words text-sm font-semibold leading-snug text-neutral-900">{value}</dd>
            </div>
          ))}
          {horse.education_level && (
            <div className="min-w-0">
              <dt className="text-[11px] font-medium tracking-wide text-neutral-500">Education</dt>
              <dd className="mt-1">
                <span className="inline-flex max-w-full rounded-full border border-[#cdac6e]/45 bg-[#cdac6e]/10 px-2.5 py-1 text-xs font-semibold leading-snug text-neutral-800">
                  {horse.education_level}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </ListingCard>

      {pedigree.length > 0 ? (
        <ListingCard title="Pedigree" titleId="horse-pedigree-heading" sectionId={pedigreeSectionId} testId="horse-pedigree" className="[&>h2]:text-[#8b713c]">
          <div className="mt-3 border-l-2 border-[#cdac6e]/70 pl-3.5">
            {sire && (
              <div className="pb-2.5">
                <p className="text-[11px] font-medium tracking-wide text-neutral-500">{sire[0]}</p>
                <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-neutral-900">{sire[1]}</p>
              </div>
            )}
            {dam && (
              <div className={sire ? "border-t border-neutral-100 pt-2.5" : "pb-2.5"}>
                <p className="text-[11px] font-medium tracking-wide text-neutral-500">{dam[0]}</p>
                <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-neutral-900">{dam[1]}</p>
              </div>
            )}
            {damSire && (
              <div className={`${dam ? "ml-4 border-l border-[#cdac6e]/50 pl-3" : ""} ${sire || dam ? "mt-2 border-t border-neutral-100 pt-2.5" : ""}`}>
                <p className="text-[11px] font-medium tracking-wide text-neutral-500">{damSire[0]}</p>
                <p className="mt-0.5 break-words text-sm font-semibold leading-snug text-neutral-900">{damSire[1]}</p>
              </div>
            )}
          </div>
        </ListingCard>
      ) : (
        <p data-testid="horse-pedigree-note" className="px-1 py-1 text-xs leading-5 text-neutral-500">
          {isOwner
            ? "Add pedigree details to help buyers understand this horse’s breeding."
            : "Pedigree not provided by seller"}
        </p>
      )}

      <ListingCard title={`About ${horse.name}`} testId="horse-about" titleId="horse-about-heading">
        <p className="mt-2 max-w-[62ch] whitespace-pre-wrap text-sm leading-[1.55] text-neutral-700">
          {horse.description || "No description provided."}
        </p>
      </ListingCard>

      {horse.additional_info && (
        <ListingCard title="Additional information" testId="horse-additional-information" titleId="horse-additional-information-heading">
          <p className="mt-2 max-w-[62ch] whitespace-pre-wrap text-sm leading-[1.55] text-neutral-700">{horse.additional_info}</p>
        </ListingCard>
      )}
    </div>
  );
}
