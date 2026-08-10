(function(){
  var ENDPOINT = "/api/metrics";
  var ACTIVE_MS = 3000;
  var IDLE_MS = 15000;
  var MAX_BACKOFF_MS = 60000;
  var HISTORY = 64;
  var BLOCKS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

  var win = document.querySelector("[data-btop]");
  var status = document.querySelector("[data-btop-status]");
  var coresBox = document.querySelector("[data-cores]");
  var rowsBox = document.querySelector("[data-crows]");
  var moreLine = document.querySelector("[data-more]");
  var tempEls = document.querySelectorAll("[data-temp]");
  var upEls = document.querySelectorAll("[data-uptime]");
  var upShortEls = document.querySelectorAll("[data-uptime-short]");
  var footstat = document.getElementById("footstat");

  var history = [];
  var coreBars = [];
  var visible = false;
  var failures = 0;
  var timer = null;
  var inflight = false;

  var nodes = {};
  function el(name){
    if(!(name in nodes)) nodes[name] = document.querySelector("[data-" + name + "]");
    return nodes[name];
  }
  function setText(node, text){ if(node) node.textContent = text; }

  function bytes(n){
    if(n === null || n === undefined) return "—";
    var units = ["B", "K", "M", "G", "T"];
    var i = 0;
    while(n >= 1024 && i < units.length - 1){ n /= 1024; i++; }
    return (n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)) + units[i];
  }
  function rate(bps){
    if(bps === null || bps === undefined) return "—";
    return bytes(bps) + "/s";
  }
  function pct(v){ return v === null || v === undefined ? "—" : v.toFixed(1) + "%"; }
  function celsius(v){ return v === null || v === undefined ? "—" : Math.round(v) + " °C"; }

  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function uptimeText(seconds){
    if(seconds === null || seconds === undefined) return "—";
    var d = Math.floor(seconds / 86400);
    var rest = seconds - d * 86400;
    return d + "d " + pad(Math.floor(rest / 3600)) + ":" + pad(Math.floor(rest % 3600 / 60));
  }
  function uptimeShortText(seconds){
    if(seconds === null || seconds === undefined) return "—";
    var d = Math.floor(seconds / 86400);
    return d + "d " + pad(Math.floor((seconds - d * 86400) / 3600)) + "h";
  }

  function heatClass(temp){
    if(temp === null || temp === undefined) return "";
    if(temp >= 80) return "hot";
    if(temp >= 65) return "warm";
    return "cool";
  }
  function paintTemp(node, value){
    if(!node) return;
    node.textContent = celsius(value);
    node.className = node.className.replace(/\s*(cool|warm|hot)\b/g, "") + " " + heatClass(value);
  }

  function setBar(node, value){
    if(!node) return;
    var v = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
    node.style.setProperty("--v", (v / 100).toFixed(3));
    node.dataset.level = v >= 90 ? "hot" : v >= 70 ? "warm" : "cool";
  }

  function buildCores(count){
    coresBox.textContent = "";
    coreBars = [];
    for(var i = 0; i < count; i++){
      var row = document.createElement("div");
      row.className = "core";
      var name = document.createElement("span");
      name.className = "cn";
      name.textContent = "c" + i;
      var meter = document.createElement("span");
      meter.className = "meter";
      var fill = document.createElement("i");
      meter.appendChild(fill);
      var value = document.createElement("span");
      value.className = "cv";
      value.textContent = "—";
      row.appendChild(name); row.appendChild(meter); row.appendChild(value);
      coresBox.appendChild(row);
      coreBars.push({fill: fill, value: value});
    }
  }

  function paintCores(cores){
    if(coreBars.length !== cores.length) buildCores(cores.length);
    cores.forEach(function(v, i){
      setBar(coreBars[i].fill, v);
      coreBars[i].value.textContent = Math.round(v) + "%";
    });
  }

  function paintGraph(value){
    history.push(value === null || value === undefined ? 0 : value);
    if(history.length > HISTORY) history.shift();
    setText(el("cpu-graph"), history.map(function(v){
      return BLOCKS[Math.min(BLOCKS.length - 1, Math.floor(v / 100 * BLOCKS.length))];
    }).join(""));
  }

  function containerRow(row){
    var node = document.createElement("div");
    node.className = "crow";
    var name = document.createElement("span");
    name.className = "cname";
    name.textContent = row.name;
    var image = document.createElement("span");
    image.className = "cimage";
    image.textContent = row.image;
    var meter = document.createElement("span");
    meter.className = "meter";
    var fill = document.createElement("i");
    setBar(fill, row.cpu);
    meter.appendChild(fill);
    var cpu = document.createElement("span");
    cpu.className = "num";
    cpu.textContent = row.cpu.toFixed(1);
    var mem = document.createElement("span");
    mem.className = "num";
    mem.textContent = bytes(row.mem);
    node.appendChild(name); node.appendChild(image); node.appendChild(meter);
    node.appendChild(cpu); node.appendChild(mem);
    return node;
  }

  function paintContainers(rows, running){
    var shown = rows.slice(0, 10);
    rowsBox.textContent = "";
    shown.forEach(function(row){ rowsBox.appendChild(containerRow(row)); });
    setText(el("run-count"), running + " running");
    var hidden = running - shown.length;
    moreLine.hidden = hidden <= 0;
    moreLine.textContent = hidden > 0 ? "… and " + hidden + " more, quieter than these" : "";
  }

  function paintSpecs(data){
    var cpu = el("spec-cpu");
    if(cpu && data.host.cpu_model){
      cpu.textContent = data.host.cpu_model.replace(" with Radeon Graphics", "") +
        " · " + data.host.threads + " threads";
    }
    var mem = el("spec-mem");
    if(mem && data.mem.total) mem.textContent = bytes(data.mem.total) + "B RAM · " + bytes(data.mem.swap_total) + "B swap";
    var disk = el("spec-disk");
    if(disk && data.disk.total){
      disk.textContent = "nvme — " + bytes(data.disk.total) + "B root, " +
        bytes(data.disk.home_total) + "B /home";
    }
  }

  function paint(data){
    setText(el("cpu-model"), data.host.cpu_model || "—");
    setText(el("cpu-pct"), pct(data.cpu.pct));
    paintTemp(el("cpu-temp"), data.temp.cpu);
    paintGraph(data.cpu.pct);
    paintCores(data.cpu.cores);
    setText(el("load"), data.cpu.load.map(function(v){ return v === null ? "—" : v.toFixed(2); }).join(" "));
    setText(el("procs"), data.cpu.procs === null ? "—" : Math.round(data.cpu.procs));
    setText(el("uptime-long"), uptimeText(data.uptime_s));
    setText(el("kernel"), data.host.kernel || "—");

    setBar(el("mem-bar"), data.mem.pct);
    setText(el("mem"), bytes(data.mem.used) + " / " + bytes(data.mem.total) + "  " + pct(data.mem.pct));
    setBar(el("swap-bar"), data.mem.swap_pct);
    setText(el("swap"), bytes(data.mem.swap_used) + " / " + bytes(data.mem.swap_total) + "  " + pct(data.mem.swap_pct));
    setBar(el("disk-bar"), data.disk.pct);
    setText(el("disk"), bytes(data.disk.used) + " / " + bytes(data.disk.total) + "  " + pct(data.disk.pct));
    setBar(el("home-bar"), data.disk.home_pct);
    setText(el("home"), bytes(data.disk.home_used) + " / " + bytes(data.disk.home_total) + "  " + pct(data.disk.home_pct));

    setText(el("net-rx"), rate(data.net.rx_bps));
    setText(el("net-tx"), rate(data.net.tx_bps));
    setText(el("disk-read"), rate(data.disk.read_bps));
    setText(el("disk-write"), rate(data.disk.write_bps));
    paintTemp(el("nvme-temp"), data.temp.nvme);
    paintTemp(el("gpu-temp"), data.temp.gpu);

    paintContainers(data.containers, data.containers_running);
    paintSpecs(data);

    var temp = celsius(data.temp.cpu);
    var up = "up " + uptimeText(data.uptime_s);
    tempEls.forEach(function(node){ node.textContent = temp; });
    upEls.forEach(function(node){ node.textContent = up; });
    var upShort = "up " + uptimeShortText(data.uptime_s);
    upShortEls.forEach(function(node){ node.textContent = upShort; });
    if(footstat) footstat.textContent = up + " · 6/6 gates · fail-closed";

    win.dataset.state = "live";
    setText(status, "live · " + data.containers_running + " containers · refreshed every 3s");
    document.dispatchEvent(new CustomEvent("metrics", {
      detail: {data: data, uptime: uptimeText(data.uptime_s), temp: temp}
    }));
  }

  function fail(){
    failures++;
    win.dataset.state = "offline";
    setText(status, "homeserver unreachable — retrying");
  }

  function delay(){
    if(failures) return Math.min(ACTIVE_MS * Math.pow(2, failures), MAX_BACKOFF_MS);
    return visible && !document.hidden ? ACTIVE_MS : IDLE_MS;
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(poll, delay());
  }

  function poll(){
    if(inflight) return;
    if(document.hidden){ schedule(); return; }
    inflight = true;
    fetch(ENDPOINT, {headers: {accept: "application/json"}})
      .then(function(response){
        if(!response.ok) throw new Error(response.status);
        return response.json();
      })
      .then(function(data){ failures = 0; paint(data); })
      .catch(fail)
      .then(function(){ inflight = false; schedule(); });
  }

  if("IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      var wasVisible = visible;
      visible = entries[0].isIntersecting;
      if(visible && !wasVisible) poll();
    }, {rootMargin: "120px"}).observe(win);
  } else {
    visible = true;
  }

  document.addEventListener("visibilitychange", function(){
    if(!document.hidden) poll();
  });

  poll();
})();
