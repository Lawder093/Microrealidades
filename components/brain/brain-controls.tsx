"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function BrainControls({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const interacting = useRef(false);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.42;
    controls.minDistance = 3.45;
    controls.maxDistance = 6.8;
    controls.rotateSpeed = 0.52;
    // Keep the anatomical presentation centered while allowing a meaningful
    // side-to-side inspection on both pointer and touch devices.
    controls.minAzimuthAngle = -0.85;
    controls.maxAzimuthAngle = 0.85;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.screenSpacePanning = false;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controls.target.set(0, 0, 0);
    controls.update();

    const handleStart = () => { interacting.current = true; };
    const handleEnd = () => { interacting.current = false; };
    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);

    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", handleEnd);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = !reducedMotion && !interacting.current;
    controls.autoRotateSpeed = 0.18;
    controls.update();
  });

  return null;
}
