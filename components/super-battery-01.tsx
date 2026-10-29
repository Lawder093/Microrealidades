"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { calculateConfiguredBatteryResult } from "@/lib/psychometric-battery";
import type { Respuesta } from "@/lib/evaluacion/motor";
import { defaultEvaluationItems, evaluationDimensions, likertLabels, type EvaluationItem } from "@/lib/evaluation-items";
import { batteryPresets, batteryTestCatalog, defaultBattery, getBatteryItems } from "@/lib/psychometric-battery";

type SuperBatteryMode = "home" | "recruiter" | "candidate";
type CandidateStage = "access" | "quiz" | "thanks";
type DashboardSession = { id: string; codigo: string; bateria_id: string; candidato_nombre?: string; candidato_empresa?: string; estado: string; resultados?: { globalScore?: number | null }; created_at: string; finalizado_en?: string };
type DashboardBattery = { id: string; nombre: string; clasificacion_puesto: string; tiempo_total_min: number; activa: boolean };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function CandidateItem({ item, value, onChange }: { item: EvaluationItem; value?: Respuesta; onChange: (answer: Respuesta) => void }) {
  if (item.type === "likert") {
    return <div className="super-battery-likert" role="radiogroup" aria-label={item.prompt}>{likertLabels.map((label, index) => { const score = index + 1; return <label className={value === score ? "is-selected" : ""} key={score}><input type="radio" name={item.id} checked={value === score} onChange={() => onChange(score)} /><strong>{score}</strong><small>{label.split(" · ")[1]}</small></label>; })}</div>;
  }
  return <div className="super-battery-options" role="radiogroup" aria-label={item.prompt}>{(item.options ?? []).map((option) => { const answer = item.correctValue ? option.value : option.score; return <label className={value === answer ? "is-selected" : ""} key={option.value}><input type="radio" name={item.id} checked={value === answer} onChange={() => onChange(answer)} /><span>{option.label}</span></label>; })}</div>;
}

function DemoNotice() {
  return <div className="super-battery-notice"><span aria-hidden="true">!</span><p><strong>Modo de preparación.</strong> Supabase no está conectado en este entorno. Las acciones locales son únicamente de prueba y no deben contener información real.</p></div>;
}

