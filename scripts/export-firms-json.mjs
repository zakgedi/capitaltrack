// Regenerates firms.json (manifest) + firms-N.json shards from the firm
// universe embedded in index.html. Shards stay small enough for web-editor
// commits; concatenating them in order yields the full firms array.
// Run after roster/profile updates: node scripts/export-firms-json.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const line = html.split("\n").find((x) => x.startsWith('firms=[{"name"'));
if (!line || !line.endsWith("];")) throw new Error("firms array not found in index.html");
const firms = JSON.parse(line.slice(6, -1));

const SHARD_TARGET = 220 * 1024; // bytes per shard, whole firms only
const shards = [];
let cur = [], curBytes = 2;
for (const f of firms) {
  const b = Buffer.byteLength(JSON.stringify(f)) + 1;
  if (cur.length && curBytes + b > SHARD_TARGET) { shards.push(cur); cur = []; curBytes = 2; }
  cur.push(f); curBytes += b;
}
if (cur.length) shards.push(cur);

const names = [];
shards.forEach((s, i) => {
  const name = `firms-${i + 1}.json`;
  writeFileSync(new URL("../" + name, import.meta.url), JSON.stringify(s));
  names.push(name);
});
const out = {
  site: "LP GLOBE",
  url: "https://zakgedi.github.io/lp-globe/",
  description:
    "Zakaria Gedi's map of the institutional allocator (limited partner) universe: endowments, foundations, family offices, pensions and sovereign funds, with investment-team rosters, roles, contact details, AUM and locations.",
  updated: new Date().toISOString().slice(0, 10),
  count: firms.length,
  format:
    "The firm universe is split across shard files listed in `shards`. Each shard is a JSON array of firm objects; concatenating all shards in order yields the complete firms array. A firm's id is its 0-based index in that concatenated array. Per firm: name, type, location, aum, rank, description, notes, contacts[] (name, role, email/orgEmail/personalEmail, linkedin, bio, unverified flag when pattern-inferred or third-party-sourced).",
  shards: names,
};
writeFileSync(new URL("../firms.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log("firms.json manifest +", shards.length, "shards written:", firms.length, "firms");
