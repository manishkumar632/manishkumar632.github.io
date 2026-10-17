"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import "./phone3d.css";

/* Real 3D device (CSS preserve-3d: front glass, 14-layer metal edge, back with camera, side buttons)
   with a genuinely scrollable inner screen. The dashboard reacts to its own scroll:
   collapsing large title, glass app bar, parallax/tilting balance card, drawing chart,
   filling budget rings, staggered list reveals, and the whole phone leans with scroll progress. */

const EDGES = 14;

const ICON: Record<string, string> = {
  send: "M12 19V5M5 12l7-7 7 7",
  receive: "M12 5v14M5 12l7 7 7-7",
  scan: "M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16",
  more: "M6 12h.01M12 12h.01M18 12h.01",
  coffee: "M5 8h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 9h1.5a2.5 2.5 0 010 5H16M8 3v2M11 3v2",
  bag: "M4 8h16v11H4zM9 8V6a2 2 0 012-2h2a2 2 0 012 2v2",
  bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
  plane: "M3 14l18-7-6 14-3-6zM12 15l9-8",
  cart: "M3 4h2l2.5 11h10L20 7H6.5M9 20h.01M17 20h.01",
  film: "M4 5h16v14H4zM8 5v14M16 5v14M4 12h16",
  home: "M4 11l8-7 8 7v9H4z",
  card: "M3 6h18v12H3zM3 10h18",
  chart: "M5 20V10M12 20V4M19 20v-7",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  bell: "M6 16v-5a6 6 0 0112 0v5l2 2H4zM10 21h4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 018 0v3",
  up: "M7 14l5-5 5 5",
};
function I({ n, c }: { n: string; c?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={c ?? "pd-ic"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON[n]} />
    </svg>
  );
}

