export type BrainQuality = {
  tier: "desktop" | "mobile" | "low";
  modelPath: string;
  maxDpr: number;
  shaderFps: number;
  idleFps: number;
  bloom: boolean;
};

export function chooseBrainQuality(coarsePointer: boolean, cores = 4): BrainQuality {
  // No dependemos de deviceMemory (no existe en Safari). Un valor ausente es conservador.
  const low = coarsePointer && cores <= 4;
  return {
    tier: coarsePointer ? low ? "low" : "mobile" : "desktop",
    modelPath: coarsePointer ? "/models/brain-mobile.glb" : "/models/brain-desktop.glb",
    maxDpr: coarsePointer ? low ? 1 : 1.5 : 2,
    shaderFps: coarsePointer ? 30 : 60,
    idleFps: coarsePointer ? 30 : 60,
    bloom: !coarsePointer && cores >= 8,
  };
}
