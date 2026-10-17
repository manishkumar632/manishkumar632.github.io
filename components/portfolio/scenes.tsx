import type { ReactNode } from "react";
import HeroClouds from "./HeroClouds";

/* Deterministic RNG so server and client render identical SVG (no hydration mismatch). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
const r1 = (n: number) => Math.round(n * 10) / 10;

export function Layer({ speed, children }: { speed: number; children: ReactNode }) {
  return (
    <div className="pf-layer" data-speed={speed}>
      {children}
    </div>
  );
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {children}
    </svg>
  );
}

function stars(seed: number, count: number, maxY: number) {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => ({
    k: i,
    x: r1(r() * 1440),
    y: r1(r() * maxY),
    s: r1(0.6 + r() * 1.6),
    o: r1(0.3 + r() * 0.7),
    d: r1(r() * 4),
  }));
}

function grass(seed: number, baseY: number, color: string) {
  const r = rng(seed);
  const blades: string[] = [];
  for (let i = 0; i < 110; i++) {
    const x = r1(i * 13.2 + r() * 8);
    const h = r1(30 + r() * 70);
    const lean = r1((r() - 0.5) * 30);
    const y = r1(baseY + r() * 30);
    blades.push(`M${x} ${y + 60} Q${r1(x + lean * 0.3)} ${r1(y - h * 0.5)} ${r1(x + lean)} ${r1(y - h)}`);
  }
  return <path d={blades.join(" ")} stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />;
}

function pine(x: number, base: number, h: number, w: number) {
  const tiers = [0, 1, 2].map((i) => {
    const top = base - h + i * h * 0.22;
    const bw = w * (0.45 + i * 0.28);
    const bot = top + h * 0.46;
    return `M${r1(x)} ${r1(top)} L${r1(x + bw / 2)} ${r1(bot)} L${r1(x - bw / 2)} ${r1(bot)}Z`;
  });
  return tiers.join(" ") + ` M${r1(x - w * 0.05)} ${r1(base - h * 0.1)} h${r1(w * 0.1)} v${r1(h * 0.12)} h${r1(-w * 0.1)}Z`;
}

function forestRow(seed: number, base: number, minH: number, maxH: number, gap: number) {
  const r = rng(seed);
  const d: string[] = [];
  for (let x = -40; x < 1500; x += gap + r() * gap * 0.6) {
    const h = minH + r() * (maxH - minH);
    d.push(pine(x, base + r() * 20, h, h * 0.42));
  }
  return d.join(" ");
}

/* ---------------- HERO: dusk over the mountains ---------------- */
/* ---------------- flapping birds (SMIL wing morph: flap, flap, glide) ---------------- */
const WING_UP = "M-17 -10 Q-9 -6 -2 -1 Q0 0 2 -1 Q9 -6 17 -10";
const WING_MID = "M-18 -2 Q-9 -6 -2 -1 Q0 0 2 -1 Q9 -6 18 -2";
const WING_DOWN = "M-14 8 Q-8 -1 -2 -1 Q0 0 2 -1 Q8 -1 14 8";
const WING_GLIDE = "M-18 -3 Q-9 -5 -2 -1 Q0 0 2 -1 Q9 -5 18 -3";
const FLAP = [WING_UP, WING_DOWN, WING_UP, WING_DOWN, WING_MID, WING_GLIDE, WING_GLIDE, WING_UP].join(";");
const FLAP_TIMES = "0;.12;.24;.36;.46;.56;.88;1";
const EASE = Array(7).fill(".45 0 .55 1").join(";");
const BIRDS = [
  { k: 1, x: 840, y: 228, s: 1, dur: 2.6, delay: 0 },
  { k: 2, x: 884, y: 258, s: 0.78, dur: 2.3, delay: -0.7 },
  { k: 3, x: 800, y: 270, s: 0.66, dur: 2.1, delay: -1.3 },
  { k: 4, x: 930, y: 214, s: 0.56, dur: 2.0, delay: -0.4 },
  { k: 5, x: 760, y: 240, s: 0.48, dur: 1.9, delay: -1.6 },
];
function Bird({ x, y, s, dur, delay }: { x: number; y: number; s: number; dur: number; delay: number }) {
  const begin = `${delay}s`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g>
        {/* body lifts on the downstroke, sinks on the upstroke */}
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 2;0 -2;0 2;0 -2;0 0;0 1;0 2;0 2"
          keyTimes={FLAP_TIMES}
          dur={`${dur}s`}
          begin={begin}
          repeatCount="indefinite"
        />
        <path d={WING_UP} fill="none" stroke="#2A1D63" strokeWidth={2.6 / s} strokeLinecap="round" strokeLinejoin="round">
          <animate
            attributeName="d"
            values={FLAP}
            keyTimes={FLAP_TIMES}
            calcMode="spline"
            keySplines={EASE}
            dur={`${dur}s`}
            begin={begin}
            repeatCount="indefinite"
          />
        </path>
        <ellipse cx="0" cy="0.5" rx="3.2" ry="1.8" fill="#2A1D63" />
      </g>
    </g>
  );
}

