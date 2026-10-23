import { useState } from "react";
import { Helmet } from "react-helmet";
import { ArrowDown, ArrowRight, Check, Heart, MapPin, MessageCircle, Search, SlidersHorizontal } from "lucide-react";
import logo from "@/assets/logo-filter.png";
import auditText from "@/docs/design-audit.md?raw";
import { previewContrast } from "@/lib/style-preview";
import "./style-preview.css";

const palette = [
  { name: "Charcoal", hex: "#2b2b2b", role: "Primary / text", className: "sp-swatch-charcoal" },
  { name: "Gold", hex: "#cdac6e", role: "Accent / emphasis", className: "sp-swatch-gold" },
  { name: "Warm neutral", hex: "#e4e2dd", role: "Canvas / secondary", className: "sp-swatch-neutral" },
  { name: "White", hex: "#ffffff", role: "Cards / breathing room", className: "sp-swatch-white" },
];

const contrastPairs = [
  { label: "Charcoal on white", foreground: "#2b2b2b", background: "#ffffff" },
  { label: "Charcoal on warm neutral", foreground: "#2b2b2b", background: "#e4e2dd" },
  { label: "Charcoal on gold", foreground: "#2b2b2b", background: "#cdac6e" },
  { label: "White on charcoal", foreground: "#ffffff", background: "#2b2b2b" },
];

const iconSamples = [
  { name: "Search", Icon: Search },
  { name: "Favourite", Icon: Heart },
  { name: "Message", Icon: MessageCircle },
  { name: "Location", Icon: MapPin },
  { name: "Filter", Icon: SlidersHorizontal },
];

