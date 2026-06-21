import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PALETTE = ["#c89cfb", "#a49aff", "#be6de6", "#63cfb7"];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener("change", update);
    return () => m.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useTheme() {
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    const onChange = (e) => setTheme(e.detail === "light" ? "light" : "dark");
    window.addEventListener("themechange", onChange);
    return () => window.removeEventListener("themechange", onChange);
  }, []);
  return theme;
}

// drifting glow particles, gently parallaxing toward the pointer
function Particles({ count, light }) {
  const ref = useRef();
  const { viewport } = useThree();

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 28 - 14;
      positions[i * 3 + 1] = (Math.sin(i * 78.233) * 43758.5453 % 1) * 18 - 9;
      positions[i * 3 + 2] = (Math.sin(i * 39.425) * 43758.5453 % 1) * 12 - 8;
      c.set(PALETTE[i % PALETTE.length]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.rotation.x += delta * 0.006;
    const px = (state.pointer.x * viewport.width) / 30;
    const py = (state.pointer.y * viewport.height) / 30;
    ref.current.position.x += (px - ref.current.position.x) * 0.04;
    ref.current.position.y += (py - ref.current.position.y) * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={light ? 0.05 : 0.06}
        sizeAttenuation
        vertexColors
        transparent
        opacity={light ? 0.55 : 0.85}
        depthWrite={false}
        blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}

// the "breach" — a slow, ominous wireframe portal that reacts subtly to the pointer
function Portal({ light }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * 0.05;
    ref.current.rotation.y += delta * 0.07;
    const target = 0.12 + state.pointer.x * 0.06;
    ref.current.rotation.z += (target - ref.current.rotation.z) * 0.02;
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref} position={[0, 0, -2]}>
      <icosahedronGeometry args={[3.2, 1]} />
      <meshBasicMaterial
        color={light ? "#9a55d8" : "#be6de6"}
        wireframe
        transparent
        opacity={light ? 0.16 : 0.12}
        blending={light ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function Background() {
  const reduced = useReducedMotion();
  const theme = useTheme();
  const light = theme === "light";
  const [count, setCount] = useState(900);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const small = window.matchMedia("(max-width: 820px)").matches;
    setCount(small ? 320 : 900);
    // bail entirely on reduced motion — body gradient carries the mood
    setEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (reduced || !enabled) return null;

  return (
    <div className="bg-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 70 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <fog attach="fog" args={[light ? "#e9e3f5" : "#150f1f", 8, 26]} />
        <Portal light={light} />
        <Particles count={count} light={light} />
      </Canvas>
    </div>
  );
}
