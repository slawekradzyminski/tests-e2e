import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const jobs = [
  ['initial-deterministic', 'scale-deterministic-cost.json'],
  ['deterministic', 'scale-deterministic-final-cost.json'],
  ['initial-hybrid', 'scale-initial-cost.json'],
  ['initial-actions', 'scale-actions-initial-cost.json'],
  ['initial-judgments', 'scale-judgments-initial-cost.json'],
  ['live-hybrid', 'scale-final-live-cost.json'],
  ['live-actions', 'scale-actions-live-cost.json'],
  ['judgments-save-race', 'scale-judgments-save-race-cost.json'],
  ['live-judgments', 'scale-judgments-final-cost.json'],
  ['warm-hybrid', 'scale-warm-cost.json'],
  ['fault-original', 'fault-judgments-initial-cost.json'],
  ['fault-refined', 'fault-judgments-refined-cost.json'],
  ['fault-heldout', 'fault-heldout-cost.json'],
  ['flow-original', 'fault-flows-cost.json'],
  ['flow-broad', 'fault-flows-broad-cost.json'],
];
const category = file => /home|authenticated-header|logged-out-header|login|register/.test(file) ? 'navigation-and-authentication' : /cart|checkout|product-details|products.e2e|order-details/.test(file) && !file.includes('admin') ? 'commerce' : file.includes('profile') ? 'profile' : 'administration';
const add = rows => ({ steps: rows.length, calls: rows.reduce((n,r)=>n+r.modelCalls,0), estimatedUsd: rows.reduce((n,r)=>n+r.estimatedUsd,0), totalStepSeconds: rows.reduce((n,r)=>n+r.durationMs/1000,0) });
const distribution = rows => {
  if (!rows.length) return null;
  const costs = rows.map(r=>r.estimatedUsd).sort((a,b)=>a-b);
  const seconds = rows.map(r=>r.durationMs/1000).sort((a,b)=>a-b);
  const percentile=(values,p)=>values[Math.min(values.length-1,Math.ceil(values.length*p)-1)];
  return { count: rows.length, meanUsd: costs.reduce((n,x)=>n+x,0)/costs.length, minUsd: costs[0], medianUsd: percentile(costs,.5), p90Usd: percentile(costs,.9), maxUsd: costs.at(-1), medianSeconds: percentile(seconds,.5), p90Seconds: percentile(seconds,.9) };
};
const runs = Object.fromEntries(jobs.filter(([,file])=>existsSync(join('evaluation',file))).map(([name,file])=>{
  const data=JSON.parse(readFileSync(join('evaluation',file),'utf8'));
  const run=JSON.parse(readFileSync(data.report,'utf8')).run;
  const selected=run.results.filter(r=>r.selected);
  const byFile=Object.fromEntries([...new Set(data.steps.map(r=>r.file))].map(file=>[file,add(data.steps.filter(r=>r.file===file))]));
  const byCategory=Object.fromEntries([...new Set(data.steps.map(r=>category(r.file)))].map(c=>[c,add(data.steps.filter(r=>category(r.file)===c))]));
  const scenarios=selected.map(result=>{ const rows=data.steps.filter(row=>row.file===result.file&&JSON.stringify(row.titlePath)===JSON.stringify(result.titlePath)&&row.repeat===result.repeat); return {file:result.file,titlePath:result.titlePath,...add(rows)}; });
  const byApiDistribution=Object.fromEntries([...new Set(data.steps.map(r=>r.api))].map(api=>[api,distribution(data.steps.filter(r=>r.api===api&&r.modelCalls>0))]));
  const actionCache={}; for(const step of data.steps.filter(r=>r.api==='agent.act')) { const mode=step.actionCache??'off'; actionCache[mode]=(actionCache[mode]??0)+1; }
  return [name,{ costFile:file, summary:data.summary, durationSeconds:(Date.parse(run.finishedAt)-Date.parse(run.startedAt))/1000, totals:data.totals, byApi:data.byApi, byApiDistribution, byFile, byCategory, scenarios, actionCache, activeScenarios:selected.filter(r=>r.attempts.some(a=>a.steps.some(s=>s.kind==='agent'))).length }];
}));
const readProbes=directory=>existsSync(directory)?readdirSync(directory).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(directory,f),'utf8'))).sort((a,b)=>a.timestamp.localeCompare(b.timestamp)):[];
const probeSources={ original:'.e2e/judgment-probes', refined:'.e2e/judgment-probes-refined', heldout:'.e2e/heldout-probes', flowOriginal:'.e2e/flow-probes', flowBroad:'.e2e/flow-probes-broad' };
const probeResults=Object.fromEntries(Object.entries(probeSources).map(([phase,directory])=>{
  const rows=readProbes(directory); const groups={};
  for(const row of rows) { const key=[row.kind,row.prompt??row.flow,row.verdict].join('/'); groups[key]=(groups[key]??0)+1; }
  return [phase,{ groups, rows }];
}));
const result={ updatedOn:'2026-10-02', runs, probeResults, totalCurrentExpansionEstimatedUsd:Object.values(runs).reduce((n,r)=>n+r.totals.estimatedUsd,0), limitations:'Small local experiment with one Sonnet model and injected screen/state faults. Initial failures retained. Refined faults informed two prompts; heldout faults used unchanged refined prompts. Screen-only checks cannot verify persistence. Price projections assume comparable tokens/cache behaviour. Step seconds are not additive wall-clock time under parallel workers.' };
writeFileSync('evaluation/scale-summary.json',JSON.stringify(result,null,2)+'\n');
for(const [name,r] of Object.entries(runs)) console.log(`${name}: ${r.summary.passed}/${r.summary.executed}, ${r.totals.steps} steps, ${r.durationSeconds.toFixed(2)}s, $${r.totals.estimatedUsd.toFixed(6)}`);
console.log(`Total current expansion: $${result.totalCurrentExpansionEstimatedUsd.toFixed(6)}`);
