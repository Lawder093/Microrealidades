import fs from 'node:fs/promises';
import * as THREE from 'three';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root = process.env.BRAIN_PROJECT_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsRoot = process.env.BRAIN_TOOLS_ROOT;
if (!toolsRoot) throw new Error('Define BRAIN_TOOLS_ROOT: carpeta con @gltf-transform/core, extensions, functions, draco3dgltf y meshoptimizer.');
const toolRequire=createRequire(path.join(toolsRoot,'package.json'));
const projectRequire=createRequire(path.join(root,'package.json'));
const {NodeIO,Document}=await import(toolRequire.resolve('@gltf-transform/core'));
const {ALL_EXTENSIONS}=await import(toolRequire.resolve('@gltf-transform/extensions'));
const {weld,simplifyPrimitive,prune,draco}=await import(toolRequire.resolve('@gltf-transform/functions'));
const {MeshoptSimplifier}=await import(toolRequire.resolve('meshoptimizer'));
const draco3d=toolRequire('draco3dgltf');
const ts=projectRequire('typescript');
const mod={exports:{}};
new Function('require','module','exports',ts.transpileModule(await fs.readFile(path.join(root,'components/brain/brain-anatomy.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(projectRequire,mod,mod.exports);
const {getBrainRegionFromNames,isFramingRegion}=mod.exports;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'draco3d.encoder':await draco3d.createEncoderModule()});
await MeshoptSimplifier.ready;
const source=await io.read(path.join(root,'public/models/brain.glb'));
const regions=new Map();const bounds=new THREE.Box3();const tmp=new THREE.Vector3();
// Se hornean las matrices del atlas sin alterar el GLB fuente. Los UV se conservan
// y viajan con sus vértices durante la simplificación; no se añaden texturas.
for(const node of source.getRoot().listNodes()){
 const mesh=node.getMesh();if(!mesh)continue;
 const world=new THREE.Matrix4().fromArray(node.getWorldMatrix());const normalMatrix=new THREE.Matrix3().getNormalMatrix(world);
 for(const prim of mesh.listPrimitives()){
  const region=getBrainRegionFromNames(node.getName()||mesh.getName(),prim.getMaterial()?.getName()||'');
  if(region==='support')continue;
  let dst=regions.get(region);if(!dst){dst={positions:[],normals:[],uv:[],indices:[],sourceNames:new Set()};regions.set(region,dst);}
  const p=prim.getAttribute('POSITION'),n=prim.getAttribute('NORMAL'),uv=prim.getAttribute('TEXCOORD_0'),idx=prim.getIndices();const offset=dst.positions.length/3;
  for(let i=0;i<p.getCount();i++){
   tmp.fromArray(p.getArray(),i*3).applyMatrix4(world);dst.positions.push(...tmp.toArray());if(isFramingRegion(region))bounds.expandByPoint(tmp);
   if(n)tmp.fromArray(n.getArray(),i*3).applyNormalMatrix(normalMatrix);else tmp.set(0,1,0);
   dst.normals.push(...tmp.toArray());dst.uv.push(uv?.getArray()[i*2]??0,uv?.getArray()[i*2+1]??0);
  }
  const indices=idx?.getArray()??Array.from({length:p.getCount()},(_,i)=>i);for(const i of indices)dst.indices.push(i+offset);
  dst.sourceNames.add(node.getName()||mesh.getName());
 }
}
const center=bounds.getCenter(new THREE.Vector3());const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;const scale=1.35/radius;
console.log('Core bounds',bounds.min.toArray(),bounds.max.toArray(),'scale',scale);
const budgets={desktop:{frontal:19000,parietal:6000,temporal:24000,occipital:15000,interior:45000,cerebellum:55000,whiteMatter:100000,nuclei:24000,ventricles:15000,brainstem:32000,tracts:15000,vessels:35000},mobile:{frontal:13000,parietal:4000,temporal:17000,occipital:10000,interior:22000,cerebellum:26000,whiteMatter:40000,nuclei:15000,ventricles:8000,brainstem:18000,tracts:8000,vessels:16000}};
const report={sourceBytes:(await fs.stat(path.join(root,'public/models/brain.glb'))).size,sourceCenter:center.toArray(),sourceRadius:radius,variants:{}};
for(const [quality,limits] of Object.entries(budgets)){
 const doc=new Document();const buffer=doc.createBuffer();const scene=doc.createScene('Microrealidades / '+quality);const counts={};
 for(const [region,data]of regions){
  const positions=new Float32Array(data.positions.length);for(let i=0;i<data.positions.length;i+=3){tmp.fromArray(data.positions,i).sub(center).multiplyScalar(scale);positions.set(tmp.toArray(),i);}
  let indices=data.indices;
  // El atlas incluye nervios extracraneales muy largos. Solo la variante de
  // visualización omite sus triángulos fuera del volumen de encuadre cerebral.
  if(region==='vessels'){
   const clip=bounds.clone().expandByScalar(.012);indices=[];
   for(let i=0;i<data.indices.length;i+=3){const a=data.indices[i],b=data.indices[i+1],c=data.indices[i+2];tmp.set((data.positions[a*3]+data.positions[b*3]+data.positions[c*3])/3,(data.positions[a*3+1]+data.positions[b*3+1]+data.positions[c*3+1])/3,(data.positions[a*3+2]+data.positions[b*3+2]+data.positions[c*3+2])/3);if(clip.containsPoint(tmp))indices.push(a,b,c);}
  }
  const accessor=(type,array)=>doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const prim=doc.createPrimitive().setAttribute('POSITION',accessor('VEC3',positions)).setAttribute('NORMAL',accessor('VEC3',new Float32Array(data.normals))).setAttribute('TEXCOORD_0',accessor('VEC2',new Float32Array(data.uv))).setIndices(accessor('SCALAR',new Uint32Array(indices))).setMaterial(doc.createMaterial(region).setDoubleSided(true).setBaseColorFactor([.7,.85,.85,1]));
  const mesh=doc.createMesh(region).addPrimitive(prim);scene.addChild(doc.createNode(region).setMesh(mesh).setExtras({brainRegion:region,sourceStructures:[...data.sourceNames]}));
 }
 await doc.transform(weld());
 for(const node of scene.listChildren()){
  const prim=node.getMesh().listPrimitives()[0];const before=prim.getIndices().getCount()/3;const target=limits[node.getName()]??20000;
  simplifyPrimitive(prim,{simplifier:MeshoptSimplifier,ratio:Math.min(1,target/before),error:quality==='mobile'?.008:.003,lockBorder:false});
  counts[node.getName()]={before,after:prim.getIndices().getCount()/3};
 }
 await doc.transform(prune({keepAttributes:true}),draco({method:'edgebreaker',encodeSpeed:5,decodeSpeed:5,quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}));
 const out=path.join(root,`public/models/brain-${quality}.glb`);await io.write(out,doc);
 report.variants[quality]={bytes:(await fs.stat(out)).size,triangles:Object.values(counts).reduce((s,v)=>s+v.after,0),primitives:scene.listChildren().length,regions:counts};
 console.log(quality,report.variants[quality]);
 if(quality==='mobile'&&report.variants[quality].bytes>1500000)throw new Error('El GLB móvil supera el presupuesto de 1.5 MB.');
}
await fs.writeFile(path.join(root,'public/models/brain-optimization.json'),JSON.stringify(report,null,2)+'\n');
