"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BrainFocus } from "@/components/brain/brain-anatomy";
import { BrainInteractionController } from "@/components/brain/brain-controls";
import { BrainModel, type BrainVolume } from "@/components/brain/brain-model";
import { NeuralActivity } from "@/components/brain/neural-activity";
import type { BrainQuality } from "@/components/brain/brain-quality";
import type { BrainAnimation, BrainAnimationRef } from "@/components/brain/brain-hologram-material";

const BrainBloom = lazy(() => import("@/components/brain/brain-bloom").then((m) => ({ default: m.BrainBloom })));

function LoadingCore({ animation, reducedMotion }: { animation: BrainAnimationRef; reducedMotion: boolean }) {
  const core = useRef<THREE.Mesh>(null);
  useFrame(() => { if (core.current && !reducedMotion) core.current.rotation.y = animation.current.time.value * 0.3; });
  return <mesh ref={core}><icosahedronGeometry args={[0.16, 2]} /><meshBasicMaterial color="#6ec2bd" transparent opacity={0.25} wireframe toneMapped={false} /></mesh>;
}

type SceneProps = { introComplete: boolean; reducedMotion: boolean; focusRegion: BrainFocus; onModelReady?: () => void; onFailure: () => void; quality: BrainQuality; active: boolean; interactionEnabled: boolean; resetKey: number };

