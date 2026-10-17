/* Scalable SVG versions of the Figma diagrams (Atom 8:170, Prototype flow 8:249, Schema 8:350). */

import Atom3D from "./Atom3D";
import ElasticFlow from "./ElasticFlow";

const FONT = "var(--font-geist-sans), Inter, system-ui, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/* ---------------- Phone screen (hero mockup, HTML for crisp text) ---------------- */
export function VaultScreen() {
  return (
    <div className="ps">
      <div className="ps-status">
        <span>9:41</span>
        <span className="ps-notch" />
        <span>5G ▮</span>
      </div>
      <div className="ps-hello">Good evening</div>
      <div className="ps-app">Vault Wallet</div>
      <div className="ps-card">
        <div className="ps-label">Total balance</div>
        <div className="ps-bal">₹ 2,48,560</div>
        <div className="ps-meta">
          <span>•••• 4821</span>
          <span className="ps-badge">🔒 E2E encrypted</span>
        </div>
      </div>
      <div className="ps-actions">
        {[
          ["↑", "Send"],
          ["↓", "Receive"],
          ["⌗", "Scan"],
          ["⋯", "More"],
        ].map(([i, l]) => (
          <div key={l} className="ps-act">
            <span>{i}</span>
            {l}
          </div>
        ))}
      </div>
      <div className="ps-sec">Recent activity</div>
      {[
        ["☕", "Blue Tokai", "Coffee · 8:12 PM", "−₹320", false],
        ["💼", "Salary credit", "Today · 9:00 AM", "+₹85,000", true],
        ["⚡", "Electricity", "Yesterday", "−₹1,240", false],
      ].map(([ic, t, s, a, pos]) => (
        <div key={t as string} className="ps-row">
          <span className="ps-ic">{ic}</span>
          <div className="ps-rt">
            <b>{t}</b>
            <small>{s}</small>
          </div>
          <span className={pos ? "ps-pos" : "ps-neg"}>{a}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Chapter 01: Atom breakdown ---------------- */
/* The six "atoms" every screen is checked for. Fixed, non-overlapping slots (3 left / 3 right),
   listed clockwise from top-left so the highlight walks around the phone in order. */
const chips: Array<[label: string, side: "l" | "r", y: number]> = [
  ["Loading", "l", 90],
  ["Empty", "r", 90],
  ["Error · retry", "r", 263],
  ["Offline first", "r", 436],
  ["48dp tap targets", "l", 436],
  ["Contrast 4.5:1", "l", 263],
];
const chipW = (label: string) => Math.round(label.length * 7.6 + 52);

export function AtomDiagram() {
  return (
    <div className="pf-atom">
    <svg viewBox="-10 0 500 580" role="img" aria-label="One screen broken into 24 questions: loading, empty, error, offline, tap targets, contrast" fontFamily={FONT}>
      {/* static fallback orbits (no WebGL / before the 3D atom is ready); fades out once Babylon draws */}
      <g className="pf-atom-fallback" transform="translate(240 280)">
        {[30, -30, 90].map((rot) => (
          <ellipse key={rot} transform={`rotate(${rot})`} rx="220" ry="90" fill="none" stroke="#9C8CFF" strokeOpacity=".45" strokeWidth="1.5" />
        ))}
      </g>
      <g transform="translate(192 185)">
        <rect width="96" height="190" rx="18" fill="#120E2E" stroke="#9C8CFF" strokeWidth="2" />
        <rect x="8" y="10" width="80" height="170" rx="12" fill="#0F0C29" />
        <rect x="16" y="24" width="40" height="6" rx="3" fill="#B9B3E6" opacity=".6" />
        <rect x="16" y="40" width="64" height="34" rx="8" fill="#7C5CE8" />
        <rect x="16" y="84" width="64" height="8" rx="4" fill="#E9E3FF" opacity=".25" />
        <rect x="16" y="100" width="52" height="8" rx="4" fill="#E9E3FF" opacity=".2" />
        <rect x="16" y="116" width="58" height="8" rx="4" fill="#E9E3FF" opacity=".15" />
        <rect x="16" y="150" width="64" height="18" rx="9" fill="#FFC27A" />
      </g>
      <text x="240" y="556" textAnchor="middle" fontSize="15" fill="#B9B3E6">
        1 screen → <tspan fill="#FFC27A" fontWeight="700">24 questions</tspan>, before a single pixel.
      </text>
    </svg>
    <Atom3D />
    {/* Pills sit above the 3D canvas. A highlight walks clockwise around the phone: each check lights up,
        draws a link to the screen and shows a tick, then hands over to the next one ("screen inspected"). */}
    <svg className="pf-atom-over" viewBox="-10 0 500 580" aria-hidden="true" fontFamily={FONT}>
      {chips.map(([label, side, y], i) => {
        const w = chipW(label);
        const x = side === "l" ? -5 : 485 - w;
        const cy = y + 17;
        const px = side === "l" ? 192 : 288;
        const py = Math.min(355, Math.max(205, cy));
        const sx = side === "l" ? x + w : x;
        const st = { ["--i" as string]: i } as React.CSSProperties;
        return (
          <g key={label}>
            <path className="pf-chip-link" style={st} d={`M${sx} ${cy} L${px} ${py}`} stroke="#FFC27A" strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
            <circle className="pf-chip-link" style={st} cx={px} cy={py} r="3.5" fill="#FFC27A" />
            <g transform={`translate(${x} ${y})`}>
              <g className="pf-chip" style={st}>
                <rect width={w} height="34" rx="17" fill="#1E1A5E" stroke="#9C8CFF" strokeOpacity=".6" />
                <g className="pf-chip-hi" style={st}>
                  <rect width={w} height="34" rx="17" fill="#3A2A6E" stroke="#FFC27A" strokeWidth="1.5" />
                  <text x={w - 20} y="22" fontSize="13" fontWeight="800" fill="#4ADE80">✓</text>
                </g>
                <circle cx="17" cy="17" r="4" fill="#FFC27A" />
                <text x="28" y="22" fontSize="13.5" fontWeight="600" fill="#E9E3FF">
                  {label}
                </text>
              </g>
            </g>
          </g>
        );
      })}
    </svg>
    </div>
  );
}

/* ---------------- Chapter 02: Prototype flow ---------------- */
function MiniPhone({ x, y, title, children }: { x: number; y: number; title: string; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="190" height="390" rx="30" fill="#120E2E" stroke="#9C8CFF" strokeWidth="2" />
      <rect x="9" y="9" width="172" height="372" rx="22" fill="#0F0C29" />
      <rect x="70" y="16" width="50" height="8" rx="4" fill="#120E2E" />
      <text x="95" y="-14" textAnchor="middle" fontSize="12" fontWeight="600" fill="#8FE3D2" letterSpacing="1.5">
        {title.toUpperCase()}
      </text>
      {children}
    </g>
  );
}

export function PrototypeFlow() {
  return (
    <svg className="pf-elastic" viewBox="0 0 800 620" role="img" aria-label="Clickable prototype: onboarding, home and confirm screens linked by tap and swipe interactions" fontFamily={FONT}>
      <defs>
        <linearGradient id="pp-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B9BEF" />
          <stop offset="1" stopColor="#7C5CE8" />
        </linearGradient>
        <marker id="pp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M0 0 L10 5 L0 10Z" fill="#0D99FF" />
        </marker>
      </defs>

      <g data-phone="0" className="pf-drag">
      <MiniPhone x={0} y={120} title="Onboarding">
        <circle cx="95" cy="140" r="52" fill="#1E1A5E" />
        <path d="M75 140 l14 14 l28 -30" stroke="#8FE3D2" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="95" y="228" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">Welcome to Vault</text>
        <text x="95" y="250" textAnchor="middle" fontSize="11" fill="#B9B3E6">Money, safely in your pocket</text>
        <g fill="#E9E3FF">
          <circle cx="83" cy="284" r="3.5" />
          <circle cx="95" cy="284" r="3.5" opacity=".35" />
          <circle cx="107" cy="284" r="3.5" opacity=".35" />
        </g>
        <rect x="24" y="322" width="142" height="38" rx="19" fill="#0D99FF" />
        <text x="95" y="346" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">Get started</text>
      </MiniPhone>
      <circle cx="95" cy="468" r="14" fill="none" stroke="#fff" strokeWidth="2">
        <animate attributeName="r" values="8;26" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <circle cx="95" cy="468" r="7" fill="#fff" opacity=".85" />
      </g>

      <g data-phone="1" className="pf-drag">
      <MiniPhone x={290} y={40} title="Home">
        <text x="22" y="54" fontSize="10" fill="#B9B3E6">Good evening</text>
        <text x="22" y="72" fontSize="14" fontWeight="700" fill="#fff">Vault Wallet</text>
        <rect x="20" y="86" width="150" height="84" rx="14" fill="url(#pp-card)" />
        <text x="32" y="108" fontSize="9" fill="#E9E3FF">Total balance</text>
        <text x="32" y="132" fontSize="17" fontWeight="800" fill="#fff">₹ 2,48,560</text>
        <text x="32" y="156" fontSize="9" fill="#E9E3FF">•••• 4821</text>
        {["Send", "Receive", "Scan", "More"].map((l, i) => (
          <g key={l} transform={`translate(${24 + i * 37} 186)`}>
            <rect width="30" height="30" rx="10" fill={i === 0 ? "#0D99FF" : "#1E1A5E"} />
            <text x="15" y="44" textAnchor="middle" fontSize="8" fill="#B9B3E6">{l}</text>
          </g>
        ))}
        <text x="22" y="260" fontSize="10" fontWeight="600" fill="#E9E3FF">Recent activity</text>
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(20 ${272 + i * 32})`}>
            <rect width="150" height="26" rx="8" fill="#1A1646" />
            <circle cx="14" cy="13" r="7" fill="#2A1D63" />
            <rect x="28" y="10" width={60 - i * 8} height="6" rx="3" fill="#E9E3FF" opacity=".35" />
            <rect x="112" y="10" width="28" height="6" rx="3" fill={i === 1 ? "#4ADE80" : "#FF8A9B"} opacity=".8" />
          </g>
        ))}
      </MiniPhone>
      </g>

      <g data-phone="2" className="pf-drag">
      <MiniPhone x={580} y={140} title="Confirm">
        <circle cx="95" cy="130" r="44" fill="#4ADE80" opacity=".18" />
        <circle cx="95" cy="130" r="30" fill="#4ADE80" />
        <path d="M82 130 l9 9 l18 -19" stroke="#0F0C29" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <text x="95" y="206" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">₹320 sent</text>
        <text x="95" y="226" textAnchor="middle" fontSize="11" fill="#B9B3E6">to Blue Tokai</text>
        <rect x="24" y="250" width="142" height="44" rx="10" fill="#1A1646" />
        <text x="36" y="268" fontSize="9" fill="#B9B3E6">Ref</text>
        <text x="36" y="284" fontSize="10" fontFamily={MONO} fill="#E9E3FF">idem_7f3a…c21</text>
        <rect x="24" y="322" width="142" height="38" rx="19" fill="#0D99FF" />
        <text x="95" y="346" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">Done</text>
      </MiniPhone>
      </g>

      <g fill="none" stroke="#0D99FF" strokeWidth="2.5" markerEnd="url(#pp-arrow)">
        <path data-link="0" className="pf-flow" d="M190 315 C237 315 237 220 284 220" />
        <path data-link="1" className="pf-flow" d="M480 260 C527 260 527 340 574 340" />
      </g>
      <g fontSize="12" fontWeight="700" fill="#0D99FF">
        <g data-label="0">
          <rect x="200" y="236" width="58" height="22" rx="11" fill="#0B0824" stroke="#0D99FF" />
          <text x="229" y="251" textAnchor="middle">On tap</text>
        </g>
        <g data-label="1">
          <rect x="492" y="282" width="72" height="22" rx="11" fill="#0B0824" stroke="#0D99FF" />
          <text x="528" y="297" textAnchor="middle">On swipe</text>
        </g>
      </g>
      <ElasticFlow />

      <g transform="translate(300 470) rotate(-3)">
        <rect width="210" height="104" rx="6" fill="#FFE08A" />
        <text x="16" y="28" fontSize="11" fontWeight="800" fill="#5A3E00" letterSpacing="1.5">UX NOTE</text>
        <text x="16" y="54" fontSize="14" fontWeight="600" fill="#2A1D00">Can one thumb reach Send?</text>
        <text x="16" y="78" fontSize="14" fill="#2A1D00">Moved it lower. ✓</text>
      </g>
    </svg>
  );
}

/* ---------------- Chapter 03: Schema ---------------- */
type Col = [badge: "PK" | "FK" | "UQ" | "IX" | "", name: string, type: string];
const BADGE: Record<string, string> = { PK: "#FFC27A", FK: "#5EE7FF", UQ: "#9C8CFF", IX: "#4ADE80" };
const tables: Array<{ name: string; x: number; y: number; w: number; cols: Col[] }> = [
  { name: "users", x: 0, y: 60, w: 186, cols: [["PK", "id", "uuid"], ["UQ", "phone", "varchar(15)"], ["", "name", "text"], ["", "created_at", "tstz"]] },
  { name: "wallets", x: 340, y: 0, w: 196, cols: [["PK", "id", "uuid"], ["FK", "user_id", "uuid"], ["", "balance_paise", "bigint"], ["", "currency", "char(3)"]] },
  {
    name: "transactions",
    x: 330,
    y: 270,
    w: 226,
    cols: [["PK", "id", "uuid"], ["FK", "wallet_id", "uuid"], ["", "amount_paise", "bigint"], ["UQ", "idempotency_key", "text"], ["IX", "created_at", "tstz"]],
  },
  { name: "sessions", x: 0, y: 360, w: 196, cols: [["PK", "id", "uuid"], ["FK", "user_id", "uuid"], ["", "device_hash", "sha256"], ["", "expires_at", "tstz"]] },
];
const rowY = (t: { y: number }, i: number) => t.y + 40 + i * 28 + 14;

export function SchemaDiagram() {
  const [u, w, tx, s] = tables;
  const pills = ["3NF · zero redundancy", "Money in paise · no float errors", "Index (wallet_id, created_at)", "Idempotency key · no double charges"];
  return (
    <svg viewBox="-40 -10 640 650" role="img" aria-label="Normalized schema: users, wallets, transactions and sessions with keys and indexes" fontFamily={FONT}>
      <g fill="none" stroke="#5EE7FF" strokeWidth="1.6" strokeOpacity=".7">
        <path className="pf-flow" d={`M${u.w} ${rowY(u, 0)} C${u.w + 80} ${rowY(u, 0)} ${w.x - 80} ${rowY(w, 1)} ${w.x} ${rowY(w, 1)}`} />
        <path className="pf-flow" d={`M${w.x + w.w} ${rowY(w, 0)} C${w.x + w.w + 60} ${rowY(w, 0)} ${tx.x + tx.w + 60} ${rowY(tx, 1)} ${tx.x + tx.w} ${rowY(tx, 1)}`} />
        <path className="pf-flow" d={`M0 ${rowY(u, 0)} C-34 ${rowY(u, 0)} -34 ${rowY(s, 1)} 0 ${rowY(s, 1)}`} />
      </g>
      <g fontSize="11" fontWeight="700" fill="#5EE7FF" fontFamily={MONO}>
        <text x="262" y="92">1 : n</text>
        <text x="572" y="210">1 : n</text>
        <text x="-36" y="284">1 : n</text>
      </g>
      {tables.map((t) => {
        const h = 40 + t.cols.length * 28 + 12;
        return (
          <g key={t.name} transform={`translate(${t.x} ${t.y})`}>
            <g data-jelly="" className="pf-jelly">
            <rect width={t.w} height={h} rx="14" fill="#120E2E" stroke="#5EE7FF" strokeOpacity=".45" />
            <path d={`M0 14 a14 14 0 0 1 14 -14 H${t.w - 14} a14 14 0 0 1 14 14 V36 H0Z`} fill="#1A1646" />
            <text x="16" y="25" fontSize="14" fontWeight="700" fill="#fff" fontFamily={MONO}>
              {t.name}
            </text>
            {t.cols.map(([b, n, ty], i) => (
              <g key={n} transform={`translate(0 ${40 + i * 28})`}>
                {b ? (
                  <>
                    <rect x="12" y="6" width="24" height="16" rx="4" fill={BADGE[b]} fillOpacity=".18" stroke={BADGE[b]} strokeOpacity=".6" />
                    <text x="24" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill={BADGE[b]}>
                      {b}
                    </text>
                  </>
                ) : null}
                <text x="44" y="18" fontSize="12" fill="#E9E3FF" fontFamily={MONO}>
                  {n}
                </text>
                <text x={t.w - 12} y="18" textAnchor="end" fontSize="10.5" fill="#B9B3E6" fontFamily={MONO}>
                  {ty}
                </text>
              </g>
            ))}
            </g>
          </g>
        );
      })}
      {pills.map((p, i) => (
        <g key={p} transform={`translate(${(i % 2) * 300} ${545 + Math.floor(i / 2) * 50})`}>
          <g data-jelly="" className="pf-jelly">
            <rect width="288" height="38" rx="19" fill="#0E0A2C" stroke="#5EE7FF" strokeOpacity=".35" />
            <circle cx="20" cy="19" r="4" fill="#5EE7FF" />
            <text x="34" y="24" fontSize="13" fontWeight="600" fill="#E9E3FF">
              {p}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );
}
