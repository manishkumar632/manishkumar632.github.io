"use client";

import { useEffect, useRef } from "react";

/* Real-time volumetric-looking sunset clouds rendered with Babylon.js (full-screen fBm shader).
   The canvas sits between the sky and the mountains. Clouds drift, slowly change shape,
   and are lit from below by the setting sun. Coordinates are mapped into the same
   1440x900 "xMidYMax slice" space as the SVG scene so the lighting matches the painted sun. */

const FRAG = /* glsl */ `
varying vec2 vUV;
uniform float time;
uniform vec2 res;
uniform vec3 slice;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}
/* domain-warped fbm: shapes billow and morph while the whole field drifts right */
float cloud(vec2 q, float t) {
  vec2 w = vec2(fbm(q + vec2(t * 0.6, 0.0)), fbm(q + vec2(5.2, 1.3) - vec2(t * 0.35, 0.0)));
  return fbm(q + 1.7 * w + vec2(t, 0.0));
}

void main(void) {
  vec2 px = vec2(vUV.x * res.x, (1.0 - vUV.y) * res.y);
  vec2 s = (px - slice.yz) / slice.x;          // scene coords (0..1440, 0..900)
  vec2 sc = vec2(1.0 / 380.0, 1.0 / 95.0);       // wide, flat evening clouds
  vec2 q = s * sc;
  float t = time * 0.05;

  float d = cloud(q, t);
  float band = smoothstep(40.0, 170.0, s.y) * (1.0 - smoothstep(330.0, 470.0, s.y));
  float cov = mix(0.64, 0.5, band);
  float a = smoothstep(cov, cov + 0.22, d) * band;
  if (a < 0.002) { gl_FragColor = vec4(0.0); return; }

  /* self-shadowing: compare density a little toward the sun */
  vec2 sun = vec2(1060.0, 600.0);
  vec2 dir = normalize(sun - s);
  float d2 = cloud(q + dir * sc * 14.0, t);
  float lit = clamp(0.55 + (d - d2) * 3.5, 0.0, 1.0);
  float glow = exp(-distance(s, sun) / 520.0);

  vec3 shadow = vec3(0.33, 0.22, 0.52);
  vec3 mid = vec3(0.86, 0.55, 0.70);
  vec3 warm = vec3(1.0, 0.80, 0.62);
  vec3 col = mix(shadow, mid, lit);
  col = mix(col, warm, glow * lit * 0.9);
  col += vec3(1.0, 0.75, 0.55) * pow(1.0 - a, 3.0) * glow * 0.35;  // silver lining on thin edges

  a *= 0.9;
  gl_FragColor = vec4(col * a, a);
}
`;

export default function HeroClouds() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [{ Engine }, { EffectRenderer, EffectWrapper }, { Color4 }] = await Promise.all([
        import("@babylonjs/core/Engines/engine"),
        import("@babylonjs/core/Materials/effectRenderer"),
        import("@babylonjs/core/Maths/math.color"),
      ]);
      if (disposed) return;

      let engine: InstanceType<typeof Engine>;
      try {
        engine = new Engine(canvas, false, { alpha: true, premultipliedAlpha: true, stencil: false, antialias: false, powerPreference: "low-power" }, false);
      } catch {
        return;
      }
      // clouds are soft: render below native resolution for speed
      engine.setHardwareScalingLevel(Math.max(1.75, 2.4 / Math.min(window.devicePixelRatio || 1, 2)));

      const renderer = new EffectRenderer(engine);
      const wrapper = new EffectWrapper({
        engine,
        name: "heroClouds",
        fragmentShader: FRAG,
        uniformNames: ["time", "res", "slice"],
      });
      const clear = new Color4(0, 0, 0, 0);
      const start = performance.now() - 40000; // start mid-drift so clouds are already formed

      wrapper.onApplyObservable.add(() => {
        const w = engine.getRenderWidth();
        const h = engine.getRenderHeight();
        const scale = Math.max(w / 1440, h / 900);
        const fx = wrapper.effect;
        fx.setFloat("time", reduce ? 40 : (performance.now() - start) / 1000);
        fx.setFloat2("res", w, h);
        fx.setFloat3("slice", scale, (w - 1440 * scale) / 2, h - 900 * scale);
      });

      const draw = () => {
        if (!wrapper.isReady()) return;
        engine.clear(clear, true, false);
        renderer.render(wrapper);
      };

      const ro = new ResizeObserver(() => {
        engine.resize();
        if (reduce) draw();
      });
      ro.observe(canvas);

      let running = false;
      const play = () => {
        if (running || reduce) return;
        running = true;
        /* clouds drift very slowly: 30 fps is visually identical but halves+ the GPU cost on 60-144 Hz screens */
        let lastDraw = 0;
        engine.runRenderLoop(() => {
          const now = performance.now();
          if (now - lastDraw < 32) return;
          lastDraw = now;
          draw();
        });
      };
      const pause = () => {
        running = false;
        engine.stopRenderLoop();
      };
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : pause()));
      io.observe(canvas);
      const onVis = () => (document.hidden ? pause() : play());
      document.addEventListener("visibilitychange", onVis);

      if (reduce) {
        // single still frame once the shader compiles
        const tryDraw = () => (wrapper.isReady() ? draw() : requestAnimationFrame(tryDraw));
        tryDraw();
      }

      cleanup = () => {
        pause();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        wrapper.dispose();
        renderer.dispose();
        engine.dispose();
      };
      if (disposed) cleanup();
    })().catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={ref} className="pf-clouds" aria-hidden="true" />;
}
