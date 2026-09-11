"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { BrainFocus } from "@/components/brain/brain-anatomy";
import { BrainInteractionController } from "@/components/brain/brain-controls";
import { BrainModel } from "@/components/brain/brain-model";
import { NeuralActivity } from "@/components/brain/neural-activity";

function LoadingCore({ reducedMotion }: { reducedMotion: boolean }) {
  const core = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!core.current || reducedMotion) return;
    core.current.rotation.y += delta * 0.24;
    core.current.rotation.x += delta * 0.1;
  });

  return (
    <mesh ref={core}>
      <icosahedronGeometry args={[0.26, 2]} />
      <meshBasicMaterial color="#6ec2bd" transparent opacity={0.3} wireframe toneMapped={false} />
    </mesh>
  );
}

function BrainScene({ introComplete, reducedMotion, focusRegion, onModelReady }: { introComplete: boolean; reducedMotion: boolean; focusRegion: BrainFocus; onModelReady?: () => void }) {
  const { camera, gl } = useThree();
  const interactionGroup = useRef<THREE.Group>(null);
  const revealGroup = useRef<THREE.Group>(null);
  const revealProgress = useRef(0.78);
  const controller = useRef<BrainInteractionController | null>(null);

  useFrame((_, delta) => {
    if (!revealGroup.current) return;
    const target = introComplete ? 1 : 0.78;
    revealProgress.current = THREE.MathUtils.damp(revealProgress.current, target, introComplete ? 2.6 : 1.8, delta);
    // The source atlas keeps a long anatomical depth axis. Slightly opening the
    // view-facing axes preserves that depth while making the brain legible in a
    // compact editorial stage on both desktop and mobile.
    revealGroup.current.scale.set(revealProgress.current * 3.55, revealProgress.current * 1.4, revealProgress.current * 3.55);
  });

  useEffect(() => {
    const nextController = new BrainInteractionController(gl.domElement, camera as THREE.PerspectiveCamera, reducedMotion);
    controller.current = nextController;
    nextController.attach();
    return () => {
      nextController.dispose();
      controller.current = null;
    };
  }, [camera, gl, reducedMotion]);

  useFrame((_, delta) => {
    const group = interactionGroup.current;
    if (group) controller.current?.update(group, delta);
  });

  return (
    <>
      <group ref={interactionGroup}>
        <group ref={revealGroup} rotation={[-Math.PI / 2, Math.PI, 0]}>
          <Suspense fallback={<LoadingCore reducedMotion={reducedMotion} />}>
            <BrainModel onReady={onModelReady} focusRegion={focusRegion} />
            <group scale={0.18}>
              <NeuralActivity reducedMotion={reducedMotion} />
            </group>
          </Suspense>
        </group>
      </group>
    </>
  );
}

export function BrainCanvas({ introComplete, reducedMotion, focusRegion = "all", onModelReady }: { introComplete: boolean; reducedMotion: boolean; focusRegion?: BrainFocus; onModelReady?: () => void }) {
  return (
    <Canvas
      className="brain-canvas"
      dpr={[1, 1.4]}
      camera={{ position: [0.05, 0.1, 4.2], fov: 33, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x101114, 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
      }}
    >
      <color attach="background" args={["#101114"]} />
      <hemisphereLight args={["#dbe8ff", "#07171d", 0.68]} />
      <ambientLight intensity={0.18} color="#f4d6de" />
      <directionalLight position={[3.5, 4.5, 5.5]} intensity={2.15} color="#f9e6ed" />
      <directionalLight position={[-4, 1.5, 2]} intensity={0.82} color="#8fc8e0" />
      <directionalLight position={[-2.5, 2, -5]} intensity={1.35} color="#6ec2bd" />
      <pointLight position={[0, 0.1, 1.65]} intensity={1.55} distance={4.8} color="#ef6f9b" />
      <pointLight position={[0, -0.3, -1.6]} intensity={1.2} distance={4.5} color="#5fc1bd" />
      <BrainScene introComplete={introComplete} reducedMotion={reducedMotion} focusRegion={focusRegion} onModelReady={onModelReady} />
    </Canvas>
  );
}