export function HeroScene() {
  const st = stars(7, 70, 420);
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1B1852" />
              <stop offset=".42" stopColor="#5A3EA6" />
              <stop offset=".72" stopColor="#C06C9E" />
              <stop offset="1" stopColor="#F4A36E" />
            </linearGradient>
            <radialGradient id="h-sun">
              <stop offset="0" stopColor="#FFE2B0" stopOpacity=".9" />
              <stop offset=".35" stopColor="#FFC27A" stopOpacity=".45" />
              <stop offset="1" stopColor="#F4A36E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#h-sky)" />
          {st.map((s) => (
            <circle key={s.k} className="pf-twinkle" cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} style={{ animationDelay: `${s.d}s` }} />
          ))}
          <circle cx="1060" cy="600" r="320" fill="url(#h-sun)" />
          <circle cx="1060" cy="600" r="74" fill="#FFE6BF" opacity=".92" />
        </Svg>
      </Layer>
      <Layer speed={0.18}>
        <HeroClouds />
      </Layer>
      <Layer speed={0.25}>
        <Svg>
          <defs>
            <linearGradient id="h-shadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7A52B8" />
              <stop offset="1" stopColor="#3F2F8C" />
            </linearGradient>
            <linearGradient id="h-lit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFC27A" />
              <stop offset=".45" stopColor="#E9855F" />
              <stop offset="1" stopColor="#B4568A" />
            </linearGradient>
          </defs>
          <path d="M0 560 L220 400 L400 480 L610 300 L880 470 L1110 330 L1300 430 L1440 380 V900 H0Z" fill="url(#h-shadow)" opacity=".85" />
          <path d="M0 660 L170 540 L300 590 L470 400 L560 460 L720 270 L860 440 L970 380 L1130 480 L1270 410 L1440 520 V900 H0Z" fill="url(#h-lit)" />
          <path d="M720 270 L600 470 L660 500 L700 420Z M470 400 L390 520 L430 540Z M970 380 L900 470 L940 480Z M1270 410 L1200 480 L1240 490Z" fill="#7A52B8" opacity=".55" />
          <path d="M720 270 L742 300 L728 296 L716 312 L704 296 L696 302Z" fill="#FFE6BF" opacity=".8" />
        </Svg>
      </Layer>
      <Layer speed={0.35}>
        <Svg>
          <g className="pf-birds">
            {BIRDS.map((b) => (
              <Bird key={b.k} {...b} />
            ))}
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.5}>
        <Svg>
          <defs>
            <linearGradient id="h-lake" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#8C8BE6" />
              <stop offset="1" stopColor="#3C3192" />
            </linearGradient>
          </defs>
          <path d="M0 690 C200 640 380 660 560 690 C760 722 980 650 1440 680 V900 H0Z" fill="#4A3A9E" />
          <path d="M0 742 C300 724 1100 732 1440 738 V900 H0Z" fill="url(#h-lake)" />
          <g fill="#FFC27A" className="pf-shimmer">
            <rect x="1000" y="752" width="120" height="3" rx="1.5" opacity=".6" />
            <rect x="1020" y="766" width="80" height="3" rx="1.5" opacity=".45" />
            <rect x="1036" y="780" width="48" height="3" rx="1.5" opacity=".3" />
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.8}>
        <Svg>
          <defs>
            <linearGradient id="h-fg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2A1D63" />
              <stop offset="1" stopColor="#120C33" />
            </linearGradient>
          </defs>
          {grass(11, 820, "#2A1D63")}
          <path d="M0 830 C160 784 300 802 460 822 C640 846 820 792 1000 806 C1180 820 1320 790 1440 800 V900 H0Z" fill="url(#h-fg)" />
        </Svg>
      </Layer>
    </>
  );
}

