import * as THREE from "three";
import type { RefObject } from "react";

export type BrainAnimation = { time: THREE.IUniform<number>; reveal: THREE.IUniform<number> };
export type BrainAnimationRef = RefObject<BrainAnimation>;
export type HologramSettings = { scanlineDensity: number; scanlineSpeed: number; glitchIntensity: number; fresnelPower: number };
export const hologramSettings: HologramSettings = { scanlineDensity: 105, scanlineSpeed: 0.24, glitchIntensity: 0.002, fresnelPower: 2.15 };

/** Una sola superficie: conservamos PBR y normales; no duplicamos el atlas. */
export function applyBrainHologram(material: THREE.MeshPhysicalMaterial, animation: BrainAnimation, reducedMotion: boolean) {
  const previous = material.userData.hologramUniforms as {
    uScanlineSpeed: THREE.IUniform<number>; uGlitchIntensity: THREE.IUniform<number>;
  } | undefined;
  if (previous) {
    // Mutar los uniforms ya enlazados: un cambio de preferencia no necesita otro shader.
    previous.uScanlineSpeed.value = reducedMotion ? 0 : hologramSettings.scanlineSpeed;
    previous.uGlitchIntensity.value = reducedMotion ? 0 : hologramSettings.glitchIntensity;
    return material;
  }
  const uniforms = {
    uTime: animation.time,
    uReveal: animation.reveal,
    uScanlineDensity: { value: hologramSettings.scanlineDensity },
    uScanlineSpeed: { value: reducedMotion ? 0 : hologramSettings.scanlineSpeed },
    uGlitchIntensity: { value: reducedMotion ? 0 : hologramSettings.glitchIntensity },
    uFresnelPower: { value: hologramSettings.fresnelPower },
    uHologramColor: { value: new THREE.Color("#8de0dd").lerp(material.color, 0.23) },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `
      #include <common>
      uniform float uTime;
      uniform float uGlitchIntensity;
      varying vec3 vHologramWorld;
    `).replace("#include <project_vertex>", `
      #include <project_vertex>
      vHologramWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
      // Una franja ocasional, de amplitud milimétrica en espacio de vista.
      float burst = step(0.986, sin(uTime * 0.87));
      float slice = step(0.965, sin(vHologramWorld.y * 39.0 + uTime * 2.0));
      mvPosition.x += burst * slice * sin(uTime * 73.0) * uGlitchIntensity;
      gl_Position = projectionMatrix * mvPosition;
    `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
      #include <common>
      uniform float uTime;
      uniform float uReveal;
      uniform float uScanlineDensity;
      uniform float uScanlineSpeed;
      uniform float uFresnelPower;
      uniform vec3 uHologramColor;
      varying vec3 vHologramWorld;
    `).replace("#include <emissivemap_fragment>", `
      #include <emissivemap_fragment>
      vec3 holoNormal = normalize(normal);
      float facing = abs(dot(holoNormal, normalize(vViewPosition)));
      float rim = pow(clamp(1.0 - facing, 0.0, 1.0), uFresnelPower);
      float phase = vHologramWorld.y * uScanlineDensity - uTime * uScanlineSpeed * 6.283185;
      // fwidth evita moiré en Safari/Chrome al alejar o usar DPR reducido.
      float lineSignal = 0.5 + 0.5 * sin(phase);
      float lineWidth = max(fwidth(phase) * 0.16, 0.025);
      float scan = smoothstep(0.88 - lineWidth, 0.98 + lineWidth, lineSignal);
      float sweep = pow(0.5 + 0.5 * sin(vHologramWorld.y * 3.7 - uTime * 0.8), 12.0);
      float folds = min(length(fwidth(holoNormal)) * 1.1, 0.35);
      diffuseColor.a *= uReveal * clamp(0.38 + rim * 0.58 + scan * 0.10, 0.0, 1.0);
      totalEmissiveRadiance += uHologramColor * (rim * 0.95 + scan * 0.22 + sweep * 0.14 + folds * 0.22) * uReveal;
    `);
  };
  material.customProgramCacheKey = () => "microrealidades-hologram-v1";
  material.userData.hologramUniforms = uniforms;
  material.needsUpdate = true;
  return material;
}
