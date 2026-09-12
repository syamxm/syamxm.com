const assert = require("node:assert/strict");
const {readFileSync} = require("node:fs");
const {test} = require("node:test");
const vm = require("node:vm");

function node(){
  return {textContent: "", className: "", dataset: {}, hidden: false,
    children: [], appendChild(child){ this.children.push(child); },
    style: {setProperty(){}}};
}

function browser(document, fetch){
  let scheduled;
  const events = {};
  document.createElement ||= node;
  document.addEventListener = (name, callback) => (events[name] ||= []).push(callback);
  document.dispatchEvent = event => (events[event.type] || []).forEach(callback => callback(event));
  const context = vm.createContext({document, window: {}, URL, AbortSignal, fetch,
    Event: class { constructor(type){ this.type = type; } },
    CustomEvent: class { constructor(type, options){ this.type = type; this.detail = options.detail; } },
    setTimeout(callback){ scheduled = callback; }, clearTimeout(){}});
  return {
    load(file){ vm.runInContext(readFileSync(new URL("../js/" + file, "file://" + __filename), "utf8"), context); },
    async tick(){ scheduled(); await new Promise(setImmediate); }
  };
}

test("project status handles per-site failures, unavailable status, and recovery", async () => {
  const head = node();
  const summary = node();
  const card = {href: "https://beanthere.syamxm.com", querySelector: () => head};
  let response;
  const page = browser({querySelectorAll: () => [card], querySelector: () => summary}, async (url, options) => {
    assert.equal(url, "https://status.syamxm.com/api/status");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    if(response instanceof Error) throw response;
    return response;
  });
  const reading = state => ({status: 200, json: async () => ({sites: [{host: "beanthere.syamxm.com", state}]})});
  response = reading("live");
  page.load("status.js");
  await new Promise(setImmediate);
  const badge = head.children[0];
  assert.equal(badge.textContent, "online");

  for(const state of ["down", "maintenance", "invalid"]){
    response = reading(state);
    await page.tick();
    assert.equal(badge.textContent, "offline");
  }
  for(const failure of [
    new Error("DNS failure"), new DOMException("Timeout", "TimeoutError"),
    {status: 404}, {status: 502},
    {status: 200, json: async () => { throw new SyntaxError("HTML instead of JSON"); }},
    {status: 200, json: async () => ({sites: null})},
    {status: 200, json: async () => ({sites: []})}
  ]){
    response = failure;
    await page.tick();
    assert.equal(badge.textContent, "offline · unverified");
  }
  response = reading("live");
  await page.tick();
  assert.equal(badge.textContent, "online");
});

test("failed metrics clear readings and visitors, then recover", async () => {
  const nodes = {};
  const get = selector => nodes[selector] ||= node();
  const data = {
    host: {cpu_model: "Test CPU", threads: 2, kernel: "test"},
    cpu: {pct: 12, cores: [10, 14], load: [0, 0, 0], procs: 20},
    temp: {cpu: 45, nvme: 40, gpu: 35}, uptime_s: 90000,
    mem: {}, disk: {}, net: {}, containers: [], containers_running: 0,
    visitors: {count: 2}
  };
  let offline = false;
  const document = {
    querySelector: get, querySelectorAll: selector => [get(selector)],
    getElementById: id => get("#" + id), createElement: node
  };
  const page = browser(document, async (url, options) => {
    assert.equal(url, "https://metrics.syamxm.com/api/metrics");
    assert.equal(options.cache, "no-store");
    assert.ok(options.signal instanceof AbortSignal);
    if(offline) throw new Error("Server off");
    return {status: 200, json: async () => data};
  });
  page.load("visitors.js");
  page.load("metrics.js");
  await new Promise(setImmediate);
  assert.equal(get("[data-btop]").dataset.state, "live");
  assert.equal(get("[data-visitors]").hidden, false);
  assert.equal(get("[data-cpu-pct]").textContent, "12.0%");
  let offlineEvents = 0;
  document.addEventListener("metrics:offline", () => offlineEvents++);
  offline = true;
  await page.tick();
  assert.equal(get("[data-btop]").dataset.state, "offline");
  assert.equal(get("[data-uptime]").textContent, "offline");
  assert.equal(get("[data-cpu-pct]").textContent, "—");
  assert.equal(get("[data-visitors]").hidden, true);
  assert.equal(offlineEvents, 1);
  offline = false;
  await page.tick();
  assert.equal(get("[data-btop]").dataset.state, "live");
  assert.equal(get("[data-visitors]").hidden, false);
  assert.equal(get("[data-cpu-pct]").textContent, "12.0%");
});
