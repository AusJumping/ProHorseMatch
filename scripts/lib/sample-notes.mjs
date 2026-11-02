// Remove only the known sample boilerplate, never rewrite a seller's narrative.
const stockNotice = "Fictional redesign sample, not for sale. Licensed Pexels stock photographs illustrate this profile; they may show different horses and do not identify a real horse for sale.";
const veterinaryNotice = "Veterinary history and suitability are fictional sample information only.";

export function stripSampleNotes(value) {
  if (typeof value !== "string") return value;
  return value.replaceAll(stockNotice, "").replaceAll(veterinaryNotice, "")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
