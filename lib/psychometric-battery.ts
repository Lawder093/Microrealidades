import { defaultEvaluationItems, evaluationDimensions, type EvaluationItem } from "@/lib/evaluation-items";

export type PsychometricTest = {
  id: string;
  name: string;
  description: string;
  itemIds: string[];
};

export type BatteryClassification = "1-A" | "1-B" | "2-A" | "2-B" | "3-A" | "3-B" | "3-C" | "3-D" | "custom";

export const psychometricTests: PsychometricTest[] = evaluationDimensions.map((dimension) => ({
  id: `dimension-${dimension.id}`,
  name: dimension.label,
  description: dimension.description,
  itemIds: defaultEvaluationItems.filter((item) => item.dimension === dimension.id).map((item) => item.id),
}));

export const defaultBattery = {
  id: "base-super-bateria-01",
  name: "Super batería 01",
  classification: "custom" as BatteryClassification,
  tests: psychometricTests.map((test, index) => ({ testId: test.id, order: index + 1, timeLimitSeconds: 360 })),
  totalMinutes: 30,
};

export function getBatteryItems(testIds: string[], items: EvaluationItem[] = defaultEvaluationItems) {
  const ids = new Set(psychometricTests.filter((test) => testIds.includes(test.id)).flatMap((test) => test.itemIds));
  return items.filter((item) => ids.has(item.id));
}
