"use client";

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { brainModelPath } from "@/components/brain/brain-data";

function getCategory(object: THREE.Object3D) {
  return String(object.userData?.bx_cat ?? object.parent?.userData?.bx_cat ?? object.name).toLowerCase();
}

export function BrainModel({ onReady }: { onReady?: () => void }) {
  const gltf = useLoader(GLTFLoader, brainModelPath, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  }) as GLTF;

  const materials = useMemo(() => ({
    cortex: new THREE.MeshPhysicalMaterial({
      color: "#d6a3b4",
      emissive: "#47172c",
      emissiveIntensity: 0.32,
      roughness: 0.58,
      metalness: 0,
      transmission: 0.08,
      thickness: 0.62,
      ior: 1.28,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    interior: new THREE.MeshPhysicalMaterial({
      color: "#75c8c2",
      emissive: "#145a61",
      emissiveIntensity: 0.58,
      roughness: 0.62,
      metalness: 0,
      transmission: 0.12,
      thickness: 0.42,
      ior: 1.3,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    vessel: new THREE.MeshPhysicalMaterial({
      color: "#e77798",
      emissive: "#8d1d4a",
      emissiveIntensity: 0.28,
      roughness: 0.4,
      metalness: 0,
      transmission: 0.06,
      thickness: 0.25,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  }), []);

  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);
    clonedScene.position.set(0, 0, 0);
    clonedScene.rotation.set(0, 0, 0);
    clonedScene.scale.set(1, 1, 1);
    clonedScene.updateMatrixWorld(true);

    clonedScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      const category = getCategory(object);
      const isExternalVessel = category.includes("arter") || category.includes("vein") || category.includes("sinus") || category.includes("nerve");
      const isVessel = isExternalVessel || category.includes("tract");
      const isCortex = category.includes("cortex") || category.includes("gyrus") || category.includes("sulcus") || category.includes("mening");
      object.visible = !isExternalVessel;
      object.material = isVessel ? materials.vessel : isCortex ? materials.cortex : materials.interior;
      object.renderOrder = isCortex ? 2 : isVessel ? 4 : 3;
      object.castShadow = false;
      object.receiveShadow = false;
    });

    const coreBounds = new THREE.Box3();
    let hasCore = false;
    clonedScene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const isCore = object.userData?.bx_core === 1 || object.userData?.bx_core === true || object.parent?.userData?.bx_core === 1 || object.parent?.userData?.bx_core === true;
      if (isCore) {
        coreBounds.expandByObject(object);
        hasCore = true;
      }
    });
    const bounds = hasCore ? coreBounds : new THREE.Box3().setFromObject(clonedScene);
    const center = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    clonedScene.position.sub(center);
    // The atlas keeps the cortical shell slightly lateral to its full core
    // bbox; this small local correction aligns the visible shell with the
    // activity origin without changing its proportions.
    clonedScene.position.x += -0.2;
    clonedScene.scale.setScalar(1.72 / Math.max(sphere.radius, 0.001));

    return clonedScene;
  }, [gltf, materials]);

  useEffect(() => {
    onReady?.();
  }, [onReady, scene]);

  return <primitive object={scene} dispose={null} />;
}