function RendererLifecycle({ onFailure }: { onFailure: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}

function BrainScene({ introComplete, reducedMotion, focusRegion, onModelReady, onFailure, quality, active, interactionEnabled, resetKey }: SceneProps) {
  const { camera, gl, invalidate, size } = useThree();
  const controller = useRef<BrainInteractionController | null>(null);
  const modelRadius = useRef(1.35);
  const revealGroup = useRef<THREE.Group>(null);
  const neuralGroup = useRef<THREE.Group>(null);
  const [ready, setReady] = useState(false);
  const animation = useRef<BrainAnimation>({ time: { value: 0 }, reveal: { value: 0 } });
  const accumulator = useRef(0);
  const metrics = useRef({ frames: 0 });
  const debug = useRef(typeof window !== "undefined" && new URLSearchParams(window.location.search).has("brainDebug"));

  useEffect(() => {
    const next = new BrainInteractionController(gl.domElement, camera as THREE.PerspectiveCamera, reducedMotion, invalidate, modelRadius.current);
    controller.current = next;
    return () => { next.dispose(); controller.current = null; };
  }, [camera, gl, invalidate, reducedMotion]);
  useEffect(() => { controller.current?.setEnabled(interactionEnabled && active); }, [interactionEnabled, active, reducedMotion]);
  useEffect(() => { controller.current?.resize(size.width, size.height); controller.current?.reset(); }, [size.width, size.height, reducedMotion]);
  useEffect(() => { controller.current?.reset(); }, [resetKey]);

  useEffect(() => {
    gl.domElement.setAttribute("data-brain-active", String(active));
    invalidate();
    // demand no significa «no animar»: en reposo móvil invalidamos a 30 Hz.
    // Los gestos/inercia solicitan sus propios frames a la frecuencia de pantalla.
    if (!active || reducedMotion) return;
    const timer = window.setInterval(invalidate, 1000 / quality.idleFps);
    return () => window.clearInterval(timer);
  }, [active, gl, invalidate, quality.idleFps, reducedMotion]);

  const handleReady = useCallback((volume: BrainVolume) => {
    // Conservar el encuadre si cambia prefers-reduced-motion durante la visita.
    modelRadius.current = volume.radius;
    if (neuralGroup.current) {
      neuralGroup.current.position.fromArray(volume.center);
      neuralGroup.current.scale.set(volume.size[0] * 0.59, volume.size[1] * 0.46, volume.size[2] * 1.05);
    }
    controller.current?.fit(volume.radius, size.width, size.height);
    setReady(true);
    onModelReady?.();
    invalidate();
  }, [invalidate, onModelReady, size.width, size.height]);

  useFrame((_, delta) => {
    if (!active) return;
    const safeDelta = Math.min(delta, 0.05);
    accumulator.current += safeDelta;
    if (accumulator.current >= 1 / quality.shaderFps) {
      if (!reducedMotion) animation.current.time.value += accumulator.current;
      accumulator.current = 0;
    }
    if (ready) {
      const target = introComplete ? 1 : 0.22;
      animation.current.reveal.value = reducedMotion ? 1 : THREE.MathUtils.damp(animation.current.reveal.value, target, 2.4, safeDelta);
      if (Math.abs(animation.current.reveal.value - target) > 0.002) invalidate();
    }
    controller.current?.update(safeDelta);
    if (controller.current?.needsFrame) invalidate();
    if (revealGroup.current) {
      const target = introComplete || reducedMotion ? 1 : 0.93;
      const scale = THREE.MathUtils.damp(revealGroup.current.scale.x, target, 3, safeDelta);
      revealGroup.current.scale.setScalar(scale); // Uniforme: no deformar hemisferios.
      if (Math.abs(scale - target) > 0.001) invalidate();
    }
    metrics.current.frames += 1;
    if (debug.current) {
      gl.domElement.setAttribute("data-brain-camera", camera.position.toArray().map((value) => value.toFixed(5)).join(","));
      gl.domElement.setAttribute("data-brain-frames", String(metrics.current.frames));
      gl.domElement.setAttribute("data-brain-calls", String(gl.info.render.calls));
      gl.domElement.setAttribute("data-brain-triangles", String(gl.info.render.triangles));
      gl.domElement.setAttribute("data-brain-geometries", String(gl.info.memory.geometries));
    }
    gl.info.reset();
  }, -10);

  return <>
    <group ref={revealGroup} scale={0.93}>
      {!ready && <LoadingCore animation={animation} reducedMotion={reducedMotion} />}
      <BrainModel onReady={handleReady} onFailure={onFailure} focusRegion={focusRegion} quality={quality} animation={animation} reducedMotion={reducedMotion} />
      <group ref={neuralGroup} visible={ready}><NeuralActivity animation={animation} reducedMotion={reducedMotion} /></group>
    </group>
    {quality.bloom && gl.capabilities.maxTextureSize >= 4096 && gl.extensions.has("EXT_color_buffer_float") && <Suspense fallback={null}><BrainBloom /></Suspense>}
  </>;
}

export function BrainCanvas(props: SceneProps) {
  const { quality, onFailure } = props;
  return <Canvas className="brain-canvas" frameloop="demand" dpr={[1, quality.maxDpr]}
    camera={{ position: [2.7, 1.2, 4.7], fov: 35, near: 0.05, far: 60 }}
    gl={{ antialias: quality.tier !== "low", alpha: false, powerPreference: "high-performance" }}
    onCreated={({ gl }) => {
      gl.setClearColor(0x101114, 1);
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1;
      gl.info.autoReset = false;
      gl.domElement.dataset.brainTier = quality.tier;
      gl.domElement.dataset.brainModel = quality.modelPath;
      gl.domElement.setAttribute("aria-label", "Cerebro tridimensional: arrastra para girar y acerca con rueda o pinza");
      gl.debug.onShaderError = () => onFailure();
    }}>
    <color attach="background" args={["#101114"]} />
    <hemisphereLight args={["#dbe8ff", "#07171d", 0.65]} />
    <directionalLight position={[3.5, 4.5, 5.5]} intensity={1.7} color="#d3f0ed" />
    <directionalLight position={[-4, 1.5, 2]} intensity={0.6} color="#8fc8e0" />
    <directionalLight position={[-2.5, 2, -5]} intensity={1.15} color="#6ec2bd" />
    <RendererLifecycle onFailure={onFailure} />
    <BrainScene {...props} />
  </Canvas>;
}
