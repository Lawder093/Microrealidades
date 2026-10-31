import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";

// Herramientas de QA externas al bundle del sitio (ver docs/brain-hologram.md).
const require = createRequire(path.join(process.env.BRAIN_TOOLS_ROOT || process.cwd(), "package.json"));
const output = process.env.BRAIN_REPORT_DIR || path.join(os.tmpdir(), "microrealidades-brain-check");
fs.mkdirSync(output, { recursive: true });
const chromePath = process.env.BRAIN_CHROME_PATH || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined);
const { chromium } = require("@playwright/test");
const origin = (process.env.BRAIN_BASE_URL || 'http://127.0.0.1:3200').replace(/\/$/, '');const report={cases:[],errors:[]};
async function ready(page){await page.locator('.brain-stage[aria-busy="false"]').waitFor({timeout:40000});await page.locator('canvas[data-brain-tier]').waitFor({timeout:15000});await page.locator('.brain-stage').scrollIntoViewIfNeeded();}
async function metrics(page){return page.locator('canvas').evaluate(e=>({...e.dataset}));}
function camera(d){return d.brainCamera.split(',').map(Number)}function change(a,b){return Math.hypot(...camera(a).map((v,i)=>v-camera(b)[i]))}
async function tracker(){
 window.__brainContexts=[];const get=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){const gl=get.call(this,type,...args);if(type==='webgl2'&&gl&&!gl.__brainTracked){gl.__brainTracked=true;const info={lost:false,created:0,deleted:0,buffers:new Set(),textures:new Set(),programs:new Set()};window.__brainContexts.push(info);
 for(const [create,remove,store]of [['createBuffer','deleteBuffer','buffers'],['createTexture','deleteTexture','textures'],['createProgram','deleteProgram','programs']]){const a=gl[create].bind(gl),b=gl[remove].bind(gl);gl[create]=function(...v){const item=a(...v);if(item){info[store].add(item);info.created++}return item};gl[remove]=function(item){if(info[store].delete(item))info.deleted++;return b(item)}}
 const ext=gl.getExtension.bind(gl);let patched=false;gl.getExtension=function(name){const result=ext(name);if(name==='WEBGL_lose_context'&&result&&!patched){patched=true;const lose=result.loseContext.bind(result);result.loseContext=function(){info.beforeLoss={buffers:info.buffers.size,textures:info.textures.size,programs:info.programs.size};info.lost=true;return lose()}}return result};}return gl;};
}
(async()=>{let browser;try{browser=await chromium.launch({executablePath:chromePath,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1280,height:600}});await context.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4}));await context.addInitScript(tracker);const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(origin+'/proyectos/cerebro?brainDebug=1',{waitUntil:'networkidle'});await ready(page);await page.waitForTimeout(2100);
 let box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.5+80,box.y+box.height*.4+35,{steps:15});await page.mouse.up();await page.waitForTimeout(1600);const a=await metrics(page);await page.waitForTimeout(600);const b=await metrics(page);assert.ok(change(a,b)<.005,'Autorotation should stay paused after drag');await page.waitForTimeout(3100);assert.ok(change(b,await metrics(page))>.01,'Autorotation should resume');report.cases.push({name:'auto-rotation',pause:true,resume:true});
 await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.brainActive==='false');let before=await metrics(page);await page.waitForTimeout(700);assert.equal((await metrics(page)).brainFrames,before.brainFrames);report.cases.push({name:'offscreen',framesStopped:true});
 for(let i=0;i<3;i++){
  await page.getByRole('link',{name:'Proyectos',exact:true}).click();await page.waitForURL(origin+'/proyectos');await page.locator('canvas[data-brain-tier]').waitFor({state:'detached'});await page.waitForTimeout(1300);
  const stats=await page.evaluate(()=>window.__brainContexts.map(s=>({lost:s.lost,beforeLoss:s.beforeLoss,created:s.created,deleted:s.deleted,buffers:s.buffers.size,textures:s.textures.size,programs:s.programs.size})));
  assert.ok(stats.every(s=>s.lost),'No active GL contexts should survive leaving route');assert.ok(stats.every(s=>s.buffers===0&&s.programs===0),'Owned buffers and programs should be deleted');
  report.cases.push({name:'navigation-disposal-'+(i+1),contexts:stats});
  await page.locator('a[href="/proyectos/cerebro"]').first().click();await page.waitForURL(url=>url.origin===origin&&url.pathname==='/proyectos/cerebro');await ready(page);
 }
 await page.locator('canvas').evaluate(e=>e.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.getByRole('status').filter({hasText:'vista 3D no está disponible'}).waitFor();await page.locator('canvas').waitFor({state:'detached'});report.cases.push({name:'context-loss',fallback:true});await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await mobile.newPage();const requests=[];p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/models/brain-mobile.glb',route=>route.fulfill({status:404,body:'not found'}));await p.goto(origin+'/proyectos/cerebro');await p.getByRole('status').filter({hasText:'vista 3D no está disponible'}).waitFor({timeout:15000});assert.ok(!requests.some(r=>r.endsWith('/models/brain.glb')));report.cases.push({name:'mobile-load-error',staticFallback:true,noHeavyDownload:true});await mobile.close();
 const desktop=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});await desktop.addInitScript(()=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4}));const p2=await desktop.newPage();const req=[];p2.on('request',r=>req.push(r.url()));p2.on('pageerror',e=>report.errors.push(e.message));await p2.route('**/models/brain-desktop.glb',r=>r.fulfill({status:404,body:'not found'}));await p2.goto(origin+'/proyectos/cerebro?brainDebug=1');await ready(p2);assert.ok(req.some(r=>r.endsWith('/models/brain.glb')));report.cases.push({name:'desktop-load-error',originalFallback:true});await desktop.close();
}catch(error){report.errors.push(String(error));console.error(error);}finally{fs.writeFileSync(path.join(output, 'brain-lifecycle-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser?.close();if(report.errors.length)process.exitCode=1}})();
