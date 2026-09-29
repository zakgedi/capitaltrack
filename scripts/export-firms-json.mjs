// Regenerates firms.json from the firm universe embedded in index.html.
// Run after roster/profile updates: node scripts/export-firms-json.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const line = html.split("\n").find((x) => x.startsWith('firms=[{"name"'));
if (!line || !line.endsWith("];")) throw new Error("firms array not found in index.html");
const firms = JSON.parse(line.slice(6, -1));

const out = {
  site: "LP GLOBE",
  url: "https://zakgedi.github.io/lp-globe/",
  description:
    "Zakaria Gedi's map of the institutional allocator (limited partner) universe: endowments, foundations, family offices, pensions and sovereign funds, with investment-team rosters, roles, contact details, AUM and locations.",
  updated: new Date().toISOString().slice(0, 10),
  count: firms.length,
  firms,
};
writeFileSync(new URL("../firms.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log("firms.json written:", firms.length, "firms");
