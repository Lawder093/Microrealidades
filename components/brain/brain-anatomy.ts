import * as THREE from "three";

export type BrainRegion =
  | "frontal"
  | "parietal"
  | "temporal"
  | "occipital"
  | "cerebellum"
  | "whiteMatter"
  | "nuclei"
  | "ventricles"
  | "brainstem"
  | "tracts"
  | "vessels"
  | "support"
  | "interior";

export type BrainMaterialKey = Exclude<BrainRegion, "support">;
export type BrainFocus = "all" | "lobes" | "interior" | BrainRegion;

const lobeRegions: BrainRegion[] = ["frontal", "parietal", "temporal", "occipital"];

export function focusContains(focus: BrainFocus, region: BrainRegion) {
  if (focus === "all") return true;
  if (focus === "lobes") return lobeRegions.includes(region);
  if (focus === "interior") return ["whiteMatter", "tracts", "nuclei", "ventricles", "brainstem"].includes(region);
  if (focus === "whiteMatter") return region === "whiteMatter" || region === "tracts";
  return focus === region;
}

export const brainAnatomyLegend: Array<{
  id: BrainRegion;
  label: string;
  detail: string;
  color: string;
}> = [
  { id: "frontal", label: "Frontal", detail: "atención y planificación", color: "#e69ab5" },
  { id: "parietal", label: "Parietal", detail: "cuerpo y espacio", color: "#75c9c4" },
  { id: "temporal", label: "Temporal", detail: "memoria y escucha", color: "#e2b477" },
  { id: "occipital", label: "Occipital", detail: "procesamiento visual", color: "#91a9dd" },
  { id: "cerebellum", label: "Cerebelo", detail: "coordinación y equilibrio", color: "#d18ba6" },
  { id: "nuclei", label: "Núcleos", detail: "estructuras profundas", color: "#ee789f" },
  { id: "whiteMatter", label: "Sustancia blanca", detail: "conexiones internas", color: "#d3e6df" },
  { id: "tracts", label: "Tractos", detail: "rutas y comisuras", color: "#f4b827" },
  { id: "ventricles", label: "Ventrículos", detail: "espacios internos", color: "#a3e9df" },
  { id: "brainstem", label: "Tronco", detail: "base del encéfalo", color: "#df9b7d" },
];

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getSourceMaterialName(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh)) return "";
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  return normalized(material?.name ?? "");
}

export function getBrainRegion(object: THREE.Object3D) {
  const name = normalized(object.name);
  const material = getSourceMaterialName(object);
  const haystack = `${name} ${material}`;

  if (/artery|vein|sinus|nerve/.test(haystack)) return "vessels" as const;
  if (/tentorium|cartilage|bone/.test(haystack)) return "support" as const;
  if (/cerebell/.test(haystack) || material === "cerebellum") return "cerebellum" as const;
  if (/pons|medulla|midbrain|brainstem/.test(haystack)) return "brainstem" as const;
  if (/ventricle|aqueduct|lcr/.test(haystack)) return "ventricles" as const;
  if (/nucleus|nuclei|thalam|amygdala|hippocampus|pineal|hypophysis/.test(haystack) || material.startsWith("nucleus")) {
    return "nuclei" as const;
  }
  if (/tract|fasciculus|radiation|commissure|callosum/.test(haystack)) return "tracts" as const;
  if (/white matter/.test(haystack)) return "whiteMatter" as const;
  if (/frontal|orbitofrontal/.test(name)) return "frontal" as const;
  if (/parietal|intraparietal/.test(name)) return "parietal" as const;
  if (/temporal|insul/.test(name)) return "temporal" as const;
  if (/occipital|calcarine/.test(name)) return "occipital" as const;
  if (/brain|cortex|gyrus|sulcus|mening|lobe/.test(haystack)) return "interior" as const;
  return "interior" as const;
}

export function isFramingRegion(region: BrainRegion) {
  return !["vessels", "support", "tracts"].includes(region);
}
