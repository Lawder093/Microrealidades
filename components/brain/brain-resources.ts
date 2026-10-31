import * as THREE from "three";
import { getBrainRegion, isFramingRegion, type BrainMaterialKey } from "@/components/brain/brain-anatomy";

export type BrainVolume = { center: THREE.Vector3Tuple; size: THREE.Vector3Tuple; radius: number };

export function disposeBrainSource(scene: THREE.Object3D, materials: Set<THREE.Material>) {
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  scene.traverse((object) => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); });
  materials.forEach((material) => Object.values(material).forEach((value: unknown) => { if (value instanceof THREE.Texture) textures.add(value); }));
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}

/** Geometría compartida solo dentro de esta carga; las dos raíces no comparten transformaciones. */
export function normalizeBrainScene(source: THREE.Group, materials: Record<BrainMaterialKey, THREE.MeshPhysicalMaterial>) {
  const asset = source.clone(true);
  asset.position.set(0, 0, 0);
  asset.rotation.set(0, 0, 0);
  asset.scale.set(1, 1, 1);
  asset.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  asset.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const region = getBrainRegion(object);
    object.userData.brainRegion = region;
    object.visible = region !== "support";
    object.material = materials[region === "support" ? "interior" : region];
    object.renderOrder = region === "vessels" ? 7 : region === "nuclei" || region === "ventricles" ? 6 : 3;
    object.castShadow = false;
    object.receiveShadow = false;
    if (object.visible && isFramingRegion(region)) bounds.expandByObject(object);
  });
  if (bounds.isEmpty()) bounds.setFromObject(asset);
  const center = bounds.getCenter(new THREE.Vector3());
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  // Trasladar el hijo y escalar el padre: evita multiplicar el offset Y del atlas.
  asset.position.sub(center);
  const scene = new THREE.Group();
  scene.add(asset);
  scene.scale.setScalar(1.35 / Math.max(sphere.radius, 0.001));
  scene.updateMatrixWorld(true);
  const interior = new THREE.Box3();
  scene.traverse((object) => { if (object instanceof THREE.Mesh && object.userData.brainRegion === "whiteMatter") interior.expandByObject(object); });
  if (interior.isEmpty()) interior.setFromCenterAndSize(new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(1, 1.1, 0.9));
  // Radio de vértices, no la diagonal de la caja: evita encoger visualmente el cerebro.
  let radius = 0;
  const point = new THREE.Vector3();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !isFramingRegion(object.userData.brainRegion)) return;
    const position = object.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i += 1) radius = Math.max(radius, point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).length());
  });
  const volume: BrainVolume = { radius, center: interior.getCenter(new THREE.Vector3()).toArray(), size: interior.getSize(new THREE.Vector3()).toArray() };
  return { scene, volume };
}