export function SuperBattery01() {
  const [mode, setMode] = useState<SuperBatteryMode>("home");
  const [candidateStage, setCandidateStage] = useState<CandidateStage>("access");
  const [candidateSessionId, setCandidateSessionId] = useState("");
  const [candidateCode, setCandidateCode] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateAge, setCandidateAge] = useState("");
  const [candidateCompany, setCandidateCompany] = useState("");
  const [candidateResponses, setCandidateResponses] = useState<Record<string, Respuesta>>({});
  const [candidateTestIds, setCandidateTestIds] = useState<string[]>(defaultBattery.tests.map((test) => test.testId));
  const [candidateBatteryName, setCandidateBatteryName] = useState(defaultBattery.name);
  const [candidateError, setCandidateError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(defaultBattery.totalMinutes * 60);
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [recruiterPassword, setRecruiterPassword] = useState("");
  const [recruiterToken, setRecruiterToken] = useState("");
  const [recruiterError, setRecruiterError] = useState("");
  const [batteryName, setBatteryName] = useState(defaultBattery.name);
  const [batteryClassification, setBatteryClassification] = useState("custom");
  const [batteryMinutes, setBatteryMinutes] = useState(String(defaultBattery.totalMinutes));
  const [selectedTestIds, setSelectedTestIds] = useState(defaultBattery.tests.map((test) => test.testId));
  const [selectedPresetId, setSelectedPresetId] = useState(defaultBattery.id);
  const [batteries, setBatteries] = useState<DashboardBattery[]>([]);
  const [sessions, setSessions] = useState<DashboardSession[]>([]);
  const [demoCode, setDemoCode] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [message, setMessage] = useState("");

  const candidateItems = useMemo(() => getBatteryItems(candidateTestIds, defaultEvaluationItems), [candidateTestIds]);
  const answered = candidateItems.filter((item) => candidateResponses[item.id] !== undefined).length;
  const progress = candidateItems.length ? Math.round((answered / candidateItems.length) * 100) : 0;

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("codigo")?.trim().toUpperCase();
    if (code) {
      setCandidateCode(code);
      setMode("candidate");
    }
  }, []);

  useEffect(() => {
    if (candidateStage !== "quiz") return undefined;
    const timer = window.setInterval(() => setSecondsLeft((current) => {
      if (current <= 1) {
        window.clearInterval(timer);
        setCandidateError("El tiempo terminó. Revisa tus respuestas y envía la aplicación.");
        return 0;
      }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [candidateStage]);

  async function recruiterLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecruiterError("");
    if (!hasSupabase) {
      setMode("recruiter");
      setBatteries([{ id: defaultBattery.id, nombre: defaultBattery.name, clasificacion_puesto: "custom", tiempo_total_min: defaultBattery.totalMinutes, activa: true }]);
      setRecruiterError("Modo demo activo: configura Supabase para autenticar reclutadores.");
      return;
    }
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: supabaseAnonKey ?? "", "Content-Type": "application/json" }, body: JSON.stringify({ email: recruiterEmail, password: recruiterPassword }) });
    const data = await response.json() as { access_token?: string; error_description?: string };
    if (!response.ok || !data.access_token) {
      setRecruiterError(data.error_description ?? "No se pudo iniciar sesión.");
      return;
    }
    setRecruiterToken(data.access_token);
    setMode("recruiter");
    await loadDashboard(data.access_token);
  }

  async function loadDashboard(token = recruiterToken) {
    if (!hasSupabase || !token) return;
    const response = await fetch("/api/evaluaciones/recruiter", { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json() as { batteries?: DashboardBattery[]; sessions?: DashboardSession[]; error?: string };
    if (!response.ok) {
      setRecruiterError(data.error ?? "No se pudo cargar el dashboard.");
      return;
    }
    setBatteries(data.batteries ?? []);
    setSessions(data.sessions ?? []);
  }

  function selectPreset(presetId: string) {
    const preset = batteryPresets.find((candidate) => candidate.id === presetId) ?? defaultBattery;
    setSelectedPresetId(preset.id);
    setBatteryName(preset.name);
    setBatteryClassification(preset.classification);
    setBatteryMinutes(String(preset.totalMinutes));
    setSelectedTestIds(preset.tests.map((test) => test.testId));
  }

  async function createBattery() {
    setMessage("");
    if (!hasSupabase || !recruiterToken) {
      const demoBattery: DashboardBattery = { id: `demo-${Date.now()}`, nombre: batteryName.trim() || defaultBattery.name, clasificacion_puesto: batteryClassification, tiempo_total_min: Number(batteryMinutes) || defaultBattery.totalMinutes, activa: true };
      setBatteries((current) => [demoBattery, ...current]);
      setMessage("Batería creada en modo demo.");
      return;
    }
    const response = await fetch("/api/evaluaciones/recruiter", { method: "POST", headers: { Authorization: `Bearer ${recruiterToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-battery", name: batteryName, classification: batteryClassification, totalMinutes: Number(batteryMinutes), tests: selectedTestIds.map((testId, index) => ({ testId, order: index + 1, timeLimitSeconds: batteryClassification === "PSIC-CLIN-INF" ? 900 : 360 })) }) });
    const data = await response.json() as { battery?: DashboardBattery; error?: string };
    if (data.battery) {
      setBatteries((current) => [data.battery as DashboardBattery, ...current]);
      setMessage("Batería creada.");
    } else setRecruiterError(data.error ?? "No se pudo crear la batería.");
  }

  async function createCode(batteryId: string) {
    setMessage("");
    if (!hasSupabase || !recruiterToken) {
      const code = `SB01-DEMO${String(Date.now()).slice(-4)}`;
      setDemoCode(code);
      setShareLink(`${window.location.origin}/evaluaciones-psicometricas?codigo=${encodeURIComponent(code)}`);
      setMessage("Código de prueba generado. No abre una sesión real.");
      return;
    }
    const response = await fetch("/api/evaluaciones/recruiter", { method: "POST", headers: { Authorization: `Bearer ${recruiterToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-session", batteryId }) });
    const data = await response.json() as { session?: DashboardSession; error?: string };
    if (data.session) {
      setSessions((current) => [data.session as DashboardSession, ...current]);
      const code = (data.session as DashboardSession).codigo;
      const link = `${window.location.origin}/evaluaciones-psicometricas?codigo=${encodeURIComponent(code)}`;
      setShareLink(link);
      setMessage(`Código generado: ${code}. Comparte el enlace privado.`);
    } else setRecruiterError(data.error ?? "No se pudo generar el código.");
  }

  async function copyShareLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setMessage("Enlace privado copiado.");
  }

  async function copyShareLinkForCode(code: string) {
    const link = `${window.location.origin}/evaluaciones-psicometricas?codigo=${encodeURIComponent(code)}`;
    setShareLink(link);
    await navigator.clipboard.writeText(link);
    setMessage("Enlace privado copiado.");
  }

  async function downloadPdf(sessionId: string) {
    if (!recruiterToken) return;
    const response = await fetch(`/api/evaluaciones/pdf?sessionId=${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${recruiterToken}` } });
    if (!response.ok) {
      setRecruiterError("No se pudo descargar el reporte.");
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = `super-bateria-${sessionId}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function startCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCandidateError("");
    if (!candidateCode.trim() || !candidateName.trim() || !candidateAge) {
      setCandidateError("Completa código, nombre y edad para iniciar.");
      return;
    }
    if (hasSupabase) {
      const response = await fetch("/api/evaluaciones/sesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "start", code: candidateCode, name: candidateName, age: Number(candidateAge), company: candidateCompany }) });
      const data = await response.json() as { sessionId?: string; error?: string; battery?: { nombre?: string; pruebas?: Array<{ testId: string }>; tiempo_total_min?: number } };
      if (!response.ok || !data.sessionId) {
        setCandidateError(data.error ?? "No se pudo iniciar la sesión.");
        return;
      }
      setCandidateSessionId(data.sessionId);
      const assignedTests = data.battery?.pruebas?.map((test) => test.testId).filter(Boolean) ?? [];
      setCandidateTestIds(assignedTests.length ? assignedTests : defaultBattery.tests.map((test) => test.testId));
      setCandidateBatteryName(data.battery?.nombre ?? defaultBattery.name);
      const durationMinutes = data.battery?.tiempo_total_min ?? defaultBattery.totalMinutes;
      setSecondsLeft(durationMinutes * 60);
    }
    setCandidateResponses({});
    if (!hasSupabase) setSecondsLeft(defaultBattery.totalMinutes * 60);
    setCandidateStage("quiz");
  }

  async function finishCandidate() {
    if (answered < candidateItems.length) {
      setCandidateError(`Faltan ${candidateItems.length - answered} respuestas. Puedes enviar cuando completes la batería.`);
      return;
    }
    const results = calculateConfiguredBatteryResult(candidateTestIds, candidateResponses);
    if (hasSupabase && candidateSessionId) {
      const response = await fetch("/api/evaluaciones/sesion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "complete", code: candidateCode, sessionId: candidateSessionId, responses: candidateResponses }) });
      if (!response.ok) {
        setCandidateError("No se pudo guardar la aplicación. El código no se consumió; intenta de nuevo.");
        return;
      }
    }
    setMessage(`Aplicación recibida. Perfil descriptivo: ${results.globalScore ?? "—"}/100.`);
    setCandidateStage("thanks");
  }

  function resetCandidate() {
    setCandidateStage("access");
    setCandidateCode("");
    setCandidateSessionId("");
    setCandidateName("");
    setCandidateAge("");
    setCandidateCompany("");
    setCandidateResponses({});
    setCandidateError("");
    setMessage("");
  }

  return (
    <section className="super-battery-module" aria-labelledby="super-battery-title">
      {!hasSupabase && <DemoNotice />}
      <div className="super-battery-header"><div><p className="section-label">Vidovic 01 · herramienta de reclutamiento</p><h2 id="super-battery-title">Super batería <em>01.</em></h2><p>Una matriz configurable para observar el perfil de terapeuta sin convertir una respuesta en una decisión automática.</p></div><div className="super-battery-badge"><span>Estado</span><strong>{hasSupabase ? "Conectable" : "Demo"}</strong><small>Supabase · Auth · DB · Storage</small></div></div>
      {mode === "home" && <div className="super-battery-entry-grid"><button type="button" className="super-battery-entry pink" onClick={() => setMode("recruiter")}><span>01 · Acceso privado</span><h3>Entrar como<br /><em>reclutador.</em></h3><p>Crea baterías, genera enlaces privados y revisa resultados individuales.</p><strong>Acceder al dashboard ↗</strong></button><div className="super-battery-entry blue" aria-label="Acceso de candidatura por enlace privado"><span>02 · Aplicación</span><h3>La candidatura<br /><em>recibe un enlace.</em></h3><p>La batería no es pública. Cada persona entra únicamente con el enlace y código generado por el reclutador.</p><strong>Acceso restringido</strong></div></div>}
      {mode === "recruiter" && <div className="super-battery-panel"><button className="super-battery-back" type="button" onClick={() => setMode("home")}>↖ Volver</button>{!recruiterToken && hasSupabase ? <form className="super-battery-login" onSubmit={recruiterLogin}><p className="section-label">Acceso protegido</p><h3>Espacio de <em>reclutamiento.</em></h3><label>Email<input type="email" value={recruiterEmail} onChange={(event) => setRecruiterEmail(event.target.value)} required autoComplete="email" /></label><label>Contraseña<input type="password" value={recruiterPassword} onChange={(event) => setRecruiterPassword(event.target.value)} required autoComplete="current-password" /></label><button className="super-battery-action" type="submit">Iniciar sesión ↗</button>{recruiterError && <p className="super-battery-error">{recruiterError}</p>}</form> : <div className="super-battery-dashboard"><div className="super-battery-dashboard-head"><div><p className="section-label">Dashboard de reclutador</p><h3>Configurar una <em>batería.</em></h3></div><button className="super-battery-back" type="button" onClick={() => { setRecruiterToken(""); setMode("home"); }}>Cerrar sesión</button></div><div className="super-battery-admin-grid"><section><p className="section-label">Nueva batería</p><label>Preset auditable<select value={selectedPresetId} onChange={(event) => selectPreset(event.target.value)}>{batteryPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></label><label>Nombre<input value={batteryName} onChange={(event) => setBatteryName(event.target.value)} /></label><label>Clasificación de puesto<select value={batteryClassification} onChange={(event) => setBatteryClassification(event.target.value)}>{["1-A", "1-B", "2-A", "2-B", "3-A", "3-B", "3-C", "3-D", "PSIC-CLIN-INF", "custom"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Tiempo total (minutos)<input type="number" min="1" max="240" value={batteryMinutes} onChange={(event) => setBatteryMinutes(event.target.value)} /></label><button className="super-battery-action" type="button" onClick={createBattery}>Crear batería ↗</button>{message && <p className="super-battery-feedback">{message}</p>}{shareLink && <div className="super-battery-share"><label>Enlace privado generado<input readOnly value={shareLink} /></label><button className="super-battery-small-action" type="button" onClick={copyShareLink}>Copiar enlace ↗</button></div>}</section><section><p className="section-label">Banco configurable</p><h4>{selectedTestIds.length} pruebas · {getBatteryItems(selectedTestIds).length} ítems</h4><p>La batería clínica infantil usa reactivos auditables y solo aparece en este dashboard.</p><ul>{batteryTestCatalog.map((test) => <li key={test.id}><label className="super-battery-test-toggle"><input type="checkbox" checked={selectedTestIds.includes(test.id)} onChange={() => setSelectedTestIds((current) => current.includes(test.id) ? current.filter((id) => id !== test.id) : [...current, test.id])} /><span>{test.name}</span><small>{test.itemIds.length} ítems</small></label></li>)}</ul></section></div><div className="super-battery-list"><div className="super-battery-list-head"><h4>Baterías disponibles</h4><span>{batteries.length}</span></div>{batteries.length ? batteries.map((battery) => <article key={battery.id}><div><strong>{battery.nombre}</strong><small>{battery.clasificacion_puesto} · {battery.tiempo_total_min} min</small></div><button className="super-battery-small-action" type="button" onClick={() => createCode(battery.id)}>Generar enlace ↗</button></article>) : <p>Aún no hay baterías en este espacio.</p>}</div><div className="super-battery-list"><div className="super-battery-list-head"><h4>Sesiones y resultados</h4><button className="super-battery-small-action" type="button" onClick={() => loadDashboard()}>Actualizar ↻</button></div>{demoCode && <p className="super-battery-feedback">Código demo: <strong>{demoCode}</strong></p>}{sessions.length ? sessions.map((session) => <article key={session.id}><div><strong>{session.codigo}</strong><small>{session.candidato_nombre ?? "Sin nombre capturado"} · {session.estado} · {formatDate(session.created_at)}</small></div>{session.estado === "completado" && <button className="super-battery-small-action" type="button" onClick={() => downloadPdf(session.id)}>Descargar PDF ↗</button>}</article>) : <p>No hay sesiones registradas todavía.</p>}</div></div>}</div>}
      {mode === "candidate" && <div className="super-battery-panel"><button className="super-battery-back" type="button" onClick={() => setMode("home")}>↖ Volver</button>{candidateStage === "access" && <form className="super-battery-candidate-form" onSubmit={startCandidate}><div><p className="section-label">Enlace privado · aplicación</p><h3>Tu aplicación <em>comienza aquí.</em></h3><p>Este enlace fue generado por el reclutador. Solo se conservarán los datos necesarios para identificar la sesión.</p></div><label>Código de aplicación<input value={candidateCode} onChange={(event) => setCandidateCode(event.target.value.toUpperCase())} placeholder="SB01-XXXXXXXX" required /></label><label>Nombre<input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} required /></label><label>Edad<input type="number" min="14" max="100" value={candidateAge} onChange={(event) => setCandidateAge(event.target.value)} required /></label><label>Empresa a la que aplicas<input value={candidateCompany} onChange={(event) => setCandidateCompany(event.target.value)} /></label><button className="super-battery-action" type="submit">Comenzar evaluación ↗</button>{candidateError && <p className="super-battery-error">{candidateError}</p>}</form>}{candidateStage === "quiz" && <div className="super-battery-quiz" onContextMenu={(event) => event.preventDefault()} onCopy={(event) => event.preventDefault()} onPaste={(event) => event.preventDefault()}><div className="super-battery-quiz-head"><div><p className="section-label">{candidateBatteryName} · {candidateCode}</p><h3>Responde desde tu <em>experiencia.</em></h3></div><div><strong>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</strong><small>tiempo restante</small></div></div><div className="super-battery-progress"><span style={{ width: `${progress}%` }} /></div>{evaluationDimensions.map((dimension) => <section key={dimension.id} className="super-battery-dimension"><p className="section-label">{dimension.shortLabel}</p><h4>{dimension.label}</h4>{candidateItems.filter((item) => item.dimension === dimension.id).map((item, index) => <article key={item.id}><small>{String(index + 1).padStart(2, "0")} · {item.type}</small><h5>{item.prompt}</h5><CandidateItem item={item} value={candidateResponses[item.id]} onChange={(answer) => setCandidateResponses((current) => ({ ...current, [item.id]: answer }))} /></article>)}</section>)}<div className="super-battery-quiz-foot"><p>{answered}/{candidateItems.length} respuestas</p><button className="super-battery-action" type="button" onClick={finishCandidate}>Enviar aplicación ↗</button></div>{candidateError && <p className="super-battery-error">{candidateError}</p>}</div>}{candidateStage === "thanks" && <div className="super-battery-thanks"><span>✳</span><h3>Gracias por <em>participar.</em></h3><p>{message || "Tu aplicación fue recibida."}</p><small>El equipo responsable revisará la información junto con el resto del proceso. Esta herramienta no toma decisiones automáticas.</small><button className="super-battery-action" type="button" onClick={resetCandidate}>Cerrar sesión de aplicación</button></div>}</div>}
    </section>
  );
}
