"use client";

import Link from "next/link";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  previewAreas,
  previewConcepts,
  previewQuestions,
  previewScores,
  previewTests,
  type PreviewAreaId,
} from "@/lib/microhub-preview-data";

export function MicrohubPreview() {
  const id = useId();
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const [areaId, setAreaId] = useState<PreviewAreaId>("tests");
  const [toolId, setToolId] = useState("sample");
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedTests, setSelectedTests] = useState<string[]>(
    previewTests.slice(0, 2),
  );
  const [batteryName, setBatteryName] = useState("Batería de muestra");
  const [recipient, setRecipient] = useState("Candidatura de muestra");
  const [concept, setConcept] = useState(0);
  const [notes, setNotes] = useState(
    "Una idea que conecta psicología, tecnología y comunidad.",
  );
  const [message, setMessage] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const area = previewAreas.find((entry) => entry.id === areaId)!;
  const selectedCount = `${selectedTests.length} ${selectedTests.length === 1 ? "prueba seleccionada" : "pruebas seleccionadas"}`;
  const tool = area.tools.find((entry) => entry.id === toolId) ?? area.tools[0];

  function selectArea(next: PreviewAreaId) {
    setAreaId(next);
    setToolId(previewAreas.find((entry) => entry.id === next)!.tools[0].id);
    setMessage("");
  }
  function selectTool(next: string) {
    setToolId(next);
    setMessage("");
  }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % previewAreas.length;
    else if (event.key === "ArrowLeft")
      next = (index + previewAreas.length - 1) % previewAreas.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = previewAreas.length - 1;
    else return;
    event.preventDefault();
    selectArea(previewAreas[next].id);
    tabs.current[next]?.focus();
  }
  function downloadSample() {
    const text = `MicroHub · Demostración pública\nDatos y resultados de ejemplo.\n\n${batteryName}\nPruebas: ${selectedTests.join(", ")}\n\nMi nota de muestra:\n${notes}\n`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "microhub-muestra.txt";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Muestra descargada.");
  }
  const results = (
    <div className="preview-report">
      <p className="preview-eyebrow">Ejemplo de reporte · Datos ficticios</p>
      <h3>
        Una vista para <em>comprender.</em>
      </h3>
      <p>Así puedes explorar un perfil y sus distintas dimensiones.</p>
      <div className="preview-bars">
        {previewScores.map((score) => (
          <div key={score.name}>
            <span>
              {score.name}
              <strong>{score.value}%</strong>
            </span>
            <div className="preview-bar-track">
              <span style={{ width: `${score.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="preview-caption">
        Valores ilustrativos para explorar el formato del reporte.
      </p>
    </div>
  );

  let content: ReactNode;
  if (areaId === "tests" && tool.id === "sample")
    content = (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (answers[question] === undefined) return;
          if (question < previewQuestions.length - 1)
            setQuestion((current) => current + 1);
          else selectTool("results");
        }}
      >
        <p className="preview-eyebrow">
          Muestra interactiva · {question + 1} de {previewQuestions.length}
        </p>
        <progress
          className="preview-progress"
          max={previewQuestions.length}
          value={question + 1}
          aria-label="Avance de la muestra"
        />
        <h3 id={`${id}-question`}>{previewQuestions[question]}</h3>
        <fieldset className="preview-answers">
          <legend className="sr-only">Elige una respuesta del 1 al 5</legend>
          {[1, 2, 3, 4, 5].map((value) => (
            <label
              className={answers[question] === value ? "is-selected" : ""}
              key={value}
            >
              <input
                type="radio"
                name={`${id}-answer-${question}`}
                value={value}
                checked={answers[question] === value}
                onChange={() =>
                  setAnswers((current) => ({ ...current, [question]: value }))
                }
              />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
        <div className="preview-scale">
          <span>Poco de acuerdo</span>
          <span>Muy de acuerdo</span>
        </div>
        <div className="preview-actions">
          {question > 0 && (
            <button
              className="preview-secondary"
              type="button"
              onClick={() => setQuestion((current) => current - 1)}
            >
              Anterior
            </button>
          )}
          <button
            className="preview-primary"
            disabled={answers[question] === undefined}
          >
            {question === previewQuestions.length - 1
              ? "Ver reporte de ejemplo"
              : "Continuar"}{" "}
            ↗
          </button>
        </div>
        <p className="preview-caption">
          Cuatro preguntas creadas para probar el recorrido.
        </p>
      </form>
    );
  else if (areaId === "tests" && tool.id === "library")
    content = (
      <>
        <p className="preview-eyebrow">
          Una biblioteca que acompaña tu trabajo
        </p>
        <h3>
          Explora antes de <em>elegir.</em>
        </h3>
        <div className="preview-test-list">
          {previewTests.map((test, index) => (
            <button
              key={test}
              onClick={() => {
                setQuestion(0);
                selectTool("sample");
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{test}</strong>
              <small>Probar recorrido ↗</small>
            </button>
          ))}
        </div>
      </>
    );
  else if (areaId === "tests")
    content = (
      <>
        {results}
        <button
          className="preview-secondary"
          onClick={() => {
            setAnswers({});
            setQuestion(0);
            selectTool("sample");
          }}
        >
          Volver a probar ↗
        </button>
      </>
    );
  else if (areaId === "talento" && tool.id === "battery")
    content = (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          selectTool("invitation");
        }}
      >
        <p className="preview-eyebrow">Arma tu propio recorrido</p>
        <h3>
          Una batería, <em>a tu manera.</em>
        </h3>
        <label className="preview-field">
          Nombre de la batería
          <input
            value={batteryName}
            onChange={(event) => setBatteryName(event.target.value)}
            required
            maxLength={80}
          />
        </label>
        <fieldset className="preview-test-options">
          <legend>Pruebas de ejemplo</legend>
          {previewTests.map((test) => (
            <label key={test}>
              <input
                type="checkbox"
                checked={selectedTests.includes(test)}
                onChange={() =>
                  setSelectedTests((current) =>
                    current.includes(test)
                      ? current.filter((entry) => entry !== test)
                      : [...current, test],
                  )
                }
              />
              {test}
            </label>
          ))}
        </fieldset>
        <div className="preview-actions">
          <span>{selectedCount}</span>
          <button className="preview-primary" disabled={!selectedTests.length}>
            Preparar ejemplo ↗
          </button>
        </div>
      </form>
    );
  else if (areaId === "talento" && tool.id === "invitation")
    content = (
      <>
        <p className="preview-eyebrow">De la selección al acompañamiento</p>
        <h3>
          Un recorrido <em>claro.</em>
        </h3>
        <label className="preview-field">
          Destinatario de muestra
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            maxLength={80}
          />
        </label>
        <div className="preview-invitation">
          <span className="preview-eyebrow">Invitación de ejemplo</span>
          <h4>{recipient || "Candidatura de muestra"}</h4>
          <p>
            {batteryName || "Batería de muestra"} · {selectedTests.length}{" "}
            {selectedTests.length === 1 ? "prueba" : "pruebas"}
          </p>
          <ol>
            <li>Completar datos</li>
            <li>Responder las pruebas</li>
            <li>Revisar el reporte en tu espacio</li>
          </ol>
        </div>
        <button
          className="preview-primary"
          onClick={() => {
            selectArea("tests");
            setQuestion(0);
          }}
        >
          Probar la experiencia ↗
        </button>
      </>
    );
  else if (areaId === "talento")
    content = (
      <>
        <p className="preview-eyebrow">Seguimiento · Ejemplo</p>
        <h3>
          Cada proceso, <em>a la vista.</em>
        </h3>
        <div className="preview-session-list">
          {["Finalizada", "En curso", "Pendiente"].map((state, index) => (
            <div key={state}>
              <span>Persona {String(index + 1).padStart(2, "0")}</span>
              <small>{state}</small>
              {index === 0 && (
                <button
                  className="preview-secondary"
                  onClick={() => setReportOpen((current) => !current)}
                >
                  {reportOpen ? "Cerrar reporte" : "Ver reporte"} ↗
                </button>
              )}
            </div>
          ))}
        </div>
        {reportOpen && results}
      </>
    );
  else if (areaId === "laboratorio" && tool.id === "map")
    content = (
      <>
        <p className="preview-eyebrow">Un lugar para pensar en conexiones</p>
        <h3>
          Las ideas se <em>encuentran.</em>
        </h3>
        <div className="preview-concepts" aria-label="Conceptos de muestra">
          {previewConcepts.map((entry, index) => (
            <button
              key={entry.name}
              className={concept === index ? "is-selected" : ""}
              aria-pressed={concept === index}
              onClick={() => setConcept(index)}
            >
              {entry.name}
            </button>
          ))}
        </div>
        <div className="preview-concept-detail">
          <h4>{previewConcepts[concept].name}</h4>
          <p>{previewConcepts[concept].text}</p>
        </div>
        <button className="preview-primary" onClick={() => selectTool("notes")}>
          Llevar una idea a notas ↗
        </button>
      </>
    );
  else if (areaId === "laboratorio" && tool.id === "notes")
    content = (
      <>
        <p className="preview-eyebrow">Tu mesa de ideas</p>
        <h3>
          Haz espacio para <em>escribir.</em>
        </h3>
        <label className="preview-field">
          Nota de muestra
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1200}
            rows={6}
          />
        </label>
        <div className="preview-actions">
          <span>{notes.length}/1200</span>
          <button
            className="preview-primary"
            onClick={() => selectTool("export")}
          >
            Preparar muestra ↗
          </button>
        </div>
      </>
    );
  else if (areaId === "laboratorio")
    content = (
      <>
        <p className="preview-eyebrow">Una idea que puedes llevar contigo</p>
        <h3>
          Del espacio de trabajo <em>a tus manos.</em>
        </h3>
        <div className="preview-export">
          <span aria-hidden="true">↗</span>
          <div>
            <h4>microhub-muestra.txt</h4>
            <p>Tu nota y la selección de ejemplo, en un archivo de texto.</p>
          </div>
        </div>
        <button className="preview-primary" onClick={downloadSample}>
          Descargar muestra ↗
        </button>
      </>
    );
  else
    content = (
      <div className="preview-coming">
        <span aria-hidden="true">✳</span>
        <p className="preview-eyebrow">{area.label}</p>
        <h3>
          Un espacio para <em>lo que viene.</em>
        </h3>
        <p>
          Esta área está reservada para una próxima herramienta de MicroHub.
        </p>
        <button
          className="preview-secondary"
          onClick={() => selectArea("laboratorio")}
        >
          Seguir explorando ↗
        </button>
      </div>
    );

  return (
    <section
      className="microhub-preview-section"
      aria-labelledby={`${id}-title`}
    >
      <div className="preview-heading">
        <div>
          <p className="section-label">MicroHub · Demo interactiva</p>
          <h2 id={`${id}-title`}>
            Primero explora.
            <br />
            <em>Después, hazlo tuyo.</em>
          </h2>
        </div>
        <p>
          Cambia de área, abre una herramienta y prueba el recorrido. Sin
          iniciar sesión.
        </p>
      </div>
      <div className="preview-shell">
        <div className="preview-window-heading">
          <span>Tu mesa de trabajo</span>
          <span>Datos ficticios · Demo pública</span>
        </div>
        <div
          className="preview-tabs"
          role="tablist"
          aria-label="Áreas de MicroHub"
        >
          {previewAreas.map((entry, index) => (
            <button
              ref={(element) => {
                tabs.current[index] = element;
              }}
              key={entry.id}
              id={`${id}-${entry.id}`}
              role="tab"
              aria-selected={areaId === entry.id}
              aria-controls={`${id}-panel`}
              tabIndex={areaId === entry.id ? 0 : -1}
              onClick={() => selectArea(entry.id)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="preview-mobile-hint">
          Desliza las pestañas para descubrir las cinco áreas ↔
        </p>
        <div className="preview-workspace">
          <aside className="preview-tools">
            <div className="preview-tools-heading">
              <p className="preview-eyebrow">Herramientas</p>
              <h3>{area.label}</h3>
              <p>{area.description}</p>
            </div>
            <nav aria-label={`Herramientas de ${area.label}`}>
              {area.tools.map((entry, index) => (
                <button
                  key={entry.id}
                  aria-pressed={tool.id === entry.id}
                  onClick={() => selectTool(entry.id)}
                >
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {entry.label}
                </button>
              ))}
            </nav>
          </aside>
          <div
            className="preview-panel"
            id={`${id}-panel`}
            role="tabpanel"
            aria-labelledby={`${id}-${areaId}`}
            tabIndex={0}
          >
            <div className="preview-panel-path">
              <span>
                {area.label} / {tool.label}
              </span>
              <span>Vista previa</span>
            </div>
            {content}
            <p className="preview-feedback" role="status">
              {message}
            </p>
          </div>
        </div>
        <div className="preview-footer">
          <span>Una muestra para explorar las posibilidades de MicroHub.</span>
          <Link href="/ingresar" prefetch={false}>
            Acceder a mi espacio ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