/* ---------------- CH01: atomic night meadow ---------------- */
export function AtomScene() {
  const st = stars(21, 50, 900);
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="a-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#120C33" />
              <stop offset=".55" stopColor="#2A1D63" />
              <stop offset="1" stopColor="#3B2B85" />
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#a-bg)" />
          {st.map((s) => (
            <circle key={s.k} className="pf-twinkle" cx={s.x} cy={s.y} r={s.s * 0.8} fill="#E9E3FF" opacity={s.o * 0.6} style={{ animationDelay: `${s.d}s` }} />
          ))}
        </Svg>
      </Layer>
      <Layer speed={0.3}>
        <Svg>
          <g fill="none" stroke="#9C8CFF" opacity=".12">
            <circle cx="1120" cy="460" r="300" />
            <circle cx="1120" cy="460" r="420" />
            <circle cx="1120" cy="460" r="540" />
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.85}>
        <Svg>
          <g fill="#0B0824">
            <path d="M0 900 C30 760 90 660 210 590 C140 680 110 790 130 900Z" />
            <path d="M60 900 C120 780 220 720 330 700 C240 760 190 830 190 900Z" />
            <path d="M0 900 C0 820 20 760 60 720 C50 790 60 850 80 900Z" />
            <path d="M1440 900 C1410 770 1350 680 1240 620 C1300 700 1330 800 1320 900Z" />
            <path d="M1390 900 C1330 790 1240 740 1140 730 C1220 780 1260 840 1260 900Z" />
            <path d="M0 870 C400 850 1000 860 1440 870 V900 H0Z" />
          </g>
        </Svg>
      </Layer>
    </>
  );
}

/* ---------------- CH02: firefly forest ---------------- */
export function ForestScene() {
  const r = rng(33);
  const flies = Array.from({ length: 34 }, (_, i) => ({ k: i, x: r1(r() * 1440), y: r1(420 + r() * 420), s: r1(1.5 + r() * 2.5), d: r1(r() * 5) }));
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="f-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0B0824" />
              <stop offset=".4" stopColor="#1E1A5E" />
              <stop offset=".75" stopColor="#3A3792" />
              <stop offset="1" stopColor="#4E46A8" />
            </linearGradient>
            <radialGradient id="f-glow">
              <stop offset="0" stopColor="#8FE3D2" stopOpacity=".35" />
              <stop offset="1" stopColor="#8FE3D2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#f-bg)" />
          <ellipse cx="720" cy="640" rx="620" ry="300" fill="url(#f-glow)" />
        </Svg>
      </Layer>
      <Layer speed={0.3}>
        <Svg>
          <path d={forestRow(41, 760, 220, 340, 70)} fill="#2B2770" />
        </Svg>
      </Layer>
      <Layer speed={0.55}>
        <Svg>
          <path d={forestRow(52, 860, 330, 520, 120)} fill="#15123F" />
          {flies.map((f) => (
            <circle key={f.k} className="pf-firefly" cx={f.x} cy={f.y} r={f.s} fill="#FFE08A" style={{ animationDelay: `${f.d}s` }} />
          ))}
        </Svg>
      </Layer>
      <Layer speed={0.65}>
        <Svg>
          <g fill="#E9E3FF" className="pf-drift">
            <ellipse cx="300" cy="780" rx="420" ry="40" opacity=".06" />
            <ellipse cx="1100" cy="800" rx="460" ry="46" opacity=".07" />
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.85}>
        <Svg>
          {grass(61, 830, "#0B0824")}
          <path d="M0 850 C300 820 600 846 900 834 C1140 826 1300 840 1440 836 V900 H0Z" fill="#0B0824" />
        </Svg>
      </Layer>
    </>
  );
}

/* ---------------- CH03: crystal cave ---------------- */
function crystals(x: number, base: number, scale: number) {
  const shards = [
    [0, 1, 0.28],
    [-0.32, 0.7, 0.22],
    [0.34, 0.62, 0.2],
    [-0.6, 0.42, 0.16],
    [0.62, 0.38, 0.15],
  ];
  return shards
    .map(([dx, h, w]) => {
      const cx = x + dx * 100 * scale;
      const top = base - h * 220 * scale;
      const hw = w * 100 * scale;
      return `M${r1(cx - hw)} ${base} L${r1(cx - hw * 0.8)} ${r1(top + hw)} L${r1(cx)} ${r1(top)} L${r1(cx + hw * 0.8)} ${r1(top + hw)} L${r1(cx + hw)} ${base}Z`;
    })
    .join(" ");
}

