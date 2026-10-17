"use client";

import { useEffect, useRef } from "react";

/* Real 3D atom for Chapter 01, rendered with Babylon.js (classic atom-icon look).
   - Three thick, glossy, lit tube rings crossing at 0 / 60 / 120 deg, glossy coloured electrons.
   - World units == AtomDiagram SVG viewBox units. The camera distance maps the plane z=0 1:1 onto the
     canvas, so a depth-only occluder exactly where the SVG phone (the "nucleus") is drawn hides the ring
     segments passing BEHIND it while the front halves pass OVER it.
   - Motion: the atom keeps its shape (rings never merge) and sways in 3D (bounded yaw/pitch), so the
     shading, highlights and front/back crossings stay readable. No full revolution.
   - Perf: 7 draw calls, 2 cheap lights, no shadows / post-processing, frozen materials + active meshes,
     60 fps cap, DPR capped at 1.5, lazy boot near the viewport, paused off-screen / hidden tab,
     one still frame for prefers-reduced-motion, everything disposed on unmount. */

const VB_H = 560; // canvas covers viewBox y 0..560 -> centre 280 = atom centre
const FOV = 0.5;
const DIST = VB_H / 2 / Math.tan(FOV / 2);
const R = 190;
const TUBE = 15;
// ring plane tilt away from the screen: projected ellipse aspect = sin(TILT) ~ 0.38 (like the reference)
const TILT = 0.39;
const ORBITS = [
  { rotZ: 0, color: "#4ADE80", speed: 0.9, phase: 0.4 },
  { rotZ: 60, color: "#FFC27A", speed: 0.72, phase: 2.5 },
  { rotZ: -60, color: "#FF7AC6", speed: 0.58, phase: 4.6 },
];