export default function StylePreview() {
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [demoStatus, setDemoStatus] = useState("Try an enabled sample. Nothing is sent or saved to an account.");
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  const [imageAttempt, setImageAttempt] = useState(0);

  const retryImage = () => {
    setImageState("loading");
    setImageAttempt((attempt) => attempt + 1);
  };

  return (
    <div className="phm-style-preview" id="sp-top">
      <Helmet>
        <title>Style proposal · ProHorseMatch</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="googlebot" content="noindex, nofollow, noarchive" />
      </Helmet>
      <a className="sp-skip" href="#sp-main">Skip to style proposal</a>
      <header className="sp-header">
        <div className="sp-wrap sp-header-inner">
          <img className="sp-logo" src={logo} width="112" height="80" alt="Pro Horse Match" />
          <div className="sp-header-note">
            <span className="sp-pill">Style proposal</span>
            <p>For review, not rollout</p>
          </div>
        </div>
      </header>

      <main id="sp-main" tabIndex={-1}>
        <section className="sp-wrap sp-hero" aria-labelledby="sp-title">
          <div className="sp-intro">
            <p className="sp-eyebrow">The same brand. A quieter frame.</p>
            <div className="sp-intro-rule" aria-hidden="true" />
            <h1 id="sp-title">A little less interface.<br />A lot more horse.</h1>
            <p>A calm, confident direction for ProHorseMatch. Familiar colours, considered type, and space for the horse to make the first impression.</p>
            <a className="sp-btn" href="#sp-foundations">Explore the style <ArrowDown aria-hidden="true" /></a>
            <div className="sp-intro-foot">
              <p>One page. One proposed system.<br />Your existing logo and colours, unchanged.</p>
              <a className="sp-text-link" href="#sp-audit">Read the audit notes <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>

          <div>
            <article className="sp-horse-card" aria-labelledby="sp-horse-name">
              <div className="sp-photo" aria-busy={imageState === "loading"}>
                {imageState === "error" ? (
                  <div className="sp-image-fallback" role="alert">
                    <h3>The photograph could not load.</h3>
                    <p>The sample details below are still available.</p>
                    <button className="sp-btn" type="button" onClick={retryImage}>Retry photograph</button>
                  </div>
                ) : (
                  <>
                    <img
                      key={imageAttempt}
                      src={`/style-preview/horse.jpg${imageAttempt ? `?retry=${imageAttempt}` : ""}`}
                      alt="A dark bay horse standing among grasses beside a paddock fence. Photograph used only as a fictional illustration."
                      width="660"
                      height="1024"
                      fetchPriority="high"
                      onLoad={() => setImageState("ready")}
                      onError={() => setImageState("error")}
                    />
                    {imageState === "loading" && <div className="sp-photo-loading" role="status" aria-label="Loading horse photograph" />}
                  </>
                )}
                {imageState !== "error" && <span className="sp-photo-label">Fictional illustration</span>}
                <button
                  className="sp-save"
                  type="button"
                  aria-label={saved ? "Remove fictional horse from preview favourites" : "Save fictional horse to preview favourites"}
                  aria-pressed={saved}
                  onClick={() => setSaved((value) => !value)}
                >
                  {saved ? <Check aria-hidden="true" /> : <Heart aria-hidden="true" />}
                </button>
              </div>
              <div className="sp-card-body">
                <div className="sp-card-heading">
                  <h2 id="sp-horse-name">Arden</h2>
                  <span>Illustrative profile</span>
                </div>
                <p className="sp-card-meta"><span>8 years</span><span>Gelding</span><span>Warmblood</span></p>
                <p className="sp-location"><MapPin aria-hidden="true" /> Southern Highlands, NSW</p>
                <button className="sp-btn" type="button" aria-expanded={expanded} aria-controls="sp-horse-detail" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? "Close sample profile" : "View sample profile"} <ArrowRight aria-hidden="true" />
                </button>
                  <div className="sp-card-detail" id="sp-horse-detail" hidden={!expanded}>
                    <h3>A profile, not a listing</h3>
                    <p>Arden is an invented name. All profile details are fictional and do not describe the photographed horse. This is a style demonstration, with no seller, price, enquiry or payment attached.</p>
                  </div>
                <p role="status" aria-live="polite">{saved ? "Saved in this preview only. Refreshing clears it." : "Sample only. No live listing or account connection."}</p>
              </div>
            </article>
            <p className="sp-caption">The proposed card: photograph first, 16px corners, a subtle shadow. No heavy frame.</p>
          </div>
        </section>

        <div className="sp-foundations" id="sp-foundations">
          <div className="sp-wrap">
            <section className="sp-section" aria-labelledby="sp-colours">
              <div className="sp-section-head">
                <div className="sp-section-index"><span>01</span><h2 id="sp-colours">Familiar colours. Clear roles.</h2></div>
                <p>No new palette. Charcoal leads, gold adds a little emphasis, and warm neutral gives the photography room.</p>
              </div>
              <div className="sp-swatches">
                {palette.map((colour) => (
                  <figure className="sp-swatch" key={colour.hex}>
                    <div className={`sp-swatch-block ${colour.className}`}>{colour.hex}</div>
                    <figcaption>{colour.name}<span>{colour.role}</span></figcaption>
                  </figure>
                ))}
              </div>
              <h3>Text contrast, checked</h3>
              <dl className="sp-contrast">
                {contrastPairs.map((pair) => (
                  <div key={pair.label}>
                    <dt>{pair.label}</dt>
                    <dd>{previewContrast(pair.foreground, pair.background).toFixed(2)}:1 · AA pass</dd>
                  </div>
                ))}
              </dl>
              <p className="sp-note">All four opaque text pairs exceed WCAG AA’s 4.5:1 requirement for normal text. Gold carries charcoal type, never small white type. Ratios alone do not establish outdoor visibility or full accessibility.</p>
            </section>

            <section className="sp-section" aria-labelledby="sp-type">
              <div className="sp-section-head">
                <div className="sp-section-index"><span>02</span><h2 id="sp-type">Type with a steady rhythm.</h2></div>
                <p>Montserrat for headings. Inter for reading. Three heading levels, no oversized display type. Logo lettering remains exactly as supplied.</p>
              </div>
              <div className="sp-type-row">
                <div className="sp-type-label"><strong>Heading 1</strong><span>Montserrat · 600 · 32px / 40px</span></div>
                <p className="sp-type-h1">Find your next partnership.</p>
              </div>
              <div className="sp-type-row">
                <div className="sp-type-label"><strong>Heading 2</strong><span>Montserrat · 600 · 24px / 32.4px</span></div>
                <p className="sp-type-h2">A horse worth getting to know.</p>
              </div>
              <div className="sp-type-row">
                <div className="sp-type-label"><strong>Heading 3</strong><span>Montserrat · 600 · 20px / 28px</span></div>
                <p className="sp-type-h3">The details that matter.</p>
              </div>
              <div className="sp-type-row">
                <div className="sp-type-label"><strong>Body</strong><span>Inter · 400 · 16px / 24px</span></div>
                <p>Good photographs start a conversation. Clear, comfortable-to-read details help you decide what comes next. A little space makes both easier to appreciate.</p>
              </div>
            </section>

            <section className="sp-section" aria-labelledby="sp-controls">
              <div className="sp-section-head">
                <div className="sp-section-index"><span>03</span><h2 id="sp-controls">Two buttons. No guesswork.</h2></div>
                <p>48px minimum touch targets, 12px corners, and a visible charcoal keyboard-focus outline. The focus samples show that outline permanently for inspection.</p>
              </div>
              <div className="sp-button-grid">
                {(["primary", "secondary"] as const).map((variant) => (
                  <div className="sp-button-column" key={variant}>
                    <h3>{variant === "primary" ? "Primary · charcoal" : "Secondary · warm neutral"}</h3>
                    <div>
                      <p>Default / try me</p>
                      <button type="button" className={`sp-btn ${variant === "secondary" ? "sp-btn-secondary" : ""}`} onClick={() => setDemoStatus(`${variant === "primary" ? "Primary" : "Secondary"} button activated. This is a local style sample only.`)}>
                        {variant === "primary" ? "View horse" : "Back to results"} <ArrowRight aria-hidden="true" />
                      </button>
                    </div>
                    <div>
                      <p>Focus / tab to inspect</p>
                      <button type="button" className={`sp-btn sp-focus-sample ${variant === "secondary" ? "sp-btn-secondary" : ""}`} onClick={() => setDemoStatus(`${variant === "primary" ? "Primary" : "Secondary"} focus sample activated. Use Tab to inspect real keyboard focus.`)}>
                        {variant === "primary" ? "View horse" : "Back to results"} <ArrowRight aria-hidden="true" />
                      </button>
                    </div>
                    <div>
                      <p>Disabled / unavailable</p>
                      <button type="button" className={`sp-btn ${variant === "secondary" ? "sp-btn-secondary" : ""}`} disabled>
                        {variant === "primary" ? "View horse" : "Back to results"} <ArrowRight aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="sp-demo-status" role="status" aria-live="polite">{demoStatus}</p>
              <p className="sp-note">Disabled controls use native disabled behaviour, reduced opacity and a dashed boundary. They are intentionally unavailable; their text is exempt from the active-control contrast requirement.</p>
            </section>

            <section className="sp-section" aria-labelledby="sp-details">
              <div className="sp-section-head">
                <div className="sp-section-index"><span>04</span><h2 id="sp-details">Small details. One language.</h2></div>
                <p>A repeatable spacing scale and one family of outline icons keep the interface composed, without making it the centre of attention.</p>
              </div>
              <div className="sp-spec-pair">
                <div>
                  <h3>Space to breathe</h3>
                  <div className="sp-spacing">
                    {[8, 16, 24, 32].map((space) => <div className="sp-spacing-row" key={space}><span>{space}px</span><i style={{ width: space }} aria-hidden="true" /><p>{space === 8 ? "Within a group" : space === 16 ? "Between details" : space === 24 ? "Inside the card" : "Between sections"}</p></div>)}
                  </div>
                </div>
                <div>
                  <h3>Lucide, always outline</h3>
                  <ul className="sp-icon-list">
                    {iconSamples.map(({ name, Icon }) => <li key={name}><Icon aria-hidden="true" /><span>{name}</span></li>)}
                  </ul>
                  <p className="sp-note">24px here; 20px alongside text. A consistent 1.75px stroke, no filled glyphs. Icon-only controls have accessible names and 48px targets.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="sp-wrap sp-audit" id="sp-audit" aria-labelledby="sp-audit-title">
          <div className="sp-audit-top">
            <div className="sp-section-index"><span>05</span><h2 id="sp-audit-title">Reviewed before redesigning.</h2></div>
            <p>Every active route and its shared presentation components were reviewed in source before this proposal was built. This is a code audit, not a claim that signed-in screens were visually tested.</p>
          </div>
          <ul>
            <li>Typography currently mixes Playfair Display, Montserrat and utility defaults.</li>
            <li>Gold and neutral shades vary. Small white-on-gold controls need contrast correction in any approved rollout.</li>
            <li>Button targets, card corners, shadows, spacing and icon sizes vary across buying, selling and account screens.</li>
            <li>Forms, dialogs, loading, error, empty and payment-disabled branches were inspected in code. Unused alternate pages are identified separately.</li>
          </ul>
          <p><strong>Not changed:</strong> existing pages, navigation, authentication, listings, payments, notifications, logos and global styles. This page is static and sandbox-only. Wider changes require your explicit approval.</p>
          <details>
            <summary>Read the complete page-by-page source audit</summary>
            <pre>{auditText}</pre>
          </details>
          <div className="sp-license">
            <h3>Photograph &amp; illustration note</h3>
            <p>The local horse photograph is used under the Unsplash License. The horse’s name and all profile attributes above are invented for this proposal, not claims about the photographed horse.</p>
            <p><a href="https://images.unsplash.com/photo-1603989888581-3115416784fa" target="_blank" rel="noreferrer">Original photograph</a>{" · "}<a href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a></p>
          </div>
        </section>
      </main>
      <footer className="sp-wrap sp-footer">
        <p>ProHorseMatch · Style proposal<br />An isolated direction for review. Nothing applied elsewhere.</p>
        <a href="#sp-top">Back to top <ArrowDown style={{ transform: "rotate(180deg)", marginLeft: 8 }} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
