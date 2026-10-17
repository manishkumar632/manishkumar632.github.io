"use client";

import { useEffect, useRef } from "react";
import ThreeLayer from "./ThreeLayer";
import SecurityShield from "./SecurityShield";
import { HeroScene, AtomScene, ForestScene, CaveScene, SecureScene, SunriseScene } from "./scenes";
import { AtomDiagram, PrototypeFlow, SchemaDiagram } from "./diagrams";
import PhoneDashboard from "./PhoneDashboard";
import { attachJelly } from "./jelly";

const NAV = [
  ["Process", "#analyze"],
  ["Design", "#design"],
  ["Database", "#database"],
  ["Security", "#security"],
  ["Work", "#work"],
];

export default function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const schema = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);

  /* jelly wobble on the database tables + pills */
  useEffect(() => attachJelly(schema.current), []);

  /* Parallax + nav state, rAF-throttled. translateY = rect.top * (speed - 0.5) * 0.35, clamped to the layer bleed. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(el.querySelectorAll<HTMLElement>(".pf-sec"));
    /* cache layer speeds + SMIL-animated svgs once; track which sections are near the viewport */
    const groups = sections.map((s) => ({
      s,
      live: true,
      ls: Array.from(s.querySelectorAll<HTMLElement>("[data-speed]")).map((l) => ({ l, sp: Number(l.dataset.speed), ty: NaN })),
      smil: Array.from(s.querySelectorAll<SVGSVGElement>("svg")).filter((svg) => svg.querySelector("animate, animateMotion, animateTransform, set")),
    }));
    let ticking = false;
    let navOn: boolean | null = null;
    const update = () => {
      ticking = false;
      /* nav state: touch the DOM only when it flips (no React re-render on every scroll frame) */
      const on = window.scrollY > 40;
      if (on !== navOn) {
        navOn = on;
        nav.current?.classList.toggle("scrolled", on);
      }
      if (reduce) return;
      const vh = window.innerHeight;
      /* read every rect first, then write transforms (avoids layout thrashing) */
      const rects = groups.map((g) => (g.live ? g.s.getBoundingClientRect() : null));
      for (let i = 0; i < groups.length; i++) {
        const r = rects[i];
        if (!r || r.bottom < -vh * 0.2 || r.top > vh * 1.2) continue;
        const max = r.height * 0.11;
        for (const L of groups[i].ls) {
          const ty = Math.round(Math.max(-max, Math.min(max, r.top * (L.sp - 0.5) * 0.35)) * 10) / 10;
          if (ty === L.ty) continue;
          L.ty = ty;
          L.l.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0)`;
        }
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* Only sections near the viewport animate: CSS pauses ambient animations via .pf-live,
       SMIL (birds, orbits, tap ripple) is paused here. Nothing is removed, offscreen work just stops. */
    const liveIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const g = groups.find((x) => x.s === e.target);
          if (!g) continue;
          g.live = e.isIntersecting;
          g.s.classList.toggle("pf-live", g.live);
          for (const svg of g.smil) {
            try {
              if (g.live) svg.unpauseAnimations();
              else svg.pauseAnimations();
            } catch {
              /* ignore */
            }
          }
        }
        onScroll();
      },
      { rootMargin: "30% 0px 30% 0px" }
    );
    sections.forEach((s) => liveIO.observe(s));

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.18 }
    );
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      io.disconnect();
      liveIO.disconnect();
    };
  }, []);

  /* 3D rotation (drag / hover / inertia) for the hero phone lives in PhoneDashboard */

  return (
    <div className="pf" ref={root} id="top">
      <a className="pf-skip" href="#analyze">Skip to content</a>
      <header className="pf-nav" ref={nav}>
        <a href="#top" className="pf-logo">MANISH.DEV</a>
        <nav className="pf-links" aria-label="Sections">
          {NAV.map(([l, h]) => (
            <a key={h} href={h}>{l}</a>
          ))}
        </nav>
        <a href="#contact" className="pf-cta">Let&apos;s talk</a>
      </header>

      <main>
        {/* HERO */}
        <section className="pf-sec pf-hero" aria-label="Introduction">
          <div className="pf-scene"><HeroScene /></div>
          <ThreeLayer variant="particles" />
          <div className="pf-inner">
            <div className="pf-copy">
              <p className="pf-eyebrow rv" style={{ ["--accent" as string]: "#FFE6BF" }}>▍ Flutter developer · A journey from atom to app</p>
              <h1 className="pf-title rv d1">MANISH</h1>
              <p className="pf-p rv d2">
                I don&apos;t start with code. I analyze every detail, design and prototype every flow in Figma, shape a lean database,
                and harden the server, then I build the Flutter app.
              </p>
              <a href="#analyze" className="pf-btn rv d2">Start the journey <span aria-hidden>▸</span></a>
            </div>
            <div className="pf-phone-wrap rv d1">
              <div className="pf-phone-glow" />
              <div className="pf-float">
                <div className="pf-phone" ref={phone}>
                  <PhoneDashboard />
                </div>
              </div>
              <p className="pf-phone-tip" aria-hidden="true">Drag to spin · Scroll the screen</p>
            </div>
          </div>
          <a href="#analyze" className="pf-hint">Scroll to explore ↓</a>
        </section>

        {/* CH01 */}
        <section id="analyze" className="pf-sec" style={{ ["--accent" as string]: "#FFC27A" }}>
          <div className="pf-scene"><AtomScene /></div>
          <div className="pf-inner">
            <div className="pf-copy">
              <p className="pf-eyebrow rv">Chapter 01 · Analyze</p>
              <h2 className="pf-h2 rv d1">Atomic.</h2>
              <p className="pf-p rv d2">
                Before a single line of Flutter, I break every screen down to its atoms: each tap, state, edge case and failure path.
                I keep asking questions until nothing is left to chance.
              </p>
              <a className="pf-link rv d2" href="#atom">— See the breakdown</a>
            </div>
            <div className="pf-diagram rv d1" id="atom"><AtomDiagram /></div>
          </div>
        </section>

        {/* CH02 */}
        <section id="design" className="pf-sec" style={{ ["--accent" as string]: "#8FE3D2" }}>
          <div className="pf-scene"><ForestScene /></div>
          <div className="pf-inner flip">
            <div className="pf-copy">
              <p className="pf-eyebrow rv">Chapter 02 · Design &amp; prototype</p>
              <h2 className="pf-h2 rv d1">Feel it.</h2>
              <p className="pf-p rv d2">
                Every flow lives in Figma first, as a real clickable prototype. I tap through it like a user, watch where they hesitate,
                and fix how it feels before it ever becomes code.
              </p>
              <a className="pf-link rv d2" href="#flow">— Open the prototype</a>
              <br />
              <a className="pf-link rv d2" href="#work">— See the projects ↓</a>
            </div>
            <div className="pf-diagram wide rv d1" id="flow"><PrototypeFlow /></div>
          </div>
        </section>

        {/* CH03 */}
        <section id="database" className="pf-sec" style={{ ["--accent" as string]: "#5EE7FF" }}>
          <div className="pf-scene"><CaveScene /></div>
          <ThreeLayer variant="crystal" />
          <div className="pf-inner">
            <div className="pf-copy">
              <p className="pf-eyebrow rv">Chapter 03 · Database</p>
              <h2 className="pf-h2 rv d1">Lean.</h2>
              <p className="pf-p rv d2">
                I design the schema before the screens. Normalized tables, the right indexes and strict constraints mean no duplicated
                data, fast queries, and a database that stays light as users grow.
              </p>
              <a className="pf-link rv d2" href="#schema">— View the schema</a>
            </div>
            <div className="pf-diagram rv d1" id="schema" ref={schema}><SchemaDiagram /></div>
          </div>
        </section>

        {/* CH04 */}
        <section id="security" className="pf-sec" style={{ ["--accent" as string]: "#4ADE80" }}>
          <div className="pf-scene"><SecureScene /></div>
          <div className="pf-inner flip">
            <div className="pf-copy">
              <p className="pf-eyebrow rv">Chapter 04 · Security</p>
              <h2 className="pf-h2 rv d1">Secure.</h2>
              <p className="pf-p rv d2">
                Security is a design decision, not a patch. Rate limits, bot filtering, rotating tokens and strict validation sit in
                layers, so abuse is dropped at the edge long before it can overload the server.
              </p>
              <ul className="pf-list rv d2">
                <li>Per-user &amp; per-IP rate limits</li>
                <li>Short-lived JWT + refresh rotation</li>
                <li>Server-side validation on every input</li>
                <li>Idempotent payments, encrypted at rest</li>
              </ul>
            </div>
            <div className="pf-diagram rv d1"><SecurityShield /></div>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="pf-sec" style={{ ["--accent" as string]: "#9C8CFF" }}>
          <div className="pf-inner single">
            <div className="pf-copy">
              <p className="pf-eyebrow rv">Selected work</p>
              <h2 className="pf-h2 rv d1">Projects.</h2>
              <ol className="cs-steps">
                <li className="cs-step rv d1" style={{ ["--accent" as string]: "#FFC27A" }}>
                  <span className="cs-num">01</span>
                  <p className="cs-tag">Flutter · Live on Google Play</p>
                  <h3>FODIEX</h3>
                  <p>A four-app food delivery platform for Nepal (customer, vendor, rider and admin) on a modular PostgreSQL backend with search that answers in under 16 ms.</p>
                  <a className="pf-link" href="/work/fodiex">Read the case study →</a>
                </li>
                <li className="cs-step rv d2" style={{ ["--accent" as string]: "#5EE7FF" }}>
                  <span className="cs-num">02</span>
                  <p className="cs-tag">Python · Desktop software</p>
                  <h3>Zinkognito</h3>
                  <p>An interview-prep coach that helps capable students explain their skills and projects with confidence.</p>
                  <a className="pf-link" href="/work/zinkognito">Read the case study →</a>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* CH05 */}
        <section id="contact" className="pf-sec pf-contact" style={{ ["--accent" as string]: "#FFE6BF" }}>
          <div className="pf-scene"><SunriseScene /></div>
          <div className="pf-inner single">
            <div className="pf-copy center">
              <p className="pf-eyebrow rv">Chapter 05 · Let&apos;s talk</p>
              <h2 className="pf-title rv d1">Let&apos;s build.</h2>
              <p className="pf-p rv d2">Have an app idea that needs to feel effortless and be hard to break? I&apos;d love to hear about it.</p>
              <div className="pf-row rv d2">
                <a href="mailto:manishmu632@gmail.com" className="pf-btn">Say hello <span aria-hidden>▸</span></a>
                <a href="#top" className="pf-btn ghost">Back to the start ↑</a>
              </div>
            </div>
          </div>
          <footer className="pf-foot">© {2026} Manish · Designed in Figma, built with Next.js &amp; Three.js</footer>
        </section>
      </main>
    </div>
  );
}
