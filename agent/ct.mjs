#!/usr/bin/env node
// CapitalTrack agent CLI. One command per change, every write logged to ct_audit (local jsonl fallback).
// Usage: node ct.mjs <cmd> ... ; add --why "reason" to every write. --dry previews without writing.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const API = 'https://pkiliwsmcxseoczfsfar.supabase.co/rest/v1';
const KEY = 'sb_publishable_32d3KFrWN_SVr5sdEv7ekQ_1Ycwv5Qy';
const STAGES = ['Backlog', 'Wishlist', 'Warm', 'Contacted', 'In Process', 'Committed', 'Passed'];
const KINDS = ['email', 'call', 'meeting', 'scheduled', 'note'];
const TIER = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' };
const FALLBACK_LOG = process.env.CT_AUDIT_FALLBACK || path.join(HERE, 'audit-fallback.jsonl');

async function api(p, method = 'GET', body, prefer) {
  const r = await fetch(API + p, { method, headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const t = await r.text(); let d; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) throw new Error((d && (d.message || d.msg)) || 'HTTP ' + r.status + ' ' + p);
  return d;
}
function args(argv) {
  const pos = [], opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); if (['dry', 'json', 'forward', 'if-empty'].includes(k)) opt[k] = true; else opt[k] = argv[++i]; } else pos.push(a);
  }
  return { pos, opt };
}
let FIRMS_CACHE;
async function loadFirmsAsync() {
  if (FIRMS_CACHE) return FIRMS_CACHE;
  const local = path.join(HERE, '..', 'firms-data.js');
  const src = fs.existsSync(local) ? fs.readFileSync(local, 'utf8') : await (await fetch('https://zakgedi.github.io/capitaltrack/firms-data.js?x=' + Date.now())).text();
  const ctx = {}; vm.runInNewContext(src, ctx);
  return (FIRMS_CACHE = ctx.firms);
}
let FIRMS, CUSTOM;
async function resolveFirm(q) {
  FIRMS ||= await loadFirmsAsync();
  CUSTOM ||= await api('/ct_custom_firms?select=id,name');
  const all = [...FIRMS.map((f, i) => ({ id: i, name: f.name })), ...CUSTOM.map((c) => ({ id: 10000 + c.id, name: c.name }))];
  if (/^\d+$/.test(q)) { const hit = all.find((f) => f.id === +q); if (hit) return hit; }
  const n = q.toLowerCase();
  const exact = all.filter((f) => f.name.toLowerCase() === n);
  if (exact.length === 1) return exact[0];
  const subs = all.filter((f) => f.name.toLowerCase().includes(n));
  if (subs.length === 1) return subs[0];
  throw new Error(subs.length ? 'ambiguous "' + q + '": ' + subs.slice(0, 8).map((f) => f.id + ' ' + f.name).join(' | ') : 'no firm matches "' + q + '"');
}
let auditTable = null;
async function audit(entry) {
  const row = { at: new Date().toISOString(), actor: entry.actor || 'agent', action: entry.action, firm_id: entry.firm_id ?? null, firm_name: entry.firm_name || '', detail: entry.detail || {}, why: entry.why || '' };
  if (auditTable === null) { try { await api('/ct_audit?select=id&limit=1'); auditTable = true; } catch { auditTable = false; } }
  if (auditTable) { await api('/ct_audit', 'POST', row, 'return=minimal'); return 'audit:db'; }
  fs.appendFileSync(FALLBACK_LOG, JSON.stringify(row) + '\n'); return 'audit:local-fallback (run ct_audit SQL)';
}
const pipeRow = async (id) => (await api('/ct_pipeline?firm_id=eq.' + id + '&select=*'))[0] || null;
async function prioTagIds() { const tags = await api('/ct_tags?select=id,name'); const m = {}; for (const t of tags) m[t.name.toLowerCase()] = t.id; return m; }

