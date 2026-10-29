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

export type EvaluationPdfReport = {
  code: string;
  candidateName: string | null;
  candidateAge: number | null;
  candidateCompany: string | null;
  completedAt: string | null;
  globalScore?: number | null;
  dimensions?: EvaluationPdfDimension[];
  interpretations?: EvaluationPdfInterpretation[];
  timedOut?: boolean;
};

type PdfLine = { text: string; size: number; leading: number };

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

function wrapText(value: string, width = 82) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [""];
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function dimensionLabel(value: string) {
  const labels: Record<string, string> = {
    personality: "Personalidad y estilo de trabajo",
    ethics: "Ética y profesionalismo",
    skills: "Habilidades y conocimientos",
    therapeutic: "Relación terapéutica",
    judgment: "Juicio y razonamiento profesional",
  };
  return labels[value] ?? value;
}

function makeLines(report: EvaluationPdfReport): PdfLine[] {
  const lines: PdfLine[] = [
    { text: "Super batería 01", size: 18, leading: 27 },
    { text: "Evaluación psicométrica · reporte individual", size: 11, leading: 18 },
    { text: `Código: ${report.code}`, size: 11, leading: 18 },
    { text: `Candidatura: ${report.candidateName ?? "No capturada"}`, size: 11, leading: 18 },
    { text: `Edad: ${report.candidateAge ?? "No capturada"}`, size: 11, leading: 18 },
    { text: `Empresa: ${report.candidateCompany ?? "No capturada"}`, size: 11, leading: 18 },
    { text: `Finalizada: ${report.completedAt ?? "Sin fecha"}`, size: 11, leading: 18 },
    { text: report.timedOut ? "Estado: tiempo agotado; resultados parciales." : "Estado: aplicación completada.", size: 11, leading: 22 },
    { text: "", size: 11, leading: 12 },
    { text: `Puntuación global descriptiva: ${report.globalScore ?? "Sin datos"}/100`, size: 13, leading: 22 },
    ...(report.dimensions ?? []).map((dimension) => ({
      text: `${dimensionLabel(dimension.dimension)}: ${dimension.score ?? "Sin datos"}/100 (${dimension.answered}/${dimension.total})`,
      size: 10,
      leading: 16,
    })),
    { text: "", size: 11, leading: 12 },
    ...(report.interpretations ?? []).flatMap((interpretation) => [
      { text: `Interpretación · ${interpretation.title}`, size: 12, leading: 20 },
      ...wrapText(interpretation.text, 82).map((text) => ({ text, size: 10, leading: 15 })),
      { text: "", size: 10, leading: 10 },
    ]),
    { text: "Este reporte es apoyo para la evaluación profesional; no es un diagnóstico, baremo ni decisión automática de contratación.", size: 9, leading: 14 },
  ];
  return lines.flatMap((line) => line.text.length > 82
    ? wrapText(line.text, 82).map((text) => ({ ...line, text }))
    : [line]);
}

function paginate(lines: PdfLine[]) {
  const pages: PdfLine[][] = [[]];
  let currentHeight = 0;
  for (const line of lines) {
    if (currentHeight + line.leading > 690 && pages.at(-1)?.length) {
      pages.push([]);
      currentHeight = 0;
    }
    pages.at(-1)?.push(line);
    currentHeight += line.leading;
  }
  return pages;
}

function makePageContent(lines: PdfLine[]) {
  let y = 755;
  const content = ["BT"];
  for (const line of lines) {
    content.push(`/F1 ${line.size} Tf`);
    content.push(`${line.size} 0 0 ${line.size} 50 ${y} Tm <${toWinAnsiHex(line.text)}> Tj`);
    y -= line.leading;
  }
  content.push("ET");
  return content.join("\n");
}

export function createEvaluationPdf(report: EvaluationPdfReport) {
  const pages = paginate(makeLines(report));
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  const contentObjectIds = pages.map((_, index) => 5 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  pages.forEach((page, index) => {
    const content = makePageContent(page);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`);
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
