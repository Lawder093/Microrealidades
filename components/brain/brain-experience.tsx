"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { brainAnatomyLegend, type BrainFocus } from "@/components/brain/brain-anatomy";
import { BrainFallback } from "@/components/brain/brain-fallback";
import { chooseBrainQuality, type BrainQuality } from "@/components/brain/brain-quality";

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
    const context = canvas.getContext("webgl2");
    if (!context) return false;
    // La sonda no debe retener un contexto adicional del navegador.
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
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
  const [quality, setQuality] = useState<BrainQuality | null>(null);
  const [touchEnabled, setTouchEnabled] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [inViewport, setInViewport] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting);
      if (!entry.isIntersecting) setTouchEnabled(false);
    }, { threshold: 0.03 });
    observer.observe(element);
    const onVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateMotionPreference);

    const webglFrame = window.requestAnimationFrame(() => {
      const coarse = window.matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 900px)").matches);
      // Elegir LOD antes de montar el loader: un móvil no descarga el GLB completo.
      setQuality(chooseBrainQuality(coarse, navigator.hardwareConcurrency || 4));
      setWebglAvailable(hasWebGL());
    });
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
  const handleFailure = useCallback(() => setWebglAvailable(false), []);
  const showFallback = webglAvailable === false;
  const mobile = quality?.tier !== "desktop";

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

      <div ref={stage} className="brain-stage" role="group" aria-label="Cerebro humano 3D interactivo con actividad neuronal" aria-busy={!showFallback && (webglAvailable === null || !modelReady)}>
        {showFallback ? (
          <BrainFallback />
        ) : webglAvailable === null || !quality ? (
          <BrainFallback compact />
        ) : (
          <BrainErrorBoundary fallback={<BrainFallback />}>
            <BrainCanvas introComplete={introComplete} reducedMotion={reducedMotion} focusRegion={focusRegion} onModelReady={handleModelReady}
              quality={quality} active={inViewport && pageVisible} interactionEnabled={!mobile || touchEnabled} resetKey={resetKey} onFailure={handleFailure} />
          </BrainErrorBoundary>
        )}
        {webglAvailable && quality && <div className="brain-view-controls" aria-label="Controles de la vista 3D">
          {mobile && <button type="button" aria-pressed={touchEnabled} onClick={() => setTouchEnabled((value) => !value)}>{touchEnabled ? "Volver a desplazar" : "Activar giro y zoom"}</button>}
          <button type="button" onClick={() => setResetKey((value) => value + 1)}>Restablecer vista</button>
          {mobile && <span>{touchEnabled ? "Un dedo: girar · dos dedos: ampliar" : "Puedes desplazar la página. Activa el giro para explorar."}</span>}
        </div>}
        {showFallback && <p className="brain-fallback-status" role="status">La vista 3D no está disponible en este navegador. Puedes observar la representación estática.</p>}
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