export default function Atom3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    let cleanup = () => {};

    const boot = async () => {
      const [
        { Engine },
        { Scene },
        { TargetCamera },
        { Vector3 },
        { Color3, Color4 },
        { TransformNode },
        { CreateTorus },
        { CreateSphere },
        { CreatePlane },
        { StandardMaterial },
        { HemisphericLight },
        { DirectionalLight },
      ] = await Promise.all([
        import("@babylonjs/core/Engines/engine"),
        import("@babylonjs/core/scene"),
        import("@babylonjs/core/Cameras/targetCamera"),
        import("@babylonjs/core/Maths/math.vector"),
        import("@babylonjs/core/Maths/math.color"),
        import("@babylonjs/core/Meshes/transformNode"),
        import("@babylonjs/core/Meshes/Builders/torusBuilder"),
        import("@babylonjs/core/Meshes/Builders/sphereBuilder"),
        import("@babylonjs/core/Meshes/Builders/planeBuilder"),
        import("@babylonjs/core/Materials/standardMaterial"),
        import("@babylonjs/core/Lights/hemisphericLight"),
        import("@babylonjs/core/Lights/directionalLight"),
      ]);
      if (disposed) return;

      let engine: InstanceType<typeof Engine>;
      try {
        engine = new Engine(canvas, true, { alpha: true, premultipliedAlpha: true, stencil: false, antialias: true, powerPreference: "low-power" }, false);
      } catch {
        return; // no WebGL: the static SVG orbits stay visible
      }
      engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio || 1, 1.5));

      const scene = new Scene(engine, { useGeometryUniqueIdsMap: true, useMaterialMeshMap: true, useClonedMeshMap: true });
      scene.detachControl(); // purely decorative: no picking / pointer work
      scene.skipPointerMovePicking = true;
      scene.clearColor = new Color4(0, 0, 0, 0);
      // keep the occluder's depth (group 0) for everything in group 1
      scene.setRenderingAutoClearDepthStencil(1, false, false, false);

      const cam = new TargetCamera("cam", new Vector3(0, 0, -DIST), scene);
      cam.setTarget(Vector3.Zero());
      cam.fov = FOV;
      cam.minZ = DIST - 420;
      cam.maxZ = DIST + 420;

      // soft sky/ground fill + a key light from the upper-left front for glossy highlights
      const hemi = new HemisphericLight("fill", new Vector3(-0.3, 1, -0.6), scene);
      hemi.intensity = 0.7;
      hemi.diffuse = new Color3(0.85, 0.88, 1);
      hemi.groundColor = new Color3(0.16, 0.12, 0.34);
      hemi.specular = Color3.Black();
      const key = new DirectionalLight("key", new Vector3(0.55, -0.6, 0.8), scene);
      key.intensity = 0.95;
      key.specular = new Color3(1, 1, 1);

      const mats: Array<InstanceType<typeof StandardMaterial>> = [];
      const glossy = (name: string, hex: string, glow: number, power: number) => {
        const c = Color3.FromHexString(hex);
        const m = new StandardMaterial(name, scene);
        m.diffuseColor = c;
        m.emissiveColor = c.scale(glow);
        m.specularColor = new Color3(0.9, 0.9, 0.95);
        m.specularPower = power;
        mats.push(m);
        return m;
      };

      // depth-only stand-in for the SVG phone (96 x 190 at the atom centre)
      const occ = CreatePlane("occ", { width: 96, height: 190 }, scene);
      const om = new StandardMaterial("occ", scene);
      om.disableColorWrite = true;
      om.disableLighting = true;
      om.backFaceCulling = false;
      occ.material = om;
      occ.renderingGroupId = 0;
      mats.push(om);

      const root = new TransformNode("atom", scene);
      const ringMat = glossy("ring", "#6F86FF", 0.18, 40);
      const electrons = ORBITS.map((o, i) => {
        const rz = new TransformNode("rz" + i, scene);
        rz.parent = root;
        rz.rotation.z = (o.rotZ * Math.PI) / 180;
        const tilt = new TransformNode("tilt" + i, scene);
        tilt.parent = rz;
        tilt.rotation.x = TILT; // torus lies in XZ (edge-on); tilt it so it reads as a ~0.38 ellipse

        const ring = CreateTorus("ring" + i, { diameter: R * 2, thickness: TUBE, tessellation: 96 }, scene);
        ring.parent = tilt;
        ring.material = ringMat;
        ring.renderingGroupId = 1;
        ring.isPickable = false;

        const e = CreateSphere("e" + i, { diameter: 32, segments: 16 }, scene);
        e.parent = tilt;
        e.material = glossy("em" + i, o.color, 0.22, 64);
        e.renderingGroupId = 1;
        e.isPickable = false;
        return e;
      });

      let t = 0;
      const step = (dt: number) => {
        t += dt;
        // bounded 3D sway: rings keep their 60deg spacing, at most one ring nears edge-on at a time
        root.rotation.y = Math.sin(t * 0.42) * 0.38;
        root.rotation.x = Math.sin(t * 0.31 + 1) * 0.22;
        root.rotation.z = Math.sin(t * 0.17) * 0.08;
        for (let i = 0; i < electrons.length; i++) {
          const th = ORBITS[i].phase + t * ORBITS[i].speed;
          electrons[i].position.set(R * Math.cos(th), 0, R * Math.sin(th));
        }
      };

      let ready = false;
      scene.executeWhenReady(() => {
        if (disposed) return;
        mats.forEach((m) => m.freeze());
        scene.blockMaterialDirtyMechanism = true;
        scene.freezeActiveMeshes();
        ready = true;
        canvas.parentElement?.classList.add("is-3d");
        if (reduce) {
          step(1.6);
          scene.render();
        }
      });

      let running = false;
      let last = 0;
      const play = () => {
        if (running || reduce) return;
        running = true;
        last = performance.now();
        engine.runRenderLoop(() => {
          const now = performance.now();
          if (now - last < 15) return; // cap at ~60 fps on 120/144 Hz screens
          step(Math.min(now - last, 50) / 1000);
          last = now;
          scene.render();
        });
      };
      const pause = () => {
        running = false;
        engine.stopRenderLoop();
      };

      const ro = new ResizeObserver(() => {
        engine.resize();
        if (ready && !running) scene.render();
      });
      ro.observe(canvas);
      const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? play() : pause()));
      io.observe(canvas);
      const onVis = () => (document.hidden ? pause() : play());
      document.addEventListener("visibilitychange", onVis);
      if (reduce) scene.render(); // compile; the still frame is drawn in executeWhenReady

      cleanup = () => {
        pause();
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        scene.dispose();
        engine.dispose();
      };
      if (disposed) cleanup();
    };

    // lazy: only download / compile when the section gets close to the viewport
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near.disconnect();
        boot().catch(() => {});
      },
      { rootMargin: "700px 0px" },
    );
    near.observe(canvas);

    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, []);

  return <canvas ref={ref} className="pf-atom3d" aria-hidden="true" />;
}
