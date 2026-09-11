"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { brainAnatomyLegend, type BrainFocus } from "@/components/brain/brain-anatomy";
import { BrainFallback } from "@/components/brain/brain-fallback";

const BrainCanvas = dynamic(() => import("@/components/brain/brain-canvas").then((module) => module.BrainCanvas), {
  ssr: false,
  loading: () => <BrainFallback compact />,
});

class BrainErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const focusOptions: Array<{ id: BrainFocus; label: string }> = [
  { id: "all", label: "Todo" },
  { id: "frontal", label: "Frontal" },
  { id: "parietal", label: "Parietal" },
  { id: "temporal", label: "Temporal" },
  { id: "occipital", label: "Occipital" },
  { id: "cerebellum", label: "Cerebelo" },
  { id: "interior", label: "Interior" },
  { id: "whiteMatter", label: "Sust. blanca" },
  { id: "tracts", label: "Tractos" },
  { id: "nuclei", label: "Núcleos" },
  { id: "ventricles", label: "Ventrículos" },
  { id: "brainstem", label: "Tronco" },
];

export function BrainExperience() {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [focusRegion, setFocusRegion] = useState<BrainFocus>("all");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateMotionPreference);

    const webglFrame = window.requestAnimationFrame(() => setWebglAvailable(hasWebGL()));
    const motionFrame = window.requestAnimationFrame(() => setReducedMotion(mediaQuery.matches));
    const introTimer = window.setTimeout(() => setIntroComplete(true), mediaQuery.matches ? 320 : 2650);
    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
      window.cancelAnimationFrame(webglFrame);
      window.cancelAnimationFrame(motionFrame);
      window.clearTimeout(introTimer);
    };
  }, []);

  const handleModelReady = useCallback(() => setModelReady(true), []);
  const showFallback = webglAvailable === false;

  return (
    <section className={`brain-experience${introComplete ? " is-intro-complete" : ""}${modelReady ? " is-model-ready" : ""}`} aria-labelledby="brain-experience-title">
      <div className="brain-experience-topline">
        <p className="section-label">[ 04 ] &nbsp; Microrealidades</p>
        <p className="brain-experience-index">Experiencia inicial · 01</p>
      </div>

      <div className="brain-experience-copy">
        <p className="section-label">Anatomía / percepción / movimiento</p>
        <h1 id="brain-experience-title">El cerebro<br /><em>en movimiento.</em></h1>
        <p className="brain-experience-description">Una forma de mirar el pensamiento mientras sucede: orgánico, conectado y siempre incompleto.</p>
        {!introComplete && <button className="brain-skip-intro" type="button" onClick={() => setIntroComplete(true)}>Omitir introducción <span>↗</span></button>}
      </div>

      <div className="brain-stage" role="group" aria-label="Cerebro humano 3D interactivo con actividad neuronal" aria-busy={webglAvailable === null || !modelReady}>
        {showFallback ? (
          <BrainFallback />
        ) : webglAvailable === null ? (
          <BrainFallback compact />
        ) : (
          <BrainErrorBoundary fallback={<BrainFallback />}>
            <BrainCanvas introComplete={introComplete} reducedMotion={reducedMotion} focusRegion={focusRegion} onModelReady={handleModelReady} />
          </BrainErrorBoundary>
        )}
        <div className="brain-entry-curtain" aria-hidden="true">
          <span className="brain-entry-pulse pulse-one" />
          <span className="brain-entry-pulse pulse-two" />
          <span className="brain-entry-pulse pulse-three" />
        </div>
        <div className="brain-stage-readout" aria-hidden="true">
          <span className="brain-live-dot" />
          <span>Actividad interna</span>
          <span className="brain-stage-readout-separator">·</span>
          <span>arrastra para explorar</span>
        </div>
      </div>

      <aside className="brain-experience-aside">
        <p className="section-label">Observación</p>
        <p>La superficie deja pasar la luz suficiente para que la red interna permanezca visible.</p>
        <p className="brain-asset-note">Modelo anatómico · visualización no clínica</p>
        <div className="brain-focus-panel">
          <p className="section-label">Explorar por capas</p>
          <div className="brain-focus-options" role="group" aria-label="Enfoque anatómico">
            {focusOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={focusRegion === option.id ? "is-active" : ""}
                aria-pressed={focusRegion === option.id}
                onClick={() => setFocusRegion(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="brain-anatomy-key" aria-label="Partes anatómicas visibles">
          <p className="section-label">Lectura anatómica</p>
          <ul>
            {brainAnatomyLegend.map((part) => (
              <li key={part.id}>
                <span className="brain-anatomy-swatch" style={{ backgroundColor: part.color }} />
                <span>
                  <strong>{part.label}</strong>
                  <small>{part.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </section>
  );
}
