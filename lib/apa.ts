export type SourceType = "article" | "book" | "chapter" | "webpage";

export type Citation = {
  id: string;
  quote: string;
  author: string;
  year: string;
  page: string;
  title: string;
  sourceType: SourceType;
  containerTitle: string;
  volume: string;
  issue: string;
  pages: string;
  publisher: string;
  doi: string;
  url: string;
};

export type CitationDraft = Omit<Citation, "id">;

export function emptyCitation(): CitationDraft {
  return {
    quote: "",
    author: "",
    year: "",
    page: "",
    title: "",
    sourceType: "article",
    containerTitle: "",
    volume: "",
    issue: "",
    pages: "",
    publisher: "",
    doi: "",
    url: "",
  };
}

function surname(author: string): string {
  const names = author.split(";").map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return "Autor no identificado";
  if (names.length > 2) return `${surname(names[0])} et al.`;
  if (names.length === 2) return `${surname(names[0])} & ${surname(names[1])}`;

  const first = names[0];
  return first.includes(",") ? first.split(",")[0].trim() : first.split(/\s+/).pop() || first;
}

function sourceLink(citation: CitationDraft) {
  const doi = citation.doi.trim().replace(/^https?:\/\/doi\.org\//i, "");
  if (doi) return `https://doi.org/${doi}`;
  return citation.url.trim();
}

function finishSentence(value: string) {
  const clean = value.trim();
  return clean.endsWith(".") ? clean : `${clean}.`;
}

export function formatInTextCitation(citation: CitationDraft) {
  const author = surname(citation.author);
  const year = citation.year.trim() || "s. f.";
  const page = citation.page.trim();
  const pageSuffix = page ? (page.toLowerCase().startsWith("p") ? `, ${page}` : `, p. ${page}`) : "";
  return `(${author}, ${year}${pageSuffix})`;
}

export function formatApaReference(citation: CitationDraft) {
  const author = citation.author.trim() || "Autor no identificado";
  const year = citation.year.trim() || "s. f.";
  const title = finishSentence(citation.title || "Título pendiente");
  const link = sourceLink(citation);

  if (citation.sourceType === "book") {
    return `${author} (${year}). ${title}${citation.publisher.trim() ? ` ${finishSentence(citation.publisher)}` : ""}${link ? ` ${link}` : ""}`;
  }

  if (citation.sourceType === "chapter") {
    const container = citation.containerTitle.trim() ? `En ${finishSentence(citation.containerTitle)}` : "En fuente pendiente.";
    return `${author} (${year}). ${title} ${container}${citation.publisher.trim() ? ` ${finishSentence(citation.publisher)}` : ""}${link ? ` ${link}` : ""}`;
  }

  if (citation.sourceType === "webpage") {
    return `${author} (${year}). ${title}${citation.containerTitle.trim() ? ` ${finishSentence(citation.containerTitle)}` : ""}${link ? ` ${link}` : ""}`;
  }

  const journal = citation.containerTitle.trim() ? finishSentence(citation.containerTitle) : "Revista pendiente.";
  const volume = citation.volume.trim() ? citation.volume.trim() : "";
  const issue = citation.issue.trim() ? `(${citation.issue.trim()})` : "";
  const pages = citation.pages.trim() ? `, ${citation.pages.trim()}` : "";
  return `${author} (${year}). ${title} ${journal}${volume ? ` ${volume}${issue}` : issue}${pages}.${link ? ` ${link}` : ""}`;
}

export function citationMissingFields(citation: CitationDraft) {
  const missing: string[] = [];
  if (!citation.author.trim()) missing.push("autoría");
  if (!citation.year.trim()) missing.push("año");
  if (!citation.title.trim()) missing.push("título de la fuente");
  if (citation.quote.trim() && !citation.page.trim()) missing.push("página o párrafo de la cita");
  if (citation.sourceType === "article" && !citation.containerTitle.trim()) missing.push("revista");
  if (citation.sourceType === "chapter" && !citation.containerTitle.trim()) missing.push("libro o compilación");
  if (citation.sourceType === "book" && !citation.publisher.trim()) missing.push("editorial");
  if (citation.sourceType === "webpage" && !citation.url.trim() && !citation.doi.trim()) missing.push("URL");
  return missing;
}
