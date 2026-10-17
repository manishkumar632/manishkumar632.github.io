"use client";

/**
 * Case study: Zinkognito, interview-prep tool (/work/zinkognito).
 * Light page: no WebGL, one IntersectionObserver for reveals (v2).
 *
 * NOTE: every value marked TODO is a placeholder. Replace with real data and
 * make sure FEATURES match what the product actually does before publishing.
 */
import { useEffect, useRef } from "react";

const META: Array<[string, string]> = [
  ["Role", "Solo · Research, product, engineering"],
  ["Timeline", "~2 months"],
  ["Stack", "Python · TODO: add libraries"],
  ["Status", "Live at zinkognito.com"],
];

const STEPS = [
  {
    n: "01", tag: "Research", color: "#FFC27A", title: "Understanding the machine, deeply",
    body: "I studied how desktop software observes a system, from processes and windows down to the OS and kernel level, and how hiring platforms run assessments.",
    decision: "Build on real OS knowledge, not guesswork. Design for the candidate's preparation, before the interview.",
  },
  {
    n: "02", tag: "Problem framing", color: "#8FE3D2", title: "Capable students, lost in translation",
    body: "Students who are skilled and hardworking get rejected because they can't explain their thinking the way interviewers expect, or lack a project with real impact.",
    decision: "Focus on two gaps: communication and project storytelling.",
  },
  {
    n: "03", tag: "Product", color: "#5EE7FF", title: "A coach for every round",
    body: "Separate practice modes for online assessments, technical rounds and HR rounds, so students train for the round that is actually next.",
    decision: "One tool covering the whole hiring journey, not just one round.",
  },
  {
    n: "04", tag: "Engineering", color: "#4ADE80", title: "Fast, private, desktop-native",
    body: "Written in Python as a lightweight desktop app, shipped and live in about two months.",
    decision: "TODO: add your key architecture decision (e.g. local-first processing, model choice).",
  },
];

// TODO: confirm these match real product features before publishing.
const FEATURES: Array<[string, string]> = [
  ["Mock interviews", "Realistic technical and HR questions with feedback on structure and clarity."],
  ["Answer coach", "Turns rough answers into clear STAR-style explanations."],
  ["Project storyteller", "Helps explain a project's problem, approach and impact in two minutes."],
  ["Assessment practice", "Timed practice sets with explanations, used before the test."],
];

const RESULTS: Array<[string, string]> = [
  ["TODO", "Students using it"],
  ["TODO", "Practice sessions run"],
  ["TODO", "Offers reported by users"],
  ["2 / 2", "My own job offers, first attempt"],
];

export default function CaseStudy() {
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
      { threshold: 0.15 }
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
          <a href="#process">Process</a>
          <a href="#features">Features</a>
          <a href="#results">Results</a>
        </nav>
        <a href="/#contact" className="pf-cta">Let&apos;s talk</a>
      </header>

      <main>
        <section className="cs-hero" style={{ ["--accent" as string]: "#FFE6BF" }}>
          <div className="cs-wrap">
            <a href="/" className="cs-back rv">← Back to the journey</a>
            <p className="pf-eyebrow rv">▍ Case study · EdTech · Python</p>
            <h1 className="pf-title rv d1">Zinkognito.</h1>
            <p className="pf-p cs-lead rv d2">
              An interview-prep coach for students who are capable but struggle to show it. Built from my own experience of
              landing two jobs on the first attempt, and watching smarter friends get rejected.
            </p>
            <dl className="cs-meta rv d2">
              {META.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="pf-row rv d2" style={{ marginTop: 28 }}>
              <a href="https://zinkognito.com" target="_blank" rel="noopener noreferrer" className="pf-btn">Visit zinkognito.com <span aria-hidden>↗</span></a>
            </div>
          </div>
        </section>

        <section id="problem" className="cs-sec" style={{ ["--accent" as string]: "#FF8A9B" }}>
          <div className="cs-wrap cs-two">
            <div>
              <p className="pf-eyebrow rv">The problem</p>
              <h2 className="cs-h2 rv d1">Talent isn&apos;t the bottleneck. Explaining it is.</h2>
            </div>
            <div className="rv d2">
              <p className="pf-p">
                In college I cleared my first and second job interviews on the first attempt. Many classmates were more capable,
                yet got rejected: they couldn&apos;t frame answers the way interviewers expect, or had no project with real impact to talk about.
              </p>
              <ul className="pf-list">
                <li>Explain thinking clearly under pressure</li>
                <li>Tell a project story that lands</li>
                <li>Prepare for every round, from assessment to HR</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="process" className="cs-sec">
          <div className="cs-wrap">
            <p className="pf-eyebrow rv" style={{ ["--accent" as string]: "#9C8CFF" }}>The process</p>
            <h2 className="cs-h2 rv d1">From kernel-level research to a shipped product.</h2>
            <ol className="cs-steps">
              {STEPS.map((s, i) => (
                <li key={s.n} className={`cs-step rv d${i % 2 ? 2 : 1}`} style={{ ["--accent" as string]: s.color }}>
                  <span className="cs-num">{s.n}</span>
                  <p className="cs-tag">{s.tag}</p>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                  <p className="cs-decision"><b>Decision:</b> {s.decision}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="cs-sec" style={{ ["--accent" as string]: "#8FE3D2" }}>
          <div className="cs-wrap">
            <p className="pf-eyebrow rv">What it does</p>
            <h2 className="cs-h2 rv d1">Practice that feels like the real thing.</h2>
            <ol className="cs-steps">
              {FEATURES.map(([t, d], i) => (
                <li key={t} className={`cs-step rv d${i % 2 ? 2 : 1}`}>
                  <p className="cs-tag">0{i + 1}</p>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="results" className="cs-sec" style={{ ["--accent" as string]: "#4ADE80" }}>
          <div className="cs-wrap">
            <p className="pf-eyebrow rv">Results</p>
            <h2 className="cs-h2 rv d1">What it changed.</h2>
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
              <p>Going deep into how operating systems really work made me a far better engineer, and building for real students taught me to ship fast and listen to feedback.</p>
            </div>
          </div>
        </section>

        <section className="cs-sec cs-end" style={{ ["--accent" as string]: "#FFE6BF" }}>
          <div className="cs-wrap center">
            <p className="pf-eyebrow rv">Next</p>
            <h2 className="cs-h2 rv d1">Want to build something that helps people?</h2>
            <div className="pf-row rv d2">
              <a href="mailto:manishmu632@gmail.com" className="pf-btn">Say hello <span aria-hidden>▸</span></a>
              <a href="/" className="pf-btn ghost">Back to the journey</a>
            </div>
          </div>
          <footer className="cs-foot">© 2026 Manish · Case study: Zinkognito</footer>
        </section>
      </main>
    </div>
  );
}
