"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activeItems,
  calculateApplicationResult,
  correlation,
  cronbachAlpha,
  formatDate,
  type EvaluationApplication,
  type ParticipantType,
} from "@/lib/evaluation-engine";
import {
  evaluationDimensions,
  getDimension,
  likertLabels,
  type EvaluationDimension,
  type EvaluationItem,
  type EvaluationItemType,
} from "@/lib/evaluation-items";
import { batteryTestCatalog, getBatteryItemsForDraftEvaluation } from "@/lib/psychometric-battery-public";

type EvaluationView = "overview" | "apply" | "results" | "items" | "calibration";
type PhaseStatus = "pending" | "in-progress" | "complete";
type CalibrationPhase = { id: string; label: string; description: string; status: PhaseStatus; note: string };

const itemsStorageKey = "microrealidades:evaluacion-profesional:items:demo";
const applicationsStorageKey = "microrealidades:evaluacion-profesional:applications:demo";
const calibrationStorageKey = "microrealidades:evaluacion-profesional:calibration:demo";
const professionalEvaluationItems = getBatteryItemsForDraftEvaluation(batteryTestCatalog.map((test) => test.id));

const initialPhases: CalibrationPhase[] = [
  { id: "expert-review", label: "Revisión experta", description: "Revisar pertinencia, lenguaje, cobertura y sesgos con profesionales del campo.", status: "pending", note: "" },
  { id: "pilot", label: "Piloto", description: "Aplicar a una muestra de prueba separando terapeutas actuales y candidaturas.", status: "pending", note: "" },
  { id: "items", label: "Análisis de ítems", description: "Observar distribución de respuestas, omisiones y relación ítem-total.", status: "pending", note: "" },
  { id: "consistency", label: "Consistencia interna", description: "Calcular alfa solo cuando existan datos suficientes y comparables.", status: "pending", note: "" },
  { id: "revision", label: "Revisión del instrumento", description: "Decidir qué conservar, editar o retirar antes de otro ciclo.", status: "pending", note: "" },
];

const viewTabs: Array<{ id: EvaluationView; label: string; number: string }> = [
  { id: "overview", label: "Vista general", number: "01" },
  { id: "apply", label: "Aplicar", number: "02" },
  { id: "results", label: "Resultados", number: "03" },
  { id: "items", label: "Banco de ítems", number: "04" },
  { id: "calibration", label: "Calibración", number: "05" },
];

const typeLabels: Record<EvaluationItemType, string> = {
  likert: "Likert 1–5",
  case: "Caso práctico",
  knowledge: "Conocimientos",
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T : fallback;
  } catch {
    return fallback;
  }
}

