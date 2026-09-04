"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, FormEvent, KeyboardEvent, MouseEvent } from "react";
import { citationMissingFields, emptyCitation, formatApaReference, formatInTextCitation } from "@/lib/apa";
import type { Citation, CitationDraft, SourceType } from "@/lib/apa";

const STORAGE_KEY = "microrealidades:publication-draft:v1";

const STARTER_BODY = [
  "<p>Escribe aquí con tus propias palabras. El pegado está reservado para las citas que añadas desde el botón de la barra.</p>",
  "<h2>Introducción</h2>",
  "<p>Presenta el problema, el contexto y la pregunta que orienta este artículo.</p>",
  "<h2>Desarrollo</h2>",
  "<p>Construye el argumento por secciones. Usa los subtítulos para que cada idea encuentre su lugar.</p>",
  "<h2>Conclusiones</h2>",
  "<p>Recupera los hallazgos principales y abre las preguntas que siguen.</p>",
].join("");

const SOURCE_TYPES: Array<{ id: SourceType; label: string }> = [
  { id: "article", label: "Artículo de revista" },
  { id: "book", label: "Libro" },
  { id: "chapter", label: "Capítulo de libro" },
  { id: "webpage", label: "Página web" },
];

type DraftPayload = {
  title: string;
  subtitle: string;
  author: string;
  affiliation: string;
  abstract: string;
  keywords: string;
  contentHtml: string;
  citations: Citation[];
};

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function sanitizeArticleHtml(html: string) {
  if (typeof DOMParser === "undefined") return html;
  const document = new DOMParser().parseFromString(`<div id="article-root">${html}</div>`, "text/html");
  const root = document.getElementById("article-root");
  if (!root) return "";

  const allowedTags = new Set(["P", "H2", "H3", "STRONG", "B", "EM", "I", "BLOCKQUOTE", "CITE", "UL", "OL", "LI", "A", "BR", "SPAN"]);
  root.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const isCitationId = attribute.name === "data-citation-id";
      const isSafeHref = attribute.name === "href" && /^https?:\/\//i.test(attribute.value);
      if (!isCitationId && !isSafeHref) element.removeAttribute(attribute.name);
    });
  });

  return root.innerHTML;
}

function htmlToText(html: string) {
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]+>/g, " ");
  const document = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  return document.body.textContent || "";
}

function citationKey(citation: CitationDraft) {
  return `${citation.author.trim().toLowerCase()}|${citation.year.trim()}|${citation.title.trim().toLowerCase()}`;
}

function labelForSource(sourceType: SourceType) {
  return SOURCE_TYPES.find((source) => source.id === sourceType)?.label || "Fuente";
}

function FieldLabel({ children, optional = false }: { children: React.ReactNode; optional?: boolean }) {
  return <span className="publication-field-label">{children}{optional && <em> · opcional</em>}</span>;
}

