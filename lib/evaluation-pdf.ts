export type EvaluationPdfDimension = {
  dimension: string;
  score: number | null;
  answered: number;
  total: number;
};

export type EvaluationPdfInterpretation = {
  title: string;
  text: string;
};

export type EvaluationPdfSubarea = {
  label: string;
  score: number | null;
  correct?: number;
  total?: number;
};

export type EvaluationPdfTest = {
  id: string;
  title: string;
  kind: "likert" | "knowledge" | "profile";
  score: number | null;
  answered: number;
  total: number;
  correct?: number;
  correctTotal?: number;
  band?: string | null;
  subareas: EvaluationPdfSubarea[];
  interpretation?: string;
  durationSeconds?: number;
  validityAlerts?: string[];
};

export type EvaluationPdfReport = {
  code: string;
  classification?: string;
  candidateName: string | null;
  candidateAge: number | null;
  candidateCompany: string | null;
  completedAt: string | null;
  folioHash?: string;
  globalScore?: number | null;
  executiveSummary?: string;
  dimensions?: EvaluationPdfDimension[];
  tests?: EvaluationPdfTest[];
  interpretations?: EvaluationPdfInterpretation[];
  timedOut?: boolean;
};

type PdfColor = readonly [number, number, number];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 52;
const CONTENT_WIDTH = 508;
const DARK: PdfColor = [0.12, 0.12, 0.14];
const MUTED: PdfColor = [0.42, 0.42, 0.43];
const RULE: PdfColor = [0.85, 0.84, 0.82];
const PINK: PdfColor = [0.86, 0.17, 0.39];
const PALE: PdfColor = [0.96, 0.95, 0.92];
const RED: PdfColor = [0.68, 0.22, 0.24];
const YELLOW: PdfColor = [0.65, 0.47, 0.08];
const GREEN: PdfColor = [0.18, 0.43, 0.32];

const winAnsiCodes: Record<string, number> = {
  "á": 0xe1, "é": 0xe9, "í": 0xed, "ó": 0xf3, "ú": 0xfa, "ü": 0xfc, "ñ": 0xf1,
  "Á": 0xc1, "É": 0xc9, "Í": 0xcd, "Ó": 0xd3, "Ú": 0xda, "Ü": 0xdc, "Ñ": 0xd1,
  "¿": 0xbf, "¡": 0xa1, "·": 0xb7, "—": 0x97, "–": 0x96, "“": 0x93, "”": 0x94,
  "‘": 0x91, "’": 0x92, "…": 0x85,
};

function toWinAnsiHex(value: string) {
  return Array.from(value).map((character) => {
    const code = winAnsiCodes[character] ?? character.codePointAt(0) ?? 0x3f;
    const safeCode = code <= 0xff && (code >= 0x20 || code === 0x09) ? code : 0x3f;
    return safeCode.toString(16).padStart(2, "0");
  }).join("");
}

