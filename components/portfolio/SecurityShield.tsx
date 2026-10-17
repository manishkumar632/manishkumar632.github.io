"use client";

import { useEffect, useRef, useState } from "react";

const RINGS = [
  { label: "Rate limiting", r: 0.95 },
  { label: "Bot & WAF filter", r: 0.78 },
  { label: "Auth · rotating JWT", r: 0.61 },
  { label: "Input validation", r: 0.44 },
  { label: "Encrypted core", r: 0.27 },
];
const WEIGHTS = [0.4, 0.28, 0.17, 0.1, 0.05];

type P = { x: number; y: number; vx: number; vy: number; bad: boolean; stop: number; dead: boolean };

function pickRing() {
  let v = Math.random();
  for (let i = 0; i < WEIGHTS.length; i++) {
    if ((v -= WEIGHTS[i]) <= 0) return i;
  }
  return 0;
}

export default function SecurityShield() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({ blocked: 0, served: 0, load: 12 });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0,
      h = 0,
      raf = 0,
      visible = false,
      last = performance.now(),
      lastStat = 0,
      acc = 0,
      blocked = 0,
      served = 0;
    const parts: P[] = [];
    const bursts: Array<{ x: number; y: number; t: number }> = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      w = r.width;
      h = r.height;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    const spawn = (R: number) => {
      const a = Math.random() * Math.PI * 2;
      const bad = Math.random() < 0.62;
      const speed = (bad ? 95 : 65) + Math.random() * 50;
      parts.push({
        x: w / 2 + Math.cos(a) * R * 1.12,
        y: h / 2 + Math.sin(a) * R * 1.12,
        vx: -Math.cos(a) * speed,
        vy: -Math.sin(a) * speed,
        bad,
        stop: bad ? RINGS[pickRing()].r * R : 0,
        dead: false,
      });
    };

    const frame = (t: number) => {
      if (!visible) return;
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      const cx = w / 2,
        cy = h / 2,
        R = Math.min(w, h) / 2 - 8;
      acc += dt * (reduce ? 3 : 14);
      while (acc > 1) {
        spawn(R);
        acc--;
      }

      ctx.clearRect(0, 0, w, h);
      // rings
      RINGS.forEach((ring, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r * R, 0, Math.PI * 2);
        ctx.setLineDash(i % 2 ? [] : [6, 10]);
        ctx.lineDashOffset = (t / 60) * (i % 4 === 0 ? 1 : -1);
        ctx.strokeStyle = `rgba(94,231,255,${0.18 + i * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // core
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.2);
      g.addColorStop(0, "rgba(74,222,128,.55)");
      g.addColorStop(1, "rgba(74,222,128,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0E0A2C";
      ctx.strokeStyle = "#4ADE80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4ADE80";
      ctx.font = `700 ${Math.max(11, R * 0.06)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("API", cx, cy);

      // particles
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (p.bad && d <= p.stop) {
          p.dead = true;
          blocked++;
          bursts.push({ x: p.x, y: p.y, t: 0 });
          continue;
        }
        if (!p.bad && d <= R * 0.12) {
          p.dead = true;
          served++;
          continue;
        }
        const col = p.bad ? "255,90,110" : "74,222,128";
        ctx.strokeStyle = `rgba(${col},.35)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08);
        ctx.stroke();
        ctx.fillStyle = `rgb(${col})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].dead) parts.splice(i, 1);
      for (const b of bursts) {
        b.t += dt;
        const k = b.t / 0.45;
        ctx.strokeStyle = `rgba(255,90,110,${Math.max(0, 1 - k)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3 + k * 12, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = bursts.length - 1; i >= 0; i--) if (bursts[i].t > 0.45) bursts.splice(i, 1);

      // ring labels (drawn last so they stay readable)
      ctx.font = `600 ${Math.max(10, R * 0.042)}px system-ui, sans-serif`;
      RINGS.forEach((ring) => {
        const y = cy - ring.r * R;
        const tw = ctx.measureText(ring.label).width + 14;
        ctx.fillStyle = "rgba(14,10,44,.85)";
        ctx.fillRect(cx - tw / 2, y - 9, tw, 18);
        ctx.fillStyle = "#BFF6FF";
        ctx.fillText(ring.label, cx, y);
      });

      if (t - lastStat > 400) {
        lastStat = t;
        setStats({ blocked, served, load: 10 + Math.round(Math.random() * 4) });
      }
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(c);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  const total = stats.blocked + stats.served || 1;
  return (
    <div className="pf-shield">
      <canvas ref={ref} role="img" aria-label="Layered defence: malicious requests are stopped at each ring while legitimate traffic reaches the API" />
      <div className="pf-status" aria-live="off">
        <div>
          <span className="dot bad" />
          Blocked <b>{stats.blocked.toLocaleString("en-IN")}</b>
        </div>
        <div>
          <span className="dot ok" />
          Served <b>{stats.served.toLocaleString("en-IN")}</b>
        </div>
        <div>
          Server load <b>~{stats.load}%</b>
        </div>
        <div className="bar">
          <i style={{ width: `${(stats.blocked / total) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
