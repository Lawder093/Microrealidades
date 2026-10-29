import type { EvaluationItem } from "@/lib/evaluation-items";

export type ParticipantType = "therapist" | "candidate";

export type EvaluationApplication = {
  id: string;
  participantCode: string;
  participantType: ParticipantType;
  evaluatorCode: string;
  createdAt: string;
  completedAt?: string;
  responses: Record<string, number | string>;
};

export type DimensionResult = {
  dimension: string;
  answered: number;
  total: number;
  score: number | null;
  rawMean: number | null;
};

export type ApplicationResult = {
  answered: number;
  total: number;
  globalScore: number | null;
  dimensions: DimensionResult[];
};

export function activeItems(items: EvaluationItem[]) {
  return items.filter((item) => item.active);
}

export function normalizeScore(value: number) {
  return Math.round(((value - 1) / 4) * 100);
}

export function calculateApplicationResult(application: EvaluationApplication, items: EvaluationItem[]): ApplicationResult {
  const available = activeItems(items);
  const dimensions = Array.from(new Set(available.map((item) => item.dimension)));
  const dimensionResults = dimensions.map((dimension) => {
    const dimensionItems = available.filter((item) => item.dimension === dimension);
    const values = dimensionItems.map((item) => application.responses[item.id]).filter((value): value is number => Number.isFinite(value));
    const rawMean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    return {
      dimension,
      answered: values.length,
      total: dimensionItems.length,
      score: rawMean === null ? null : normalizeScore(rawMean),
      rawMean,
    };
  });
  const allValues = available.map((item) => application.responses[item.id]).filter((value): value is number => Number.isFinite(value));
  const rawGlobalMean = allValues.length ? allValues.reduce((sum, value) => sum + value, 0) / allValues.length : null;
  return {
    answered: allValues.length,
    total: available.length,
    globalScore: rawGlobalMean === null ? null : normalizeScore(rawGlobalMean),
    dimensions: dimensionResults,
  };
}

export function correlation(first: number[], second: number[]) {
  if (first.length < 3 || first.length !== second.length) return null;
  const firstMean = first.reduce((sum, value) => sum + value, 0) / first.length;
  const secondMean = second.reduce((sum, value) => sum + value, 0) / second.length;
  const numerator = first.reduce((sum, value, index) => sum + (value - firstMean) * (second[index] - secondMean), 0);
  const firstVariance = first.reduce((sum, value) => sum + (value - firstMean) ** 2, 0);
  const secondVariance = second.reduce((sum, value) => sum + (value - secondMean) ** 2, 0);
  const denominator = Math.sqrt(firstVariance * secondVariance);
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(2));
}

export function cronbachAlpha(applications: EvaluationApplication[], items: EvaluationItem[]) {
  const usable = applications.filter((application) => items.every((item) => Number.isFinite(application.responses[item.id])));
  if (usable.length < 3 || items.length < 2) return null;
  const itemVariances = items.map((item) => variance(usable.map((application) => Number(application.responses[item.id]))));
  const totalScores = usable.map((application) => items.reduce((sum, item) => sum + Number(application.responses[item.id]), 0));
  const totalVariance = variance(totalScores);
  if (totalVariance === 0) return null;
  return Number(((items.length / (items.length - 1)) * (1 - itemVariances.reduce((sum, value) => sum + value, 0) / totalVariance)).toFixed(2));
}

export function variance(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

export function formatDate(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
