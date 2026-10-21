// Diagnostic only: no deployment, email or application mutations. The staging
// credential stays in this protected runner's mode-0600 temporary env file.
// Profiles contain stacks/times, never request bodies, credentials or DB rows.
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const WS = createRequire(require.resolve("wrangler"))("ws");
let phase = "configuration", temp, child, ws;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  const db = new URL(process.env.DATABASE_URL ?? "");
  if (db.hostname !== "ep-ancient-dawn-zacmh8ub.c-2.eu-west-2.aws.neon.tech" || db.pathname !== "/odyssey") throw Error();
  const root = path.resolve(".cloudflare-build");
  await mkdir(root, {recursive: true});
  temp = await mkdtemp(path.join(root, "transport-"));
  await writeFile(path.join(temp, ".dev.vars"), `DATABASE_URL=${JSON.stringify(db.href)}\n`, {mode: 0o600});
  await writeFile(path.join(temp, "probe.ts"), `
import { Client as Neon } from '@neondatabase/serverless';
import { Client as Postgres } from 'pg';
export default { async fetch(request, env) {
  if (new URL(request.url).pathname === '/health') return new Response('ok');
  const Client = new URL(request.url).pathname === '/ws' ? Neon : Postgres;
  const client = new Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return new Response('ok');
  } catch { return new Response('Unavailable', {status:503}); }
  finally { await client.end().catch(()=>{}); }
}};`);
  await writeFile(path.join(temp, "wrangler.json"), JSON.stringify({
    name:"odyssey-transport-local-probe", main:"probe.ts", compatibility_date:"2026-10-17",
    compatibility_flags:["nodejs_compat"], observability:{enabled:false}
  }));
  const {DATABASE_URL: ignored, ...cleanEnv} = process.env;
  child = spawn("pnpm", ["exec","wrangler","dev","--local","--config",path.join(temp,"wrangler.json"),"--ip","127.0.0.1","--port","43229","--inspector-port","43230","--env-file",path.join(temp,".dev.vars")], {
    env:{...cleanEnv,WRANGLER_LOG_PATH:path.join(temp,"wrangler.log")}, stdio:"ignore"
  });
  phase = "local Worker startup";
  let ready = false;
  for(let i=0;i<60;i++) {
    try { const r=await fetch("http://127.0.0.1:43229/health",{signal:AbortSignal.timeout(1000)}); await r.body?.cancel(); if(r.ok){ready=true;break;} } catch {}
    await delay(500);
  }
  if (!ready) throw Error();
  ws = new WS("ws://127.0.0.1:43230/ws",{origin:"http://localhost:43230"});
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;setTimeout(()=>reject(Error()),10000).unref()});
  let seq=10000; const pending=new Map();
  ws.onmessage=({data})=>{const m=JSON.parse(data);const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error()):p.resolve(m.result)};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));setTimeout(()=>reject(Error()),10000).unref()});
  await call("Profiler.enable");
  await call("Profiler.setSamplingInterval",{interval:100});
  const out=path.join(root,"transport-profiles"); await mkdir(out,{recursive:true});
  for (const [transport,count,kind] of [["ws",1,"first"],["ws",5,"warm"],["tcp",1,"first"],["tcp",5,"warm"]]) {
    phase=`${transport} ${kind}`;
    await call("Profiler.start");
    const elapsed=[];
    for(let i=0;i<count;i++) {
      const start=performance.now();
      const r=await fetch(`http://127.0.0.1:43229/${transport}`,{signal:AbortSignal.timeout(20000)});
      await r.body?.cancel(); if(!r.ok)throw Error(); elapsed.push(Math.round(performance.now()-start));
    }
    const {profile}=await call("Profiler.stop");
    await writeFile(path.join(out,`${transport}-${kind}.cpuprofile`),JSON.stringify(profile));
    const nodes=new Map(profile.nodes.map(n=>[n.id,n]));const totals=new Map();
    for(let i=0;i<(profile.samples??[]).length;i++) {
      const n=nodes.get(profile.samples[i]); const name=n.callFrame.functionName+" @ "+n.callFrame.url+":"+n.callFrame.lineNumber;
      totals.set(name,(totals.get(name)??0)+(profile.timeDeltas[i]??0));
    }
    console.log(JSON.stringify({phase,elapsedMs:elapsed,hotspots:[...totals].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([name,us])=>({name,ms:+(us/1000).toFixed(2)}))}));
  }
  console.log("PASS: diagnostic profiles captured; local sampling/elapsed times are not deployed billed CPU acceptance.");
} catch {
  console.error(`FAIL: ${phase}; sensitive diagnostics omitted.`); process.exitCode=1;
} finally {
  ws?.close(); child?.kill("SIGTERM");
  if(child) await delay(1000);
  if(temp) await rm(temp,{recursive:true,force:true});
}
