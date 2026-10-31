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
const { chromium, webkit } = require("@playwright/test");
const origin = (process.env.BRAIN_BASE_URL || 'http://127.0.0.1:3200').replace(/\/$/, '');
const report={cases:[],errors:[]};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function data(page){return page.locator('canvas[data-brain-tier]').evaluate(e=>({...e.dataset,width:e.width,height:e.height}));}
const camera=d=>(d.brainCamera||'0,0,0').split(',').map(Number);
const dist=d=>Math.hypot(...camera(d));
function changed(a,b){return Math.hypot(...camera(a).map((v,i)=>v-camera(b)[i]));}
async function ready(page){await page.locator('.brain-stage[aria-busy="false"]').waitFor({timeout:40000});await page.locator('canvas[data-brain-camera]').waitFor({timeout:15000});}
function capture(page,name){page.on('console',m=>{if(m.type()==='error')report.errors.push({case:name,error:m.text()})});page.on('pageerror',e=>report.errors.push({case:name,error:e.message}));}
async function touchDrag(cdp,x,y,dx,dy,steps=18){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps,id:0}]});await delay(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
async function desktop(browser){
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();capture(page,'chrome-desktop');
 await page.goto(origin+'/proyectos/cerebro?brainDebug=1',{waitUntil:'networkidle'});await ready(page);await page.waitForTimeout(2100);
 assert.equal(await page.getByRole('heading',{level:1}).innerText(),'El cerebro\nen movimiento.');
 assert.equal(await page.getByRole('button',{name:'Frontal',exact:true}).count(),1);
 const start=await data(page);await page.waitForTimeout(700);const idle=await data(page);assert.ok(Number(idle.brainFrames)-Number(start.brainFrames)<=2,'Reduced motion should stop idle frames');
 const box=await page.locator('canvas[data-brain-tier]').boundingBox();const x=box.x+box.width*.5,y=box.y+box.height*.5;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+150,y-100,{steps:30});await page.mouse.up();await page.waitForTimeout(1600);
 const rotated=await data(page);assert.ok(changed(start,rotated)>.2,'Drag should rotate camera');
 const beforeZoom=dist(rotated);await page.mouse.move(x,y);await page.mouse.wheel(0,-200);await page.waitForTimeout(700);assert.ok(dist(await data(page))<beforeZoom,'Wheel should zoom');
 await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();await page.waitForTimeout(1700);assert.ok(changed(start,await data(page))<.03,'Reset should restore camera');
 await page.getByRole('button',{name:'Cerebelo',exact:true}).click();await page.waitForTimeout(200);await page.locator('.brain-stage').screenshot({path:path.join(output, 'brain-focus-cerebellum.png')});
 await page.getByRole('button',{name:'Todo',exact:true}).click();await page.waitForTimeout(200);await page.screenshot({path:path.join(output, 'brain-desktop-final.png'),fullPage:true});
 const beforePreference=await data(page);
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(700);
 assert.ok(changed(beforePreference,await data(page))<.03,'Changing motion preference must preserve model framing');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(1700);
 const stopped=await data(page);await page.waitForTimeout(500);assert.ok(Number((await data(page)).brainFrames)-Number(stopped.brainFrames)<=2,'Restored reduced motion must stop idle rendering');
 report.cases.push({name:'chrome-desktop',checks:['shader','drag','wheel','reset','focus','reduced-motion-idle','live-motion-preference','layout'],metrics:await data(page)});await context.close();
}
async function mobile(browser,cores){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await context.addInitScript(n=>Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>n}),cores);
 const page=await context.newPage();capture(page,'chrome-mobile-'+cores);const assets=[];page.on('request',r=>{if(/brain.*\.(glb|js)/.test(r.url()))assets.push(r.url())});
 await page.goto(origin+'/proyectos/cerebro?brainDebug=1',{waitUntil:'networkidle'});await ready(page);await page.locator('.brain-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(2000);
 const first=await data(page);assert.equal(first.brainTier,cores===4?'low':'mobile');assert.equal(first.brainModel,'/models/brain-mobile.glb');assert.equal(first.width,cores===4?390:585);
 assert.ok(!assets.some(a=>/brain-desktop\.glb|\/models\/brain\.glb|brain-bloom/.test(a)),'Mobile must not load heavy model or bloom');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal overflow');
 const cdp=await context.newCDPSession(page);let b=await page.locator('canvas[data-brain-tier]').boundingBox();let x=b.x+b.width*.5,y=Math.max(250,b.y+b.height*.65);
 const scroll=await page.evaluate(()=>scrollY);await touchDrag(cdp,x,y,0,-160);await page.waitForTimeout(600);const afterScroll=await page.evaluate(()=>scrollY);assert.ok(afterScroll>scroll+30,'Unarmed canvas must allow native vertical scroll');
 await page.locator('.brain-stage').scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Activar giro y zoom',exact:true}).click();await page.waitForTimeout(100);b=await page.locator('canvas[data-brain-tier]').boundingBox();x=b.x+b.width*.5;y=b.y+b.height*.55;
 const before=await data(page);const scrollBefore=await page.evaluate(()=>scrollY);await touchDrag(cdp,x,y,100,-80);await page.waitForTimeout(400);const dragged=await data(page);assert.ok(changed(before,dragged)>.1,'One finger must rotate');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<5,'Armed rotation should not scroll');
 const zoomBefore=dist(dragged);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-25,y,id:0},{x:x+25,y,id:1}]});
 for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-25-i*3,y,id:0},{x:x+25+i*3,y,id:1}]});await delay(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);assert.ok(dist(await data(page))<zoomBefore,'Pinch should zoom in');
 await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();await page.waitForTimeout(1000);
 const from=await data(page),begin=Date.now();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
 for(let i=0;i<150;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+Math.sin(i/15)*80,y:y+Math.cos(i/20)*40,id:0}]});await delay(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const duration=(Date.now()-begin)/1000;const end=await data(page);const fps=(Number(end.brainFrames)-Number(from.brainFrames))/duration;
 assert.ok(fps >= 45, `Rendimiento de arrastre inferior a 45 FPS: ${fps.toFixed(1)}`);
 await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();await page.waitForTimeout(1400);await page.screenshot({path:path.join(output, `brain-mobile-${cores}.png`),fullPage:true});
 await page.setViewportSize({width:844,height:390});await page.locator('.brain-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('.brain-stage').screenshot({path:path.join(output, `brain-landscape-${cores}.png`)});
 await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'Inicio',exact:true}).click();await page.waitForURL(origin+'/');await page.locator('canvas[data-brain-tier]').waitFor({state:'detached',timeout:15000});
 report.cases.push({name:'chrome-mobile-'+cores,checks:['mobile-asset','dpr','scroll','one-finger','pinch','orientation','navigation'],fpsDuringDrag:Number(fps.toFixed(1)),durationSeconds:duration,metrics:end,assets});await context.close();
}
async function fallback(browser){const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(type==='webgl2'||type==='webgl')return null;return get.call(this,type,...rest)}});const page=await context.newPage();capture(page,'no-webgl');await page.goto(origin+'/proyectos/cerebro');await page.getByRole('status').filter({hasText:'vista 3D no está disponible'}).waitFor();assert.equal(await page.locator('canvas').count(),0);await page.screenshot({path:path.join(output, 'brain-fallback.png'),fullPage:true});report.cases.push({name:'no-webgl',checks:['static-fallback','no-canvas']});await context.close();}
async function engine(type,name,options={}){let browser;try{browser=await type.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,...options});capture(page,name);await page.goto(origin+'/proyectos/cerebro?brainDebug=1',{waitUntil:'networkidle'});await ready(page);await page.locator('.brain-stage').scrollIntoViewIfNeeded();await page.waitForTimeout(1200);await page.locator('.brain-stage').screenshot({path:path.join(output, `brain-${name}.png`)});report.cases.push({name,checks:['WebGL2','shader','asset-load'],metrics:await data(page)});}catch(error){report.cases.push({name,error:String(error)})}finally{await browser?.close()}}
(async()=>{let browser;try{browser=await chromium.launch({executablePath:chromePath,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});await desktop(browser);await mobile(browser,4);await mobile(browser,8);await fallback(browser);}catch(error){report.errors.push({case:'assertion',error:String(error),stack:error.stack});console.error(error);}finally{await browser?.close();}
await engine(webkit,'webkit',{isMobile:true,deviceScaleFactor:2});fs.writeFileSync(path.join(output, 'brain-e2e-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.errors.length||report.cases.some(c=>c.error))process.exitCode=1;})();
