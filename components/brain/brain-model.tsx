"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  focusContains,
  getBrainRegion,
  isFramingRegion,
  type BrainFocus,
  type BrainMaterialKey,
} from "@/components/brain/brain-anatomy";
import { brainModelPath } from "@/components/brain/brain-data";

type BrainMaterials = Record<BrainMaterialKey, THREE.MeshPhysicalMaterial>;

function createMaterial({
  color,
  emissive,
  opacity,
  roughness = 0.58,
  transmission = 0.06,
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
    transmission,
    thickness,
    ior: 1.28,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  material.userData.baseOpacity = opacity;
  return material;
}

export function BrainModel({ onReady, focusRegion = "all" }: { onReady?: () => void; focusRegion?: BrainFocus }) {
  const gltf = useLoader(GLTFLoader, brainModelPath, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  }) as GLTF;

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
    vessels: createMaterial({ color: "#f08aa8", emissive: "#8d1d4a", opacity: 0.27, roughness: 0.4, transmission: 0.08, intensity: 0.32 }),
    interior: createMaterial({ color: "#75c8c2", emissive: "#145a61", opacity: 0.37, roughness: 0.62, transmission: 0.12, intensity: 0.58 }),
  }), []);

  useEffect(() => () => {
    Object.values(materials).forEach((material) => material.dispose());
  }, [materials]);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);
    clonedScene.scale.set(1, 1, 1);
    clonedScene.updateMatrixWorld(true);

    clonedScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const region = getBrainRegion(object);
      object.userData.brainRegion = region;
      object.visible = region !== "support";
      object.material = region === "support" ? materials.interior : materials[region];
      object.renderOrder = region === "vessels" ? 7 : region === "nuclei" || region === "ventricles" ? 6 : 3;
      object.castShadow = false;
      object.receiveShadow = false;
    });

    // Frame the actual brain, not the long vessels and nerves that extend out
    // from it in the atlas. This keeps all of the anatomical parts centered.
    const coreBounds = new THREE.Box3();
    clonedScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const region = object.userData.brainRegion as ReturnType<typeof getBrainRegion>;
      if (object.visible && isFramingRegion(region)) coreBounds.expandByObject(object);
    });
    const bounds = coreBounds.isEmpty() ? new THREE.Box3().setFromObject(clonedScene) : coreBounds;
    const center = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    clonedScene.position.sub(center);
    clonedScene.scale.setScalar(1.42 / Math.max(sphere.radius, 0.001));

    return clonedScene;
  }, [gltf, materials]);

  useEffect(() => {
    onReady?.();
  }, [onReady, scene]);

  useEffect(() => {
    Object.entries(materials).forEach(([region, material]) => {
      const baseOpacity = Number(material.userData.baseOpacity ?? material.opacity);
      material.opacity = focusContains(focusRegion, region as BrainMaterialKey) ? baseOpacity : Math.min(baseOpacity * 0.12, 0.08);
    });
  }, [focusRegion, materials]);

  return <primitive object={scene} dispose={null} />;
}
