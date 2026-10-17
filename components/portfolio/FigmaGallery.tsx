"use client";

import { useEffect, useRef, useState } from "react";

// Public, customer-only Figma file. The main FODIEX file (with the database
// design) is private and must never be linked or embedded here.
const FILE = "https://www.figma.com/design/uhiTNmq68ufLynMyRS0rXp/Fodiex-Customer";
const NODE = "0-1";
const OPEN_URL = FILE + "?node-id=" + NODE;
const EMBED_URL = "https://www.figma.com/embed?embed_host=share&url=" + encodeURIComponent(OPEN_URL);

export default function FigmaGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="cs-figma" style={{ ["--accent" as string]: "#FFC27A" }}>
      <div className="cs-figma-tabs">
        <button className="on" type="button">Customer app</button>
      </div>
      <p className="cs-figma-note">
        Home, restaurant & dish sheets, cart, payment (eSewa / Khalti), live tracking, coupons, addresses, orders, ratings and empty states
      </p>
      <div ref={ref} className="cs-figma-frame">
        {show ? (
          <iframe
            src={EMBED_URL}
            title="FODIEX customer app designed in Figma"
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <div className="cs-figma-ph">Loading Figma…</div>
        )}
      </div>
      <p className="cs-figma-hint">
        Drag to pan, scroll or pinch to zoom.{" "}
        <a href={OPEN_URL} target="_blank" rel="noopener noreferrer">Open in Figma ↗</a>
      </p>
    </div>
  );
}
