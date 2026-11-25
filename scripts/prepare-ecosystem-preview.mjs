import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
  copyFile,
} from "node:fs/promises";
import { resolve } from "node:path";

const branch = execFileSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).trim();
if (branch !== "microhub-001")
  throw new Error(
    "La preparación de este prototipo se realiza únicamente en microhub-001.",
  );
if (execFileSync("git",["status","--porcelain"],{encoding:"utf8"}).trim())
  throw new Error("Guarda y verifica los cambios en un commit antes de preparar el preview.");
const output = resolve(".ecosystem-preview");
await mkdir(output, { recursive: true });
const files = (await readdir("supabase/migrations"))
  .filter((name) => name.startsWith("20261125") && name.endsWith(".sql"))
  .sort();
const manifest = {
  branch,
  commit: execFileSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim(),
  productionModified: false,
  cloudDeploymentPerformed: false,
  migrations: [],
};
let bundle =
  "-- ECOSYSTEM CORE: ejecutar primero en Supabase de pruebas con el esquema previo de MicroWeb instalado.\n-- Contiene solo migraciones nuevas. Revisar docs/ecosystem-core.md antes de ejecutar.\n";
for (const name of files) {
  const source = await readFile(`supabase/migrations/${name}`, "utf8");
  bundle += `\n-- ${name}\n${source}\n`;
  manifest.migrations.push({
    name,
    sha256: createHash("sha256").update(source).digest("hex"),
  });
}
await writeFile(`${output}/ecosystem-core.sql`, bundle);
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2));
await copyFile(
  "config/ecosystem-preview.env.example",
  `${output}/variables.example`,
);
process.stdout.write(
  `Preview preparado en ${output}. No se conectó a ninguna base ni se inició un despliegue.\n`,
);
