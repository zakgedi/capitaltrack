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
const STAGES = ['Wishlist', 'Warm', 'Contacted', 'In Process', 'Committed'];
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
    const rec = { firm_id: f.id, kind, note: opt.note || '', owner: opt.owner ?? row.owner ?? '', ...(day ? { touched_at: day } : {}), ...(sent ? { sent_at: sent } : {}) };
    if (opt.src) {
      const seen = (await CMDS.log({ opt: { n: 5000 } })).some((e) => e.action === 'touch' && e.detail && e.detail.src === opt.src);
      if (seen) return { ok: true, skipped: 'duplicate src ' + opt.src };
    }
    if (opt.dry) return { dry: true, would: rec, src: opt.src || null };
    const r = await api('/ct_touches', 'POST', rec, 'return=representation');
    return { ok: true, touch: r[0], log: await audit({ action: 'touch', firm_id: f.id, firm_name: f.name, detail: { ...rec, ...(opt.src ? { src: opt.src } : {}) }, why: opt.why }) };
  },
  async 'touch-email'({ pos, opt }) {
    const tid = +pos[0]; if (!tid) throw new Error('touch-email <touch_id> --email-file <json>');
    const e = JSON.parse((await import('node:fs')).readFileSync(opt['email-file'], 'utf8'));
    const t = (await api('/ct_touches?id=eq.' + tid + '&select=id,firm_id'))[0]; if (!t) throw new Error('no touch ' + tid);
    const rec = { source_key: e.source_key || (e.account_email + ':' + e.message_id), touch_id: tid, firm_id: t.firm_id, provider: e.provider || 'gmail', account_email: e.account_email, message_id: e.message_id, thread_id: e.thread_id, subject: e.subject, from_addr: e.from, to_addr: e.to || [], cc_addr: e.cc || [], sent_at: e.sent_at, body_text: e.body_text, gmail_url: e.gmail_url || null };
    if (opt.dry) return { dry: true, would: { ...rec, body_text: (rec.body_text || '').slice(0, 80) + '...' } };
    const r = await fetch(API + '/ct_email_copies', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(rec) });
    if (r.status === 409) return { ok: true, skipped: 'already stored ' + rec.source_key };
    if (!r.ok) throw new Error('store failed ' + r.status + ' ' + (await r.text()));
    return { ok: true, stored: rec.source_key, log: await audit({ action: 'email_copy', firm_id: t.firm_id, detail: { touch_id: tid, source_key: rec.source_key }, why: opt.why }) };
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
    if (opt.note !== undefined) patch.note = opt.note; if (opt.owner !== undefined) patch.owner = opt.owner; if (opt.kind) patch.kind = opt.kind;
    if (!Object.keys(patch).length) throw new Error('nothing to change: use --at, --note, --owner or --kind');
    if (opt.dry) return { dry: true, from: t, patch };
    await api('/ct_touches?id=eq.' + tid, 'PATCH', patch, 'return=minimal');
    let copy = null; if (opt['email-file']) copy = await CMDS['touch-email']({ pos: [String(tid)], opt });
    return { ok: true, touch: tid, patch, copy, log: await audit({ action: 'touch_edit', firm_id: t.firm_id, detail: { touch_id: tid, from: { touched_at: t.touched_at, sent_at: t.sent_at || null }, to: patch, ...(opt.src ? { src: opt.src } : {}) }, why: opt.why }) };
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
const WRITES = new Set(['touch', 'touch-email', 'touch-delete', 'touch-edit', 'stage', 'next', 'owner', 'note', 'connection', 'stars', 'pin', 'priority', 'commit', 'add', 'remove', 'person']);
if (WRITES.has(cmd) && !a.opt.dry && !a.opt.why) { console.error('--why "<reason>" is required for writes'); process.exit(2); }
try { console.log(JSON.stringify(await CMDS[cmd](a), null, 1)); } catch (e) { console.error('ERROR: ' + e.message); process.exit(1); }