/* weekly spend chart, computed once (deterministic for SSR) */
const SPEND = [42, 58, 35, 74, 51, 88, 64];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const CH = (() => {
  const W = 300, H = 110, pad = 10;
  const pts = SPEND.map((v, i) => [Math.round((pad + (i * (W - 2 * pad)) / (SPEND.length - 1)) * 10) / 10, Math.round((H - pad - (v / 100) * (H - 2 * pad)) * 10) / 10]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = Math.round(((x0 + x1) / 2) * 10) / 10;
    d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  const last = pts[pts.length - 1];
  return { d, area: `${d} L${last[0]} ${H} L${pts[0][0]} ${H}Z`, pts };
})();

const BUDGETS = [
  { k: "Food", pct: 62, col: "#FFC27A" },
  { k: "Travel", pct: 38, col: "#5EE7FF" },
  { k: "Bills", pct: 81, col: "#FF7A9C" },
];
const CARDS = [
  { k: "Platinum", no: "4821", bg: "linear-gradient(135deg,#5B9BEF,#7C5CE8)" },
  { k: "RuPay", no: "7730", bg: "linear-gradient(135deg,#F4A36E,#C06C9E)" },
  { k: "Virtual", no: "0193", bg: "linear-gradient(135deg,#1F1A4D,#3A2F8C)" },
];
const TX = [
  { k: 1, ic: "coffee", name: "Blue Tokai", sub: "Coffee · 8:12 PM", amt: "−₹320", pos: false, tint: "#FFC27A" },
  { k: 2, ic: "bag", name: "Salary credit", sub: "Today · 9:00 AM", amt: "+₹85,000", pos: true, tint: "#4ADE80" },
  { k: 3, ic: "bolt", name: "Electricity", sub: "Yesterday", amt: "−₹1,240", pos: false, tint: "#FFB054" },
  { k: 4, ic: "plane", name: "IndiGo", sub: "Travel · Mon", amt: "−₹6,480", pos: false, tint: "#5EE7FF" },
  { k: 5, ic: "cart", name: "BigBasket", sub: "Groceries · Sun", amt: "−₹2,115", pos: false, tint: "#9C8CFF" },
  { k: 6, ic: "film", name: "PVR Cinemas", sub: "Movies · Sat", amt: "−₹780", pos: false, tint: "#FF7A9C" },
];

const d = (n: number) => ({ ["--d" as string]: n }) as CSSProperties;

function Sec({ title, aside, children, delay = 0 }: { title: string; aside?: string; children: ReactNode; delay?: number }) {
  return (
    <section className="pd-sec" data-rv="" style={d(delay)}>
      <div className="pd-sec-h">
        <h3>{title}</h3>
        {aside ? <span>{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export default function PhoneDashboard() {
  const scroller = useRef<HTMLDivElement>(null);
  const bal = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const phone = sc.closest(".pf-phone") as HTMLElement | null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let spv = 0;
    let kick3d = () => {};

    /* scroll -> CSS vars */
    let raf = 0;
    const upd = () => {
      raf = 0;
      const s = sc.scrollTop;
      const max = Math.max(1, sc.scrollHeight - sc.clientHeight);
      sc.style.setProperty("--s", s.toFixed(1));
      sc.style.setProperty("--p", Math.min(s / 110, 1).toFixed(3));
      spv = s / max;
      phone?.style.setProperty("--sp", spv.toFixed(3));
      kick3d();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(upd);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    upd();

    /* reveal blocks as they scroll into the phone's viewport */
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
      { root: sc, threshold: 0.2 },
    );
    sc.querySelectorAll("[data-rv]").forEach((el) => io.observe(el));

    /* first time the phone is on screen: count up balance + a gentle scroll "peek" */
    let touched = false;
    const mark = () => { touched = true; };
    sc.addEventListener("wheel", mark, { passive: true });
    sc.addEventListener("pointerdown", mark);
    sc.addEventListener("touchstart", mark, { passive: true });
    const timers: number[] = [];
    let countRaf = 0;
    const vis = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      vis.disconnect();
      if (reduce) return;
      const el = bal.current;
      if (el) {
        const target = 248560;
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 1400);
          const v = Math.round(target * (1 - Math.pow(1 - k, 4)));
          el.textContent = v.toLocaleString("en-IN");
          if (k < 1) countRaf = requestAnimationFrame(step);
        };
        countRaf = requestAnimationFrame(step);
      }
      timers.push(window.setTimeout(() => { if (!touched) sc.scrollTo({ top: 170, behavior: "smooth" }); }, 1700));
      timers.push(window.setTimeout(() => { if (!touched) sc.scrollTo({ top: 0, behavior: "smooth" }); }, 3300));
    }, { threshold: 0.4 });
    vis.observe(sc);

    /* ---------- real 3D interaction: drag to spin (with inertia), hover tilt, mouse wheel scrolls the screen ---------- */
    const attach3d = (ph: HTMLElement) => {
      const BX = 6, BY = -14;
      const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
      const norm = (a: number) => ((((a % 360) + 540) % 360) - 180);
      let rx = BX, ry = BY, tx = BX, ty = BY, vy = 0;
      let hx = 0, hy = 0, chx = 0, chy = 0;
      let idleAt = 0, wheelT = -1, lastTop = -1, suppress = false, live = true, loop = 0;
      let lastTf = "";
      type Drag = {
        id: number; x: number; y: number; sx: number; sy: number; st: number; sl: number;
        lx: number; lt: number; v: number; mode: "" | "rot" | "scroll" | "cards";
        cards: HTMLElement | null; screen: boolean; touch: boolean;
      };
      let drag: Drag | null = null;
      const facing = () => Math.abs(norm(ry)) < 90;

      const tick = () => {
        loop = 0;
        const now = performance.now();
        if (!drag) {
          if (vy) {
            ty += vy;
            vy *= 0.95;
            if (Math.abs(vy) < 0.03) { vy = 0; idleAt = now; }
          } else if (now - idleAt > 2600) {
            const home = BY + Math.round((ty - BY) / 360) * 360;
            ty += (home - ty) * 0.035;
            tx += (BX - tx) * 0.035;
          }
        }
        rx += (tx - rx) * 0.16;
        ry += (ty - ry) * 0.16;
        chx += (hx - chx) * 0.08;
        chy += (hy - chy) * 0.08;
        if (wheelT >= 0) {
          const dd = wheelT - sc.scrollTop;
          if (Math.abs(dd) < 0.6 || sc.scrollTop === lastTop) { wheelT = -1; lastTop = -1; }
          else { lastTop = sc.scrollTop; sc.scrollTop += dd * 0.22; }
        }
        const X = rx - chy * 14 + spv * 8;
        const Y = ry + chx * 20 + spv * 12;
        const tf = `rotateX(${X.toFixed(2)}deg) rotateY(${Y.toFixed(2)}deg) rotateZ(${(-6 + spv * 5).toFixed(2)}deg)`;
        if (tf !== lastTf) {
          lastTf = tf;
          ph.style.transform = tf;
          ph.style.setProperty("--ry", `${norm(Y).toFixed(1)}deg`);
        }
        /* sleep when fully at rest; any input (drag, hover, wheel, screen scroll) wakes it again */
        const homeY = BY + Math.round((ty - BY) / 360) * 360;
        const settled = !drag && !vy && wheelT < 0 &&
          Math.abs(tx - rx) < 0.005 && Math.abs(ty - ry) < 0.005 &&
          Math.abs(hx - chx) < 0.0005 && Math.abs(hy - chy) < 0.0005 &&
          Math.abs(homeY - ty) < 0.01 && Math.abs(BX - tx) < 0.01;
        if (live && !settled) loop = requestAnimationFrame(tick);
      };
      const kick = () => { if (!loop && live) loop = requestAnimationFrame(tick); };
      kick3d = kick;

      const seen = new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live) kick(); });
      seen.observe(ph);

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        touched = true;
        suppress = false;
        vy = 0;
        wheelT = -1;
        const t = e.target as Element;
        const cards = t.closest(".pd-cards") as HTMLElement | null;
        drag = {
          id: e.pointerId, x: e.clientX, y: e.clientY, sx: tx, sy: ty, st: sc.scrollTop, sl: cards?.scrollLeft ?? 0,
          lx: e.clientX, lt: performance.now(), v: 0, mode: "", cards, screen: !!t.closest(".pd-scroll"), touch: e.pointerType !== "mouse",
        };
        kick();
      };
      const onMove = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) {
          if (e.pointerType !== "mouse" || !live) return;
          const r = ph.getBoundingClientRect();
          hx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 2.2), -0.5, 0.5);
          hy = clamp((e.clientY - (r.top + r.height / 2)) / (r.height * 1.6), -0.5, 0.5);
          kick();
          return;
        }
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.mode) {
          if (Math.hypot(dx, dy) < 6) return;
          const horiz = Math.abs(dx) > Math.abs(dy);
          if (horiz) drag.mode = drag.cards && facing() && !drag.touch ? "cards" : "rot";
          else if (drag.screen && facing()) {
            if (drag.touch) { drag = null; return; } /* native touch scrolling handles this */
            drag.mode = "scroll";
          } else drag.mode = "rot";
          if (drag.mode === "cards" && drag.cards) drag.cards.style.scrollSnapType = "none";
          try { ph.setPointerCapture(e.pointerId); } catch { /* ignore */ }
          ph.classList.add("is-drag");
          hx = 0; hy = 0;
        }
        if (drag.mode === "rot") {
          ty = drag.sy + dx * 0.5;
          tx = clamp(drag.sx - dy * 0.35, -45, 45);
          const now = performance.now();
          const dt = Math.max(1, now - drag.lt);
          drag.v = drag.v * 0.4 + (((e.clientX - drag.lx) * 0.5) / dt) * 16 * 0.6;
          drag.lx = e.clientX;
          drag.lt = now;
        } else if (drag.mode === "scroll") {
          sc.scrollTop = drag.st - dy;
        } else if (drag.mode === "cards" && drag.cards) {
          drag.cards.scrollLeft = drag.sl - dx;
        }
        e.preventDefault();
      };
      const onUp = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.mode === "rot" && !reduce && performance.now() - drag.lt < 90) vy = clamp(drag.v, -28, 28);
        if (drag.mode === "cards" && drag.cards) drag.cards.style.scrollSnapType = "";
        if (drag.mode) suppress = true;
        idleAt = performance.now();
        ph.classList.remove("is-drag");
        drag = null;
      };
      const onClick = (e: MouseEvent) => {
        if (suppress) { e.preventDefault(); e.stopPropagation(); suppress = false; }
      };
      const onLeaveDoc = () => { hx = 0; hy = 0; kick(); };
      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || !live || !facing()) return;
        const r = ph.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        const t = e.target as Element | null;
        if (t?.closest?.(".pd-cards") && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? sc.clientHeight : 1;
        const dy = e.deltaY * unit;
        if (!dy) return;
        const max = sc.scrollHeight - sc.clientHeight;
        const from = wheelT >= 0 ? wheelT : sc.scrollTop;
        if ((dy < 0 && from <= 0) || (dy > 0 && from >= max - 1)) return; /* at either end: let the page scroll */
        e.preventDefault();
        touched = true;
        wheelT = clamp(from + dy, 0, max);
        lastTop = -1;
        kick();
      };

      ph.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      ph.addEventListener("click", onClick, true);
      document.documentElement.addEventListener("mouseleave", onLeaveDoc);
      window.addEventListener("wheel", onWheel, { passive: false });
      kick();

      return () => {
        live = false;
        cancelAnimationFrame(loop);
        seen.disconnect();
        ph.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        ph.removeEventListener("click", onClick, true);
        document.documentElement.removeEventListener("mouseleave", onLeaveDoc);
        window.removeEventListener("wheel", onWheel);
      };
    };
    const stop3d = phone ? attach3d(phone) : () => {};

    return () => {
      stop3d();
      sc.removeEventListener("scroll", onScroll);
      sc.removeEventListener("wheel", mark);
      sc.removeEventListener("pointerdown", mark);
      sc.removeEventListener("touchstart", mark);
      io.disconnect();
      vis.disconnect();
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(countRaf);
    };
  }, []);

  return (
    <>
      <div className="p3-shadow" aria-hidden="true" />
      {Array.from({ length: EDGES }, (_, i) => (
        <div key={i} className="p3-edge" style={{ ["--i" as string]: i + 1 } as CSSProperties} aria-hidden="true" />
      ))}
      <div className="p3-back" aria-hidden="true">
        <div className="p3-cam"><i /><i /><i /><b /></div>
        <div className="p3-logo">M</div>
      </div>
      <span className="p3-btn p3-btn-a" aria-hidden="true" />
      <span className="p3-btn p3-btn-b" aria-hidden="true" />
      <span className="p3-btn p3-btn-c" aria-hidden="true" />
      <span className="p3-btn p3-btn-p" aria-hidden="true" />

      <div className="p3-front">
        <div className="p3-screen" role="region" aria-label="Vault Wallet app preview (scrollable)">
          <div className="pd-status" aria-hidden="true">
            <span>9:41</span>
            <span className="pd-island" />
            <span className="pd-sig">5G <i /></span>
          </div>

          <div className="pd-scroll" ref={scroller} tabIndex={0}>
            <header className="pd-bar">
              <div className="pd-ava">M</div>
              <div className="pd-head">
                <p className="pd-hello">Good evening, Manish</p>
                <h2 className="pd-title">Vault Wallet</h2>
              </div>
              <button className="pd-bell" type="button" aria-label="Notifications"><I n="bell" /><b /></button>
            </header>

            <div className="pd-balance">
              <div className="pd-bal-card">
                <div className="pd-sheen" />
                <div className="pd-bal-top">
                  <span>Total balance</span>
                  <span className="pd-up"><I n="up" c="pd-ic-s" />12.4%</span>
                </div>
                <p className="pd-bal">₹ <span ref={bal}>2,48,560</span></p>
                <div className="pd-bal-bot">
                  <span>•••• 4821</span>
                  <span className="pd-chip"><I n="lock" c="pd-ic-s" />E2E encrypted</span>
                </div>
              </div>
            </div>

            <div className="pd-body">
              <div className="pd-actions" data-rv="" style={d(0)}>
                {[
                  ["send", "Send"],
                  ["receive", "Receive"],
                  ["scan", "Scan"],
                  ["more", "More"],
                ].map(([n, l], i) => (
                  <button key={n} type="button" className={`pd-act${i === 0 ? " on" : ""}`}>
                    <span><I n={n} /></span>
                    {l}
                  </button>
                ))}
              </div>

              <Sec title="This week" aside="₹4,120 spent">
                <div className="pd-chart">
                  <svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="pd-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#9C8CFF" stopOpacity=".45" />
                        <stop offset="1" stopColor="#9C8CFF" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="pd-line" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#5EE7FF" />
                        <stop offset="1" stopColor="#FF7A9C" />
                      </linearGradient>
                    </defs>
                    <path className="pd-area" d={CH.area} fill="url(#pd-area)" />
                    <path className="pd-line" d={CH.d} pathLength={1} fill="none" stroke="url(#pd-line)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span className="pd-dot" style={{ left: `${(CH.pts[5][0] / 300) * 100}%`, top: `${(CH.pts[5][1] / 110) * 100}%` }}>
                    <em>₹880</em>
                  </span>
                </div>
                <div className="pd-days">
                  {DAYS.map((x, i) => (
                    <span key={i} className={i === 5 ? "on" : undefined}>{x}</span>
                  ))}
                </div>
              </Sec>

              <Sec title="Budgets" aside="October">
                <div className="pd-rings">
                  {BUDGETS.map((b, i) => (
                    <div key={b.k} className="pd-ring" style={{ ["--pct" as string]: b.pct, ["--c" as string]: b.col, ["--d" as string]: i } as CSSProperties}>
                      <svg viewBox="0 0 36 36" aria-hidden="true">
                        <circle cx="18" cy="18" r="15.9155" className="pd-ring-bg" />
                        <circle cx="18" cy="18" r="15.9155" className="pd-ring-fg" pathLength={100} />
                      </svg>
                      <b>{b.pct}%</b>
                      <span>{b.k}</span>
                    </div>
                  ))}
                </div>
              </Sec>

              <Sec title="My cards" aside="3 active">
                <div className="pd-cards">
                  {CARDS.map((c) => (
                    <div key={c.k} className="pd-mini" style={{ background: c.bg }}>
                      <span>{c.k}</span>
                      <b>•••• {c.no}</b>
                    </div>
                  ))}
                </div>
              </Sec>

              <Sec title="Savings goal" aside="64%">
                <div className="pd-goal">
                  <div className="pd-goal-top">
                    <span className="pd-goal-ic"><I n="plane" /></span>
                    <div>
                      <b>Goa trip</b>
                      <span>₹38,400 of ₹60,000</span>
                    </div>
                  </div>
                  <div className="pd-bar-track"><i style={{ ["--w" as string]: "64%" } as CSSProperties} /></div>
                </div>
              </Sec>

              <Sec title="Recent activity" aside="See all">
                <ul className="pd-tx">
                  {TX.map((t, i) => (
                    <li key={t.k} data-rv="" style={d(i)}>
                      <span className="pd-tx-ic" style={{ color: t.tint }}><I n={t.ic} /></span>
                      <div>
                        <b>{t.name}</b>
                        <span>{t.sub}</span>
                      </div>
                      <em className={t.pos ? "pos" : undefined}>{t.amt}</em>
                    </li>
                  ))}
                </ul>
              </Sec>

              <div className="pd-secure" data-rv="">
                <span><I n="shield" /></span>
                <div>
                  <b>Secured by Vault</b>
                  <p>AES-256 · Biometric lock · Rate-limited API</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="pd-tabs" aria-label="App tabs">
            {["home", "card", "chart", "user"].map((n, i) => (
              <span key={n} className={i === 0 ? "on" : undefined}><I n={n} /></span>
            ))}
          </nav>
          <span className="pd-homebar" aria-hidden="true" />
          <div className="p3-glare" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
