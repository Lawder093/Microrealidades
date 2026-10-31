"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { neuralPaths } from "@/components/brain/brain-data";
import type { BrainAnimationRef } from "@/components/brain/brain-hologram-material";

export function NeuralActivity({ animation, reducedMotion }: { animation: BrainAnimationRef; reducedMotion: boolean }) {
  const pulses = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const prepared = useMemo(() => {
    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const points = neuralPaths.map((path) => {
      const curve = new THREE.CatmullRomCurve3(path.points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.46);
      const color = new THREE.Color(path.color);
      const samples = curve.getPoints(32);
      for (let i = 0; i < samples.length - 1; i += 1) {
        linePositions.push(...samples[i].toArray(), ...samples[i + 1].toArray());
        lineColors.push(...color.toArray(), ...color.toArray());
      }
      return { ...path, curve, color };
    });
    const entries = points.flatMap((path) => path.secondaryPulse ? [{ path, offset: 0 }, { path, offset: 0.49 }] : [{ path, offset: 0 }]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    const material = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    return { coreMaterial: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), haloMaterial: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), entries, line: new THREE.LineSegments(geometry, material), sphere: new THREE.SphereGeometry(0.025, 8, 6), matrix: new THREE.Matrix4(), point: new THREE.Vector3(), scale: new THREE.Vector3(), rotation: new THREE.Quaternion(), color: new THREE.Color() };
  }, []);

  useEffect(() => {
    const coreInstances = pulses.current;
    const haloInstances = halos.current;
    return () => {
      // InstancedMesh posee buffers de matrices/colores ajenos a la geometría compartida.
      coreInstances?.dispose();
      haloInstances?.dispose();
      prepared.line.geometry.dispose();
      prepared.line.material.dispose();
      prepared.sphere.dispose();
      prepared.coreMaterial.dispose();
      prepared.haloMaterial.dispose();
    };
  }, [prepared]);

  useFrame(() => {
    if (!pulses.current || !halos.current) return;
    // Un único buffer de instancias para todos los impulsos, sin geometrías por pulso.
    const time = reducedMotion ? 0 : animation.current.time.value;
    prepared.entries.forEach(({ path, offset }, index) => {
      const progress = (time * path.speed + path.phase + offset) % 1;
      path.curve.getPointAt(progress, prepared.point);
      const envelope = Math.sin(progress * Math.PI);
      prepared.scale.setScalar(0.45 + envelope * 0.8);
      prepared.matrix.compose(prepared.point, prepared.rotation, prepared.scale);
      pulses.current!.setMatrixAt(index, prepared.matrix);
      prepared.color.copy(path.color).multiplyScalar(0.6 + envelope * 1.4);
      pulses.current!.setColorAt(index, prepared.color);
      prepared.scale.multiplyScalar(2.4);
      prepared.matrix.compose(prepared.point, prepared.rotation, prepared.scale);
      halos.current!.setMatrixAt(index, prepared.matrix);
      halos.current!.setColorAt(index, path.color);
    });
    pulses.current.instanceMatrix.needsUpdate = true;
    halos.current.instanceMatrix.needsUpdate = true;
    if (pulses.current.instanceColor) pulses.current.instanceColor.needsUpdate = true;
    if (halos.current.instanceColor) halos.current.instanceColor.needsUpdate = true;
  });

  return <group renderOrder={8}>
    <primitive object={prepared.line} dispose={null} />
    <instancedMesh ref={halos} args={[prepared.sphere, prepared.haloMaterial, prepared.entries.length]} frustumCulled={false} dispose={null} />
    <instancedMesh ref={pulses} args={[prepared.sphere, prepared.coreMaterial, prepared.entries.length]} frustumCulled={false} dispose={null} />
  </group>;
}
