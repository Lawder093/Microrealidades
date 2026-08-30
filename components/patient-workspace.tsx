"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type PatientTab = "summary" | "profile" | "sessions" | "plan" | "documents";

const tabs: Array<{ id: PatientTab; label: string; shortLabel: string }> = [
  { id: "summary", label: "Resumen", shortLabel: "01" },
  { id: "profile", label: "Datos del paciente", shortLabel: "02" },
  { id: "sessions", label: "Sesiones y notas", shortLabel: "03" },
  { id: "plan", label: "Plan y objetivos", shortLabel: "04" },
  { id: "documents", label: "Documentos", shortLabel: "05" },
];

const coverage = [
  "Identificación y contacto",
  "Antecedentes y contexto",
  "Evaluación clínica",
  "Sesiones y notas",
  "Plan y objetivos",
  "Consentimientos",
  "Documentos y archivos",
  "Permisos y auditoría",
];

const recentActivity = [
  { date: "14 JUN 2026", label: "Sesión de seguimiento", detail: "Nota de evolución · 45 min", tone: "pink" },
  { date: "07 JUN 2026", label: "Plan actualizado", detail: "Objetivos revisados con el paciente", tone: "blue" },
  { date: "31 MAY 2026", label: "Primera sesión", detail: "Registro inicial · 60 min", tone: "yellow" },
];

function TabButton({ tab, active, onSelect }: { tab: (typeof tabs)[number]; active: boolean; onSelect: () => void }) {
  return (
    <button className={`patient-tab${active ? " active" : ""}`} type="button" role="tab" aria-selected={active} onClick={onSelect}>
      <span>{tab.shortLabel}</span>
      {tab.label}
    </button>
  );
}

