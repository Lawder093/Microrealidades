import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const root=fileURLToPath(new URL('..',import.meta.url));
const modules=new Map();
function load(relative){
 const file=path.resolve(root,relative);if(modules.has(file))return modules.get(file).exports;
 const compiled={exports:{}};modules.set(file,compiled);
 const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 new Function('require','module','exports',result.outputText)((name)=>name==='three'?THREE:name.startsWith('@/')?load(name.slice(2)+'.ts'):require(name),compiled,compiled.exports);
 return compiled.exports;
}
const anatomy=load('components/brain/brain-anatomy.ts');
const resources=load('components/brain/brain-resources.ts');
const {chooseBrainQuality}=load('components/brain/brain-quality.ts');
const {applyBrainHologram}=load('components/brain/brain-hologram-material.ts');

function glb(name){const buffer=fs.readFileSync(path.join(root,'public/models',name));assert.equal(buffer.readUInt32LE(0),0x46546c67);return {buffer,json:JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString())};}

test('mobile atlas stays below 1.5 MB, compressed and selectable by all anatomical regions',()=>{
 for(const [file,budget]of [['brain-mobile.glb',1500000],['brain-desktop.glb',1800000]]){
  const {buffer,json}=glb(file);assert.ok(buffer.length<budget);
  assert.ok(json.extensionsRequired.includes('KHR_draco_mesh_compression'));
  const primitives=json.meshes.flatMap(mesh=>mesh.primitives);assert.ok(primitives.length<=12);
  const regions=json.nodes.filter(node=>node.mesh!==undefined).map(node=>node.extras.brainRegion);
  for(const region of anatomy.brainRegionNames.filter(region=>region!=='support'))assert.ok(regions.includes(region),region);
  assert.ok(primitives.every(primitive=>primitive.attributes.NORMAL!==undefined));
  assert.ok(primitives.every(primitive=>primitive.attributes.TEXCOORD_0!==undefined));
  const triangles=primitives.reduce((sum,primitive)=>sum+json.accessors[primitive.indices].count/3,0);
  assert.ok(triangles<(file.includes('mobile')?230000:420000));
 }
});

test('mobile quality never selects the full atlas, even when CPU information is absent',()=>{
 assert.equal(chooseBrainQuality(true).modelPath,'/models/brain-mobile.glb');
 assert.equal(chooseBrainQuality(true).maxDpr,1);
 assert.equal(chooseBrainQuality(true,8).maxDpr,1.5);
 assert.equal(chooseBrainQuality(true,8).bloom,false);
 assert.equal(chooseBrainQuality(false,8).maxDpr,2);
});

test('normalization centers an offset atlas without changing its proportions or source transform',()=>{
 const source=new THREE.Group();const geometry=new THREE.BoxGeometry(.15,.18,.21);geometry.translate(0,1.6,0);
 const mesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial());mesh.name='Frontal cortex';source.add(mesh);
 const mats=Object.fromEntries(anatomy.brainRegionNames.filter(r=>r!=='support').map(r=>[r,new THREE.MeshPhysicalMaterial()]));
 const first=resources.normalizeBrainScene(source,mats);const second=resources.normalizeBrainScene(source,mats);
 for(const result of [first,second]){
  const box=new THREE.Box3().setFromObject(result.scene);assert.ok(box.getCenter(new THREE.Vector3()).length()<1e-5);
  const size=box.getSize(new THREE.Vector3());assert.ok(Math.abs(size.x/size.y-.15/.18)<1e-5);
  assert.ok(result.volume.radius>0);assert.ok(result.volume.radius<=1.35001);
 }
 assert.deepEqual(source.position.toArray(),[0,0,0]);assert.equal(source.parent,null);
 geometry.dispose();mesh.material.dispose();Object.values(mats).forEach(m=>m.dispose());
});

test('disposal releases shared geometry, material and texture once per owned asset',()=>{
 const source=new THREE.Group();const geometry=new THREE.BoxGeometry();const texture=new THREE.Texture();
 const a=new THREE.MeshPhysicalMaterial({map:texture});const b=new THREE.MeshPhysicalMaterial({map:texture});
 source.add(new THREE.Mesh(geometry,a),new THREE.Mesh(geometry,b));
 const counts={geometry:0,texture:0,a:0,b:0};
 geometry.addEventListener('dispose',()=>counts.geometry++);texture.addEventListener('dispose',()=>counts.texture++);
 a.addEventListener('dispose',()=>counts.a++);b.addEventListener('dispose',()=>counts.b++);
 resources.disposeBrainSource(source,new Set([a,b]));assert.deepEqual(counts,{geometry:1,texture:1,a:1,b:1});
});

test('hologram extends the physical shader and reduced motion disables both scan motion and glitch',()=>{
 const material=new THREE.MeshPhysicalMaterial();const animation={time:{value:0},reveal:{value:1}};
 applyBrainHologram(material,animation,true);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.physical.vertexShader,fragmentShader:THREE.ShaderLib.physical.fragmentShader};
 material.onBeforeCompile(shader,null);
 assert.equal(shader.uniforms.uTime,animation.time);assert.equal(shader.uniforms.uGlitchIntensity.value,0);
 assert.equal(shader.uniforms.uScanlineSpeed.value,0);assert.ok(shader.fragmentShader.includes('fwidth(phase)'));
 applyBrainHologram(material,animation,false);assert.ok(shader.uniforms.uScanlineSpeed.value>0);assert.ok(shader.uniforms.uGlitchIntensity.value>0);
 applyBrainHologram(material,animation,true);assert.equal(shader.uniforms.uScanlineSpeed.value,0);assert.equal(shader.uniforms.uGlitchIntensity.value,0);
 assert.ok(shader.fragmentShader.includes('totalEmissiveRadiance +='));assert.ok(shader.vertexShader.includes('vHologramWorld'));
 material.dispose();
});