async function srcSeen(src) { return (await CMDS.log({ opt: { n: 5000 } })).some((e) => (e.action === 'touch' || e.action === 'touch_edit') && e.detail && e.detail.src === src); }
const CMDS = {
  async find({ pos }) { FIRMS ||= await loadFirmsAsync(); CUSTOM ||= await api('/ct_custom_firms?select=id,name'); const n = pos.join(' ').toLowerCase(); return [...FIRMS.map((f, i) => ({ id: i, name: f.name })), ...CUSTOM.map((c) => ({ id: 10000 + c.id, name: c.name }))].filter((f) => f.name.toLowerCase().includes(n)).slice(0, 15); },
  async show({ pos }) {
    const f = await resolveFirm(pos.join(' ')); const [row, touches, commit, next] = await Promise.all([pipeRow(f.id), api('/ct_touches?firm_id=eq.' + f.id + '&select=id,kind,note,owner,touched_at&order=touched_at.desc&limit=10'), api('/ct_commitments?firm_id=eq.' + f.id + '&select=amount'), Promise.resolve(null)]);
    const tags = await api('/ct_card_tags?firm_id=eq.' + f.id + '&select=tag_id'); const all = await api('/ct_tags?select=id,name');
    return { firm: f, pipeline: row, commitment: commit[0]?.amount ?? null, tags: tags.map((t) => all.find((x) => x.id === t.tag_id)?.name), touches };
  },
  async pipe() { const rows = await api('/ct_pipeline?select=firm_id,stage,owner,tier,next_step,pinned&order=stage.asc'); FIRMS ||= await loadFirmsAsync(); CUSTOM ||= await api('/ct_custom_firms?select=id,name'); const nm = (id) => id >= 10000 ? CUSTOM.find((c) => c.id === id - 10000)?.name : FIRMS[id]?.name; return rows.map((r) => ({ id: r.firm_id, name: nm(r.firm_id), stage: r.stage, owner: r.owner, stars: { S: 5, A: 4, B: 3, C: 2, D: 1 }[r.tier] || 0, next: r.next_step })); },
  async touch({ pos, opt }) {
    const [q, kind] = pos; if (!KINDS.includes(kind)) throw new Error('kind must be ' + KINDS.join('|'));
    const f = await resolveFirm(q); const row = await pipeRow(f.id); if (!row) throw new Error(f.name + ' is not on the board; run add first');
    let sent = null, day;
    const exact = opt['sent-at'] || opt.at;
    if (exact) { const d = new Date(exact); if (isNaN(d)) throw new Error('--sent-at must be an ISO timestamp'); sent = d.toISOString(); day = d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); }
    else if (opt.date) day = opt.date;
    const rec = { firm_id: f.id, kind, note: opt.note || '', owner: opt.owner ?? row.owner ?? '', ...(day ? { touched_at: day } : {}), ...(sent ? { sent_at: sent } : {}), ...(opt.summary ? { summary: opt.summary } : {}), ...(opt.people ? { people: opt.people.split(',').map((x) => x.trim()).filter(Boolean) } : {}) };
    if (opt.src) {
      const seen = await srcSeen(opt.src);
      if (seen) return { ok: true, skipped: 'duplicate src ' + opt.src };
    }
    if (opt.dry) return { dry: true, would: rec, src: opt.src || null };
    const r = await api('/ct_touches', 'POST', rec, 'return=representation');
    return { ok: true, touch: r[0], log: await audit({ action: 'touch', firm_id: f.id, firm_name: f.name, detail: { ...rec, ...(opt.src ? { src: opt.src } : {}) }, why: opt.why }) };
  },
  async 'touch-delete'({ pos, opt }) {
    const tid = +pos[0]; const t = (await api('/ct_touches?id=eq.' + tid + '&select=*'))[0]; if (!t) throw new Error('no touch ' + tid);
    if (opt.dry) return { dry: true, would_delete: t };
    await api('/ct_touches?id=eq.' + tid, 'DELETE', undefined, 'return=minimal');
    return { ok: true, deleted: t, log: await audit({ action: 'touch_delete', firm_id: t.firm_id, detail: t, why: opt.why }) };
  },
  async 'touch-edit'({ pos, opt }) {
    const tid = +pos[0]; const t = (await api('/ct_touches?id=eq.' + tid + '&select=*'))[0]; if (!t) throw new Error('no touch ' + tid);
    const patch = {}; const exact = opt['sent-at'] || opt.at;
    if (exact) { const d = new Date(exact); if (isNaN(d)) throw new Error('--at must be an ISO timestamp'); patch.sent_at = d.toISOString(); patch.touched_at = d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); }
    if (opt.summary !== undefined) patch.summary = opt.summary; if (opt.people !== undefined) patch.people = opt.people.split(',').map((x) => x.trim()).filter(Boolean); if (opt.note !== undefined) patch.note = opt.note; if (opt.owner !== undefined) patch.owner = opt.owner; if (opt.kind) patch.kind = opt.kind;
    if (!Object.keys(patch).length) throw new Error('nothing to change: use --at, --summary, --people, --note, --owner or --kind');
    if (opt.src && await srcSeen(opt.src)) return { ok: true, skipped: 'duplicate src ' + opt.src };
    if (opt.dry) return { dry: true, from: t, patch };
    await api('/ct_touches?id=eq.' + tid, 'PATCH', patch, 'return=minimal');
    return { ok: true, touch: tid, patch, log: await audit({ action: 'touch_edit', firm_id: t.firm_id, detail: { touch_id: tid, from: { touched_at: t.touched_at, sent_at: t.sent_at || null }, to: patch, ...(opt.src ? { src: opt.src } : {}) }, why: opt.why }) };
  },
  async meetings({ pos, opt }) {
    const f = pos.length ? await resolveFirm(pos.join(' ')) : null;
    return api('/ct_meetings?select=*' + (f ? '&firm_id=eq.' + f.id : '') + '&order=starts_at.asc');
  },
  async schedule({ pos, opt }) {
    const f = await resolveFirm(pos.join(' '));
    if (!opt.src) throw new Error('schedule requires --src opaque-account:event-id');
    if (!opt.start || !/(Z|[+-]\d{2}:\d{2})$/.test(opt.start)) throw new Error('--start needs ISO timestamp with offset or Z');
    const start = new Date(opt.start); if (isNaN(start)) throw new Error('invalid --start');
    const end = opt.end ? new Date(opt.end) : null;
    if (end && (isNaN(end) || !/(Z|[+-]\d{2}:\d{2})$/.test(opt.end) || end < start)) throw new Error('invalid --end');
    const zone = opt.timezone || 'America/Los_Angeles'; new Intl.DateTimeFormat('en-US', {timeZone: zone});
    const rows = await api('/ct_meetings?select=*');
    let prev = rows.find(r => r.source_key === opt.src);
    if (prev && prev.firm_id !== f.id) throw new Error('source key belongs to another firm; resolve mapping before update');
    if (!prev && opt.uid) prev = rows.find(r => r.ical_uid === opt.uid && r.firm_id === f.id);
    const status = opt.status || ((end || start).getTime() < Date.now() ? 'past-scheduled' : 'planned');
    if (!['planned','cancelled','past-scheduled'].includes(status)) throw new Error('bad --status');
    const rec = {firm_id:f.id, source_key:prev?.source_key || opt.src, ical_uid:opt.uid || prev?.ical_uid || null, starts_at:start.toISOString(), ends_at:end?.toISOString() || null, timezone:zone, people:(opt.people || '').split(',').map(x=>x.trim()).filter(Boolean), summary:opt.summary || '', status};
    if (rec.people.some(x=>x.includes('@')) || /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(rec.summary) || /https?:\/\//i.test(rec.summary)) throw new Error('names and sanitized one-line summary only; no email addresses or meeting links');
    rec.summary = rec.summary.replace(/[\r\n]+/g,' ').trim();
    const same = prev && Object.entries(rec).every(([k,v])=>(['starts_at','ends_at'].includes(k) ? (prev[k] == null && v == null || new Date(prev[k]).getTime() === new Date(v).getTime()) : JSON.stringify(prev[k])===JSON.stringify(v)));
    if (same) return {ok:true, skipped:'unchanged / source deduped', meeting:prev};
    if (opt.dry) return {dry:true, from:prev || null, would:rec};
    rec.updated_at = new Date().toISOString();
    const result = prev ? await api('/ct_meetings?id=eq.'+prev.id,'PATCH',rec,'return=representation') : await api('/ct_meetings','POST',rec,'return=representation');
    const log = await audit({action:prev?'meeting_update':'meeting_schedule',firm_id:f.id,firm_name:f.name,detail:{from:prev || null,to:result[0],src:opt.src},why:opt.why});
    const stored = (await api('/ct_meetings?id=eq.'+result[0].id+'&select=*'))[0];
    return {ok:true,meeting:stored,log};
  },
  async 'schedule-cancel'({ pos, opt }) {
    if (!opt.src && !opt.uid) throw new Error('schedule-cancel requires --src or --uid');
    const rows = await api('/ct_meetings?select=*');
    let matches = rows.filter(r=>opt.src ? r.source_key===opt.src : r.ical_uid===opt.uid);
    if (!matches.length && opt.uid) matches = rows.filter(r=>r.ical_uid===opt.uid);
    if (!matches.length) return {ok:true,skipped:'no matching schedule'};
    const logs=[]; const out=[];
    for (const prev of matches) {
      if (prev.status==='cancelled') {out.push(prev);continue;}
      if (opt.dry) {out.push({from:prev,would:{status:'cancelled'}});continue;}
      const r = await api('/ct_meetings?id=eq.'+prev.id,'PATCH',{status:'cancelled',updated_at:new Date().toISOString()},'return=representation');
      logs.push(await audit({action:'meeting_cancel',firm_id:prev.firm_id,detail:{from:prev,to:r[0],src:opt.src || null},why:opt.why}));out.push(r[0]);
    }
    return {ok:true,dry:!!opt.dry,meetings:out,logs};
  },
  async pass({ pos, opt }) {
    const f = await resolveFirm(pos.join(' ')); const row = await pipeRow(f.id); if (!row) throw new Error(f.name + ' is not on the board; run add first');
    if (!opt.reason) throw new Error('pass needs --reason "one line"');
    const patch = { stage: 'Passed', stage_changed_at: new Date().toISOString(), pass_reason: opt.reason, passed_at: opt.at ? new Date(opt.at).toISOString() : new Date().toISOString(), passed_by: opt.by || '' };
    if (opt.dry) return { dry: true, from: row.stage, patch };
    await api('/ct_pipeline?firm_id=eq.' + f.id, 'PATCH', patch, 'return=minimal');
    return { ok: true, from: row.stage, to: 'Passed', log: await audit({ action: 'stage', firm_id: f.id, firm_name: f.name, detail: { from: row.stage, to: 'Passed', reason: opt.reason }, why: opt.why }) };
  },
  async reopen({ pos, opt }) {
    const f = await resolveFirm(pos.join(' ')); const row = await pipeRow(f.id); if (!row) throw new Error('not on board');
    const st = opt.stage || 'Warm'; if (!STAGES.includes(st) || st === 'Passed') throw new Error('--stage must be one of ' + STAGES.filter((x) => x !== 'Passed').join('|'));
    const patch = { stage: st, stage_changed_at: new Date().toISOString(), pass_reason: null, passed_at: null, passed_by: null };
    if (opt.dry) return { dry: true, from: row.stage, patch };
    await api('/ct_pipeline?firm_id=eq.' + f.id, 'PATCH', patch, 'return=minimal');
    return { ok: true, from: row.stage, to: st, log: await audit({ action: 'stage', firm_id: f.id, firm_name: f.name, detail: { from: row.stage, to: st, reopened: true }, why: opt.why }) };
  },
  async stage({ pos, opt }) {
    const [q, stage] = pos; if (!STAGES.includes(stage)) throw new Error('stage must be ' + STAGES.join('|'));
    const f = await resolveFirm(q); const row = await pipeRow(f.id); if (!row) throw new Error('not on board');
    if (opt.forward && STAGES.indexOf(stage) <= STAGES.indexOf(row.stage)) return { ok: true, skipped: 'not forward: ' + row.stage + ' -> ' + stage };
    if (opt.dry) return { dry: true, from: row.stage, to: stage };
    await api('/ct_pipeline?firm_id=eq.' + f.id, 'PATCH', { stage, stage_changed_at: new Date().toISOString() }, 'return=minimal');
    return { ok: true, from: row.stage, to: stage, log: await audit({ action: 'stage', firm_id: f.id, firm_name: f.name, detail: { from: row.stage, to: stage }, why: opt.why }) };
  },
  async patchField(name, col, val, { pos, opt }) {
    const f = await resolveFirm(pos[0]); const row = await pipeRow(f.id); if (!row) throw new Error('not on board');
    if (opt['if-empty'] !== undefined && row[col]) return { ok: true, skipped: 'field already set', current: row[col] };
    if (opt.dry) return { dry: true, from: row[col], to: val };
    await api('/ct_pipeline?firm_id=eq.' + f.id, 'PATCH', { [col]: val }, 'return=minimal');
    return { ok: true, from: row[col], to: val, log: await audit({ action: name, firm_id: f.id, firm_name: f.name, detail: { from: row[col], to: val }, why: opt.why }) };
  },
  async next(a) { return CMDS.patchField('next_step', 'next_step', a.pos.slice(1).join(' '), a); },
  async owner(a) { return CMDS.patchField('owner', 'owner', a.pos.slice(1).join(' '), a); },
  async note(a) { return CMDS.patchField('notes', 'notes', a.pos.slice(1).join(' '), a); },
  async connection(a) { return CMDS.patchField('connection', 'connection', a.pos.slice(1).join(' '), a); },
  async stars(a) { const n = +a.pos[1]; if (!TIER[n]) throw new Error('stars 1-5'); return CMDS.patchField('stars', 'tier', TIER[n], a); },
  async pin(a) { return CMDS.patchField('pin', 'pinned', a.pos[1] !== 'off', a); },
  async priority({ pos, opt }) {
    const f = await resolveFirm(pos[0]); const lvl = pos[1]; if (!['high', 'mid', 'low', 'none'].includes(lvl)) throw new Error('priority high|mid|low|none');
    const ids = await prioTagIds(); const all = ['high', 'mid', 'low'].map((l) => ids[l]).filter(Boolean);
    const cur = await api('/ct_card_tags?firm_id=eq.' + f.id + '&select=tag_id'); const had = ['high', 'mid', 'low'].find((l) => cur.some((c) => c.tag_id === ids[l])) || 'none';
    if (opt.dry) return { dry: true, from: had, to: lvl };
    for (const id of all) if (cur.some((c) => c.tag_id === id)) await api('/ct_card_tags?firm_id=eq.' + f.id + '&tag_id=eq.' + id, 'DELETE');
    if (lvl !== 'none') await api('/ct_card_tags', 'POST', { firm_id: f.id, tag_id: ids[lvl] }, 'return=minimal');
    return { ok: true, from: had, to: lvl, log: await audit({ action: 'priority', firm_id: f.id, firm_name: f.name, detail: { from: had, to: lvl }, why: opt.why }) };
  },
  async commit({ pos, opt }) {
    const f = await resolveFirm(pos[0]); const m = pos[1];
    const prev = (await api('/ct_commitments?firm_id=eq.' + f.id + '&select=amount'))[0]?.amount ?? null;
    if (m === 'clear') { if (opt.dry) return { dry: true, from: prev, to: null }; await api('/ct_commitments?firm_id=eq.' + f.id, 'DELETE'); return { ok: true, from: prev, to: null, log: await audit({ action: 'commit', firm_id: f.id, firm_name: f.name, detail: { from: prev, to: null }, why: opt.why }) }; }
    const amt = Math.round(+m * 1e6); if (!(amt > 0)) throw new Error('commit <firm> <amount in $M>|clear');
    if (opt.dry) return { dry: true, from: prev, to: amt };
    await api('/ct_commitments?on_conflict=firm_id', 'POST', { firm_id: f.id, amount: amt, fund: 'III', updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
    return { ok: true, from: prev, to: amt, log: await audit({ action: 'commit', firm_id: f.id, firm_name: f.name, detail: { from: prev, to: amt }, why: opt.why }) };
  },
  async 'firm-create'({pos,opt}) {
    const name=pos.join(' ').trim(),simple=opt.simple||name,type=opt.type||'Other',stage=opt.stage||'Backlog';
    if(!name||!STAGES.includes(stage))throw Error('firm-create "Full name" --simple "Short name" --type "Type" --stage "Stage" --relationship "referred via X"');
    const exists=await api('/ct_custom_firms?select=id,name');const hit=exists.find(c=>c.name.toLowerCase()===name.toLowerCase());if(hit)return {ok:true,existing:true,id:10000+hit.id,name};
    const rec={name,simple_name:simple,full_name:name,type,notes:opt.relationship||'',city:opt.city||'',state:opt.state||''};
    if(opt.dry)return {dry:true,firm:rec,pipeline:{stage,owner:opt.owner||''}};
    const made=(await api('/ct_custom_firms','POST',rec,'return=representation'))[0],id=10000+made.id;
    await audit({action:'firm_create',firm_id:id,firm_name:name,detail:rec,why:opt.why});
    try {await api('/ct_pipeline?on_conflict=firm_id','POST',{firm_id:id,stage,owner:opt.owner||'',stage_changed_at:new Date().toISOString()},'resolution=merge-duplicates,return=minimal');}
    catch(e){throw Error('Firm created as '+id+' but pipeline add failed: '+e.message+'. Use add '+id+' to finish; do not create again.');}
    return {ok:true,id,name,stage,log:await audit({action:'add',firm_id:id,firm_name:name,detail:{stage},why:opt.why})};
  },
  async scheduling({pos,opt}) {
    const f=await resolveFirm(pos[0]),status=opt.status||'scheduling',waiting=opt.waiting||'unknown';
    if(!['scheduling','booked','closed'].includes(status)||!['ours','theirs','unknown'].includes(waiting))throw Error('Invalid status/waiting');
    const rec={firm_id:f.id,status,waiting_on:waiting,people:(opt.people||'').split(',').map(x=>x.trim()).filter(Boolean),last_touch_at:opt.at||null,proposed_times:opt.times||'',next_action:opt.next||'',updated_at:new Date().toISOString()};
    if(opt.dry)return {dry:true,rec};await api('/ct_scheduling?on_conflict=firm_id','POST',rec,'resolution=merge-duplicates,return=minimal');return {ok:true,rec,log:await audit({action:'scheduling',firm_id:f.id,firm_name:f.name,detail:rec,why:opt.why})};
  },
  async add({ pos, opt }) {
    const f = await resolveFirm(pos[0]); const stage = opt.stage || 'Wishlist'; if (!STAGES.includes(stage)) throw new Error('bad stage');
    if (await pipeRow(f.id)) throw new Error(f.name + ' already on board');
    if (opt.dry) return { dry: true, add: f.name, stage };
    await api('/ct_pipeline?on_conflict=firm_id', 'POST', { firm_id: f.id, stage, stage_changed_at: new Date().toISOString(), ...(opt.owner ? { owner: opt.owner } : {}) }, 'resolution=merge-duplicates,return=minimal');
    return { ok: true, added: f.name, stage, log: await audit({ action: 'add', firm_id: f.id, firm_name: f.name, detail: { stage }, why: opt.why }) };
  },
  async remove({ pos, opt }) {
    const f = await resolveFirm(pos[0]); const row = await pipeRow(f.id); if (!row) throw new Error('not on board');
    if (opt.dry) return { dry: true, remove: f.name, snapshot: row };
    await api('/ct_pipeline?firm_id=eq.' + f.id, 'DELETE');
    return { ok: true, removed: f.name, log: await audit({ action: 'remove', firm_id: f.id, firm_name: f.name, detail: { snapshot: row }, why: opt.why }) };
  },
  async profile({pos,opt}) {
    const f=await resolveFirm(pos[0]);
    if(!opt.file)return api('/ct_profile_enrichment?firm_id=eq.'+f.id+'&select=*');
    const d=JSON.parse(fs.readFileSync(opt.file,'utf8'));
    if(typeof d.background!=='string'||!Array.isArray(d.sources)||!d.sources.length)throw Error('profile JSON requires background and sources [{title,url}]');
    if(d.sources.some(x=>!/^https?:\/\//i.test(x.url||'')))throw Error('sources require HTTP(S) URLs');
    const rec={firm_id:f.id,background:d.background,contacts:(d.contacts||[]).map(c=>({name:c.name,role:c.role||''})),sources:d.sources.map(x=>({title:x.title||x.url,url:x.url})),updated_at:new Date().toISOString()};
    if(opt.dry)return {dry:true,rec};
    await api('/ct_profile_enrichment?on_conflict=firm_id','POST',rec,'resolution=merge-duplicates,return=minimal');
    return {ok:true,rec,log:await audit({action:'profile',firm_id:f.id,firm_name:f.name,detail:rec,why:opt.why})};
  },
  async person({ pos, opt }) {
    const f = await resolveFirm(pos[0]); const name = pos[1]; if (!name) throw new Error('person <firm> "<name>" [--email --linkedin --role --unverified]');
    const rec = { firm_id: f.id, name, ...(opt.email ? { email: opt.email } : {}), ...(opt.linkedin ? { linkedin: opt.linkedin } : {}), ...(opt.role ? { role: opt.role } : {}), unverified: opt.unverified === 'true', updated_at: new Date().toISOString() };
    if (opt.dry) return { dry: true, rec };
    await api('/ct_contacts?on_conflict=firm_id,name', 'POST', rec, 'resolution=merge-duplicates,return=minimal');
    return { ok: true, rec, log: await audit({ action: 'person', firm_id: f.id, firm_name: f.name, detail: rec, why: opt.why }) };
  },
  async lookup({ pos }) {
    FIRMS ||= await loadFirmsAsync(); const q = pos.join(' ').toLowerCase().replace(/^.*</, '').replace(/>.*$/, ''); const dom = q.includes('@') ? q.split('@')[1] : q; const out = [];
    FIRMS.forEach((f, i) => { for (const c of f.contacts || []) { const em = [c.email, c.orgEmail, c.personalEmail].filter(Boolean).map((x) => x.toLowerCase());
      if (em.includes(q) || (!q.includes('@') && c.name.toLowerCase().includes(q)) || (q.includes('@') && em.some((x) => x.endsWith('@' + dom)))) out.push({ firm_id: i, firm: f.name, person: c.name, role: c.role, match: em.includes(q) ? 'email' : 'domain/name' }); } });
    let extra = []; try { extra = await api('/ct_contacts?select=firm_id,name,email'); } catch {}
    for (const c of extra) if ((c.email || '').toLowerCase() === q) out.push({ firm_id: c.firm_id, person: c.name, match: 'email(ct_contacts)' });
    return out.slice(0, 20);
  },
  async log({ opt }) {
    try { return await api('/ct_audit?select=at,action,firm_name,detail,why&order=at.desc&limit=' + (opt.n || 20)); }
    catch { return fs.existsSync(FALLBACK_LOG) ? fs.readFileSync(FALLBACK_LOG, 'utf8').trim().split('\n').slice(-(opt.n || 20)).map(JSON.parse) : []; }
  },
};
const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || !CMDS[cmd] || cmd === 'patchField') { console.error('commands: ' + Object.keys(CMDS).filter((c) => c !== 'patchField').join(', ')); process.exit(2); }
const a = args(rest);
const WRITES = new Set(['profile','firm-create','scheduling','schedule', 'schedule-cancel', 'pass', 'reopen', 'touch', 'touch-delete', 'touch-edit', 'stage', 'next', 'owner', 'note', 'connection', 'stars', 'pin', 'priority', 'commit', 'add', 'remove', 'person']);
if (WRITES.has(cmd) && !(cmd === 'profile' && !a.opt.file) && !a.opt.dry && !a.opt.why) { console.error('--why "<reason>" is required for writes'); process.exit(2); }
try { console.log(JSON.stringify(await CMDS[cmd](a), null, 1)); } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
