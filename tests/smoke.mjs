// Smoke test for the Tuned In website.
// Local:  node tests/smoke.mjs            (serves this folder on a random port)
// Live:   BASE_URL=https://tunedin.meetdigrajkar.ca node tests/smoke.mjs
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TYPES = { ".html":"text/html", ".json":"application/json", ".webmanifest":"application/manifest+json", ".svg":"image/svg+xml", ".md":"text/markdown" };
let server, base = process.env.BASE_URL;
if (!base) {
  server = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    if (!extname(p)) p += ".html"; // mimic Vercel cleanUrls
    try { const body = await readFile(join(ROOT, normalize(p)));
      res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" }); res.end(body);
    } catch { res.writeHead(404); res.end("not found"); }
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
}
base = base.replace(/\/$/, "");
const fail = m => { console.error("❌ " + m); process.exitCode = 1; };
const ok = m => console.log("✅ " + m);

const browser = await chromium.launch();
try {
  // 1. Static files are served
  for (const f of ["/", "/privacy", "/manifest.webmanifest", "/icon.svg"]) {
    const r = await fetch(base + f + (process.env.BASE_URL ? `?ci=${Date.now()}` : ""));
    r.ok ? ok(`GET ${f} -> ${r.status}`) : fail(`GET ${f} -> ${r.status}`);
  }

  // 2. App boots without errors on a phone-sized screen
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(base + "/?ci=" + Date.now());
  await page.waitForSelector("[data-act=setup]");
  ok("home screen renders");

  // 3. In Sync: full one-phone round
  await page.evaluate(() => localStorage.setItem("tunedin.prefs", JSON.stringify(
    { mode:"duel", pnames:["Maya","Leo"], packs:["sync"], twists:"some", timer:60, goal:10 })));
  await page.reload();
  await page.click("[data-act=setup]");
  await page.click("[data-act=start]");
  await page.click("[data-act=toPsychic]");
  if (!(await page.isDisabled("#syncBtn"))) fail("lock should be disabled before dragging");
  const box = await page.locator("#dw svg").boundingBox();
  const tap = async (fx, fy) => { await page.mouse.move(box.x + box.width*fx, box.y + box.height*fy); await page.mouse.down(); await page.mouse.up(); };
  await tap(0.85, 0.35);
  await page.click("#syncBtn");
  await page.click("[data-act=syncGo]");
  await tap(0.8, 0.25);
  await page.click("#syncBtn");
  const g = await page.evaluate(() => window.TunedIn.S.game);
  if (g.phase === "reveal" && g.lastSummary.both && g.teams[0].score - 0 === g.teams[1].score - 1) ok(`In Sync round scored +${g.lastSummary.gained} each`);
  else fail("In Sync round did not reach a shared reveal: " + JSON.stringify({ phase: g.phase, s: g.lastSummary }));

  // 4. Game rules (pure logic)
  const r = await page.evaluate(() => {
    const T = window.TunedIn, out = {};
    out.teamsDeck = T.buildDeck(["sync"], "teams").length;
    out.duelDeck = T.buildDeck(["sync"], "duel").length;
    out.score = [T.scoreFor(90, 92), T.scoreFor(90, 100), T.scoreFor(90, 112), T.scoreFor(0, 180)];
    const saved = T.S.game;
    const gm = T.makeGame({ mode:"duel", names:[], packs:["sync"], twists:"off", timer:0, goal:10,
      players:[{id:"A",name:"A",team:0},{id:"B",name:"B",team:1}] });
    T.S.game = gm;
    T.reduce("syncLock", { v:40 }, "A");
    out.hidden = T.strip(gm).r.sync[0];
    out.dup = T.reduce("syncLock", { v:99 }, "A");
    out.spectator = T.reduce("syncLock", { v:10 }, "Z");
    T.reduce("syncLock", { v:48 }, "B");
    out.phase = gm.phase;
    T.S.game = saved;
    return out;
  });
  const check = (c, m) => c ? ok(m) : fail(m + " " + JSON.stringify(r));
  check(r.teamsDeck === 0 && r.duelDeck > 0, "In Sync cards only in 1 v 1 decks");
  check(JSON.stringify(r.score) === "[4,3,2,0]", "scoring bands 4/3/2/0");
  check(r.hidden === -1, "online answers stay hidden until both lock");
  check(!r.dup && !r.spectator, "no double answers or spectator answers");
  check(r.phase === "reveal", "online round reveals after both lock");

  // 5. Desktop layout boots too
  const desk = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  desk.on("pageerror", e => errors.push(String(e)));
  await desk.goto(base + "/?ci=" + Date.now());
  await desk.waitForSelector("[data-act=setup]");
  ok("desktop layout renders");

  errors.length ? fail("page errors:\n" + errors.join("\n")) : ok("no page errors");
} catch (e) { fail(e.stack || String(e)); }
finally { await browser.close(); server && server.close(); }
