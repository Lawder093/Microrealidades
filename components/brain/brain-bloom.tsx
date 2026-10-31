"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/** Chunk separado: los móviles nunca descargan ni crean los render targets de bloom. */
export function BrainBloom() {
  const { gl, scene, camera, size, invalidate } = useThree();
  const pipeline = useMemo(() => {
    const composer = new EffectComposer(gl);
    const render = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.32, 0.45, 0.85);
    const output = new OutputPass();
    // Compensar el punto negro del pase ACES para integrar el canvas en #101114.
    // Así bloom no introduce un rectángulo más oscuro que la página.
    output.uniforms.uPageBackground = { value: new Color("#101114") };
    output.material.fragmentShader = output.material.fragmentShader
      .replace("uniform sampler2D tDiffuse;", "uniform sampler2D tDiffuse; uniform vec3 uPageBackground;")
      .replace("// color space", `
        #ifdef ACES_FILMIC_TONE_MAPPING
          gl_FragColor.rgb += uPageBackground - ACESFilmicToneMapping(uPageBackground);
        #endif
        // color space
      `);
    composer.addPass(render); composer.addPass(bloom); composer.addPass(output);
    return { composer, render, bloom, output };
  }, [gl, scene, camera]);
  useEffect(() => {
    // Bloom limitado a resolución CSS: no multiplicar estos targets por DPR 2.
    pipeline.composer.setPixelRatio(1);
    pipeline.composer.setSize(size.width, size.height);
    invalidate();
  }, [pipeline, size.width, size.height, invalidate]);
  useEffect(() => () => { pipeline.bloom.dispose(); pipeline.output.dispose(); pipeline.composer.dispose(); }, [pipeline]);
  useFrame((_, delta) => pipeline.composer.render(delta), 1);
  return null;
}
