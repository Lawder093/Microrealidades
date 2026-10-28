export type EvaluationPdfReport = {
  code: string;
  candidateName: string | null;
  candidateAge: number | null;
  candidateCompany: string | null;
  completedAt: string | null;
  globalScore?: number | null;
  dimensions?: Array<{ dimension: string; score: number | null; answered: number; total: number }>;
};

function pdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function createEvaluationPdf(report: EvaluationPdfReport) {
  const lines = [
    "Super batería 01",
    "Evaluación psicométrica · reporte individual",
    `Código: ${report.code}`,
    `Candidatura: ${report.candidateName ?? "No capturada"}`,
    `Edad: ${report.candidateAge ?? "No capturada"}`,
    `Empresa: ${report.candidateCompany ?? "No capturada"}`,
    `Finalizada: ${report.completedAt ?? "Sin fecha"}`,
    "",
    `Puntuación global descriptiva: ${report.globalScore ?? "Sin datos"}/100`,
    ...(report.dimensions ?? []).map((dimension) => `${dimension.dimension}: ${dimension.score ?? "Sin datos"}/100 (${dimension.answered}/${dimension.total})`),
    "",
    "Este reporte es apoyo para la evaluación profesional; no es un diagnóstico, baremo ni decisión automática de contratación.",
  ];
  const content = ["BT", "/F1 12 Tf", "50 760 Td", ...lines.flatMap((line, index) => [index === 0 ? `/F1 18 Tf (${pdfText(line)}) Tj` : `/F1 11 Tf 0 -22 Td (${pdfText(line)}) Tj`]), "ET"].join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
