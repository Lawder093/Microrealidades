# Holograma cerebral · Microrealidades

Implementado en `/proyectos/cerebro`. Conserva la página, sus textos, metadatos,
navbar, leyenda y enfoque por capas. No agrega dependencias de ejecución.

## Integración

- `brain-experience.tsx`: detección WebGL2, reducción de movimiento, visibilidad,
  introducción y controles táctiles. En teléfono se desplaza normalmente la página;
  «Activar giro y zoom» habilita un dedo para rotar y dos para ampliar.
- `brain-canvas.tsx`: luces, cámara, reloj compartido y `frameloop="demand"`.
  Se suspende fuera de pantalla y en pestañas ocultas. En móvil el reloj del shader
  avanza a 30 Hz; durante arrastre/inercia se solicitan frames a frecuencia de pantalla.
- `brain-hologram-material.ts`: extensión GLSL `onBeforeCompile` sobre el material
  físico original. `hologramSettings` controla densidad/velocidad de scanlines,
  glitch y Fresnel. Conserva normales y UV. Transparencia por ángulo y emisión
  realzan bordes y pliegues sin duplicar la malla.
- `brain-model.tsx`: carga Draco local, materiales/colores/opacidades por región y
  liberación de geometrías, materiales, texturas y workers. La carga se aborta al salir.
- `brain-resources.ts`: centrado y escala uniforme; evita el desplazamiento del atlas
  y la deformación que antes dificultaban ver el cerebro completo.
- `brain-controls.ts`: OrbitControls, límites de zoom, inercia, ajuste al viewport y
  restablecimiento. La rotación automática espera 4 segundos después del gesto.
- `neural-activity.tsx`: trayectorias de `brain-data.ts`, una línea combinada y dos
  mallas instanciadas para impulsos y halos. Se ubican dentro de la sustancia blanca.
- `brain-bloom.tsx`: postproceso en chunk independiente, solo para escritorio con
  recursos y soporte de render target flotante. Targets a resolución CSS.
- `brain-quality.ts`: selecciona el modelo antes de descargarlo. DPR máximo 2 en
  escritorio, 1.5 en móvil y 1 con cuatro núcleos o información de CPU ausente.

Para ajustar iluminación/cámara editar `brain-canvas.tsx`; para materiales,
`brain-model.tsx`; para actividad, `brain-data.ts` y `neural-activity.tsx`.
Los estilos añadidos son locales a `.brain-*` en `app/globals.css`.

## Modelos y licencia

| Variante | Bytes | Triángulos | Primitivas |
| --- | ---: | ---: | ---: |
| Original | 4,650,816 | 1,383,522 | 563 |
| Escritorio | 1,425,420 | 388,640 | 12 |
| Móvil | 841,344 | 212,933 | 12 |

Los GLB están en `public/models/`. Se conservan las 12 regiones visibles, normales y
UV. El original `brain.glb` permanece intacto: SHA-256
`76a49ea4526a4880613aec7a02756bd7301b0b9d0680d7cae33e197b672c5453`.
Las variantes se simplifican, unen por región y comprimen con Draco. No hay texturas
que convertir a KTX2. Fuente, licencia CC BY-SA 4.0, atribución y reproducción del
optimizador: `public/models/README.md`. Detalle: `brain-optimization.json`.

Para sustituir el modelo, conservar el original y regenerar las variantes con
`scripts/optimize-brain.mjs`. Revisar el clasificador en `brain-anatomy.ts` si cambian
los nombres anatómicos. En escritorio hay fallback al GLB original; en móvil un
error muestra la representación estática sin descargar el atlas pesado. La pérdida
de contexto o la ausencia de WebGL2 también muestran el fallback.

## Verificación reproducible

```bash
npm run lint
npm test
npx next build
```

`npm test` ejecuta el build Vinext existente y los tests del proyecto. Se verificó
además `next build`, el comando de producción configurado en `vercel.json`.
Diez tests pasan, incluidos cinco nuevos para los presupuestos GLB, selección LOD,
centrado, liberación de recursos y shader/reducción de movimiento.

Las comprobaciones de navegador usan herramientas externas al bundle:

```bash
npm install --prefix /tmp/microrealidades-brain-tools --no-audit --no-fund @playwright/test@1.56.1
PLAYWRIGHT_BROWSERS_PATH=/tmp/microrealidades-brain-browsers /tmp/microrealidades-brain-tools/node_modules/.bin/playwright install webkit
# Arrancar antes el build de Next: npx next start --port 3200
BRAIN_TOOLS_ROOT=/tmp/microrealidades-brain-tools PLAYWRIGHT_BROWSERS_PATH=/tmp/microrealidades-brain-browsers node scripts/check-brain-browser.mjs
BRAIN_TOOLS_ROOT=/tmp/microrealidades-brain-tools PLAYWRIGHT_BROWSERS_PATH=/tmp/microrealidades-brain-browsers node scripts/check-brain-lifecycle.mjs
```

En macOS se usa Chrome instalado. `BRAIN_CHROME_PATH` permite indicar otro binario;
en otros sistemas instalar Chromium con Playwright. `BRAIN_BASE_URL` cambia el
servidor y `BRAIN_REPORT_DIR` la carpeta de capturas y reportes JSON.

Se probó el build de producción en Chrome con GPU ANGLE/Metal de Apple M2 y WebKit
26.0. Se comprobaron shader, giro, rueda, reset, capas, reducción de movimiento,
390 px, DPR 1/1.5, desplazamiento vertical, un dedo, pinza, ambas orientaciones,
navegación, cambio de preferencia de movimiento durante la visita y fallback sin WebGL. Durante arrastre se midieron 60.0–60.1 FPS en
emulación móvil; no es una medición de iPhone/Android físicos. La escena móvil usa
15 draw calls y 215,333 triángulos incluyendo actividad; escritorio con bloom,
29 draw calls y 391,054 triángulos.

El test de ciclo de vida comprueba pausa/reanudación, suspensión fuera de pantalla,
tres salidas/entradas, liberación de buffers/programas, pérdida de contexto y errores
de carga. Three conserva cinco texturas internas vacías hasta perder el contexto;
ningún contexto queda activo al salir. Las pruebas normales no produjeron errores
de consola ni excepciones de página.

Firefox no pudo iniciar en el entorno macOS de automatización (fallo nativo de
perfil/sandbox antes de cargar la web). Queda pendiente comprobarlo y medir en
Safari/iPhone y Chrome/Android físicos. El build Vinext advierte del tamaño de los
chunks de Three.js; el visor y bloom se cargan dinámicamente solo en esta experiencia.

## Peso JavaScript medido

Carga en frío de `next start`, sumando las respuestas JavaScript recibidas. Gzip
recalculado por archivo para comparar; no incluye GLB, Draco WASM, CSS ni fuentes.

| Ruta / perfil | JS minificado | JS gzip | Scripts |
| --- | ---: | ---: | ---: |
| `/proyectos` | 671,632 bytes | 195,026 bytes | 12 |
| Cerebro móvil | 1,740,217 bytes | 473,623 bytes | 16 |
| Cerebro escritorio con bloom | 1,821,433 bytes | 491,320 bytes | 18 |

El módulo que construye el bloom pesa 20,497 bytes (4,993 gzip), además de sus
utilidades compartidas. Ningún chunk de bloom se solicitó en el perfil móvil.

La verificación se ejecutó en una copia idéntica del código con `npm ci`, en una
carpeta temporal sin `.env`; los cambios fuente están en Desktop/MicroWeb.
