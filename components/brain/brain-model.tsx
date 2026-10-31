"use client";

import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { focusContains, type BrainFocus, type BrainMaterialKey } from "@/components/brain/brain-anatomy";
import { disposeBrainSource, normalizeBrainScene, type BrainVolume } from "@/components/brain/brain-resources";
export type { BrainVolume } from "@/components/brain/brain-resources";
import { brainModelPath } from "@/components/brain/brain-data";
import { applyBrainHologram, type BrainAnimationRef } from "@/components/brain/brain-hologram-material";
import type { BrainQuality } from "@/components/brain/brain-quality";

type BrainMaterials = Record<BrainMaterialKey, THREE.MeshPhysicalMaterial>;

function createMaterial({
  color,
  emissive,
  opacity,
  roughness = 0.58,

  thickness = 0.4,
  intensity = 0.24,
}: {
  color: string;
  emissive: string;
  opacity: number;
  roughness?: number;
  transmission?: number;
  thickness?: number;
  intensity?: number;
}) {
  const material = new THREE.MeshPhysicalMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness,
    metalness: 0,
    transmission: 0, // Transparencia sin el pase extra de refracción del atlas.
    thickness,
    ior: 1.28,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  material.color.multiplyScalar(0.55);
  material.forceSinglePass = true; // DoubleSide transparente en un pase, no dos por región.
  material.userData.baseOpacity = opacity;
  return material;
}

export function BrainModel({ onReady, onFailure, focusRegion = "all", quality, animation, reducedMotion }: { onReady?: (volume: BrainVolume) => void; onFailure: () => void; focusRegion?: BrainFocus; quality: BrainQuality; animation: BrainAnimationRef; reducedMotion: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  const [asset, setAsset] = useState<THREE.Group | null>(null);

  useEffect(() => {
    let alive = true;
    let loaded: THREE.Group | null = null;
    const sourceMaterials = new Set<THREE.Material>();
    const abort = new AbortController();
    const decoder = new DRACOLoader().setDecoderPath("/draco/").setWorkerLimit(quality.tier === "desktop" ? 2 : 1);
    const loader = new GLTFLoader().setDRACOLoader(decoder);
    async function load(path: string) {
      const response = await fetch(path, { signal: abort.signal });
      if (!response.ok) throw new Error(`No se pudo cargar el cerebro (${response.status}).`);
      return loader.parseAsync(await response.arrayBuffer(), "/models/");
    }
    void (async () => {
      try {
        let gltf: GLTF;
        try { gltf = await load(quality.modelPath); }
        catch (cause) {
          // Un teléfono nunca descarga el atlas pesado como rescate silencioso.
          if (abort.signal.aborted || quality.tier !== "desktop") throw cause;
          gltf = await load(brainModelPath);
        }
        loaded = gltf.scene;
        loaded.traverse((object) => {
          if (object instanceof THREE.Mesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => sourceMaterials.add(material));
        });
        if (alive) setAsset(loaded);
        else disposeBrainSource(loaded, sourceMaterials);
      } catch { if (alive && !abort.signal.aborted) onFailure(); }
      finally { decoder.dispose(); }
    })();
    return () => {
      alive = false;
      abort.abort();
      decoder.dispose();
      if (loaded) disposeBrainSource(loaded, sourceMaterials);
    };
  }, [quality.modelPath, quality.tier, onFailure]);

  const materials = useMemo<BrainMaterials>(() => ({
    frontal: createMaterial({ color: "#e69ab5", emissive: "#5e1938", opacity: 0.5, intensity: 0.3 }),
    parietal: createMaterial({ color: "#75c9c4", emissive: "#164d4d", opacity: 0.43, intensity: 0.3 }),
    temporal: createMaterial({ color: "#e2b477", emissive: "#633f1f", opacity: 0.46, intensity: 0.24 }),
    occipital: createMaterial({ color: "#91a9dd", emissive: "#243a72", opacity: 0.46, intensity: 0.28 }),
    cerebellum: createMaterial({ color: "#d18ba6", emissive: "#60253d", opacity: 0.66, roughness: 0.7, intensity: 0.28 }),
    whiteMatter: createMaterial({ color: "#d3e6df", emissive: "#1d6769", opacity: 0.3, roughness: 0.5, intensity: 0.46 }),
    nuclei: createMaterial({ color: "#ee789f", emissive: "#8e1747", opacity: 0.78, roughness: 0.42, intensity: 0.42 }),
    ventricles: createMaterial({ color: "#a3e9df", emissive: "#2a8d8e", opacity: 0.25, roughness: 0.3, transmission: 0.28, intensity: 0.6 }),
    brainstem: createMaterial({ color: "#df9b7d", emissive: "#6b302b", opacity: 0.63, roughness: 0.64, intensity: 0.28 }),
    tracts: createMaterial({ color: "#f4b827", emissive: "#956609", opacity: 0.46, roughness: 0.5, intensity: 0.46 }),
    vessels: createMaterial({ color: "#f08aa8", emissive: "#8d1d4a", opacity: 0.08, roughness: 0.4, transmission: 0.08, intensity: 0.32 }),
    interior: createMaterial({ color: "#75c8c2", emissive: "#145a61", opacity: 0.37, roughness: 0.62, transmission: 0.12, intensity: 0.58 }),
  }), []);

  useEffect(() => {
    Object.values(materials).forEach((material) => applyBrainHologram(material, animation.current, reducedMotion));
    invalidate();
  }, [materials, animation, reducedMotion, invalidate]);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  const normalized = useMemo(() => asset ? normalizeBrainScene(asset, materials) : null, [asset, materials]);
  const scene = normalized?.scene;

  useEffect(() => { if (normalized) onReady?.(normalized.volume); }, [onReady, normalized]);

  useEffect(() => {
    Object.entries(materials).forEach(([region, material]) => {
      const baseOpacity = Number(material.userData.baseOpacity ?? material.opacity);
      material.opacity = focusContains(focusRegion, region as BrainMaterialKey) ? baseOpacity : Math.min(baseOpacity * 0.12, 0.08);
    });
    invalidate();
  }, [focusRegion, materials, invalidate]);

  return scene ? <primitive object={scene} dispose={null} /> : null;
}