function Field({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="patient-field">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Panel({ eyebrow, title, children, className = "" }: { eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`patient-panel ${className}`}>
      <p className="section-label">{eyebrow}</p>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function PatientWorkspace() {
  const [activeTab, setActiveTab] = useState<PatientTab>("summary");

  function openTab(tab: PatientTab) {
    setActiveTab(tab);
  }

  return (
    <section className="patient-module" aria-labelledby="patient-module-title">
      <div className="patient-safety-banner">
        <span className="patient-safety-mark" aria-hidden="true">!</span>
        <div>
          <strong>Prototipo de interfaz · datos simulados</strong>
          <p>MicroHub es público y esta pantalla no guarda información. No introduzcas datos reales de pacientes hasta contar con login, permisos, cifrado, aviso de privacidad y revisión profesional.</p>
        </div>
        <span className="patient-demo-badge">DEMO</span>
      </div>

      <div className="patient-workspace">
        <aside className="patient-sidebar" aria-label="Navegación del expediente">
          <div className="patient-selector">
            <span className="patient-avatar" aria-hidden="true">PD</span>
            <div>
              <strong>Paciente de prueba</strong>
              <span>ID DEMO-0001</span>
            </div>
            <span className="patient-chevron" aria-hidden="true">⌄</span>
          </div>
          <div className="patient-sidebar-rule" />
          <p className="section-label">Expediente</p>
          <div className="patient-tabs" role="tablist" aria-label="Secciones del expediente">
            {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onSelect={() => openTab(tab.id)} />)}
          </div>
          <div className="patient-sidebar-footer">
            <span className="patient-status-dot" aria-hidden="true" />
            <div><strong>Privacidad primero</strong><p>El acceso se definirá antes de usar información real.</p></div>
          </div>
        </aside>

        <div className="patient-main" role="tabpanel" aria-label={tabs.find((tab) => tab.id === activeTab)?.label}>
          <div className="patient-main-header">
            <div>
              <p className="section-label">Expediente · Demo</p>
              <h2 id="patient-module-title">Paciente <em>de prueba.</em></h2>
              <p className="patient-subtitle">Una vista única para orientarte en la historia, el presente y los próximos pasos de acompañamiento.</p>
            </div>
            <button className="patient-primary-action" type="button" onClick={() => openTab("sessions")}>Nueva sesión <span aria-hidden="true">↗</span></button>
          </div>

          {activeTab === "summary" && (
            <div className="patient-view">
              <div className="patient-metrics" aria-label="Indicadores del expediente">
                <div><span>Estado</span><strong>Activo</strong><small>Demo · no clínico</small></div>
                <div><span>Última actividad</span><strong>14 JUN</strong><small>Sesión de seguimiento</small></div>
                <div><span>Sesiones</span><strong>03</strong><small>Registros simulados</small></div>
                <div><span>Tareas abiertas</span><strong>02</strong><small>Por configurar</small></div>
              </div>
              <div className="patient-summary-grid">
                <Panel eyebrow="Línea de tiempo" title="Actividad reciente" className="patient-timeline">
                  <div className="patient-activity-list">
                    {recentActivity.map((item) => (
                      <button className="patient-activity" type="button" key={item.date} onClick={() => openTab("sessions")}>
                        <span className={`patient-activity-mark ${item.tone}`} aria-hidden="true" />
                        <span><small>{item.date}</small><strong>{item.label}</strong><em>{item.detail}</em></span>
                        <span className="patient-activity-arrow" aria-hidden="true">→</span>
                      </button>
                    ))}
                  </div>
                  <button className="patient-text-action" type="button" onClick={() => openTab("sessions")}>Ver todas las sesiones <span aria-hidden="true">↗</span></button>
                </Panel>
                <Panel eyebrow="Ficha rápida" title="Lo esencial, a la mano." className="patient-quick-view">
                  <div className="patient-field-stack">
                    <Field label="Motivo de consulta" value="Sin capturar" note="Campo pendiente de configuración" />
                    <Field label="Próxima sesión" value="Por definir" note="Se añadirá al activar agenda" />
                    <Field label="Consentimiento" value="Pendiente" note="Debe existir antes de usar datos reales" />
                  </div>
                  <button className="patient-text-action" type="button" onClick={() => openTab("profile")}>Abrir ficha completa <span aria-hidden="true">↗</span></button>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="patient-view">
              <Panel eyebrow="Datos del paciente" title="Una ficha clara, sin ruido." className="patient-detail-panel">
                <p className="patient-panel-intro">La ficha debe reunir solo los datos necesarios para la atención y separar identificación, contacto, contexto y consentimientos.</p>
                <div className="patient-fields-grid">
                  <Field label="Nombre completo" value="No capturado" note="Se definirá con control de acceso" />
                  <Field label="Identificador interno" value="DEMO-0001" note="No usar CURP como identificador visible" />
                  <Field label="Fecha de nacimiento" value="No capturada" />
                  <Field label="Pronombres / identidad" value="No capturado" />
                  <Field label="Contacto preferente" value="No capturado" />
                  <Field label="Contacto de emergencia" value="No capturado" />
                  <Field label="Antecedentes relevantes" value="No capturados" />
                  <Field label="Alergias / alertas" value="No configuradas" />
                </div>
                <div className="patient-note-box"><strong>Decisión de diseño</strong><p>Los campos sensibles deben ser opcionales cuando no sean necesarios, con trazabilidad de quién los consultó o modificó.</p></div>
              </Panel>
            </div>
          )}

          {activeTab === "sessions" && (
            <div className="patient-view">
              <Panel eyebrow="Sesiones y notas" title="Registrar con contexto." className="patient-detail-panel">
                <p className="patient-panel-intro">Cada sesión debe conservar fecha, duración, profesional responsable, nota de evolución, acuerdos y próximos pasos, con historial de cambios.</p>
                <div className="patient-session-list">
                  <article><div><small>14 JUN 2026 · 45 MIN</small><h4>Sesión de seguimiento</h4></div><span className="patient-tag pink">Nota demo</span><p>Registro simulado para mostrar la jerarquía de una nota. No corresponde a una persona real.</p></article>
                  <article><div><small>07 JUN 2026 · 45 MIN</small><h4>Revisión de objetivos</h4></div><span className="patient-tag blue">Plan</span><p>Se revisan objetivos y acuerdos con el paciente. Contenido demostrativo.</p></article>
                  <article><div><small>31 MAY 2026 · 60 MIN</small><h4>Primera sesión</h4></div><span className="patient-tag yellow">Inicial</span><p>Ejemplo de estructura para una primera nota de sesión.</p></article>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "plan" && (
            <div className="patient-view">
              <Panel eyebrow="Plan y objetivos" title="Acompañar el proceso." className="patient-detail-panel">
                <p className="patient-panel-intro">Los objetivos se deben acordar con el paciente, tener responsable, fecha de revisión y un estado visible; el sistema no debe inferir diagnósticos.</p>
                <div className="patient-goal-list">
                  <article><span>01</span><div><h4>Objetivo de trabajo</h4><p>Descripción pendiente de acordar con el paciente.</p></div><small>En diseño</small></article>
                  <article><span>02</span><div><h4>Acuerdo de seguimiento</h4><p>Próxima revisión pendiente de calendarizar.</p></div><small>En diseño</small></article>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="patient-view">
              <Panel eyebrow="Documentos" title="Todo en su lugar." className="patient-detail-panel">
                <p className="patient-panel-intro">Más adelante aquí podrán vivir consentimientos, referencias y archivos compartidos, con límites de acceso y registro de actividad.</p>
                <div className="patient-empty-state"><span aria-hidden="true">✳</span><strong>Aún no hay documentos de demostración.</strong><p>La carga de archivos se activará únicamente cuando exista almacenamiento seguro y control de permisos.</p></div>
              </Panel>
            </div>
          )}
        </div>
      </div>

      <div className="patient-coverage">
        <div><p className="section-label">Arquitectura del expediente</p><h3>La información que vamos a ordenar.</h3></div>
        <div className="patient-coverage-grid">
          {coverage.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
        </div>
      </div>
    </section>
  );
}