function ToolbarButton({ label, title, onClick, children }: { label: string; title: string; onClick: () => void; children: React.ReactNode }) {
  function keepSelection(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  return <button className="publication-tool-button" type="button" aria-label={label} title={title} onMouseDown={keepSelection} onClick={onClick}>{children}</button>;
}

export function PublicationEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [contentHtml, setContentHtml] = useState(STARTER_BODY);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citationDraft, setCitationDraft] = useState<CitationDraft>(emptyCitation());
  const [citationOpen, setCitationOpen] = useState(false);
  const [citationError, setCitationError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewHtml, setPreviewHtml] = useState(STARTER_BODY);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const draft = JSON.parse(saved) as Partial<DraftPayload>;
          setTitle(typeof draft.title === "string" ? draft.title : "");
          setSubtitle(typeof draft.subtitle === "string" ? draft.subtitle : "");
          setAuthor(typeof draft.author === "string" ? draft.author : "");
          setAffiliation(typeof draft.affiliation === "string" ? draft.affiliation : "");
          setAbstract(typeof draft.abstract === "string" ? draft.abstract : "");
          setKeywords(typeof draft.keywords === "string" ? draft.keywords : "");
          setContentHtml(typeof draft.contentHtml === "string" ? sanitizeArticleHtml(draft.contentHtml) : STARTER_BODY);
          setCitations(Array.isArray(draft.citations) ? draft.citations as Citation[] : []);
          setFeedback("Borrador local recuperado.");
        }
      } catch {
        setFeedback("No pudimos recuperar el borrador local. Puedes comenzar uno nuevo.");
      } finally {
        setIsReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const timer = window.setTimeout(() => {
      const draft: DraftPayload = { title, subtitle, author, affiliation, abstract, keywords, contentHtml: sanitizeArticleHtml(contentHtml), citations };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        // The explicit save button communicates failures to the author.
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [abstract, affiliation, author, citations, contentHtml, isReady, keywords, subtitle, title]);

  useEffect(() => {
    if (!citationOpen) return;
    function closeWithEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setCitationOpen(false);
    }
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [citationOpen]);

  const references = useMemo(() => [...citations].sort((first, second) => citationKey(first).localeCompare(citationKey(second))), [citations]);
  const wordCount = useMemo(() => htmlToText(contentHtml).trim().split(/\s+/).filter(Boolean).length, [contentHtml]);
  const missingCitationFields = citationMissingFields(citationDraft);

  function blockClipboard(event: ClipboardEvent<HTMLElement>, action: string) {
    event.preventDefault();
    setFeedback(`${action} está reservado para el módulo de citas.`);
  }

  function blockDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setFeedback("Arrastrar texto está desactivado. Añade las fuentes desde Insertar cita.");
  }

  function blockBeforeInput(event: FormEvent<HTMLDivElement>) {
    const inputEvent = event.nativeEvent as globalThis.InputEvent;
    if (inputEvent.inputType === "insertFromPaste" || inputEvent.inputType === "insertFromDrop") {
      event.preventDefault();
      setFeedback("El pegado está reservado para el módulo de citas.");
    }
  }

  function updateBodyFromDom() {
    if (editorRef.current) setContentHtml(editorRef.current.innerHTML);
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateBodyFromDom();
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      runCommand("bold");
    }
    if (event.key.toLowerCase() === "i") {
      event.preventDefault();
      runCommand("italic");
    }
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    if (savedRange.current && editorRef.current?.contains(savedRange.current.commonAncestorContainer)) {
      selection.addRange(savedRange.current);
      return;
    }
    const range = document.createRange();
    if (editorRef.current) {
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.addRange(range);
    }
  }

  function openCitationDialog() {
    rememberSelection();
    setCitationDraft(emptyCitation());
    setCitationError("");
    setCitationOpen(true);
  }

  function updateCitation<K extends keyof CitationDraft>(field: K, value: CitationDraft[K]) {
    setCitationDraft((current) => ({ ...current, [field]: value }));
  }

  function handleCitationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = citationMissingFields(citationDraft);
    if (missing.length > 0) {
      setCitationError(`Completa: ${missing.join(", ")}.`);
      return;
    }

    const existing = citations.find((citation) => citationKey(citation) === citationKey(citationDraft));
    const citation = existing || { ...citationDraft, id: newId() };
    if (!existing) setCitations((current) => [...current, citation]);

    restoreSelection();
    const inline = escapeHtml(formatInTextCitation(citation));
    const citationMarkup = citation.quote.trim()
      ? `<blockquote data-citation-id="${citation.id}"><p>“${escapeHtml(citation.quote.trim())}”</p><cite>${inline}</cite></blockquote><p></p>`
      : `<span data-citation-id="${citation.id}">${inline}</span>`;
    document.execCommand("insertHTML", false, citationMarkup);
    updateBodyFromDom();
    setCitationOpen(false);
    setCitationDraft(emptyCitation());
    setFeedback(existing ? "Cita reutilizada e insertada en el texto." : "Cita insertada y referencia añadida al final.");
  }

  function draftPayload(safeContent = sanitizeArticleHtml(contentHtml)): DraftPayload {
    return { title, subtitle, author, affiliation, abstract, keywords, contentHtml: safeContent, citations };
  }

  function saveDraft() {
    const safeContent = sanitizeArticleHtml(contentHtml);
    setContentHtml(safeContent);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPayload(safeContent)));
      setFeedback("Borrador guardado en este dispositivo.");
    } catch {
      setFeedback("No pudimos guardar el borrador en este dispositivo.");
    }
  }

  function preparePreview() {
    const safeContent = sanitizeArticleHtml(contentHtml);
    const missing: string[] = [];
    if (!title.trim()) missing.push("título");
    if (wordCount < 20) missing.push("al menos 20 palabras en el cuerpo");
    if (citations.some((citation) => citationMissingFields(citation).length > 0)) missing.push("completar una referencia");
    if (missing.length > 0) {
      setFeedback(`Antes de revisar, completa: ${missing.join("; ")}.`);
      return;
    }
    setContentHtml(safeContent);
    setPreviewHtml(safeContent);
    setPreviewMode(true);
    setFeedback("Vista previa preparada. Este prototipo no publica en internet.");
  }

  function resetDraft() {
    if (!window.confirm("¿Restablecer el artículo de demostración y borrar el borrador local?")) return;
    setTitle("");
    setSubtitle("");
    setAuthor("");
    setAffiliation("");
    setAbstract("");
    setKeywords("");
    setContentHtml(STARTER_BODY);
    setCitations([]);
    setPreviewMode(false);
    window.localStorage.removeItem(STORAGE_KEY);
    setFeedback("Comenzaste un artículo nuevo.");
  }

  function blockedFieldProps() {
    return {
      onPaste: (event: ClipboardEvent<HTMLElement>) => blockClipboard(event, "Pegar"),
      onCopy: (event: ClipboardEvent<HTMLElement>) => blockClipboard(event, "Copiar"),
      onCut: (event: ClipboardEvent<HTMLElement>) => blockClipboard(event, "Cortar"),
      onDrop: (event: DragEvent<HTMLElement>) => blockDrop(event),
    };
  }

  function citationQuoteProps() {
    return {
      onCopy: (event: ClipboardEvent<HTMLElement>) => blockClipboard(event, "Copiar"),
      onCut: (event: ClipboardEvent<HTMLElement>) => blockClipboard(event, "Cortar"),
      onDrop: (event: DragEvent<HTMLElement>) => blockDrop(event),
    };
  }

  return (
    <section className="publication-studio" aria-labelledby="publication-editor-title">
      <div className="publication-welcome" aria-label="Bienvenida al estudio editorial">
        <div className="publication-welcome-mark" aria-hidden="true"><span /> <span /> <span /></div>
        <div className="publication-welcome-heading">
          <p className="section-label">Bienvenido</p>
          <h3>Queremos leerte <em>a ti.</em></h3>
        </div>
        <div className="publication-welcome-copy">
          <p>Este editor no permite copiar ni pegar textos externos; las citas académicas se agregan desde <strong>Insertar cita</strong> porque queremos leerte a ti.</p>
          <p>Escribe un ensayo de dos a tres cuartillas sobre un tema de psicología que te interese. Cuando esté listo, nosotros lo publicaremos.</p>
          <p className="publication-welcome-priority">Nuestra prioridad es la comunidad: un espacio hecho por psicólogos para psicólogos.</p>
        </div>
      </div>
      <div className="publication-studio-header">
        <div>
          <p className="section-label">Estudio editorial</p>
          <h2 id="publication-editor-title">Escribe con <em>cuidado.</em></h2>
          <p>Un lienzo simple para construir artículos de investigación con estructura, fuentes y una bibliografía que se ordena sola.</p>
        </div>
        <div className="publication-studio-status"><span aria-hidden="true" /> Borrador local · APA 7</div>
      </div>

      <div className="publication-editor-layout">
        <aside className="publication-meta-panel" aria-label="Información del artículo">
          <div className="publication-meta-panel-heading"><span>01</span><strong>Ficha del artículo</strong></div>
          <label><FieldLabel>Título del artículo</FieldLabel><input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Un título que oriente la lectura" maxLength={180} {...blockedFieldProps()} /></label>
          <label><FieldLabel optional>Subtítulo</FieldLabel><input type="text" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Una segunda línea para abrir el tema" maxLength={180} {...blockedFieldProps()} /></label>
          <div className="publication-meta-rule" />
          <label><FieldLabel>Autoría</FieldLabel><input type="text" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Apellido, Nombre" maxLength={120} {...blockedFieldProps()} /></label>
          <label><FieldLabel optional>Afiliación</FieldLabel><input type="text" value={affiliation} onChange={(event) => setAffiliation(event.target.value)} placeholder="Institución o proyecto" maxLength={180} {...blockedFieldProps()} /></label>
          <label><FieldLabel>Resumen</FieldLabel><textarea value={abstract} onChange={(event) => setAbstract(event.target.value)} placeholder="Explica en pocas líneas qué pregunta, argumento o hallazgo presenta el artículo." rows={6} maxLength={1000} {...blockedFieldProps()} /></label>
          <label><FieldLabel optional>Palabras clave</FieldLabel><input type="text" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="psicología, comunidad, tecnología" maxLength={180} {...blockedFieldProps()} /></label>
          <div className="publication-meta-help"><strong>Una regla sencilla</strong><p>Escribe el argumento; pega solo las citas desde el botón de la barra. El sistema no acepta texto externo directamente en el artículo.</p></div>
        </aside>

        <div className="publication-editor-column">
          <div className="publication-format-line"><span>Artículo científico · estructura flexible</span><span>{wordCount} palabras</span></div>
          {!previewMode ? (
            <div className="publication-paper">
              <div className="publication-paper-kicker">Microrealidades · Borrador</div>
              <div className="publication-paper-title-preview">{title || "El título aparecerá aquí"}</div>
              <div className="publication-paper-author-preview">{author || "Autoría pendiente"}{affiliation && ` · ${affiliation}`}</div>
              <div className="publication-editor-toolbar" role="toolbar" aria-label="Herramientas de formato">
                <ToolbarButton label="Negritas" title="Negritas (⌘/Ctrl + B)" onClick={() => runCommand("bold")}><strong>B</strong></ToolbarButton>
                <ToolbarButton label="Cursivas" title="Cursivas (⌘/Ctrl + I)" onClick={() => runCommand("italic")}><em>I</em></ToolbarButton>
                <span className="publication-tool-divider" aria-hidden="true" />
                <ToolbarButton label="Subtítulo nivel 2" title="Subtítulo nivel 2" onClick={() => runCommand("formatBlock", "<h2>")}>H2</ToolbarButton>
                <ToolbarButton label="Subtítulo nivel 3" title="Subtítulo nivel 3" onClick={() => runCommand("formatBlock", "<h3>")}>H3</ToolbarButton>
                <ToolbarButton label="Párrafo" title="Párrafo" onClick={() => runCommand("formatBlock", "<p>")}>¶</ToolbarButton>
                <span className="publication-tool-divider" aria-hidden="true" />
                <ToolbarButton label="Lista con viñetas" title="Lista con viñetas" onClick={() => runCommand("insertUnorderedList")}>•</ToolbarButton>
                <ToolbarButton label="Cita en bloque" title="Cita en bloque" onClick={() => runCommand("formatBlock", "<blockquote>")}>“</ToolbarButton>
                <span className="publication-tool-divider" aria-hidden="true" />
                <ToolbarButton label="Deshacer" title="Deshacer" onClick={() => runCommand("undo")}>↶</ToolbarButton>
                <ToolbarButton label="Rehacer" title="Rehacer" onClick={() => runCommand("redo")}>↷</ToolbarButton>
                <button className="publication-citation-button" type="button" onMouseDown={(event) => event.preventDefault()} onClick={openCitationDialog}><span aria-hidden="true">＋</span> Insertar cita</button>
              </div>
              <div
                ref={editorRef}
                className="publication-content-editor"
                contentEditable
                role="textbox"
                aria-label="Cuerpo del artículo"
                aria-multiline="true"
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: contentHtml }}
                onInput={handleEditorInput}
                onBeforeInput={blockBeforeInput}
                onPaste={(event) => blockClipboard(event, "Pegar")}
                onCopy={(event) => blockClipboard(event, "Copiar")}
                onCut={(event) => blockClipboard(event, "Cortar")}
                onDrop={blockDrop}
                onKeyDown={handleEditorKeyDown}
              />
              <div className="publication-reference-area" aria-labelledby="reference-title">
                <div className="publication-reference-heading"><span id="reference-title">Referencias</span><small>{references.length} {references.length === 1 ? "fuente" : "fuentes"}</small></div>
                {references.length === 0 ? <p className="publication-reference-empty">Las fuentes que insertes aparecerán aquí en formato APA 7.</p> : <ol className="publication-reference-list">{references.map((citation) => <li key={citation.id}>{formatApaReference(citation)}</li>)}</ol>}
              </div>
            </div>
          ) : (
            <article className="publication-preview-paper">
              <div className="publication-preview-topline"><span>Vista previa de publicación</span><button type="button" onClick={() => setPreviewMode(false)}>← Volver al editor</button></div>
              <p className="publication-preview-type">Artículo científico · APA 7</p>
              <h1>{title}</h1>
              {subtitle && <p className="publication-preview-subtitle">{subtitle}</p>}
              <p className="publication-preview-byline">{author || "Autoría pendiente"}{affiliation && ` · ${affiliation}`}</p>
              {abstract && <div className="publication-preview-abstract"><strong>Resumen</strong><p>{abstract}</p>{keywords && <small>Palabras clave: {keywords}</small>}</div>}
              <div className="publication-preview-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              <div className="publication-preview-references"><h2>Referencias</h2>{references.length === 0 ? <p>No hay referencias todavía.</p> : <ol>{references.map((citation) => <li key={citation.id}>{formatApaReference(citation)}</li>)}</ol>}</div>
            </article>
          )}
          <div className="publication-editor-actions">
            <button className="publication-quiet-action" type="button" onClick={resetDraft}>Nuevo artículo</button>
            <span className="publication-save-note">{isReady ? "Se guarda localmente mientras escribes" : "Preparando borrador…"}</span>
            <button className="publication-secondary-action" type="button" onClick={saveDraft}>Guardar borrador</button>
            <button className="publication-primary-action" type="button" onClick={preparePreview}>Revisar publicación <span aria-hidden="true">↗</span></button>
          </div>
          <p className="publication-feedback" aria-live="polite">{feedback}</p>
        </div>
      </div>

      {citationOpen && (
        <div className="citation-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCitationOpen(false); }}>
          <div className="citation-dialog" role="dialog" aria-modal="true" aria-labelledby="citation-dialog-title">
            <div className="citation-dialog-header"><div><p className="section-label">Fuente nueva</p><h2 id="citation-dialog-title">Insertar <em>cita.</em></h2></div><button className="citation-dialog-close" type="button" onClick={() => setCitationOpen(false)} aria-label="Cerrar ventana">×</button></div>
            <p className="citation-dialog-intro">Aquí sí puedes pegar el fragmento original. La fuente necesita datos suficientes para generar una referencia APA 7 confiable.</p>
            <form onSubmit={handleCitationSubmit}>
              <label><FieldLabel optional>Texto de la cita</FieldLabel><textarea autoFocus value={citationDraft.quote} onChange={(event) => updateCitation("quote", event.target.value)} placeholder="Pega aquí la cita literal…" rows={4} {...citationQuoteProps()} /></label>
              <div className="citation-form-grid">
                <label><FieldLabel>Tipo de fuente</FieldLabel><select value={citationDraft.sourceType} onChange={(event) => updateCitation("sourceType", event.target.value as SourceType)} {...blockedFieldProps()}>{SOURCE_TYPES.map((source) => <option value={source.id} key={source.id}>{source.label}</option>)}</select></label>
                <label><FieldLabel>Autoría</FieldLabel><input type="text" value={citationDraft.author} onChange={(event) => updateCitation("author", event.target.value)} placeholder="Apellido, N. N." {...blockedFieldProps()} /></label>
                <label><FieldLabel>Año</FieldLabel><input type="text" inputMode="numeric" value={citationDraft.year} onChange={(event) => updateCitation("year", event.target.value)} placeholder="2026" maxLength={4} {...blockedFieldProps()} /></label>
                <label><FieldLabel optional>Página o párrafo</FieldLabel><input type="text" value={citationDraft.page} onChange={(event) => updateCitation("page", event.target.value)} placeholder="18 o párr. 4" {...blockedFieldProps()} /></label>
                <label className="citation-form-wide"><FieldLabel>Título de la fuente</FieldLabel><input type="text" value={citationDraft.title} onChange={(event) => updateCitation("title", event.target.value)} placeholder="Título del artículo, capítulo o página" {...blockedFieldProps()} /></label>
                {(citationDraft.sourceType === "article" || citationDraft.sourceType === "chapter" || citationDraft.sourceType === "webpage") && <label className="citation-form-wide"><FieldLabel>{citationDraft.sourceType === "article" ? "Revista" : citationDraft.sourceType === "chapter" ? "Libro o compilación" : "Sitio web"}</FieldLabel><input type="text" value={citationDraft.containerTitle} onChange={(event) => updateCitation("containerTitle", event.target.value)} placeholder={citationDraft.sourceType === "article" ? "Nombre de la revista" : "Nombre de la publicación"} {...blockedFieldProps()} /></label>}
                {citationDraft.sourceType === "article" && <><label><FieldLabel optional>Volumen</FieldLabel><input type="text" value={citationDraft.volume} onChange={(event) => updateCitation("volume", event.target.value)} placeholder="12" {...blockedFieldProps()} /></label><label><FieldLabel optional>Número</FieldLabel><input type="text" value={citationDraft.issue} onChange={(event) => updateCitation("issue", event.target.value)} placeholder="2" {...blockedFieldProps()} /></label><label><FieldLabel optional>Páginas</FieldLabel><input type="text" value={citationDraft.pages} onChange={(event) => updateCitation("pages", event.target.value)} placeholder="30–46" {...blockedFieldProps()} /></label></>}
                {(citationDraft.sourceType === "book" || citationDraft.sourceType === "chapter") && <label className="citation-form-wide"><FieldLabel>{citationDraft.sourceType === "book" ? "Editorial" : "Editorial o institución"}</FieldLabel><input type="text" value={citationDraft.publisher} onChange={(event) => updateCitation("publisher", event.target.value)} placeholder="Editorial o institución" {...blockedFieldProps()} /></label>}
                <label><FieldLabel optional>DOI</FieldLabel><input type="text" value={citationDraft.doi} onChange={(event) => updateCitation("doi", event.target.value)} placeholder="10.xxxx/xxxxx" {...blockedFieldProps()} /></label>
                <label><FieldLabel optional>URL</FieldLabel><input type="url" value={citationDraft.url} onChange={(event) => updateCitation("url", event.target.value)} placeholder="https://…" {...blockedFieldProps()} /></label>
              </div>
              <div className="citation-live-preview"><span>Vista previa</span><strong>{formatInTextCitation(citationDraft)}</strong><p>{labelForSource(citationDraft.sourceType)} · {citationDraft.title || "Título pendiente"}</p></div>
              {missingCitationFields.length > 0 && <p className="citation-dialog-field-note">Campos pendientes: {missingCitationFields.join(", ")}.</p>}
              {citationError && <p className="citation-dialog-error" role="alert">{citationError}</p>}
              <div className="citation-dialog-actions"><button className="publication-quiet-action" type="button" onClick={() => setCitationOpen(false)}>Cancelar</button><button className="publication-primary-action" type="submit">Insertar en el artículo <span aria-hidden="true">↗</span></button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );

  function handleEditorInput(event: FormEvent<HTMLDivElement>) {
    setContentHtml(event.currentTarget.innerHTML);
  }
}
