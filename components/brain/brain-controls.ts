import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** OrbitControls nativo de Three, sin otra dependencia para el bundle móvil. */
export class BrainInteractionController {
  readonly controls: OrbitControls;
  private dragging = false;
  private updating = false;
  private settleUntil = 0;
  private resumeAt = performance.now() + 3200;
  private fitDistance = 6;
  private modelRadius = 1.35;
  private readonly homeDirection = new THREE.Vector3(2.7, 1.2, 4.7).normalize();
  private readonly start = () => { this.dragging = true; this.resumeAt = Infinity; this.wake(); };
  private readonly end = () => { this.dragging = false; this.settleUntil = performance.now() + 1200; this.resumeAt = performance.now() + 4000; this.wake(); };
  private readonly change = () => { if (!this.updating) this.wake(); };

  constructor(private readonly element: HTMLCanvasElement, private readonly camera: THREE.PerspectiveCamera, private readonly reducedMotion: boolean, private readonly wake: () => void, radius = 1.35) {
    this.modelRadius = radius;
    this.controls = new OrbitControls(camera, element);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.085;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.65;
    this.controls.minPolarAngle = 0.06;
    this.controls.maxPolarAngle = Math.PI - 0.06;
    this.controls.autoRotateSpeed = 0.2;
    this.controls.touches.ONE = THREE.TOUCH.ROTATE;
    this.controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    this.controls.addEventListener("start", this.start);
    this.controls.addEventListener("end", this.end);
    this.controls.addEventListener("change", this.change);
  }

  setEnabled(enabled: boolean) {
    this.controls.enabled = enabled;
    // El modo táctil se activa ANTES de iniciar el gesto, no a mitad del arrastre.
    this.element.style.touchAction = enabled ? "none" : "pan-y";
    if (!enabled) this.dragging = false;
  }

  resize(width: number, height: number) {
    const old = this.fitDistance;
    const halfVertical = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * width / Math.max(height, 1));
    this.fitDistance = this.modelRadius / Math.sin(Math.min(halfVertical, halfHorizontal)) * 1.12;
    this.controls.minDistance = this.fitDistance * 0.72;
    this.controls.maxDistance = this.fitDistance * 1.75;
    const ratio = old ? THREE.MathUtils.clamp(this.camera.position.length() / old, 0.72, 1.75) : 1;
    this.camera.position.normalize().multiplyScalar(this.fitDistance * ratio);
    this.camera.near = 0.05;
    this.camera.far = 60;
    this.camera.updateProjectionMatrix();
    this.wake();
  }

  fit(radius: number, width: number, height: number) {
    this.modelRadius = Math.max(radius, 0.1);
    this.resize(width, height);
    this.reset();
  }

  reset() {
    this.controls.reset();
    this.controls.target.set(0, 0, 0);
    this.camera.position.copy(this.homeDirection).multiplyScalar(this.fitDistance);
    this.camera.lookAt(0, 0, 0);
    this.settleUntil = performance.now() + 1200;
    this.resumeAt = performance.now() + 4000;
    this.wake();
  }

  get needsFrame() { return this.dragging || performance.now() < this.settleUntil; }

  update(delta: number) {
    this.controls.autoRotate = !this.reducedMotion && !this.dragging && performance.now() >= this.resumeAt;
    this.updating = true;
    this.controls.update(Math.min(delta, 0.05));
    this.updating = false;
  }

  dispose() {
    this.controls.removeEventListener("start", this.start);
    this.controls.removeEventListener("end", this.end);
    this.controls.removeEventListener("change", this.change);
    this.controls.dispose();
    this.element.style.touchAction = "pan-y";
  }
}
