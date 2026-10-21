// Public, crawler-readable versions of horse listing pages.
//
// The app is a single-page React app, so a search engine or AI tool that does not run
// JavaScript only ever saw an empty shell. These helpers put each listing's details into the
// page HTML itself (title, description, structured data and plain text). React still takes
// over in the browser exactly as before, so people see no difference.

export const SITE_NAME = "Pro Horse Match";

type HorseLike = {
  id: number;
  name: string;
  location_country?: string | null;
  disciplines?: string[] | null;
  levels?: string[] | null;
  breeds?: string[] | null;
  age?: number | null;
  height_hands?: number | null;
  height_cm?: number | null;
  sex?: string | null;
  colour?: string | null;
  sire?: string | null;
  dam?: string | null;
  dam_sire?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  currency?: string | null;
  description?: string | null;
  photos?: string[] | null;
  created_at?: Date | string | null;
};

const NO_MAX_PRICE = 999999999;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: unknown): string {
  return escapeHtml(value);
}

// Safe to place inside <script type="application/ld+json">
function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function words(value: string): string {
  const cleaned = value.replace(/[_-]+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

const CURRENCY_SYMBOLS: Record<string, string> = { AUD: "A$", NZD: "NZ$", USD: "US$", EUR: "€", GBP: "£" };

function money(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${amount.toLocaleString("en-AU")}`;
}

export function priceText(horse: HorseLike): string | null {
  const min = horse.price_min ?? 0;
  const max = horse.price_max ?? 0;
  const currency = (horse.currency || "AUD").toUpperCase();
  if (min <= 0 && (max <= 0 || max >= NO_MAX_PRICE)) return null;
  if (max >= NO_MAX_PRICE || max === min || max <= 0) return money(min, currency);
  if (min <= 0) return `up to ${money(max, currency)}`;
  return `${money(min, currency)} to ${money(max, currency)}`;
}

function heightText(horse: HorseLike): string | null {
  if (horse.height_hands) return `${horse.height_hands}hh`;
  if (horse.height_cm) return `${horse.height_cm}cm`;
  return null;
}

// "8yo 16.2hh bay Warmblood gelding" style one-liner
export function summaryLine(horse: HorseLike): string {
  const parts: string[] = [];
  if (horse.age) parts.push(`${horse.age}yo`);
  const height = heightText(horse);
  if (height) parts.push(height);
  if (horse.colour) parts.push(horse.colour.toLowerCase());
  if (horse.breeds?.length) parts.push(horse.breeds.map(words).join(" / "));
  if (horse.sex) parts.push(horse.sex.toLowerCase());
  return parts.join(" ");
}

function facts(horse: HorseLike): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value && value.trim()) rows.push([label, value.trim()]);
  };
  add("Age", horse.age ? `${horse.age} years` : null);
  add("Height", heightText(horse));
  add("Colour", horse.colour ? words(horse.colour) : null);
  add("Sex", horse.sex ? words(horse.sex) : null);
  add("Breed", horse.breeds?.length ? horse.breeds.map(words).join(", ") : null);
  add("Discipline", horse.disciplines?.length ? horse.disciplines.map(words).join(", ") : null);
  add("Level", horse.levels?.length ? horse.levels.join(", ") : null);
  add("Sire", horse.sire);
  add("Dam", horse.dam);
  add("Dam sire", horse.dam_sire);
  add("Location", horse.location_country);
  add("Price", priceText(horse));
  return rows;
}

function absoluteUrl(url: string, baseUrl: string): string {
  return url.startsWith("/") ? `${baseUrl}${url}` : url;
}

export function pageTitle(horse: HorseLike): string {
  const kind = [horse.age ? `${horse.age}yo` : null, horse.breeds?.[0] ? words(horse.breeds[0]) : null, horse.sex ? horse.sex.toLowerCase() : null]
    .filter(Boolean)
    .join(" ");
  const title = kind ? `${horse.name} | ${kind} for sale` : `${horse.name} | Horse for sale`;
  return `${title} | ${SITE_NAME}`;
}

export function pageDescription(horse: HorseLike): string {
  const bits = [summaryLine(horse)];
  const discipline = horse.disciplines?.length ? words(horse.disciplines[0]) : null;
  if (discipline) bits.push(discipline);
  if (horse.levels?.length) bits.push(horse.levels[0]);
  if (horse.location_country) bits.push(horse.location_country);
  const price = priceText(horse);
  if (price) bits.push(price);
  const text = `${bits.filter(Boolean).join(", ")}. Horse for sale on ${SITE_NAME}.`;
  return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}

export function structuredData(horse: HorseLike, baseUrl: string): object {
  const url = `${baseUrl}/horse/${horse.id}`;
  const currency = (horse.currency || "AUD").toUpperCase();
  const min = horse.price_min ?? 0;
  const max = horse.price_max ?? 0;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: horse.name,
    category: "Horse",
    description: pageDescription(horse),
    url,
    additionalProperty: facts(horse)
      .filter(([label]) => label !== "Price")
      .map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
  };
  const photos = (horse.photos ?? []).filter(Boolean).slice(0, 6).map(p => absoluteUrl(p, baseUrl));
  if (photos.length) data.image = photos;

  if (min > 0 || (max > 0 && max < NO_MAX_PRICE)) {
    const hasRange = max > min && max < NO_MAX_PRICE && min > 0;
    data.offers = hasRange
      ? { "@type": "AggregateOffer", priceCurrency: currency, lowPrice: min, highPrice: max, availability: "https://schema.org/InStock", url }
      : { "@type": "Offer", priceCurrency: currency, price: min > 0 ? min : max, availability: "https://schema.org/InStock", url };
  }
  return data;
}

const MAX_DESCRIPTION_CHARS = 6000;

function bodyHtml(horse: HorseLike, baseUrl: string): string {
  const rows = facts(horse)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  const paragraphs = (horse.description ?? "")
    .slice(0, MAX_DESCRIPTION_CHARS)
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const photo = horse.photos?.find(Boolean);
  const image = photo ? `<img src="${escapeHtml(absoluteUrl(photo, baseUrl))}" alt="${escapeHtml(horse.name)}" width="600">` : "";
  return (
    `<main class="seo-fallback" style="max-width:720px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#2b2b2b">` +
    `<h1>${escapeHtml(horse.name)}</h1>` +
    `<p>${escapeHtml(summaryLine(horse))}</p>` +
    image +
    `<dl>${rows}</dl>` +
    paragraphs +
    `<p><a href="${escapeHtml(baseUrl)}/">${SITE_NAME}: find and list performance horses</a></p>` +
    `</main>`
  );
}

// Takes the built index.html and returns it with this listing's details filled in.
export function buildHorsePage(template: string, horse: HorseLike, baseUrl: string): string {
  const title = escapeHtml(pageTitle(horse));
  const description = escapeHtml(pageDescription(horse));
  const url = escapeHtml(`${baseUrl}/horse/${horse.id}`);
  const photo = horse.photos?.find(Boolean);

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  html = html.replace(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="product" />`);

  const extra =
    `<link rel="canonical" href="${url}" />` +
    `<meta property="og:url" content="${url}" />` +
    `<meta property="og:site_name" content="${SITE_NAME}" />` +
    (photo ? `<meta property="og:image" content="${escapeHtml(absoluteUrl(photo, baseUrl))}" />` : "") +
    `<meta name="twitter:card" content="${photo ? "summary_large_image" : "summary"}" />` +
    `<script type="application/ld+json">${jsonForScript(structuredData(horse, baseUrl))}</script>`;
  html = html.replace(/<\/head>/i, `${extra}</head>`);
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${bodyHtml(horse, baseUrl)}</div>`);
  return html;
}

export function robotsTxt(baseUrl: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /messages",
    "Disallow: /profile",
    "Disallow: /auth",
    "Disallow: /verify-email",
    "Disallow: /subscription",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

export function sitemapXml(horses: HorseLike[], baseUrl: string): string {
  const urls = [`<url><loc>${escapeXml(baseUrl + "/")}</loc></url>`];
  for (const horse of horses) {
    const created = horse.created_at ? new Date(horse.created_at) : null;
    const lastmod = created && !isNaN(created.getTime()) ? `<lastmod>${created.toISOString().slice(0, 10)}</lastmod>` : "";
    urls.push(`<url><loc>${escapeXml(`${baseUrl}/horse/${horse.id}`)}</loc>${lastmod}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
