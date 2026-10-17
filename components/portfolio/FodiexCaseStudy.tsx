"use client";

/**
 * Case study: FODIEX, food delivery platform (/work/fodiex).
 * Light page: no WebGL, one IntersectionObserver for reveals.
 * Content sourced from all FODIEX Figma pages: Database Design, Vendor, Driver (Rider),
 * Customer, Admin and Animations. Values marked TODO are placeholders.
 */
import { useEffect, useRef } from "react";
import FigmaGallery from "./FigmaGallery";

const PLAY_URL = ""; // TODO: paste the Play Store link

const META: Array<[string, string]> = [
  ["Role", "Solo · Product, design, engineering"],
  ["Product", "4 apps · Customer, Vendor, Rider, Admin"],
  ["Stack", "Flutter · Supabase Postgres · Cloudflare · MongoDB"],
  ["Market", "Nepal · eSewa, Khalti & cash"],
  ["Status", "Live on Google Play"],
];

type Card = { n: string; tag: string; color: string; title: string; body: string; points?: string[]; decision?: string };

const APPS: Card[] = [
  {
    n: "01", tag: "Customer app · 18 flows", color: "#FFC27A", title: "From craving to doorstep",
    body: "Set a delivery location by GPS or saved address, browse restaurants by cuisine and filters, customise dishes in a bottom sheet with required and optional choices, then check out with eSewa, Khalti or cash. Tracking moves through Preparing, On the way, Arriving and Delivered with an arrival alert and delivery proof.",
    points: [
      "Home feed with promo carousel, categories, restaurant & dish cards (with skeleton loaders)",
      "Sort & filter sheet with accordion filters and filter chips",
      "Cart with quantity edits, fees, promo codes and coupon success badge",
      "Address book, orders history, reorder and invoices",
      "Ratings with animated faces and rider tips",
      "Designed empty & error states: closed, outside service area, payment failed (cart kept)",
      "Profile, notifications and cancellation with policy & refund status",
    ],
  },
  {
    n: "02", tag: "Vendor app · light & dark", color: "#8FE3D2", title: "A kitchen dashboard that keeps up",
    body: "Restaurants run their day from one home screen: a store status card (Open, Pause for 30 min, Close) and live order cards that move from New order to Preparing, Ready for pickup, Hand over to rider and Completed, with an accept-within countdown.",
    points: [
      "Order details with prep timer, repeat-customer badge and live rider ETA",
      "Item customisation: required portion choice, optional add-ons, validation",
      "Add product with up to 3 photos, categories, pricing and drafts",
      "Menu, store profile, weekly operating hours, holidays & auto-close",
      "Business documents upload for approval",
      "Shimmer skeletons for live orders; full dark mode",
    ],
    decision: "Order IDs like K7M4XQ2: 7 characters from a 30-symbol alphabet with no look-alikes (0/O, 1/I/L, U). That gives about 19.4 billion IDs vs 10 million for 7 digits, and they're easy to read over the phone. Backed by a unique index with retry, while the internal key stays a UUID.",
  },
  {
    n: "03", tag: "Rider app · 60+ screens", color: "#5EE7FF", title: "Built for the road",
    body: "Phone and OTP login, go online, accept a new request, navigate to pickup, tick off items at the counter, navigate to the customer and confirm delivery with the customer's code or a photo. Every step has a fallback, including a Customer unavailable sheet.",
    points: [
      "One-tap chat with quick replies (On my way, I'm at the gate, Please share the code) and calls to restaurant, customer or support",
      "Earnings chart, weekly bonus, wallet activity and per-transaction detail",
      "Cash on delivery: deposit collected cash, withdraw earnings, payout methods",
      "Safety & SOS with direct Police, Ambulance and Traffic police calls",
      "Vehicle & documents, work zones, language, refer a rider",
      "Orders split into delivered and cancelled",
    ],
  },
  {
    n: "04", tag: "Admin app", color: "#FF8A9B", title: "Trust before anyone goes live",
    body: "Admins decide what riders and vendors must submit before approval, then review each document. Riders need 4 (driving licence, bluebook, citizenship, insurance). Vendors need 3 required (PAN/VAT, business registration, owner ID) plus an optional food licence.",
    points: [
      "Add, edit, reorder (drag) and delete required documents, with number and expiry fields",
      "Changes show up in the rider and vendor apps right away",
      "Per-vendor review: Verified, In review, Missing; Verify or Reject each one",
      "Approve unlocks only when every required document is verified",
    ],
  },
];

