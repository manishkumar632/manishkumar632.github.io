/* Spring-driven "jelly" for DOM/SVG elements marked with [data-jelly].
   Cursor movement drags + skews them, a click squishes them, and damped springs wobble them back.
   The loop sleeps when everything is at rest. Returns a cleanup function. */

type Body = {
  el: HTMLElement | SVGElement;
  x: number; y: number; vx: number; vy: number; // drag offset (svg units)
  kx: number; ky: number; vkx: number; vky: number; // skew (deg)
  s: number; vs: number; // squash amount
};

const clamp = (v: number, m: number) => (v > m ? m : v < -m ? -m : v);

export function attachJelly(root: HTMLElement | null) {
  if (!root) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const bodies: Body[] = Array.from(root.querySelectorAll<HTMLElement | SVGElement>("[data-jelly]")).map((el) => ({
    el, x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, vkx: 0, vky: 0, s: 0, vs: 0,
  }));
  if (!bodies.length) return () => {};

  const svg = root.querySelector("svg");
  const vbW = svg?.viewBox.baseVal?.width || 640;
  let px = NaN, py = NaN;
  let raf = 0;
  let last = 0;
  let running = false;

  const kick = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(step);
  };

  const influence = (b: Body, cx: number, cy: number, pad: number) => {
    const r = b.el.getBoundingClientRect();
    const ox = Math.max(r.left - cx, 0, cx - r.right);
    const oy = Math.max(r.top - cy, 0, cy - r.bottom);
    const d = Math.hypot(ox, oy);
    return d > pad ? 0 : 1 - d / pad;
  };

  const onMove = (e: PointerEvent) => {
    const cx = e.clientX, cy = e.clientY;
    if (Number.isNaN(px)) { px = cx; py = cy; return; }
    const dx = cx - px, dy = cy - py;
    px = cx; py = cy;
    const rr = root.getBoundingClientRect();
    if (cy < rr.top - 60 || cy > rr.bottom + 60 || cx < rr.left - 60 || cx > rr.right + 60) return;
    const k = svg ? vbW / (svg.getBoundingClientRect().width || vbW) : 1; // px -> svg units
    let any = false;
    for (const b of bodies) {
      const f = influence(b, cx, cy, 40);
      if (!f) continue;
      any = true;
      const sp = Math.min(Math.hypot(dx, dy), 60);
      b.vx += dx * k * 9 * f;
      b.vy += dy * k * 9 * f;
      b.vkx += -dx * 6 * f; // lean against the motion like jelly
      b.vky += -dy * 3 * f;
      b.vs += sp * 0.012 * f;
    }
    if (any) kick();
  };

  const onDown = (e: PointerEvent) => {
    let any = false;
    for (const b of bodies) {
      const f = influence(b, e.clientX, e.clientY, 1);
      if (!f) continue;
      any = true;
      b.vs += 2.6; // squish: wide + short, then boing
      b.vky += (Math.random() - 0.5) * 60;
    }
    if (any) kick();
  };

  function step(t: number) {
    const dt = Math.min((t - last) / 1000, 1 / 30);
    last = t;
    let energy = 0;
    const sub = 3;
    const h = dt / sub;
    for (const b of bodies) {
      for (let i = 0; i < sub; i++) {
        b.vx += (-200 * b.x - 9 * b.vx) * h;
        b.vy += (-200 * b.y - 9 * b.vy) * h;
        b.vkx += (-260 * b.kx - 7 * b.vkx) * h;
        b.vky += (-260 * b.ky - 7 * b.vky) * h;
        b.vs += (-300 * b.s - 8 * b.vs) * h;
        b.x = clamp(b.x + b.vx * h, 16);
        b.y = clamp(b.y + b.vy * h, 16);
        b.kx = clamp(b.kx + b.vkx * h, 9);
        b.ky = clamp(b.ky + b.vky * h, 6);
        b.s = clamp(b.s + b.vs * h, 0.14);
      }
      energy += Math.abs(b.x) + Math.abs(b.y) + Math.abs(b.kx) + Math.abs(b.ky) + Math.abs(b.s) * 40 +
        Math.abs(b.vx) * 0.05 + Math.abs(b.vy) * 0.05 + Math.abs(b.vkx) * 0.05 + Math.abs(b.vs);
      b.el.style.transform =
        `translate(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px) skew(${b.kx.toFixed(2)}deg, ${b.ky.toFixed(2)}deg) ` +
        `scale(${(1 + b.s).toFixed(4)}, ${(1 - b.s * 0.8).toFixed(4)})`;
    }
    if (energy < 0.02) {
      running = false;
      for (const b of bodies) {
        Object.assign(b, { x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, vkx: 0, vky: 0, s: 0, vs: 0 });
        b.el.style.transform = "";
      }
      return;
    }
    raf = requestAnimationFrame(step);
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  };
}