export function CaveScene() {
  const r = rng(77);
  const dust = Array.from({ length: 40 }, (_, i) => ({ k: i, x: r1(r() * 1440), y: r1(150 + r() * 650), s: r1(0.8 + r() * 1.8), d: r1(r() * 6) }));
  const tips: string[] = [];
  for (let x = 0; x < 1460; x += 46) {
    const len = 40 + r() * 140;
    tips.push(`L${r1(x + 12)} ${r1(80 + len)} L${r1(x + 24)} 90`);
  }
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="c-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0B0824" />
              <stop offset=".35" stopColor="#140F42" />
              <stop offset=".7" stopColor="#18124D" />
              <stop offset="1" stopColor="#0E0A2C" />
            </linearGradient>
            <radialGradient id="c-glow">
              <stop offset="0" stopColor="#5EE7FF" stopOpacity=".28" />
              <stop offset="1" stopColor="#5EE7FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#c-bg)" />
          <ellipse cx="1060" cy="520" rx="560" ry="380" fill="url(#c-glow)" />
        </Svg>
      </Layer>
      <Layer speed={0.3}>
        <Svg>
          <path d={`M0 0 H1440 V90 L1440 90 ${""}M0 90 ${tips.join(" ")} L1440 90 V0 H0Z`} fill="#07051A" />
          <rect width="1440" height="92" fill="#07051A" />
        </Svg>
      </Layer>
      <Layer speed={0.5}>
        <Svg>
          <defs>
            <linearGradient id="c-cr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#BFF6FF" />
              <stop offset=".5" stopColor="#5EE7FF" />
              <stop offset="1" stopColor="#2A5FB8" />
            </linearGradient>
          </defs>
          <g fill="url(#c-cr)" className="pf-glowpulse">
            <path d={crystals(140, 860, 1.1)} opacity=".75" />
            <path d={crystals(640, 880, 0.7)} opacity=".55" />
            <path d={crystals(1320, 860, 1.25)} opacity=".7" />
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.65}>
        <Svg>
          {dust.map((p) => (
            <circle key={p.k} className="pf-firefly" cx={p.x} cy={p.y} r={p.s} fill="#5EE7FF" style={{ animationDelay: `${p.d}s` }} />
          ))}
        </Svg>
      </Layer>
      <Layer speed={0.85}>
        <Svg>
          <path d="M0 900 V820 L80 790 L170 812 L260 776 L380 820 L520 800 L700 836 L880 806 L1020 830 L1180 790 L1300 812 L1440 780 V900Z" fill="#07051A" />
        </Svg>
      </Layer>
    </>
  );
}

/* ---------------- CH04: secure night grid ---------------- */
export function SecureScene() {
  const lines: string[] = [];
  for (let x = -720; x <= 2160; x += 120) lines.push(`M720 520 L${x} 900`);
  for (let y = 560; y <= 900; y += 34 + (y - 560) * 0.25) lines.push(`M0 ${r1(y)} H1440`);
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="s-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0E0A2C" />
              <stop offset=".6" stopColor="#1B1852" />
              <stop offset="1" stopColor="#2A1D63" />
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#s-bg)" />
        </Svg>
      </Layer>
      <Layer speed={0.6}>
        <Svg>
          <path d={lines.join(" ")} stroke="#9C8CFF" strokeWidth="1" opacity=".14" fill="none" />
        </Svg>
      </Layer>
    </>
  );
}

/* ---------------- CH05: sunrise (loops back to hero) ---------------- */
export function SunriseScene() {
  return (
    <>
      <Layer speed={0.1}>
        <Svg>
          <defs>
            <linearGradient id="r-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1B1852" />
              <stop offset=".45" stopColor="#5A3EA6" />
              <stop offset=".75" stopColor="#C06C9E" />
              <stop offset="1" stopColor="#FFC27A" />
            </linearGradient>
            <radialGradient id="r-sun">
              <stop offset="0" stopColor="#FFE6BF" stopOpacity=".95" />
              <stop offset=".3" stopColor="#FFC27A" stopOpacity=".5" />
              <stop offset="1" stopColor="#F4A36E" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#r-sky)" />
          <g className="pf-rise">
            <circle cx="720" cy="720" r="380" fill="url(#r-sun)" />
            <circle cx="720" cy="720" r="96" fill="#FFE6BF" />
          </g>
        </Svg>
      </Layer>
      <Layer speed={0.35}>
        <Svg>
          <path d="M0 640 L200 520 L380 600 L560 470 L720 560 L900 450 L1100 590 L1260 510 L1440 600 V900 H0Z" fill="#7A52B8" opacity=".9" />
        </Svg>
      </Layer>
      <Layer speed={0.55}>
        <Svg>
          <path d="M0 730 C260 690 520 720 720 740 C960 762 1200 700 1440 720 V900 H0Z" fill="#3F2F8C" />
        </Svg>
      </Layer>
      <Layer speed={0.85}>
        <Svg>
          {grass(91, 830, "#120C33")}
          <path d="M0 840 C300 806 600 830 900 820 C1140 812 1300 826 1440 820 V900 H0Z" fill="#120C33" />
        </Svg>
      </Layer>
    </>
  );
}
