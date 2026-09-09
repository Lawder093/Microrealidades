export type BrainPoint = [number, number, number];

export type NeuralPath = {
  id: string;
  points: BrainPoint[];
  color: string;
  speed: number;
  phase: number;
  opacity: number;
  secondaryPulse?: boolean;
};

// Coordinates are deliberately kept in the normalized model space. This makes
// the activity easy to retune if a better GLB is introduced later.
export const neuralPaths: NeuralPath[] = [
  {
    id: "left-frontal-arc",
    points: [[-0.28, 0.78, 0.02], [-0.36, 0.42, 0.12], [-0.22, 0.08, 0.23], [-0.04, -0.22, 0.1]],
    color: "#f18ca8",
    speed: 0.17,
    phase: 0.12,
    opacity: 0.23,
    secondaryPulse: true,
  },
  {
    id: "right-frontal-arc",
    points: [[0.29, 0.72, -0.04], [0.38, 0.36, -0.12], [0.2, 0.06, -0.2], [0.02, -0.25, -0.08]],
    color: "#78d2ce",
    speed: 0.13,
    phase: 0.57,
    opacity: 0.18,
  },
  {
    id: "cross-callosal",
    points: [[-0.33, 0.1, 0.02], [-0.18, 0.16, 0.15], [0, 0.2, 0.02], [0.19, 0.16, -0.14], [0.34, 0.08, -0.02]],
    color: "#f4b827",
    speed: 0.2,
    phase: 0.34,
    opacity: 0.25,
    secondaryPulse: true,
  },
  {
    id: "deep-left-loop",
    points: [[-0.09, 0.62, -0.16], [-0.2, 0.35, -0.28], [-0.12, -0.03, -0.32], [0.03, -0.34, -0.2], [0.13, -0.52, 0.02]],
    color: "#9ce7df",
    speed: 0.1,
    phase: 0.76,
    opacity: 0.14,
  },
  {
    id: "deep-right-loop",
    points: [[0.11, 0.64, 0.17], [0.23, 0.36, 0.28], [0.14, -0.01, 0.33], [-0.02, -0.3, 0.22], [-0.13, -0.5, 0.04]],
    color: "#f5a9bd",
    speed: 0.15,
    phase: 0.21,
    opacity: 0.16,
    secondaryPulse: true,
  },
  {
    id: "upper-bridge",
    points: [[-0.3, 0.55, -0.06], [-0.12, 0.71, 0.1], [0.08, 0.75, -0.08], [0.3, 0.53, 0.06]],
    color: "#f4b827",
    speed: 0.09,
    phase: 0.48,
    opacity: 0.13,
  },
  {
    id: "lower-bridge",
    points: [[-0.28, -0.28, 0.06], [-0.12, -0.46, -0.08], [0.06, -0.6, 0.08], [0.28, -0.31, -0.02]],
    color: "#69b8cf",
    speed: 0.12,
    phase: 0.89,
    opacity: 0.13,
  },
  {
    id: "left-branch",
    points: [[-0.12, 0.18, 0.05], [-0.34, 0.01, 0.18], [-0.43, -0.22, 0.03], [-0.3, -0.38, -0.16]],
    color: "#e9789a",
    speed: 0.22,
    phase: 0.03,
    opacity: 0.2,
  },
  {
    id: "right-branch",
    points: [[0.12, 0.19, -0.04], [0.35, 0.02, -0.17], [0.43, -0.2, -0.02], [0.3, -0.39, 0.15]],
    color: "#65c2bd",
    speed: 0.18,
    phase: 0.67,
    opacity: 0.18,
  },
  {
    id: "posterior-loop",
    points: [[-0.08, -0.58, -0.03], [-0.2, -0.72, 0.15], [0, -0.82, 0.25], [0.2, -0.71, 0.11], [0.08, -0.58, -0.03]],
    color: "#dfe795",
    speed: 0.08,
    phase: 0.4,
    opacity: 0.12,
    secondaryPulse: true,
  },
  {
    id: "anterior-thread",
    points: [[-0.05, 0.88, -0.02], [0.02, 0.69, 0.18], [0.09, 0.48, 0.16], [0.03, 0.28, 0.05]],
    color: "#f7c7d4",
    speed: 0.14,
    phase: 0.28,
    opacity: 0.16,
  },
];

export const brainModelPath = "/models/brain.glb";
