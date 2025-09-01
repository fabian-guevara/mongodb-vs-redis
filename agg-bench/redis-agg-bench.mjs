import { createClient } from 'redis';
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.startsWith('--')?s.replace(/^--/,'').split('='):[s,true]));
const host=args.host, port=args.port, password=args.password, index=args.index||'idx:events';
const iters=parseInt(args.iters||'10',10), workers=parseInt(args.workers||'8',10);
if(!host||!port||!password){ console.error('Usage: node redis-agg-bench.mjs --host <HOST> --port <PORT> --password <PASSWORD> --index idx:events'); process.exit(1); }
const url=`rediss://:${password}@${host}:${port}`; const client=createClient({url}); client.on('error',e=>console.error('Redis error',e)); await client.connect();
function stats(ms){ const s=[...ms].sort((a,b)=>a-b); const avg=s.reduce((a,b)=>a+b,0)/s.length; const p=q=>s[Math.min(s.length-1,Math.floor(q*(s.length-1)))]; const mean=avg; const variance=s.reduce((acc,v)=>acc+(v-mean)*(v-mean),0)/s.length; const std=Math.sqrt(variance); return {p50:p(0.5),p95:p(0.95),p99:p(0.99),avg:mean,std}; }
const now=Date.now(); const from24h=now-24*3600*1000; const from7d=now-7*3600*24*1000;
async function time(fn){ const t0=performance.now(); await fn(); return performance.now()-t0; }
async function q1(){ return time(async()=>{ await client.ft.aggregate(index, `@ts:[${from24h} +inf]`, { STEPS:[{type:'GROUPBY',properties:['@event'],REDUCE:[{type:'COUNT',alias:'c'}]},{type:'SORTBY',BY:{property:'@c',direction:'DESC'},MAX:5}] }); }); }
async function q2(){ return time(async()=>{ await client.ft.aggregate(index, `@ts:[${from7d} +inf]`, { STEPS:[{type:'GROUPBY',properties:['@region'],REDUCE:[{type:'SUM',property:'@amount',alias:'sum'},{type:'AVG',property:'@amount',alias:'avg'}]},{type:'SORTBY',BY:{property:'@sum',direction:'DESC'}}] }); }); }
async function q3(){ return time(async()=>{ await client.ft.aggregate(index, '*', { STEPS:[{type:'GROUPBY',properties:['@sku'],REDUCE:[{type:'COUNT',alias:'c'}]},{type:'SORTBY',BY:{property:'@c',direction:'DESC'},MAX:20}] }); }); }
async function q4(){ return time(async()=>{ await client.ft.aggregate(index, '@tags:{promo}', { STEPS:[{type:'GROUPBY',properties:['@event'],REDUCE:[{type:'COUNT',alias:'c'}]},{type:'SORTBY',BY:{property:'@c',direction:'DESC'},MAX:5}] }); }); }
async function q5(){ return time(async()=>{ await client.ft.aggregate(index, `@ts:[${from24h} +inf]`, { STEPS:[{type:'APPLY',expression:'floor(@ts/3600000)',AS:'hour'},{type:'GROUPBY',properties:['@hour','@event'],REDUCE:[{type:'COUNT',alias:'c'}]},{type:'SORTBY',BY:{property:'@hour',direction:'ASC'}}] }); }); }
const queries=[['q1_topN_event_last24h',q1],['q2_revenue_by_region',q2],['q3_count_by_sku',q3],['q4_tag_filter_topN',q4],['q5_hourly_rollup_by_event',q5]];
console.log('engine,query_id,iters,workers,p50_ms,p95_ms,p99_ms,avg_ms,std_ms,total_ops');
for (const [qid, fn] of queries){ const times=[]; for(let r=0;r<iters;r++){ const batch=Array.from({length:workers},()=>fn()); const res=await Promise.all(batch); times.push(...res); } const st=stats(times); console.log(['redis',qid,iters,workers,st.p50.toFixed(2),st.p95.toFixed(2),st.p99.toFixed(2),st.avg.toFixed(2),st.std.toFixed(2),times.length].join(',')); } await client.quit();