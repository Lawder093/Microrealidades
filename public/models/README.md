# Modelo cerebral de Microrealidades

La escena utiliza `brain.glb`, un modelo anatómico derivado de Z-Anatomy y BodyParts3D / DBCLS.

- Fuente: [itayinbarr/brainproject](https://github.com/itayinbarr/brainproject)
- Asset original: `brain-atlas/models/brain.glb`
- Licencia del asset 3D: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- Atribución: © Z-Anatomy contributors and BodyParts3D / DBCLS
- El código del visor de origen tiene una licencia distinta; este proyecto solo reutiliza el asset 3D con su licencia correspondiente.

El archivo está en `/public/models/brain.glb` y se carga con el decoder Draco local de `/public/draco/`. Para sustituirlo en el futuro, reemplaza el GLB manteniendo esa ruta o actualiza `brainModelPath` en `components/brain/brain-data.ts`. Si el nuevo archivo no usa Draco, retira el `DRACOLoader` de `components/brain/brain-model.tsx`.
