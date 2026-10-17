"use client";

import { useEffect, useRef } from "react";

type Three = typeof import("three");

/* ---------- jelly crystal: flat-subdivided octahedron whose vertices sit on damped springs ---------- */
const SUB = 7; // subdivisions per original edge (keeps the faceted crystal silhouette)
const OCT_V = [
  [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
];
const OCT_F = [
  [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2], [1, 2, 5], [1, 5, 3], [1, 3, 4], [1, 4, 2],
];

function buildCrystalPositions() {
  const out: number[] = [];
  for (const [ia, ib, ic] of OCT_F) {
    const a = OCT_V[ia], b = OCT_V[ib], c = OCT_V[ic];
    const P = (i: number, j: number) => [0, 1, 2].map((k) => a[k] + ((b[k] - a[k]) * i) / SUB + ((c[k] - a[k]) * j) / SUB);
    for (let i = 0; i < SUB; i++) {
      for (let j = 0; j < SUB - i; j++) {
        out.push(...P(i, j), ...P(i + 1, j), ...P(i, j + 1));
        if (i + j < SUB - 1) out.push(...P(i + 1, j), ...P(i + 1, j + 1), ...P(i, j + 1));
      }
    }
  }
  return new Float32Array(out);
}

/* Vertex indices that lie along the 12 original edges, so the bright edge lines bend with the jelly. */
function buildEdgeIndex(rest: Float32Array) {
  const seen = new Set<string>();
  const idx: number[] = [];
  const find = (p: number[]) => {
    for (let v = 0; v < rest.length / 3; v++) {
      if (Math.abs(rest[v * 3] - p[0]) + Math.abs(rest[v * 3 + 1] - p[1]) + Math.abs(rest[v * 3 + 2] - p[2]) < 1e-5) return v;
    }
    return 0;
  };
  for (const f of OCT_F) {
    for (let e = 0; e < 3; e++) {
      const ia = f[e], ib = f[(e + 1) % 3];
      const key = ia < ib ? `${ia}-${ib}` : `${ib}-${ia}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const a = OCT_V[ia], b = OCT_V[ib];
      let prev = find(a);
      for (let k = 1; k <= SUB; k++) {
        const cur = find([0, 1, 2].map((q) => a[q] + ((b[q] - a[q]) * k) / SUB));
        idx.push(prev, cur);
        prev = cur;
      }
    }
  }
  return Int32Array.from(idx);
}

type Jelly = {
  mesh: InstanceType<Three["Mesh"]>;
  lines: InstanceType<Three["LineSegments"]>;
  pos: Float32Array;
  linePos: Float32Array;
  off: Float32Array;
  vel: Float32Array;
  base: number;
  sq: number; // whole-body squash spring
  sqv: number;
  spin: number;
  awake: boolean; // false = fully at rest, physics + GPU upload skipped
};

/* Optional WebGL layer. Loads three.js lazily; silently does nothing if WebGL is unavailable or reduced motion is on. */
export default function ThreeLayer({ variant }: { variant: "particles" | "crystal" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: variant === "crystal", powerPreference: "low-power" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.z = 6;
      const disposables: Array<{ dispose: () => void }> = [];
      const group = new THREE.Group();
      scene.add(group);
      const jellies: Jelly[] = [];

      if (variant === "particles") {
        const n = 700;
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 24;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
          pos[i * 3 + 2] = -6 + Math.random() * 8;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
          size: 0.05,
          color: 0xffe8c2,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        group.add(new THREE.Points(geo, mat));
        disposables.push(geo, mat);
      } else {
        scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const p1 = new THREE.PointLight(0x5ee7ff, 40, 30);
        p1.position.set(3, 3, 4);
        const p2 = new THREE.PointLight(0x9c8cff, 30, 30);
        p2.position.set(-4, -2, 3);
        scene.add(p1, p2);

        const rest = buildCrystalPositions();
        const edgeIdx = buildEdgeIndex(rest);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x5ee7ff,
          emissive: 0x0b5a7a,
          metalness: 0.2,
          roughness: 0.15,
          flatShading: true,
          transparent: true,
          opacity: 0.85,
        });
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xbff6ff, transparent: true, opacity: 0.6 });
        disposables.push(mat, edgeMat);

        const spots: Array<[number, number, number, number]> = [
          [3.2, 0.6, 0, 0.9],
          [4.4, -1.3, -1, 0.55],
          [2.1, -1.8, 0.5, 0.4],
          [-4.6, 1.8, -2, 0.45],
          [5.2, 1.9, -2, 0.35],
        ];
        spots.forEach(([x, y, z, s], i) => {
          const pos = rest.slice();
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          const linePos = new Float32Array(edgeIdx.length * 3);
          const lineGeo = new THREE.BufferGeometry();
          lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
          disposables.push(geo, lineGeo);
          const mesh = new THREE.Mesh(geo, mat);
          const lines = new THREE.LineSegments(lineGeo, edgeMat);
          lines.frustumCulled = false;
          mesh.frustumCulled = false;
          mesh.add(lines);
          mesh.position.set(x, y, z);
          mesh.scale.set(s, s * 1.7, s);
          mesh.rotation.set(0.4 + i * 0.7, i * 1.3, 0.2 + i * 0.5);
          group.add(mesh);
          jellies.push({
            mesh, lines, pos, linePos,
            off: new Float32Array(rest.length),
            vel: new Float32Array(rest.length),
            base: s, sq: 0, sqv: 0, spin: 0.25 + i * 0.05, awake: false,
          });
        });

        /* write rest edges once */
        for (const j of jellies) {
          for (let k = 0; k < edgeIdx.length; k++) {
            const v = edgeIdx[k] * 3;
            j.linePos[k * 3] = rest[v];
            j.linePos[k * 3 + 1] = rest[v + 1];
            j.linePos[k * 3 + 2] = rest[v + 2];
          }
        }

        /* physics state stashed for the frame loop */
        (group.userData as { rest: Float32Array; edgeIdx: Int32Array }).rest = rest;
        (group.userData as { rest: Float32Array; edgeIdx: Int32Array }).edgeIdx = edgeIdx;
      }

      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      /* pointer: normalized for the gentle group sway, NDC (relative to this canvas) for the jelly */
      const mouse = { x: 0, y: 0 };
      const ptr = { x: 0, y: 0, px: 0, py: 0, inside: false, has: false, poke: 0, cx: 0, cy: 0, dirty: false };
      /* rect is read at most once per frame (not on every pointer event) */
      const toNdc = () => {
        if (!ptr.dirty) return;
        ptr.dirty = false;
        const r = el.getBoundingClientRect();
        ptr.x = ((ptr.cx - r.left) / r.width) * 2 - 1;
        ptr.y = -((ptr.cy - r.top) / r.height) * 2 + 1;
        ptr.inside = ptr.cy >= r.top && ptr.cy <= r.bottom;
      };
      const onMove = (e: PointerEvent) => {
        mouse.x = e.clientX / window.innerWidth - 0.5;
        mouse.y = e.clientY / window.innerHeight - 0.5;
        if (variant !== "crystal") return; // particles only need the sway
        ptr.cx = e.clientX;
        ptr.cy = e.clientY;
        ptr.dirty = true;
        if (!ptr.has) {
          toNdc();
          ptr.px = ptr.x;
          ptr.py = ptr.y;
          ptr.has = true;
        }
      };
      const onDown = (e: PointerEvent) => {
        if (variant !== "crystal") return;
        ptr.cx = e.clientX;
        ptr.cy = e.clientY;
        ptr.dirty = true;
        toNdc();
        ptr.poke = 1;
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });

      /* scratch objects */
      const ray = new THREE.Vector3();
      const now = new THREE.Vector3();
      const before = new THREE.Vector3();
      const center = new THREE.Vector3();
      const pointOnPlane = (nx: number, ny: number, z: number, target: InstanceType<typeof THREE.Vector3>) => {
        ray.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
        const t = (z - camera.position.z) / ray.z;
        return target.copy(camera.position).addScaledVector(ray, t);
      };

      const K = 170; // spring stiffness
      const C = 6.5; // damping (low = more wobble)
      const R2 = 0.75; // influence radius² (local units)
      const MAX = 0.55; // max vertex offset

      const stepJelly = (dt: number) => {
        const ud = group.userData as { rest: Float32Array; edgeIdx: Int32Array };
        const rest = ud.rest, edgeIdx = ud.edgeIdx;
        scene.updateMatrixWorld();
        const poke = ptr.poke;
        ptr.poke = 0;
        for (const j of jellies) {
          const { mesh, off, vel, pos } = j;
          let hit = 0;
          let touched = false;
          if (ptr.has && ptr.inside) {
            mesh.getWorldPosition(center);
            pointOnPlane(ptr.x, ptr.y, center.z, now);
            pointOnPlane(ptr.px, ptr.py, center.z, before);
            mesh.worldToLocal(now);
            mesh.worldToLocal(before);
            const dx = now.x - before.x, dy = now.y - before.y, dz = now.z - before.z;
            const speed = Math.min(Math.hypot(dx, dy, dz), 0.6);
            /* a still cursor applies zero impulse, so skip the vertex loop entirely */
            if (speed > 1e-6 || poke) for (let v = 0; v < rest.length; v += 3) {
              const vx = rest[v] + off[v], vy = rest[v + 1] + off[v + 1], vz = rest[v + 2] + off[v + 2];
              const ox = vx - now.x, oy = vy - now.y, oz = vz - now.z;
              const d2 = ox * ox + oy * oy + oz * oz;
              if (d2 > R2 * 4) continue;
              const fall = Math.exp(-d2 / R2);
              const inv = 1 / (Math.sqrt(d2) + 1e-4);
              // drag along the cursor + bulge away from it while moving
              let ix = dx * 22 * fall + ox * inv * speed * 9 * fall;
              let iy = dy * 22 * fall + oy * inv * speed * 9 * fall;
              let iz = dz * 22 * fall + oz * inv * speed * 9 * fall;
              if (poke) {
                // click = dent inward, then it wobbles back
                ix -= ox * inv * 4.5 * fall;
                iy -= oy * inv * 4.5 * fall;
                iz -= oz * inv * 4.5 * fall;
              }
              vel[v] += ix;
              vel[v + 1] += iy;
              vel[v + 2] += iz;
              hit = Math.max(hit, fall * (speed * 6 + poke * 1.2));
              touched = true;
            }
          }
          if (touched) j.awake = true;
          if (j.awake) {
            // damped springs back to rest
            let energy = 0;
            for (let v = 0; v < rest.length; v++) {
              vel[v] += (-K * off[v] - C * vel[v]) * dt;
              off[v] = Math.max(-MAX, Math.min(MAX, off[v] + vel[v] * dt));
              pos[v] = rest[v] + off[v];
              const e = Math.abs(off[v]) + Math.abs(vel[v]);
              if (e > energy) energy = e;
            }
            if (!touched && energy < 1e-4) {
              // settled: snap exactly to rest and sleep (invisible difference)
              off.fill(0);
              vel.fill(0);
              pos.set(rest);
              j.awake = false;
            }
            mesh.geometry.getAttribute("position").needsUpdate = true;
            // bend the edge lines with the body
            for (let k = 0; k < edgeIdx.length; k++) {
              const v = edgeIdx[k] * 3;
              j.linePos[k * 3] = pos[v];
              j.linePos[k * 3 + 1] = pos[v + 1];
              j.linePos[k * 3 + 2] = pos[v + 2];
            }
            j.lines.geometry.getAttribute("position").needsUpdate = true;
          }
          // whole-body squash & stretch spring
          j.sqv += hit * 2.2;
          j.sqv += (-90 * j.sq - 5 * j.sqv) * dt;
          j.sq = Math.max(-0.35, Math.min(0.35, j.sq + j.sqv * dt));
          const s = j.base;
          mesh.scale.set(s * (1 + j.sq * 0.6), s * 1.7 * (1 - j.sq), s * (1 + j.sq * 0.6));
        }
        ptr.px = ptr.x;
        ptr.py = ptr.y;
      };

      let visible = true;
      let raf = 0;
      const clock = new THREE.Clock();
      let last = 0;
      const frame = () => {
        if (!visible) return;
        const t = clock.getElapsedTime();
        const dt = Math.min(t - last, 1 / 30);
        last = t;
        if (variant === "particles") {
          group.rotation.y = t * 0.02 + mouse.x * 0.15;
          group.rotation.x = mouse.y * 0.08;
        } else {
          jellies.forEach((j, i) => {
            j.mesh.rotation.y += dt * j.spin;
            j.mesh.position.y += Math.sin(t + i) * 0.0015;
          });
          group.rotation.y = mouse.x * 0.25;
          toNdc();
          // sub-step the springs for stability
          const steps = 2;
          for (let s = 0; s < steps; s++) stepJelly(dt / steps);
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      /* render only while on screen AND the tab is visible */
      let onScreen = false;
      const sync = () => {
        visible = onScreen && !document.hidden;
        cancelAnimationFrame(raf);
        if (visible) {
          last = clock.getElapsedTime();
          raf = requestAnimationFrame(frame);
        }
      };
      const io = new IntersectionObserver(([e]) => {
        onScreen = e.isIntersecting;
        sync();
      }, { rootMargin: "100px 0px" });
      io.observe(el);
      document.addEventListener("visibilitychange", sync);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
    })().catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, [variant]);

  return <div ref={ref} className="pf-three" aria-hidden="true" />;
}
