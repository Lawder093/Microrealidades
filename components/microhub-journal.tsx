"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type JournalEntry = {
  id: string;
  date: string;
  title: string;
  experience: string;
  feelings: string;
  nextStep: string;
};

const STORAGE_KEY = "microrealidades:microhub:journal";

function localToday() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MicrohubJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [feelings, setFeelings] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [message, setMessage] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setEntries(JSON.parse(saved) as JournalEntry[]);
      } catch {
        setMessage("No pudimos leer este dispositivo. Puedes continuar, pero esta sesión no se guardará.");
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function persist(nextEntries: JournalEntry[]) {
    setEntries(nextEntries);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
    } catch {
      setMessage("No pudimos guardar en este dispositivo. Revisa el espacio disponible o la configuración de privacidad del navegador.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanExperience = experience.trim();
    if (!cleanExperience) {
      setMessage("Cuéntanos al menos qué quieres recordar de esta experiencia.");
      return;
    }

    const nextEntries = [
      { id: newId(), date: date || localToday(), title: title.trim(), experience: cleanExperience, feelings: feelings.trim(), nextStep: nextStep.trim() },
      ...entries,
    ];
    persist(nextEntries);
    setTitle("");
    setExperience("");
    setFeelings("");
    setNextStep("");
    setMessage("Guardado en este dispositivo.");
  }

  function removeEntry(id: string) {
    persist(entries.filter((entry) => entry.id !== id));
    setMessage("Entrada eliminada de este dispositivo.");
  }

  function clearEntries() {
    if (!window.confirm("¿Borrar todas las entradas guardadas en este dispositivo?")) return;
    persist([]);
    setMessage("La bitácora quedó vacía.");
  }

  return (
    <div className="journal-shell">
      <div className="journal-notice">
        <span className="journal-notice-mark" aria-hidden="true">i</span>
        <div>
          <strong>Bitácora de autoobservación</strong>
          <p>Esta herramienta guarda tus notas únicamente en este dispositivo. No realiza diagnósticos, tratamientos ni seguimiento clínico; no es un expediente clínico ni sustituye a tu profesional de salud.</p>
          <p className="journal-warning">Evita escribir nombres completos, diagnósticos, teléfonos u otros datos que identifiquen a alguien, especialmente si compartes el dispositivo.</p>
        </div>
      </div>

      <div className="journal-layout">
        <form className="journal-form" onSubmit={handleSubmit}>
          <div className="journal-form-heading">
            <p className="section-label">Nueva entrada</p>
            <h2>Volver a<br /><em>lo vivido.</em></h2>
          </div>
          <label>Fecha<input type="date" value={date ?? (isReady ? localToday() : "")} onChange={(event) => setDate(event.target.value)} disabled={!isReady} /></label>
          <label>Un título para este momento <span>(opcional)</span><input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Después de la sesión..." maxLength={120} /></label>
          <label>¿Qué quieres recordar? <textarea required value={experience} onChange={(event) => setExperience(event.target.value)} placeholder="Escribe con tus propias palabras qué pasó, qué apareció o qué te llevas." rows={6} /></label>
          <label>¿Qué emociones o sensaciones reconoces? <span>(opcional)</span><textarea value={feelings} onChange={(event) => setFeelings(event.target.value)} placeholder="Sin tener que explicarlo todo..." rows={4} /></label>
          <label>¿Qué quieres observar o cuidar después? <span>(opcional)</span><textarea value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Una pregunta, un gesto, un límite..." rows={4} /></label>
          <button className="journal-submit" type="submit" disabled={!isReady}>Guardar entrada <span aria-hidden="true">↗</span></button>
          <p className="journal-feedback" aria-live="polite">{message}</p>
        </form>

        <section className="journal-entries" aria-labelledby="entries-title">
          <div className="journal-entries-heading"><div><p className="section-label">Tu archivo</p><h2 id="entries-title">Entradas <span>{entries.length}</span></h2></div>{entries.length > 0 && <button className="journal-clear" type="button" onClick={clearEntries}>Borrar todas</button>}</div>
          {entries.length === 0 ? (
            <div className="journal-empty"><span aria-hidden="true">✳</span><p>Aquí aparecerán tus notas. Este archivo vive en tu dispositivo y solo tú puedes verlo desde este navegador.</p></div>
          ) : (
            <div className="journal-entry-list">
              {entries.map((entry) => (
                <article className="journal-entry" key={entry.id}>
                  <div className="journal-entry-meta"><time dateTime={entry.date}>{entry.date}</time><button type="button" onClick={() => removeEntry(entry.id)} aria-label={`Eliminar ${entry.title || "esta entrada"}`}>Eliminar</button></div>
                  {entry.title && <h3>{entry.title}</h3>}
                  <p>{entry.experience}</p>
                  {entry.feelings && <div><small>Emociones y sensaciones</small><p>{entry.feelings}</p></div>}
                  {entry.nextStep && <div><small>Para observar o cuidar</small><p>{entry.nextStep}</p></div>}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