function wrapText(value: string, width: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if (`${current} ${word}`.length <= width) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function labelFor(value: string) {
  const labels: Record<string, string> = {
    cleaver_disc: "Cleaver-DISC · comportamiento profesional",
    dieciseis_factores: "Dieciséis factores · perfil de trabajo",
    personalidad_trabajo: "Personalidad y estilo de trabajo",
    etica_profesionalismo: "Ética y profesionalismo",
    habilidades_conocimientos: "Habilidades y conocimientos",
    relacion_terapeutica: "Relación terapéutica",
    conocimientos_autismo: "Conocimientos en autismo",
    estabilidad_emocional: "Estabilidad emocional",
    empatia_calidez: "Empatía y calidez",
    organizacion_metodo: "Organización y método",
    flexibilidad_cognitiva: "Flexibilidad cognitiva",
    motivacion_servicio: "Motivación de servicio",
    confidencialidad: "Confidencialidad",
    consentimiento_informado: "Consentimiento informado",
    limites_profesionales: "Límites profesionales",
    competencia_profesional: "Competencia profesional",
    documentacion: "Documentación",
    reportes_obligatorios: "Reportes obligatorios",
    conflictos_interes: "Conflictos de interés",
    diversidad_cultural: "Diversidad cultural",
    evaluacion_situada: "Evaluación situada",
    comunicacion: "Comunicación",
    supervision: "Supervisión",
    intervencion_respetuosa: "Intervención respetuosa",
    alianza_terapeutica: "Alianza terapéutica",
    manejo_rupturas: "Manejo de rupturas",
    trabajo_familia: "Trabajo con la familia",
    limites_calidez: "Límites y calidez",
    contratransferencia: "Contratransferencia",
    empatia_escucha: "Empatía y escucha",
    colaboracion_interdisciplinaria: "Colaboración interdisciplinaria",
    autocuidado_terapeuta: "Autocuidado del terapeuta",
    criterios_diagnosticos: "Criterios diagnósticos",
    deteccion_temprana: "Detección temprana",
    comorbilidades: "Comorbilidades",
    comunicacion_lenguaje: "Comunicación y lenguaje",
    sensorial_motor: "Procesamiento sensorial y motor",
    intervencion_evidencia: "Intervención y evidencia",
    familia_derechos: "Familia y derechos",
    neurodiversidad: "Neurodiversidad",
  };
  return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function textCommand(value: string, x: number, y: number, size: number, color: PdfColor = DARK, bold = false) {
  const [red, green, blue] = color;
  return `${red} ${green} ${blue} rg BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${y} Tm <${toWinAnsiHex(value)}> Tj ET`;
}

function rectCommand(x: number, y: number, width: number, height: number, color: PdfColor) {
  const [red, green, blue] = color;
  return `${red} ${green} ${blue} rg ${x} ${y} ${width} ${height} re f`;
}

function lineCommand(x1: number, y1: number, x2: number, y2: number, color: PdfColor = RULE, width = 0.8) {
  const [red, green, blue] = color;
  return `${red} ${green} ${blue} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function drawParagraph(ops: string[], value: string, x: number, y: number, width: number, size = 10, leading = 15, color: PdfColor = DARK) {
  const maxCharacters = Math.max(12, Math.floor(width / (size * 0.52)));
  const lines = wrapText(value, maxCharacters);
  for (const line of lines) {
    ops.push(textCommand(line, x, y, size, color));
    y -= leading;
  }
  return y;
}

function displayBand(band: string | null | undefined) {
  if (band === "insuficiente") return { label: "Insuficiente · referencial", color: RED };
  if (band === "aceptable") return { label: "Aceptable · referencial", color: YELLOW };
  if (band === "solido" || band === "sólido") return { label: "Sólido · referencial", color: GREEN };
  return null;
}

function scoreColor(score: number | null, kind: EvaluationPdfTest["kind"]): PdfColor {
  if (score === null) return MUTED;
  if (kind === "knowledge") return score < 70 ? RED : score < 85 ? YELLOW : GREEN;
  if (kind === "likert") return score >= 71 ? GREEN : score >= 40 ? YELLOW : RED;
  return PINK;
}

function scoreBar(ops: string[], label: string, score: number | null, x: number, y: number, width: number, kind: EvaluationPdfTest["kind"], detail = "") {
  ops.push(textCommand(label, x, y, 9, DARK, true));
  if (detail) ops.push(textCommand(detail, x + width - 145, y, 8, MUTED));
  ops.push(textCommand(score === null ? "Sin datos" : `${Math.round(score)}%`, x + width - 48, y, 9, DARK, true));
  const barY = y - 12;
  ops.push(rectCommand(x, barY, width, 5, PALE));
  if (score !== null) ops.push(rectCommand(x, barY, width * Math.max(0, Math.min(100, score)) / 100, 5, scoreColor(score, kind)));
  return y - 27;
}

function addHeader(ops: string[], title: string, pageNumber: number, pageCount: number) {
  ops.push(rectCommand(LEFT, 758, 36, 3, PINK));
  ops.push(textCommand("MICROREALIDADES", LEFT, 741, 9, DARK, true));
  ops.push(textCommand("EVALUACIÓN · REPORTE CONFIDENCIAL", PAGE_WIDTH - LEFT - 208, 741, 8, MUTED));
  ops.push(lineCommand(LEFT, 727, PAGE_WIDTH - LEFT, 727));
  ops.push(textCommand(title, LEFT, 700, 17, DARK, true));
  ops.push(lineCommand(LEFT, 46, PAGE_WIDTH - LEFT, 46));
  ops.push(textCommand("Documento orientativo · No es diagnóstico ni decisión automática", LEFT, 30, 8, MUTED));
  ops.push(textCommand(`${pageNumber} / ${pageCount}`, PAGE_WIDTH - LEFT - 36, 30, 8, MUTED));
}

function makeSummaryPage(report: EvaluationPdfReport, tests: EvaluationPdfTest[], pageNumber: number, pageCount: number) {
  const ops: string[] = [];
  addHeader(ops, "Reporte de evaluación psicométrica", pageNumber, pageCount);
  ops.push(textCommand(`Microtalento · ${report.classification || "Evaluación configurable"}`, LEFT, 679, 10, PINK, true));

  const cardY = 550;
  ops.push(rectCommand(LEFT, cardY, CONTENT_WIDTH, 108, PALE));
  ops.push(textCommand("DATOS DE LA APLICACIÓN", LEFT + 14, cardY + 88, 8, MUTED, true));
  const metaLeft = LEFT + 14;
  const metaRight = LEFT + 266;
  ops.push(textCommand(`Folio: ${report.code}`, metaLeft, cardY + 67, 10, DARK, true));
  ops.push(textCommand(`Candidato: ${report.candidateName || "No capturado"}`, metaLeft, cardY + 48, 9, DARK));
  ops.push(textCommand(`Edad: ${report.candidateAge ?? "No capturada"}`, metaLeft, cardY + 29, 9, DARK));
  ops.push(textCommand(`Empresa: ${report.candidateCompany || "No capturada"}`, metaRight, cardY + 48, 9, DARK));
  ops.push(textCommand(`Finalizada: ${report.completedAt || "Sin fecha"}`, metaRight, cardY + 29, 9, DARK));
  if (report.folioHash) ops.push(textCommand(`Folio SHA-256 · datos de evaluación: ${report.folioHash}`, metaLeft, cardY + 10, 7, MUTED));

  const scoreY = 486;
  const objectiveScores = tests.filter((test) => test.kind === "knowledge" && test.score !== null).map((test) => test.score as number);
  const globalScore = objectiveScores.length
    ? Math.round(objectiveScores.reduce((sum, score) => sum + score, 0) / objectiveScores.length)
    : report.globalScore;
  const scoreLabel = objectiveScores.length ? `PROMEDIO DE PRUEBAS OBJETIVAS (${objectiveScores.length})` : "PUNTAJE GLOBAL DESCRIPTIVO";
  ops.push(textCommand(scoreLabel, LEFT, scoreY, 8, MUTED, true));
  ops.push(textCommand(globalScore == null ? "—" : `${Math.round(globalScore)}`, LEFT, scoreY - 41, 31, DARK, true));
  ops.push(textCommand(globalScore == null ? "Sin datos" : "/100", LEFT + 57, scoreY - 39, 12, MUTED));
  ops.push(textCommand(objectiveScores.length ? "Media de las pruebas objetivas contestadas; referencia descriptiva." : "Promedio descriptivo de las pruebas incluidas.", LEFT + 136, scoreY - 22, 9, MUTED));
  if (objectiveScores.length && globalScore !== null && globalScore !== undefined) {
    const globalBand = displayBand(globalScore < 70 ? "insuficiente" : globalScore < 85 ? "aceptable" : "solido");
    if (globalBand) {
      ops.push(rectCommand(LEFT + 136, scoreY - 54, 139, 22, globalBand.color));
      ops.push(textCommand(globalBand.label, LEFT + 143, scoreY - 46, 8, [1, 1, 1], true));
    }
  }
  if (report.timedOut) {
    ops.push(rectCommand(LEFT + 136, scoreY - 81, CONTENT_WIDTH - 136, 20, [0.99, 0.94, 0.92]));
    ops.push(textCommand("Aplicación finalizada por tiempo; los resultados pueden ser parciales.", LEFT + 145, scoreY - 74, 8, RED));
  }

  const validityAlertCount = tests.reduce((sum, test) => sum + (test.validityAlerts?.length ?? 0), 0);
  let y = 395;
  ops.push(textCommand("RESUMEN EJECUTIVO", LEFT, y, 8, MUTED, true));
  if (validityAlertCount) ops.push(textCommand(`${validityAlertCount} señal(es) descriptiva(s) · ver páginas por prueba`, PAGE_WIDTH - LEFT - 190, y, 7, RED));
  const summary = objectiveScores.length
    ? `El promedio de las ${objectiveScores.length} pruebas objetivas incluidas es ${globalScore}/100. Es un resumen descriptivo de respuestas correctas; requiere revisión profesional y contraste con entrevista y contexto del puesto.`
    : report.executiveSummary || "Los resultados describen las respuestas observadas y deben revisarse junto con entrevista, antecedentes relevantes y criterio profesional.";
  y = drawParagraph(ops, summary, LEFT, y - 19, CONTENT_WIDTH, 10, 15);
  y -= 9;
  ops.push(lineCommand(LEFT, y, PAGE_WIDTH - LEFT, y));
  y -= 22;
  ops.push(textCommand("RESULTADOS POR PRUEBA", LEFT, y, 8, MUTED, true));
  y -= 20;
  if (tests.length) {
    for (const test of tests) {
      if (y < 82) break;
      y = scoreBar(ops, labelFor(test.id), test.score, LEFT, y, CONTENT_WIDTH, test.kind, `${test.answered}/${test.total} respuestas`);
    }
  } else {
    for (const dimension of report.dimensions ?? []) {
      if (y < 82) break;
      y = scoreBar(ops, labelFor(dimension.dimension), dimension.score, LEFT, y, CONTENT_WIDTH, "profile", `${dimension.answered}/${dimension.total} respuestas`);
    }
  }
  return ops;
}

function makeTestPage(test: EvaluationPdfTest, index: number, pageNumber: number, pageCount: number) {
  const ops: string[] = [];
  addHeader(ops, labelFor(test.id), pageNumber, pageCount);
  const durationLabel = test.durationSeconds === undefined ? "" : ` · ${Math.floor(test.durationSeconds / 60)}:${String(test.durationSeconds % 60).padStart(2, "0")} min`;
  ops.push(textCommand(`PRUEBA ${String(index).padStart(2, "0")} · ${test.answered}/${test.total} RESPUESTAS${durationLabel}`, LEFT, 679, 8, PINK, true));

  const scoreY = 625;
  ops.push(rectCommand(LEFT, scoreY - 20, CONTENT_WIDTH, 66, PALE));
  ops.push(textCommand(test.score === null ? "—" : `${Math.round(test.score)}%`, LEFT + 15, scoreY + 2, 23, DARK, true));
  ops.push(textCommand(test.kind === "knowledge" && test.correct != null && test.correctTotal != null
    ? `${test.correct}/${test.correctTotal} aciertos`
    : "Puntaje descriptivo", LEFT + 94, scoreY + 1, 9, MUTED));
  const band = test.kind === "knowledge" ? displayBand(test.band) : null;
  if (band) {
    ops.push(rectCommand(LEFT + CONTENT_WIDTH - 153, scoreY - 5, 139, 25, band.color));
    ops.push(textCommand(band.label, LEFT + CONTENT_WIDTH - 147, scoreY + 3, 8, [1, 1, 1], true));
  }
  const scoreNote = test.kind === "knowledge"
    ? "Rangos descriptivos del proyecto; no son baremos ni evidencia de validación."
    : test.kind === "likert"
      ? "Conversión descriptiva de respuestas; no es un baremo poblacional."
      : "Perfil exploratorio; no se compara con baremos poblacionales.";
  ops.push(textCommand(scoreNote, LEFT + 94, scoreY - 15, 8, MUTED));

  let y = 575;
  if (test.validityAlerts?.length) {
    ops.push(textCommand("SEÑALES PARA REVISIÓN", LEFT, y, 8, RED, true));
    y -= 14;
    for (const alert of test.validityAlerts) {
      y = drawParagraph(ops, alert, LEFT, y, CONTENT_WIDTH, 8, 11, RED) - 4;
    }
    y -= 2;
  }
  if (test.subareas.length) {
    ops.push(textCommand(test.kind === "likert" ? "DIMENSIONES" : test.kind === "profile" ? "FACTORES DEL PERFIL" : "ACIERTOS POR SUBÁREA", LEFT, y, 8, MUTED, true));
    y -= 22;
    for (const subarea of test.subareas) {
      if (test.kind === "knowledge" && subarea.correct != null && subarea.total != null) {
        const count = `${subarea.correct}/${subarea.total}`;
        ops.push(textCommand(labelFor(subarea.label), LEFT, y, 9, DARK, true));
        ops.push(textCommand(count, LEFT + 285, y, 9, MUTED));
        ops.push(textCommand(subarea.score === null ? "—" : `${Math.round(subarea.score)}%`, LEFT + 348, y, 9, DARK, true));
        const barX = LEFT + 390;
        const barWidth = CONTENT_WIDTH - 390;
        ops.push(rectCommand(barX, y - 3, barWidth, 5, PALE));
        if (subarea.score !== null) ops.push(rectCommand(barX, y - 3, barWidth * Math.max(0, Math.min(100, subarea.score)) / 100, 5, scoreColor(subarea.score, "knowledge")));
        y -= 26;
      } else {
        const level = test.kind === "likert" && subarea.score !== null
          ? subarea.score > 70 ? "Alto" : subarea.score >= 40 ? "Medio" : "Bajo"
          : "";
        const rowY = y;
        y = scoreBar(ops, labelFor(subarea.label), subarea.score, LEFT, y, CONTENT_WIDTH, test.kind === "likert" ? "likert" : "profile", level);
        if (test.id === "personalidad_trabajo" && level) {
          ops.push(textCommand(`Lectura descriptiva: nivel ${level.toLowerCase()} en este autoinforme.`, LEFT + 2, rowY - 25, 7, MUTED));
          y -= 12;
        }
      }
    }
  }

  if (test.kind === "knowledge") {
    y -= 5;
    ops.push(textCommand("LECTURA DE BANDA", LEFT, y, 8, MUTED, true));
    y -= 15;
    y = drawParagraph(ops, "Insuficiente: menos de 70%. Aceptable: 70–84%. Sólido: 85% o más. Son referencias descriptivas configuradas para este MVP; requieren revisión experta y no deben interpretarse como riesgo clínico ni como decisión de contratación.", LEFT, y, CONTENT_WIDTH, 8, 12, MUTED);
  } else if (test.kind === "likert") {
    y -= 4;
    y = drawParagraph(ops, "Los porcentajes transforman promedios de respuestas Likert a una escala descriptiva de 0 a 100. Alto: más de 70; medio: 40–70; bajo: menos de 40. No son baremos poblacionales.", LEFT, y, CONTENT_WIDTH, 8, 12, MUTED);
  }

  if (test.interpretation) {
    y -= 14;
    if (y > 145) {
      ops.push(lineCommand(LEFT, y, PAGE_WIDTH - LEFT, y));
      y -= 18;
      ops.push(textCommand("INTERPRETACIÓN", LEFT, y, 8, MUTED, true));
      y -= 17;
      drawParagraph(ops, test.interpretation, LEFT, y, CONTENT_WIDTH, 9, 13, DARK);
    }
  }
  return ops;
}

function makeMethodPage(pageNumber: number, pageCount: number) {
  const ops: string[] = [];
  addHeader(ops, "Alcance y notas metodológicas", pageNumber, pageCount);
  let y = 664;
  const paragraphs = [
    "Este reporte resume las respuestas registradas y las puntuaciones de la versión actual de Microtalento. La documentación del proyecto describe inspiración conceptual en Big Five, DISC, códigos éticos profesionales, DSM-5 y BACB; los reactivos son originales, no reproducen ni adaptan instrumentos licenciados.",
    "El instrumento no cuenta aquí con evidencia documentada de validación, confiabilidad, normas poblacionales ni puntos de corte validados. Las bandas son referencias descriptivas definidas para este MVP y deben revisarse mediante revisión experta, piloto, análisis de ítems y estudios psicométricos antes de cualquier uso de alto impacto.",
    "Los resultados no constituyen diagnóstico, certificación de competencias, evaluación clínica integral ni recomendación automática de contratación. Deben interpretarse junto con entrevista, experiencia, referencias, supervisión y contexto pertinente por profesionales responsables.",
    "Las señales de tiempo y patrón uniforme son indicadores de revisión, no evidencia de respuesta al azar ni de fraude. El tiempo se reporta desde el navegador y no es una medida independiente. Algunas pruebas tienen claves concentradas en una opción, lo que puede producir falsos positivos. No se calculó una escala de consistencia personal validada.",
    "Confidencialidad: este documento contiene información de candidatura. Compártase únicamente con personas autorizadas y consérvese de acuerdo con las políticas de privacidad aplicables.",
  ];
  for (const paragraph of paragraphs) {
    y = drawParagraph(ops, paragraph, LEFT, y, CONTENT_WIDTH, 10, 16, DARK) - 19;
  }
  ops.push(rectCommand(LEFT, 80, CONTENT_WIDTH, 58, PALE));
  drawParagraph(ops, "Aviso: documento confidencial orientativo. No constituye diagnóstico clínico. Validar con entrevista.", LEFT + 12, 117, CONTENT_WIDTH - 24, 9, 13, DARK);
  return ops;
}

function makePdfPage(content: string[]) {
  return ["q", ...content, "Q"].join("\n");
}

export function createEvaluationPdf(report: EvaluationPdfReport) {
  const tests = report.tests?.length ? report.tests : (report.interpretations ?? []).map((interpretation): EvaluationPdfTest => ({
    id: interpretation.title,
    title: interpretation.title,
    kind: "profile",
    score: null,
    answered: 0,
    total: 0,
    subareas: [],
    interpretation: interpretation.text,
    band: null,
  }));
  const pageCount = 1 + tests.length + 1;
  const pages = [makeSummaryPage(report, tests, 1, pageCount)];
  tests.forEach((test, index) => pages.push(makeTestPage(test, index + 1, index + 2, pageCount)));
  pages.push(makeMethodPage(pageCount, pageCount));

  const pageObjectIds = pages.map((_, index) => 5 + index * 2);
  const contentObjectIds = pages.map((_, index) => 6 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  pages.forEach((page, index) => {
    const content = makePdfPage(page);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