const SYSTEMS: Card[] = [
  {
    n: "A", tag: "Architecture · v4.0", color: "#9C8CFF", title: "A modular monolith, ready to split",
    body: "One deployment and one PostgreSQL primary, divided into 15 modules with clear owners: Identity, Customer, Restaurant ops, Catalog, Discovery, Pricing & promotions, Orders, Delivery, Payments, Benefits, Notifications, Support, Reviews and Infrastructure. Modules talk through owner interfaces, never by writing into each other's tables.",
    points: [
      "181 relations across 28 domains; all 109 original relations kept",
      "Phone number is the only login key for every role",
      "Money stored as integer minor units + currency; UTC timestamps, IANA time zones for scheduling",
      "Transactional outbox for durable events; stable IDs and versioned commands for future extraction",
    ],
  },
  {
    n: "B", tag: "Order pipeline", color: "#FFC27A", title: "Immediate or scheduled, never double-charged",
    body: "Checkout validates identity and ownership, reserves stock, slot, promo, points and entitlements, then creates an immutable order with its outbox in one transaction. Scheduled orders book future kitchen capacity and are re-validated when they activate.",
    points: [
      "Idempotent payment calls with compensation; unknown results reconcile before retry",
      "Holds released exactly once on expiry or cancel; refunds append, never edit",
      "Only the assigned rider can mark Delivered, with photo or OTP proof; reassignment rotates the OTP",
      "Signed webhook inbox feeds a balanced ledger; notifications never block an order",
    ],
  },
  {
    n: "C", tag: "Search", color: "#FF7AC6", title: "Suggestions in under 16 ms",
    body: "Every keystroke is answered on the phone first, from a SQLite FTS5 index (Drift) with Nepali-aware synonyms like chaumin → chowmein. A Cloudflare Worker with KV covers long-tail queries in about 20–50 ms. Supabase is only hit on a cold cache, using prefix match with pg_trgm typo fallback.",
    points: [
      "Rebuildable search projection fed by the outbox; nothing writes suggestions directly",
      "Versioned zone shards in R2; phones download only the delta every 6 h",
      "Works offline; price and open status are fetched live only when you open a result",
    ],
  },
  {
    n: "D", tag: "Behaviour tracking", color: "#4ADE80", title: "Learn tastes without touching the real database",
    body: "Searches, card views, dish opens, cart actions and quick back-outs are recorded in order per session, buffered on the phone, batched through Cloudflare Queues and stored in a separate MongoDB cluster. Ordering keeps working even if that store is down.",
    points: [
      "Fire-and-forget tracker: 20 s / 30-event batches, never blocks the UI",
      "HMAC-scrambled user IDs, consent toggle, 90-day auto-delete, delete-my-data in one call",
      "Read-only catalog mirror; no foreign keys or writes back into Supabase",
    ],
  },
  {
    n: "E", tag: "On-device model", color: "#5EE7FF", title: "A nightly model that ranks on the phone",
    body: "A shared model (dish embeddings + a lightweight scorer, trained in Python) is rebuilt every night and only ships if it beats the live one on every check. On the phone, a personal layer adjusts for taste and price range: top 6 matches plus 1–2 discovery picks, in under 10 ms, even offline.",
    points: [
      "Model ≤ 3 MB, int8, signed with Ed25519 and checked by SHA-256 before loading",
      "One manifest call; 10% canary, 24 h health watch, automatic rollback",
      "New customers get good picks from day one; hourly trend file without retraining",
    ],
  },
];

const CRAFT: Array<[string, string]> = [
  ["Motion", "One continuous Smart Animate scene from splash to Preparing, On the way and Delivered, plus a 5-state animated rating face."],
  ["States", "Skeletons, empty and error states, and transition frames designed for the dish sheet, order placed and tracking."],
  ["Systems", "Shared components across all four apps: status bar, cards, chips, sheets, toggles and payment logos."],
  ["Launch", "Play Store feature graphics and app icons for the customer, vendor and rider apps."],
];

const RESULTS: Array<[string, string]> = [
  ["4", "Connected apps designed"],
  ["181", "Database relations designed"],
  ["TODO", "Play Store installs"],
  ["TODO", "Orders delivered"],
];

