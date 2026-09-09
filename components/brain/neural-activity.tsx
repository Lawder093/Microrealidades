"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { neuralPaths, type NeuralPath } from "@/components/brain/brain-data";

type PreparedPath = NeuralPath & { curve: THREE.CatmullRomCurve3 };

function Pulse({ path, curve, offset = 0, reducedMotion = false }: { path: PreparedPath; curve: THREE.CatmullRomCurve3; offset?: number; reducedMotion?: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const point = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const speed = path.speed * (reducedMotion ? 0.1 : 1);
    const progress = (clock.getElapsedTime() * speed + path.phase + offset) % 1;
    curve.getPointAt(progress, point);
    mesh.current.position.copy(point);

    const envelope = Math.sin(progress * Math.PI);
    const scale = 0.52 + envelope * 0.8;
    mesh.current.scale.setScalar(scale);
    if (material.current) material.current.opacity = 0.18 + envelope * 0.82;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.032, 8, 8]} />
      <meshBasicMaterial ref={material} color={path.color} transparent opacity={0.2} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

function NeuralPathVisual({ path, reducedMotion }: { path: PreparedPath; reducedMotion?: boolean }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(path.curve.getPoints(42));
    const material = new THREE.LineBasicMaterial({
      color: path.color,
      transparent: true,
      opacity: path.opacity,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geometry, material);
  }, [path]);

  useEffect(() => () => {
    line.geometry.dispose();
    line.material.dispose();
  }, [line]);

  return (
    <group>
      <primitive object={line} />
      <Pulse path={path} curve={path.curve} reducedMotion={reducedMotion} />
      {path.secondaryPulse && <Pulse path={path} curve={path.curve} offset={0.49} reducedMotion={reducedMotion} />}
    </group>
  );
}

export function NeuralActivity({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const paths = useMemo<PreparedPath[]>(() => neuralPaths.map((path) => ({
    ...path,
    curve: new THREE.CatmullRomCurve3(path.points.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, "catmullrom", 0.46),
  })), []);

  return (
    <group renderOrder={8}>
      {paths.map((path) => <NeuralPathVisual key={path.id} path={path} reducedMotion={reducedMotion} />)}
    </group>
  );
}
