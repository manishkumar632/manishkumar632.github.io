"use client";

/**
 * ElasticFlow — makes the Prototype-flow phones draggable, with the connector
 * lines behaving like rubber bands. Drag a phone: it resists more the further
 * you pull (tanh rubber curve), the line stretches + thins, then on release a
 * damped spring snaps it back with a little overshoot/wobble. Connected phones
 * get a gentle tug through the band.
 *
 * Perf: zero React state, direct attribute writes, rAF runs ONLY while
 * something is moving and stops when settled. Nothing runs when idle.
 */
import { useEffect, useRef } from "react";

type Pt = { x: number; y: number };
const LINKS: Array<{ from: number; to: number; s: Pt; e: Pt }> = [
  { from: 0, to: 1, s: { x: 190, y: 315 }, e: { x: 284, y: 220 } },
  { from: 1, to: 2, s: { x: 480, y: 260 }, e: { x: 574, y: 340 } },
];
const MAX = 150; // max stretch in SVG units (rubber limit)
const K = 170; // spring stiffness
const C = 9; // damping (low = bouncier)
const TUG = 28; // how much a stretched band tugs the neighbour phone

function curve(sx: number, sy: number, ex: number, ey: number, lx: number, ly: number) {
  const mx = (sx + ex) / 2;
  const c1x = mx + lx, c1y = sy + ly, c2x = mx + lx, c2y = ey + ly;
  return {
    d: `M${sx.toFixed(1)} ${sy.toFixed(1)} C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`,
    mid: { x: (sx + 3 * c1x + 3 * c2x + ex) / 8, y: (sy + 3 * c1y + 3 * c2y + ey) / 8 },
  };
}

export default function ElasticFlow() {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = ref.current?.ownerSVGElement;
    if (!svg) return;
    const phones = [0, 1, 2].map((i) => svg.querySelector<SVGGElement>(`[data-phone="${i}"]`));
    const paths = LINKS.map((_, i) => svg.querySelector<SVGPathElement>(`[data-link="${i}"]`));
    const labels = LINKS.map((_, i) => svg.querySelector<SVGGElement>(`[data-label="${i}"]`));
    if (phones.some((p) => !p) || paths.some((p) => !p)) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const L0 = LINKS.map((l) => Math.hypot(l.e.x - l.s.x, l.e.y - l.s.y));
    const M0 = LINKS.map((l) => curve(l.s.x, l.s.y, l.e.x, l.e.y, 0, 0).mid);
    const st = phones.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, drag: false, id: -1, gx: 0, gy: 0, bx: 0, by: 0, t: 0 }));
    const rubber = (d: number) => MAX * Math.tanh(d / MAX);

    const toSvg = (e: PointerEvent): Pt => {
      const m = svg.getScreenCTM();
      if (!m) return { x: e.clientX, y: e.clientY };
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    };

    const draw = () => {
      st.forEach((s, i) => phones[i]!.setAttribute("transform", `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)})`));
      LINKS.forEach((L, i) => {
        const a = st[L.from], b = st[L.to];
        const sx = L.s.x + a.x, sy = L.s.y + a.y, ex = L.e.x + b.x, ey = L.e.y + b.y;
        // rubber lag: the middle of the band trails behind the motion
        const lx = Math.max(-40, Math.min(40, -(a.vx + b.vx) * 0.025));
        const ly = Math.max(-40, Math.min(40, -(a.vy + b.vy) * 0.025));
        const c = curve(sx, sy, ex, ey, lx, ly);
        const p = paths[i]!;
        p.setAttribute("d", c.d);
        const thin = Math.max(0.45, Math.min(1.3, L0[i] / Math.max(1, Math.hypot(ex - sx, ey - sy))));
        p.style.strokeWidth = (2.5 * thin).toFixed(2);
        labels[i]?.setAttribute("transform", `translate(${(c.mid.x - M0[i].x).toFixed(1)} ${(c.mid.y - M0[i].y).toFixed(1)})`);
      });
    };

    let raf = 0, last = 0;
    const step = (t: number) => {
      const dt = last ? Math.min(0.032, (t - last) / 1000) : 1 / 60;
      last = t;
      let active = false;
      st.forEach((s, i) => {
        if (s.drag) { active = true; return; }
        if (reduce) { s.x = s.y = s.vx = s.vy = 0; return; }
        let fx = -K * s.x - C * s.vx, fy = -K * s.y - C * s.vy;
        // tug from connected bands (neighbour pulled toward the stretched side)
        LINKS.forEach((L) => {
          const o = L.from === i ? st[L.to] : L.to === i ? st[L.from] : null;
          if (o) { fx += TUG * (o.x - s.x); fy += TUG * (o.y - s.y); }
        });
        s.vx += fx * dt; s.vy += fy * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
        if (Math.abs(s.x) + Math.abs(s.y) > 0.05 || Math.abs(s.vx) + Math.abs(s.vy) > 0.5) active = true;
        else s.x = s.y = s.vx = s.vy = 0;
      });
      draw();
      if (active) raf = requestAnimationFrame(step);
      else { raf = 0; last = 0; }
    };
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(step); } };

    const offs: Array<() => void> = [];
    phones.forEach((el, i) => {
      const s = st[i];
      const down = (e: PointerEvent) => {
        if (e.button !== 0) return;
        const p = toSvg(e);
        s.drag = true; s.id = e.pointerId; s.gx = p.x; s.gy = p.y; s.bx = s.x; s.by = s.y; s.t = e.timeStamp;
        s.vx = s.vy = 0;
        try { el!.setPointerCapture(e.pointerId); } catch { /* synthetic/stale pointer */ }
        el!.classList.add("is-dragging");
        e.preventDefault();
        kick();
      };
      const move = (e: PointerEvent) => {
        if (!s.drag || e.pointerId !== s.id) return;
        const p = toSvg(e);
        const nx = rubber(s.bx + p.x - s.gx), ny = rubber(s.by + p.y - s.gy);
        const dt = Math.max(0.008, (e.timeStamp - s.t) / 1000);
        s.vx = Math.max(-2500, Math.min(2500, (nx - s.x) / dt));
        s.vy = Math.max(-2500, Math.min(2500, (ny - s.y) / dt));
        s.x = nx; s.y = ny; s.t = e.timeStamp;
      };
      const up = (e: PointerEvent) => {
        if (!s.drag || e.pointerId !== s.id) return;
        s.drag = false;
        if (e.timeStamp - s.t > 80) s.vx = s.vy = 0; // held still → no fling
        el!.classList.remove("is-dragging");
        try { if (el!.hasPointerCapture(e.pointerId)) el!.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        kick();
      };
      el!.addEventListener("pointerdown", down);
      el!.addEventListener("pointermove", move);
      el!.addEventListener("pointerup", up);
      el!.addEventListener("pointercancel", up);
      offs.push(() => {
        el!.removeEventListener("pointerdown", down);
        el!.removeEventListener("pointermove", move);
        el!.removeEventListener("pointerup", up);
        el!.removeEventListener("pointercancel", up);
      });
    });

    return () => { cancelAnimationFrame(raf); offs.forEach((f) => f()); };
  }, []);

  return <g ref={ref} aria-hidden="true" />;
}
