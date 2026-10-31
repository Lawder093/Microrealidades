# Modelo cerebral de Microrealidades

La escena utiliza `brain.glb`, un modelo anatómico derivado de Z-Anatomy y BodyParts3D / DBCLS.

- Fuente: [itayinbarr/brainproject](https://github.com/itayinbarr/brainproject)
- Asset original: `brain-atlas/models/brain.glb`
- Licencia del asset 3D: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Atribución: © Z-Anatomy contributors and BodyParts3D / DBCLS
- El código del visor de origen tiene una licencia distinta; este proyecto solo reutiliza el asset 3D con su licencia correspondiente.

El archivo está en `/public/models/brain.glb` y se carga con el decoder Draco local de `/public/draco/`. Para sustituirlo en el futuro, reemplaza el GLB manteniendo esa ruta o actualiza `brainModelPath` en `components/brain/brain-data.ts`. Si el nuevo archivo no usa Draco, retira el `DRACOLoader` de `components/brain/brain-model.tsx`.

## Variantes del holograma (31 de octubre de 2026)

El atlas original permanece intacto. Para evitar cientos de draw calls y su descarga
completa en teléfonos se incluyen dos adaptaciones bajo la misma licencia CC BY-SA 4.0:

| Archivo | Tamaño | Triángulos | Primitivas |
| --- | ---: | ---: | ---: |
| `brain.glb` (original) | 4,650,816 bytes | 1,383,522 | 563 |
| `brain-desktop.glb` | 1,425,420 bytes | 388,640 | 12 |
| `brain-mobile.glb` | 841,344 bytes | 212,933 | 12 |

Cambios: matrices del atlas horneadas; centrado y escala uniforme; unión por región;
simplificación con meshoptimizer; compresión Draco. Se conservan normales, UV y las
12 capas visibles. Se omiten soportes que el visor ya ocultaba y triángulos de nervios
extracraneales fuera del encuadre cerebral. No hay texturas que convertir a KTX2.
Los nombres de estructuras de origen se conservan en `extras.sourceStructures`.
Las cifras y el desglose por región se encuentran en `brain-optimization.json`.

La variante se elige antes de descargar, en `components/brain/brain-quality.ts`.
Si falla la variante de escritorio se intenta el original. En móvil se muestra el
fallback estático en vez de descargar automáticamente el atlas pesado.

Para reproducir la optimización, instalar herramientas **de desarrollo** en una carpeta
externa (no son dependencias del sitio):

```bash
npm install --prefix /tmp/microrealidades-brain-tools --no-audit --no-fund \
  @gltf-transform/core@4.3.0 @gltf-transform/extensions@4.3.0 \
  @gltf-transform/functions@4.3.0 draco3dgltf@1.5.7 meshoptimizer@0.25.0
BRAIN_TOOLS_ROOT=/tmp/microrealidades-brain-tools node scripts/optimize-brain.mjs
```

Ejecutar desde la raíz del proyecto con sus dependencias instaladas. El script nunca
escribe en `brain.glb` y comprueba el límite de 1.5 MB de la variante móvil.