function csvValue(value: string | number | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number | undefined>>) {
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function participantLabel(type: ParticipantType) {
  return type === "therapist" ? "Terapeuta actual" : "Candidatura";
}

function applicationIsComplete(application: EvaluationApplication, items: EvaluationItem[]) {
  return activeItems(items).every((item) => typeof application.responses[item.id] === "number" && Number.isFinite(application.responses[item.id]));
}

function ProgressBar({ value }: { value: number }) {
  return <div className="evaluation-progress"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function DimensionCard({ dimension, score, status }: { dimension: (typeof evaluationDimensions)[number]; score: number | null; status: string }) {
  return (
    <article className={`evaluation-dimension-card ${dimension.color}`}>
      <div className="evaluation-dimension-card-top"><span>{dimension.shortLabel}</span><small>{score === null ? "—" : `${score}/100 descriptivo`}</small></div>
      <h3>{dimension.label}</h3>
      <p>{dimension.description}</p>
      <ProgressBar value={score ?? 0} />
      <small className="evaluation-dimension-status">{status}</small>
    </article>
  );
}

function ItemResponse({ item, value, onChange }: { item: EvaluationItem; value?: number | string; onChange: (value: number) => void }) {
  if (item.type === "likert") {
    return (
      <div className="evaluation-likert" role="radiogroup" aria-label={item.prompt}>
        {likertLabels.map((label, index) => {
          const score = index + 1;
          return (
            <label key={score} className={value === score ? "is-selected" : ""}>
              <input type="radio" name={item.id} checked={value === score} onChange={() => onChange(score)} />
              <span>{score}</span>
              <small>{label.split(" · ")[1]}</small>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="evaluation-choice-list" role="radiogroup" aria-label={item.prompt}>
      {(item.options ?? []).map((option, index) => {
        const score = option.score ?? index + 1;
        return <label key={option.value} className={value === score ? "is-selected" : ""}>
          <input type="radio" name={item.id} checked={value === score} onChange={() => onChange(score)} />
          <span>{option.label}</span>
        </label>;
      })}
    </div>
  );
}

function Overview({ items, applications, onNavigate }: { items: EvaluationItem[]; applications: EvaluationApplication[]; onNavigate: (view: EvaluationView) => void }) {
  const active = activeItems(items);
  const completed = applications.filter((application) => application.completedAt && applicationIsComplete(application, items));
  return (
    <div className="evaluation-view">
      <div className="evaluation-intro-grid">
        <div>
          <p className="section-label">Instrumento en revisión</p>
          <h2>Observar el trabajo<br /><em>terapéutico.</em></h2>
          <p className="evaluation-lead">Una herramienta de apoyo para conversar sobre el perfil de puesto de terapeuta. No sustituye entrevista, supervisión ni criterio profesional.</p>
          <div className="evaluation-actions"><button className="evaluation-primary" type="button" onClick={() => onNavigate("apply")}>Nueva aplicación <span>↗</span></button><button className="evaluation-text-button" type="button" onClick={() => onNavigate("items")}>Revisar banco de ítems ↗</button></div>
        </div>
        <div className="evaluation-orbit" aria-hidden="true"><span /><span /><span /><strong>VR</strong></div>
      </div>
      <div className="evaluation-metric-grid">
        <div><span>Ítems activos</span><strong>{active.length}</strong><small>Separados del código de interfaz</small></div>
        <div><span>Aplicaciones</span><strong>{applications.length}</strong><small>Terapeutas y candidaturas</small></div>
        <div><span>Completas</span><strong>{completed.length}</strong><small>Disponibles para resultados</small></div>
        <div><span>Dimensiones</span><strong>05</strong><small>Perfil de puesto terapéutico</small></div>
      </div>
      <div className="evaluation-section-heading"><div><p className="section-label">Mapa del instrumento</p><h3>Cinco dimensiones para <em>conversar.</em></h3></div><p>La puntuación se muestra como una referencia descriptiva de las respuestas registradas; no hay baremos ni puntos de corte.</p></div>
      <div className="evaluation-dimension-grid">
        {evaluationDimensions.map((dimension) => <DimensionCard key={dimension.id} dimension={dimension} score={null} status="Aún sin una aplicación seleccionada" />)}
      </div>
      <div className="evaluation-how"><p className="section-label">Cómo usarlo</p><div><article><span>01</span><h4>Registrar</h4><p>Usa un código interno, nunca un nombre o dato clínico innecesario.</p></article><article><span>02</span><h4>Aplicar</h4><p>Combina auto-reporte, casos y conocimientos para abrir conversación.</p></article><article><span>03</span><h4>Revisar</h4><p>Lee el perfil junto con entrevista, supervisión y contexto del puesto.</p></article></div></div>
      <div className="evaluation-disclaimer"><strong>Estado del instrumento</strong><p>Versión de trabajo para revisión experta y piloto. No está validado, no diagnostica y no automatiza decisiones de contratación.</p></div>
    </div>
  );
}

function ApplicationForm({ items, applications, selectedApplicationId, onSelectApplication, onCreateApplication, onUpdateResponse, onComplete }: {
  items: EvaluationItem[];
  applications: EvaluationApplication[];
  selectedApplicationId: string | null;
  onSelectApplication: (id: string) => void;
  onCreateApplication: (type: ParticipantType, code: string) => void;
  onUpdateResponse: (id: string, itemId: string, value: number) => void;
  onComplete: (id: string) => void;
}) {
  const [type, setType] = useState<ParticipantType>("candidate");
  const [code, setCode] = useState("");
  const application = applications.find((entry) => entry.id === selectedApplicationId);
  const available = activeItems(items);
  const answered = application ? available.filter((item) => Number.isFinite(application.responses[item.id])).length : 0;
  const progress = available.length ? Math.round((answered / available.length) * 100) : 0;

  return (
    <div className="evaluation-view">
      <div className="evaluation-section-heading"><div><p className="section-label">Aplicación nueva</p><h2>Un registro <em>sin nombres.</em></h2></div><p>Usa un código interno que tu equipo pueda reconocer. La versión actual vive solo en este navegador.</p></div>
      <div className="evaluation-application-register">
        <label><span>Tipo de persona</span><select value={type} onChange={(event) => setType(event.target.value as ParticipantType)}><option value="candidate">Candidatura</option><option value="therapist">Terapeuta actual</option></select></label>
        <label><span>Código interno</span><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ej. TER-001 o CAND-014" autoComplete="off" /></label>
        <button className="evaluation-primary" type="button" disabled={!code.trim()} onClick={() => { onCreateApplication(type, code.trim()); setCode(""); }}>Crear aplicación <span>↗</span></button>
      </div>
      {applications.length > 0 && <label className="evaluation-application-picker"><span>Continuar una aplicación</span><select value={selectedApplicationId ?? ""} onChange={(event) => onSelectApplication(event.target.value)}><option value="">Selecciona un registro</option>{applications.map((entry) => <option key={entry.id} value={entry.id}>{entry.participantCode} · {participantLabel(entry.participantType)} · {formatDate(entry.createdAt)}</option>)}</select></label>}
      {application ? (
        <div className="evaluation-questionnaire">
          <div className="evaluation-questionnaire-head"><div><p className="section-label">{participantLabel(application.participantType)} · {application.participantCode}</p><h3>Responde con calma.</h3></div><div className="evaluation-questionnaire-progress"><strong>{answered}/{available.length}</strong><span>respondidos</span><ProgressBar value={progress} /></div></div>
          {evaluationDimensions.map((dimension) => {
            const dimensionItems = available.filter((item) => item.dimension === dimension.id);
            if (!dimensionItems.length) return null;
            return <section className="evaluation-question-group" key={dimension.id}><div className="evaluation-question-group-heading"><span className={`evaluation-color-dot ${dimension.color}`} /><div><p className="section-label">{dimension.shortLabel}</p><h4>{dimension.label}</h4><p>{dimension.description}</p></div></div>{dimensionItems.map((item, index) => <article className="evaluation-question" key={item.id}><div className="evaluation-question-meta"><span>{String(index + 1).padStart(2, "0")}</span><small>{typeLabels[item.type]}</small></div><h5>{item.prompt}</h5><ItemResponse item={item} value={application.responses[item.id]} onChange={(value) => onUpdateResponse(application.id, item.id, value)} /></article>)}</section>;
          })}
          <div className="evaluation-questionnaire-footer"><p>{application.completedAt ? `Concluida el ${formatDate(application.completedAt)}.` : "Puedes guardar avances; el resultado aparece al concluir todos los ítems activos."}</p><button className="evaluation-primary" type="button" disabled={!applicationIsComplete(application, items)} onClick={() => onComplete(application.id)}>{application.completedAt ? "Actualizar resultado" : "Concluir aplicación"} <span>↗</span></button></div>
        </div>
      ) : <div className="evaluation-empty"><span>✳</span><strong>Aún no seleccionas una aplicación.</strong><p>Registra un código arriba para comenzar o continuar una aplicación existente.</p></div>}
    </div>
  );
}

function ResultsView({ items, applications, selectedApplicationId, onSelectApplication, onExport }: { items: EvaluationItem[]; applications: EvaluationApplication[]; selectedApplicationId: string | null; onSelectApplication: (id: string) => void; onExport: (application: EvaluationApplication) => void }) {
  const completed = applications.filter((application) => application.completedAt && applicationIsComplete(application, items));
  const application = completed.find((entry) => entry.id === selectedApplicationId) ?? completed[0];
  const result = application ? calculateApplicationResult(application, items) : null;
  const ranked = result?.dimensions.filter((entry) => entry.score !== null).sort((first, second) => (second.score ?? 0) - (first.score ?? 0)) ?? [];
  const resultStatus = (dimension: EvaluationDimension) => {
    const position = ranked.findIndex((entry) => entry.dimension === dimension);
    if (position === 0) return "Fortaleza relativa del perfil";
    if (position >= Math.max(1, ranked.length - 2)) return "Área para profundizar";
    return "Patrón para observar";
  };
  return (
    <div className="evaluation-view">
      <div className="evaluation-section-heading"><div><p className="section-label">Lectura individual</p><h2>Resultados <em>para conversar.</em></h2></div><p>El perfil describe respuestas de esta aplicación; no compara contra una población ni determina idoneidad.</p></div>
      {completed.length > 0 && <div className="evaluation-results-toolbar"><label><span>Aplicación</span><select value={application?.id ?? ""} onChange={(event) => onSelectApplication(event.target.value)}>{completed.map((entry) => <option key={entry.id} value={entry.id}>{entry.participantCode} · {participantLabel(entry.participantType)}</option>)}</select></label>{application && <button className="evaluation-text-button" type="button" onClick={() => onExport(application)}>Exportar resultado CSV ↗</button>}</div>}
      {application && result ? <><div className="evaluation-result-summary"><div><span>Perfil consultado</span><strong>{application.participantCode}</strong><small>{participantLabel(application.participantType)} · {formatDate(application.completedAt)}</small></div><div><span>Índice descriptivo global</span><strong>{result.globalScore ?? "—"}<small>{result.globalScore === null ? "Sin datos" : "/100"}</small></strong><small>{result.answered}/{result.total} respuestas</small></div></div><div className="evaluation-result-grid">{evaluationDimensions.map((dimension) => { const dimensionResult = result.dimensions.find((entry) => entry.dimension === dimension.id); return <DimensionCard key={dimension.id} dimension={dimension} score={dimensionResult?.score ?? null} status={dimensionResult?.score === null ? "Sin respuestas" : resultStatus(dimension.id)} />; })}</div><section className="evaluation-response-detail"><div className="evaluation-section-heading"><div><p className="section-label">Detalle de respuestas</p><h3>Volver a cada <em>decisión.</em></h3></div><p>Los valores se conservan como respuestas de trabajo y pueden revisarse junto con la evidencia profesional disponible.</p></div>{evaluationDimensions.map((dimension) => { const dimensionItems = activeItems(items).filter((item) => item.dimension === dimension.id); return <div className="evaluation-response-group" key={dimension.id}><h4>{dimension.label}</h4>{dimensionItems.map((item) => <div key={item.id}><span>{typeLabels[item.type]}</span><p>{item.prompt}</p><strong>{application.responses[item.id]}/5</strong></div>)}</div>; })}</section></> : <div className="evaluation-empty"><span>✳</span><strong>No hay resultados completos todavía.</strong><p>Concluye una aplicación para generar un perfil individual. Las aplicaciones incompletas permanecen disponibles en Aplicar.</p></div>}
    </div>
  );
}

function ItemBank({ items, onToggle, onAdd }: { items: EvaluationItem[]; onToggle: (id: string) => void; onAdd: (item: EvaluationItem) => void }) {
  const [dimension, setDimension] = useState<EvaluationDimension>("personality");
  const [type, setType] = useState<EvaluationItemType>("likert");
  const [prompt, setPrompt] = useState("");
  const [optionLabels, setOptionLabels] = useState(["", "", "", ""]);
  const activeCount = activeItems(items).length;
  const addItem = () => {
    if (!prompt.trim()) return;
    const next: EvaluationItem = { id: `custom-${Date.now()}`, dimension, type, prompt: prompt.trim(), active: true, options: type === "likert" ? undefined : optionLabels.map((label, index) => ({ value: `custom-${Date.now()}-${index}`, label: label.trim() || `Opción ${index + 1}`, score: [1, 2, 4, 5][index] })) };
    onAdd(next);
    setPrompt("");
    setOptionLabels(["", "", "", ""]);
  };
  return (
    <div className="evaluation-view">
      <div className="evaluation-section-heading"><div><p className="section-label">Administración</p><h2>Un banco <em>revisable.</em></h2></div><p>Los ítems viven fuera de la interfaz para facilitar revisión experta, edición y ciclos de calibración.</p></div>
      <div className="evaluation-admin-grid"><section className="evaluation-admin-form"><p className="section-label">Agregar ítem</p><label><span>Dimensión</span><select value={dimension} onChange={(event) => setDimension(event.target.value as EvaluationDimension)}>{evaluationDimensions.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label><label><span>Tipo de ítem</span><select value={type} onChange={(event) => setType(event.target.value as EvaluationItemType)}>{Object.entries(typeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label><span>Enunciado</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Escribe un ítem para revisión experta." rows={4} /></label>{type !== "likert" && <div className="evaluation-option-editor"><span>Opciones de respuesta</span>{optionLabels.map((label, index) => <input key={index} value={label} onChange={(event) => setOptionLabels((current) => current.map((entry, entryIndex) => entryIndex === index ? event.target.value : entry))} placeholder={`Opción ${index + 1}`} />)}</div>}<button className="evaluation-primary" type="button" disabled={!prompt.trim()} onClick={addItem}>Agregar al banco <span>↗</span></button><small>Los ítems nuevos se guardan solo en esta versión de demostración.</small></section><section className="evaluation-item-list"><div className="evaluation-item-list-head"><div><p className="section-label">Banco actual</p><h3>{items.length} ítems · {activeCount} activos</h3></div><span className="evaluation-demo-chip">DEMO</span></div>{items.map((item) => <article className={`evaluation-bank-item${item.active ? "" : " is-inactive"}`} key={item.id}><div className="evaluation-bank-item-meta"><span>{item.id}</span><small>{typeLabels[item.type]} · {getDimension(item.dimension).shortLabel}</small></div><p>{item.prompt}</p><button type="button" onClick={() => onToggle(item.id)}>{item.active ? "Desactivar" : "Activar"}</button></article>)}</section></div>
    </div>
  );
}

function CalibrationView({ items, applications, phases, onUpdatePhase, onExportAll }: { items: EvaluationItem[]; applications: EvaluationApplication[]; phases: CalibrationPhase[]; onUpdatePhase: (id: string, patch: Partial<CalibrationPhase>) => void; onExportAll: () => void }) {
  const completed = applications.filter((application) => application.completedAt && applicationIsComplete(application, items));
  const active = activeItems(items);
  const analyses = active.map((item) => {
    const responses = completed.map((application) => application.responses[item.id]).filter((value): value is number => Number.isFinite(value));
    const totals = completed.filter((application) => typeof application.responses[item.id] === "number" && Number.isFinite(application.responses[item.id])).map((application) => active.filter((candidate) => candidate.id !== item.id).reduce((sum, candidate) => sum + (typeof application.responses[candidate.id] === "number" ? application.responses[candidate.id] as number : 0), 0));
    return { item, n: responses.length, mean: responses.length ? (responses.reduce((sum, value) => sum + value, 0) / responses.length).toFixed(2) : "—", correlation: correlation(responses, totals) ?? "—" };
  });
  return (
    <div className="evaluation-view">
      <div className="evaluation-section-heading"><div><p className="section-label">Proceso de calibración</p><h2>Revisar antes de <em>interpretar.</em></h2></div><p>Estos análisis se calculan únicamente con las aplicaciones completas almacenadas en este navegador. No son evidencia de validez.</p></div>
      <div className="evaluation-calibration-metrics"><div><span>Aplicaciones completas</span><strong>{completed.length}</strong></div><div><span>Ítems activos</span><strong>{active.length}</strong></div><div><span>Datos separados</span><strong>DEMO</strong></div></div>
      <section className="evaluation-phases"><div className="evaluation-section-heading"><div><p className="section-label">Cinco fases</p><h3>Del borrador al <em>instrumento.</em></h3></div><p>Marca avances del equipo y deja una nota breve para la siguiente revisión.</p></div>{phases.map((phase, index) => <article className="evaluation-phase" key={phase.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h4>{phase.label}</h4><p>{phase.description}</p><input value={phase.note} onChange={(event) => onUpdatePhase(phase.id, { note: event.target.value })} placeholder="Nota de revisión (opcional)" /></div><select value={phase.status} onChange={(event) => onUpdatePhase(phase.id, { status: event.target.value as PhaseStatus })}><option value="pending">Pendiente</option><option value="in-progress">En curso</option><option value="complete">Completada</option></select></article>)}</section>
      <section className="evaluation-analysis"><div className="evaluation-section-heading"><div><p className="section-label">Análisis disponible</p><h3>Lo que los datos <em>sí permiten.</em></h3></div><button className="evaluation-text-button" type="button" onClick={onExportAll}>Exportar todas las respuestas CSV ↗</button></div><div className="evaluation-analysis-grid"><section><h4>Consistencia interna</h4>{evaluationDimensions.map((dimension) => { const dimensionItems = active.filter((item) => item.dimension === dimension.id); const alpha = cronbachAlpha(completed, dimensionItems); return <div className="evaluation-analysis-row" key={dimension.id}><span>{dimension.shortLabel}</span><strong>{alpha === null ? "No calculable" : alpha}</strong><small>{alpha === null ? "Se requieren al menos 3 aplicaciones completas y 2 ítems respondidos." : `α descriptivo con ${completed.length} aplicaciones.`}</small></div>; })}</section><section><h4>Comportamiento de ítems</h4><div className="evaluation-table-wrap"><table><thead><tr><th>Ítem</th><th>n</th><th>Media</th><th>r ítem-total</th></tr></thead><tbody>{analyses.map((analysis) => <tr key={analysis.item.id}><td>{analysis.item.id}</td><td>{analysis.n}</td><td>{analysis.mean}</td><td>{analysis.correlation}</td></tr>)}</tbody></table></div><small className="evaluation-table-note">La correlación requiere al menos 3 respuestas con variación. No se interpretan valores como puntos de corte.</small></section></div></section>
    </div>
  );
}

export function ProfessionalEvaluation() {
  const [view, setView] = useState<EvaluationView>("overview");
  const [items, setItems] = useState<EvaluationItem[]>(professionalEvaluationItems);
  const [applications, setApplications] = useState<EvaluationApplication[]>([]);
  const [phases, setPhases] = useState<CalibrationPhase[]>(initialPhases);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readStorage(itemsStorageKey, professionalEvaluationItems));
      setApplications(readStorage(applicationsStorageKey, []));
      setPhases(readStorage(calibrationStorageKey, initialPhases));
      setStorageReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(itemsStorageKey, JSON.stringify(items));
    window.localStorage.setItem(applicationsStorageKey, JSON.stringify(applications));
    window.localStorage.setItem(calibrationStorageKey, JSON.stringify(phases));
  }, [applications, items, phases, storageReady]);

  const active = useMemo(() => activeItems(items), [items]);

  function createApplication(participantType: ParticipantType, participantCode: string) {
    const application: EvaluationApplication = { id: `application-${Date.now()}`, participantCode, participantType, evaluatorCode: "local-demo", createdAt: new Date().toISOString(), responses: {} };
    setApplications((current) => [application, ...current]);
    setSelectedApplicationId(application.id);
    setView("apply");
  }

  function updateResponse(applicationId: string, itemId: string, value: number) {
    setApplications((current) => current.map((application) => application.id === applicationId ? { ...application, responses: { ...application.responses, [itemId]: value }, completedAt: undefined } : application));
  }

  function completeApplication(applicationId: string) {
    setApplications((current) => current.map((application) => application.id === applicationId ? { ...application, completedAt: new Date().toISOString() } : application));
    setSelectedApplicationId(applicationId);
    setView("results");
  }

  function exportApplication(application: EvaluationApplication) {
    const result = calculateApplicationResult(application, items);
    downloadCsv(`evaluacion-${application.participantCode}.csv`, [["codigo", "tipo", "fecha", "dimension", "puntuacion_descriptiva", "respuestas", "total_items"], ...result.dimensions.map((dimension) => [application.participantCode, participantLabel(application.participantType), formatDate(application.completedAt), getDimension(dimension.dimension).label, dimension.score ?? "", dimension.answered, dimension.total]), [application.participantCode, participantLabel(application.participantType), formatDate(application.completedAt), "Global", result.globalScore ?? "", result.answered, result.total]]);
  }

  function exportAll() {
    const header = ["codigo", "tipo", "fecha", ...active.map((item) => item.id)];
    const rows = applications.map((application) => [application.participantCode, participantLabel(application.participantType), formatDate(application.completedAt ?? application.createdAt), ...active.map((item) => application.responses[item.id] ?? "")]);
    downloadCsv("evaluacion-aplicaciones-demo.csv", [header, ...rows]);
  }

  return (
    <section className="evaluation-module" aria-labelledby="evaluation-title">
      <div className="evaluation-safety"><span className="evaluation-safety-mark" aria-hidden="true">!</span><div><strong>Versión de trabajo · datos locales de demostración</strong><p>No introduzcas nombres, diagnósticos ni datos personales reales. Esta versión no tiene login, cifrado, auditoría ni backend seguro.</p></div><span className="evaluation-demo-chip">DEMO</span></div>
      <div className="evaluation-header"><div><p className="section-label">Vidovic 01 · Microrealidades</p><h1 id="evaluation-title">Evaluación <em>Profesional.</em></h1><p>Un instrumento en construcción para conversar sobre el perfil de puesto de terapeuta con cinco dimensiones y tres formas de evidencia.</p></div><div className="evaluation-header-note"><span>Versión</span><strong>0.1</strong><small>Instrumento no validado</small></div></div>
      <nav className="evaluation-tabs" aria-label="Secciones de evaluación" role="tablist">{viewTabs.map((tab) => <button key={tab.id} className={view === tab.id ? "is-active" : ""} type="button" role="tab" aria-selected={view === tab.id} onClick={() => setView(tab.id)}><span>{tab.number}</span>{tab.label}</button>)}</nav>
      {view === "overview" && <Overview items={items} applications={applications} onNavigate={setView} />}
      {view === "apply" && <ApplicationForm items={items} applications={applications} selectedApplicationId={selectedApplicationId} onSelectApplication={setSelectedApplicationId} onCreateApplication={createApplication} onUpdateResponse={updateResponse} onComplete={completeApplication} />}
      {view === "results" && <ResultsView items={items} applications={applications} selectedApplicationId={selectedApplicationId} onSelectApplication={setSelectedApplicationId} onExport={exportApplication} />}
      {view === "items" && <ItemBank items={items} onToggle={(id) => setItems((current) => current.map((item) => item.id === id ? { ...item, active: !item.active } : item))} onAdd={(item) => setItems((current) => [...current, item])} />}
      {view === "calibration" && <CalibrationView items={items} applications={applications} phases={phases} onUpdatePhase={(id, patch) => setPhases((current) => current.map((phase) => phase.id === id ? { ...phase, ...patch } : phase))} onExportAll={exportAll} />}
      <div className="evaluation-footer-note"><span>Privacidad primero</span><p>Cuando exista backend, esta vista deberá incorporar autenticación, roles, cifrado, retención limitada, trazabilidad y separación estricta entre datos de prueba y reales.</p></div>
    </section>
  );
}
