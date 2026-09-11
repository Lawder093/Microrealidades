import * as THREE from "three";

export class BrainInteractionController {
  private dragging = false;
  private pointerId: number | null = null;
  private lastPointer = { x: 0, y: 0, time: 0 };
  private desiredRotation = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  private resumeAutoRotationAt = 0;

  constructor(
    private readonly element: HTMLCanvasElement,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly reducedMotion: boolean,
  ) {}

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastPointer = { x: event.clientX, y: event.clientY, time: performance.now() };
    this.velocity = { x: 0, y: 0 };
    this.resumeAutoRotationAt = Number.POSITIVE_INFINITY;
    this.element.setPointerCapture?.(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    if (!this.dragging || this.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(now - this.lastPointer.time, 8) / 1000;
    const horizontalDelta = (event.clientX - this.lastPointer.x) * 0.008;
    const verticalDelta = (event.clientY - this.lastPointer.y) * 0.0045;
    this.desiredRotation.y += horizontalDelta;
    this.desiredRotation.x = THREE.MathUtils.clamp(this.desiredRotation.x + verticalDelta, -0.48, 0.48);
    this.velocity.y = horizontalDelta / elapsed;
    this.velocity.x = verticalDelta / elapsed;
    this.lastPointer = { x: event.clientX, y: event.clientY, time: now };
  };

  private readonly stopDragging = (event: PointerEvent) => {
    if (this.pointerId !== event.pointerId) return;
    this.dragging = false;
    this.pointerId = null;
    this.resumeAutoRotationAt = performance.now() + 1800;
    if (this.element.hasPointerCapture?.(event.pointerId)) this.element.releasePointerCapture(event.pointerId);
  };

  private readonly handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    const nextDistance = THREE.MathUtils.clamp(this.camera.position.z + event.deltaY * 0.0025, 3.25, 5.8);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, nextDistance, 10, 0.16);
    this.resumeAutoRotationAt = performance.now() + 1200;
  };

  attach() {
    this.element.addEventListener("pointerdown", this.handlePointerDown);
    this.element.addEventListener("pointermove", this.handlePointerMove);
    this.element.addEventListener("pointerup", this.stopDragging);
    this.element.addEventListener("pointercancel", this.stopDragging);
    this.element.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  dispose() {
    this.element.removeEventListener("pointerdown", this.handlePointerDown);
    this.element.removeEventListener("pointermove", this.handlePointerMove);
    this.element.removeEventListener("pointerup", this.stopDragging);
    this.element.removeEventListener("pointercancel", this.stopDragging);
    this.element.removeEventListener("wheel", this.handleWheel);
  }

  update(group: THREE.Group, delta: number) {
    if (!this.dragging) {
      this.desiredRotation.x = THREE.MathUtils.damp(this.desiredRotation.x, 0, 2.2, delta);
      if (performance.now() < this.resumeAutoRotationAt) {
        this.desiredRotation.y += this.velocity.y * delta;
        this.desiredRotation.x += this.velocity.x * delta;
        this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 7, delta);
        this.velocity.y = THREE.MathUtils.damp(this.velocity.y, 0, 7, delta);
      } else if (!this.reducedMotion) {
        this.desiredRotation.y += delta * 0.09;
      }
    }

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, this.desiredRotation.x, 12, delta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, this.desiredRotation.y, 12, delta);
  }
}