function Steps({ items }: { items: Card[] }) {
  return (
    <ol className="cs-steps">
      {items.map((s, i) => (
        <li key={s.n} className={`cs-step rv d${i % 2 ? 2 : 1}`} style={{ ["--accent" as string]: s.color }}>
          <span className="cs-num">{s.n}</span>
          <p className="cs-tag">{s.tag}</p>
          <h3>{s.title}</h3>
          <p>{s.body}</p>
          {s.points ? (
            <ul className="pf-list">
              {s.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          ) : null}
          {s.decision ? <p className="cs-decision"><b>Decision:</b> {s.decision}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export default function FodiexCaseStudy() {
  const root = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let on: boolean | null = null;
    const onScroll = () => {
      const s = window.scrollY > 40;
      if (s !== on) { on = s; nav.current?.classList.toggle("scrolled", s); }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);

  return (
    <div className="pf cs" ref={root} id="top">
      <a className="pf-skip" href="#problem">Skip to content</a>
      <header className="pf-nav" ref={nav}>
        <a href="/" className="pf-logo">MANISH.DEV</a>
        <nav className="pf-links" aria-label="Case study sections">
          <a href="#problem">Problem</a>
          <a href="#apps">Apps</a>
          <a href="#figma">Figma</a>
          <a href="#systems">Systems</a>
          <a href="#craft">Craft</a>
          <a href="#results">Results</a>
        </nav>
        <a href="/#contact" className="pf-cta">Let&apos;s talk</a>
      </header>

      <main>
        <section className="cs-hero" style={{ ["--accent" as string]: "#FFC27A" }}>
          <div className="cs-wrap">
            <a href="/" className="cs-back rv">← Back to the journey</a>
            <p className="pf-eyebrow rv">▍ Case study · Food delivery · Flutter</p>
            <h1 className="pf-title rv d1">FODIEX.</h1>
            <p className="pf-p cs-lead rv d2">
              A complete food delivery platform for Nepal: apps for customers, restaurants, riders and admins, all running on one
              carefully designed backend. I designed the systems first and the screens second, then built it in Flutter and shipped it to Google Play.
            </p>
            <dl className="cs-meta rv d2">
              {META.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="pf-row rv d2" style={{ marginTop: 28 }}>
              {PLAY_URL ? (
                <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" className="pf-btn">Get it on Google Play <span aria-hidden>↗</span></a>
              ) : null}
              <a href="#figma" className="pf-btn ghost">See the UI designs <span aria-hidden>↓</span></a>
            </div>
          </div>
        </section>

        <section id="problem" className="cs-sec" style={{ ["--accent" as string]: "#FF8A9B" }}>
          <div className="cs-wrap cs-two">
            <div>
              <p className="pf-eyebrow rv">The problem</p>
              <h2 className="cs-h2 rv d1">Delivery is four products pretending to be one.</h2>
            </div>
            <div className="rv d2">
              <p className="pf-p">
                An order only works when the customer, the kitchen, the rider and the platform all agree on the same truth: what was bought,
                at what price, who is carrying it and whether it really arrived. In Nepal that also means wallets like eSewa and Khalti, lots of cash on delivery,
                and patchy networks.
              </p>
              <ul className="pf-list">
                <li>Phone-only identity across every role</li>
                <li>Orders and money that can always be reconciled</li>
                <li>Proof of delivery that can&apos;t be faked</li>
                <li>Search and suggestions that feel instant, even offline</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="apps" className="cs-sec">
          <div className="cs-wrap">
            <p className="pf-eyebrow rv" style={{ ["--accent" as string]: "#FFC27A" }}>The apps</p>
            <h2 className="cs-h2 rv d1">One order, four journeys.</h2>
            <Steps items={APPS} />
          </div>
        </section>

        <section id="figma" className="cs-sec" style={{ ["--accent" as string]: "#FFC27A" }}>
          <div className="cs-wrap">
            <p className="pf-eyebrow rv">Designed in Figma first</p>
            <h2 className="cs-h2 rv d1">Every screen, before a line of Flutter.</h2>
            <p className="pf-p rv d2">
              Over 160 frames across four apps, all designed and prototyped in Figma before any code was written.
              Here are the screens, exported straight from the design file.
            </p>
            <FigmaGallery />
          </div>
        </section>

        <section id="systems" className="cs-sec" style={{ ["--accent" as string]: "#9C8CFF" }}>
          <div className="cs-wrap">
            <p className="pf-eyebrow rv">Under the hood</p>
            <h2 className="cs-h2 rv d1">Systems designed before screens.</h2>
            <Steps items={SYSTEMS} />
          </div>
        </section>

        <section id="craft" className="cs-sec" style={{ ["--accent" as string]: "#FFE6BF" }}>
          <div className="cs-wrap cs-two">
            <div>
              <p className="pf-eyebrow rv">Craft</p>
              <h2 className="cs-h2 rv d1">The details people feel.</h2>
            </div>
            <div className="rv d2">
              <ul className="pf-list">
                {CRAFT.map(([k, v]) => <li key={k}><b>{k}.</b> {v}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section id="results" className="cs-sec" style={{ ["--accent" as string]: "#4ADE80" }}>
          <div className="cs-wrap">
            <p className="pf-eyebrow rv">Results</p>
            <h2 className="cs-h2 rv d1">Shipped and live.</h2>
            <div className="cs-results">
              {RESULTS.map(([v, l], i) => (
                <div key={l} className={`cs-stat rv d${i % 2 ? 2 : 1}${v === "TODO" ? " todo" : ""}`}>
                  <b>{v}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <div className="cs-learn rv d2">
              <h3>What I learned</h3>
              <p>
                Designing the data model, the order pipeline and the failure paths first made four apps feel like one product.
                Keeping behaviour data apart from the real database, and moving ranking onto the phone, showed me you can personalise
                quickly without risking orders or privacy.
              </p>
            </div>
          </div>
        </section>

        <section className="cs-sec cs-end" style={{ ["--accent" as string]: "#FFE6BF" }}>
          <div className="cs-wrap center">
            <p className="pf-eyebrow rv">Next</p>
            <h2 className="cs-h2 rv d1">Building a product with moving parts?</h2>
            <div className="pf-row rv d2">
              <a href="mailto:manishmu632@gmail.com" className="pf-btn">Say hello <span aria-hidden>▸</span></a>
              <a href="/" className="pf-btn ghost">Back to the journey</a>
            </div>
          </div>
          <footer className="cs-foot">© 2026 Manish · Case study: FODIEX</footer>
        </section>
      </main>
    </div>
  );
}
