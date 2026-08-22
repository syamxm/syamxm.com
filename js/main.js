(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- interactive shell (always active) ---- */
  var tin = document.getElementById("tin");
  var tout = document.getElementById("tout");
  var fp = document.getElementById("fp");

  /* latest reading from js/metrics.js — null until the homeserver answers */
  var live = null;
  document.addEventListener("metrics", function(e){ live = e.detail; });

  var PROJECTS = {
    "beanthere": "https://beanthere.syamxm.com",
    "taskflow": "https://taskflow.syamxm.com",
    "debian-watch": "https://debian-watch.syamxm.com",
    "dashboard": "https://dash.syamxm.com",
    "reminder": "https://github.com/syamxm/student_reminder_system",
    "cipher-agent": "https://cipher-agent.syamxm.com",
    "cipher-forge": "https://cipher-forge.syamxm.com",
    "cv": "https://cv.syamxm.com",
    "cv-spring": "https://cv-spring.syamxm.com",
    "c-aegis": "https://c-aegis.syamxm.com"
  };

  var INTERN_START = Date.parse("2026-09-07T00:00:00+08:00");
  var INTERN_END = Date.parse("2027-03-05T23:59:59+08:00");

  /* the pill counts down to the start, flips to "in progress", then retires itself */
  function availability(){
    var now = Date.now();
    if(now > INTERN_END) return null;
    if(now >= INTERN_START) return {pill: "in progress", note: "In progress until 5 March 2027."};
    var days = Math.ceil((INTERN_START - now) / 86400000);
    return {
      pill: "placed · sep 2026",
      note: "Starts in " + days + " day" + (days === 1 ? "" : "s") + "."
    };
  }

  function pad(n){ return (n < 10 ? "0" : "") + n; }

  var FORTUNES = [
    "the S in IoT stands for security",
    "there is no cloud, only someone else's computer — mine is in my room",
    "fail-closed beats fail-open. ask the pipeline.",
    "a backup you haven't restored is a rumour",
    "least privilege: because 'sudo everything' is a lifestyle, not a policy",
    "the best time to rotate a secret was before the commit. the second best is now.",
    "127.0.0.1 is where the heart is"
  ];

  function neofetch(){
    var d = live && live.data;
    return [
      "   ▄▄▄▄▄▄▄     visitor@syamxm.com",
      "  █ ~> ▌  █    ------------------",
      "  █       █    os      debian 13 · self-hosted",
      "  █       █    kernel  " + (d ? d.host.kernel : "—"),
      "  █ ▂▂▂▂▂ █    uptime  " + (live ? live.uptime : "—"),
      "   ▀▀▀▀▀▀▀     cpu     " + (d ? d.host.cpu_model + " · " + d.host.threads + " threads" : "—"),
      "               load    " + (d ? d.cpu.pct + "% · " + live.temp : "—"),
      "               docker  " + (d ? d.containers_running + " containers running" : "—"),
      "               shell   fish",
      "               net     tailscale + cloudflare tunnel",
      "               ci      6/6 gates · fail-closed",
      "               theme   cachyos violet"
    ].join("\n");
  }

  var USES = [
    "host       debian 13 · docker · 8+ services, none with a published port",
    "edge       cloudflare tunnel → nginx (hsts · csp · real-ip)",
    "host edge  ufw · fail2ban · crowdsec",
    "private    tailscale — ssh and ci deploys",
    "workstation cachyos · waybar · fish",
    "rendered above ↑"
  ].join("\n");

  var TIMELINE = [
    "* f1c9d04 (HEAD -> main) DevOps intern — 6-month industrial placement",
    "* a7f3e21 BSc Computer Science (Hons) — UiTM Shah Alam",
    "* 3d90c4f exam invigilator — Community Tuition Group",
    "* 8b2e510 Foundation in Engineering — UiTM Dengkil",
    "* c15af73 SPM — SMK Saujana Utama",
    "* 0e4d6a1 part-time crew — Subway, Eco Grandeur",
    "rendered above ↑"
  ].join("\n");

  function tprint(text, cls){
    text.split("\n").forEach(function(line){
      var d = document.createElement("div");
      d.className = cls;
      d.textContent = line;
      tout.appendChild(d);
    });
  }
  function echo(c){
    var e = document.createElement("div");
    var p = document.createElement("span");
    p.className = "prompt";
    p.innerHTML = '<span class="tick">~&gt;</span> ';
    var t = document.createElement("span");
    t.className = "cmd";
    t.textContent = c;
    e.appendChild(p); e.appendChild(t);
    tout.appendChild(e);
  }
  function panic(){
    tprint("rm: descending into /home/syamxm ...", "out");
    document.body.classList.add("panic");
    setTimeout(function(){ tprint("rm: cannot remove '/': permission denied — nice try", "err"); }, 900);
    setTimeout(function(){
      document.body.classList.remove("panic");
      tprint("restored from backup ✓ (fail-closed applies here too)", "out");
    }, 1800);
  }

  function tree(){
    var keys = Object.keys(PROJECTS);
    var lines = ["~/projects"];
    keys.forEach(function(k, i){
      lines.push((i === keys.length - 1 ? "└── " : "├── ") + k + "/");
    });
    lines.push("\n" + keys.length + " directories, 0 loose files");
    tprint(lines.join("\n"), "out");
  }

  function fakePing(host){
    var n = 0;
    tprint("PING " + host + " via tailscale0", "out");
    var iv = setInterval(function(){
      n++;
      var ms = (1.2 + Math.random() * 2.3).toFixed(1);
      tprint("64 bytes from homeserver: icmp_seq=" + n + " ttl=64 time=" + ms + " ms", "out");
      if(n >= 4){
        clearInterval(iv);
        tprint("--- " + host + " ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss", "out");
        tin.scrollIntoView({block: "nearest"});
      }
    }, 420);
  }

  function cmatrix(){
    if(document.getElementById("mtx")) return;
    if(reduce){ tprint("cmatrix: disabled — prefers-reduced-motion is set", "out"); return; }
    var cv = document.createElement("canvas");
    cv.id = "mtx";
    document.body.appendChild(cv);
    var ctx = cv.getContext("2d");
    cv.width = innerWidth; cv.height = innerHeight;
    var fs = 14, cols = Math.floor(cv.width / fs);
    var drops = [];
    for(var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
    var CHARS = "アイウエオカキクケコ01<>~/$#";
    var iv = setInterval(function(){
      ctx.fillStyle = "rgba(13,11,20,.14)";
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = "#A6E3A1";
      ctx.font = fs + "px monospace";
      drops.forEach(function(y, x){
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x * fs, y * fs);
        drops[x] = y * fs > cv.height && Math.random() > .975 ? 0 : y + 1;
      });
    }, 50);
    var stopped = false;
    function stop(){
      if(stopped) return;
      stopped = true;
      clearInterval(iv);
      cv.remove();
      window.removeEventListener("keydown", stop);
      window.removeEventListener("pointerdown", stop);
      tprint("cmatrix: session ended", "out");
    }
    setTimeout(function(){
      window.addEventListener("keydown", stop);
      window.addEventListener("pointerdown", stop);
      setTimeout(stop, 8000);
    }, 200);
  }

  var history = [];
  var hidx = 0;
  var COMMANDS = ["help", "whoami", "ls", "open ", "cat contact.txt", "cat security.txt",
    "skills ps", "skills ps --", "uses", "git log", "avail", "neofetch", "uptime", "tree", "btop",
    "history", "fortune",
    "ping", "date", "echo ", "clear", "sudo hire syamxm", "cmatrix"];

  function run(c){
    var parts = c.split(/\s+/);
    if(c === "clear"){ tout.textContent = ""; return; }
    echo(c);
    if(c === "help"){
      tprint("help  whoami  ls  tree  open <project>  cat contact.txt  neofetch\nskills ps [--group]  uses  btop  git log  avail  uptime  fortune  ping\ndate  echo  history  clear  sudo hire syamxm", "out");
    } else if(c === "whoami"){
      tprint("visitor — guest session on syamxm@homeserver", "out");
    } else if(c === "ls" || c === "ls ~/projects" || c === "ls projects"){
      tprint(Object.keys(PROJECTS).map(function(k){ return k + "/"; }).join("  "), "out");
    } else if(parts[0] === "open"){
      var url = PROJECTS[parts[1]];
      if(url){ tprint("opening " + url + " ...", "out"); window.open(url, "_blank", "noopener"); }
      else tprint("open: unknown project '" + (parts[1] || "") + "' — try: " + Object.keys(PROJECTS).join(", "), "err");
    } else if(c === "cat contact.txt"){
      tprint("email   ahmadsyamim200@gmail.com\ngithub  github.com/syamxm", "out");
    } else if(c === "cat security.txt"){
      document.getElementById("posture").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
      tprint("rendered above ↑", "out");
    } else if(c === "neofetch"){
      tprint(neofetch(), "out");
    } else if(c === "tree" || c === "tree ~/projects" || c === "tree projects"){
      tree();
    } else if(c === "history"){
      tprint(history.map(function(h, i){ return "  " + (i + 1) + "  " + h; }).join("\n") || "history: empty", "out");
    } else if(c === "fortune"){
      tprint(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], "out");
    } else if(parts[0] === "ping"){
      fakePing(parts[1] || "syamxm.com");
    } else if(c === "date"){
      tprint(new Date().toString(), "out");
    } else if(parts[0] === "echo"){
      tprint(c.slice(5) || "", "out");
    } else if(c === "cmatrix" || c === "matrix"){
      tprint("wake up, visitor ... (any key to exit)", "out");
      cmatrix();
    } else if(c === "uses" || c === "cat uses" || c === "cat ~/uses"){
      document.getElementById("uses").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
      tprint(USES, "out");
    } else if(parts[0] === "git" || c === "timeline"){
      if(parts[0] === "git" && parts[1] !== "log" && parts[1] !== undefined){
        tprint("git: '" + parts[1] + "' is not supported here — try 'git log'", "err");
      } else {
        document.getElementById("timeline").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
        tprint(TIMELINE, "out");
      }
    } else if(c === "avail" || c === "availability"){
      var a = availability();
      tprint("internship  devops intern · 7 sep 2026 – 5 mar 2027 · 6 months, confirmed\n" +
             "status      placed — " + (a ? a.note.replace(/\.$/, "") : "window closed") + "\n" +
             "contact     ahmadsyamim200@gmail.com", "out");
    } else if(parts[0] === "skills"){
      var cat = (parts[2] || "--all").replace(/^--/, "");
      var shown = applyStackFilter(cat);
      if(!shown){
        tprint("skills: unknown group '" + cat + "' — try: " + STACK_CATS.join(", "), "err");
      } else {
        document.getElementById("stack").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
        tprint(shown + " unit" + (shown === 1 ? "" : "s") + " matched --" + cat + " — rendered above ↑", "out");
      }
    } else if(c === "uptime"){
      if(!live) tprint("uptime: no reading yet — the homeserver has not answered", "err");
      else tprint("up " + live.uptime + " · cpu " + live.temp + " · all systems green", "out");
    } else if(c === "btop" || c === "htop" || c === "top"){
      document.getElementById("btop").scrollIntoView({behavior: reduce ? "auto" : "smooth"});
      if(!live) tprint("btop: waiting for the homeserver to answer ↑", "out");
      else {
        var d = live.data;
        tprint("cpu  " + d.cpu.pct + "%  " + live.temp + "  load " + d.cpu.load.join(" ") + "\n" +
               "mem  " + d.mem.pct + "% used · swap " + d.mem.swap_pct + "%\n" +
               "disk " + d.disk.pct + "% of root · " + d.containers_running + " containers running\n" +
               "rendered above ↑", "out");
      }
    } else if(c === "sudo hire syamxm"){
      tprint("[sudo] password for recruiter: ********\naccess granted — forwarding to ahmadsyamim200@gmail.com ...", "out");
    } else if(c === "rm -rf /" || c === "sudo rm -rf /"){
      panic();
    } else {
      tprint("fish: Unknown command: " + c + " — try 'help'", "err");
    }
    tin.scrollIntoView({block: "nearest"});
  }

  fp.addEventListener("click", function(){ tin.focus(); });
  tin.addEventListener("keydown", function(e){
    if(e.key === "Escape"){ tin.blur(); return; }
    if(e.key === "ArrowUp"){
      e.preventDefault();
      if(hidx > 0) tin.value = history[--hidx];
      return;
    }
    if(e.key === "ArrowDown"){
      e.preventDefault();
      if(hidx < history.length - 1) tin.value = history[++hidx];
      else { hidx = history.length; tin.value = ""; }
      return;
    }
    if(e.key === "Tab"){
      e.preventDefault();
      var v = tin.value;
      if(!v) return;
      var pool = COMMANDS;
      if(/^open\s+/.test(v)){
        pool = Object.keys(PROJECTS).map(function(k){ return "open " + k; });
      } else if(/^skills\s+ps\s+-/.test(v)){
        pool = STACK_CATS.map(function(k){ return "skills ps --" + k; });
      }
      var hits = pool.filter(function(cmd){ return cmd.indexOf(v) === 0; });
      if(hits.length === 1){ tin.value = hits[0]; }
      else if(hits.length > 1){ tprint(hits.join("  "), "out"); tin.scrollIntoView({block: "nearest"}); }
      return;
    }
    if(e.key !== "Enter") return;
    var c = tin.value.trim();
    tin.value = "";
    if(c){
      history.push(c);
      hidx = history.length;
      run(c);
    }
  });
  document.addEventListener("keydown", function(e){
    if(e.key !== "/" || e.target === tin) return;
    if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    e.preventDefault();
    fp.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "center"});
    tin.focus({preventScroll: true});
  });

  /* ---- waybar clock — the sensors next to it are painted by js/metrics.js ---- */
  var clkT = document.getElementById("clk-t");
  var clkD = document.getElementById("clk-d");
  function tick(){
    if(document.hidden || !clkT) return;
    var d = new Date();
    clkT.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    clkD.textContent = pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + String(d.getFullYear()).slice(2);
  }
  tick();
  setInterval(tick, 1000);

  /* ---- internship availability ---- */
  var availEls = document.querySelectorAll("[data-avail]");
  var availWhenEls = document.querySelectorAll("[data-availwhen]");
  var availCount = document.getElementById("availcount");
  function paintAvailability(){
    var a = availability();
    if(!a){
      availEls.forEach(function(el){ el.remove(); });
      if(availCount) availCount.textContent = "";
      return;
    }
    availWhenEls.forEach(function(el){ el.textContent = a.pill; });
    if(availCount) availCount.textContent = a.note;
  }
  paintAvailability();
  setInterval(paintAvailability, 3600000);

  /* ---- mobile burger menu ---- */
  var burger = document.getElementById("burger");
  var barmenu = document.getElementById("barmenu");
  function setMenu(open){
    if(!burger || !barmenu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    barmenu.hidden = !open;
  }
  if(burger && barmenu){
    burger.addEventListener("click", function(){
      setMenu(barmenu.hidden);
    });
    barmenu.addEventListener("click", function(e){
      if(e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", function(e){
      if(barmenu.hidden) return;
      if(burger.contains(e.target) || barmenu.contains(e.target)) return;
      setMenu(false);
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && !barmenu.hidden){ setMenu(false); burger.focus(); }
    });
    window.addEventListener("resize", function(){
      if(window.innerWidth > 620) setMenu(false);
    }, {passive: true});
  }

  /* ---- workspace pills follow the section in view ---- */
  var pills = document.querySelectorAll("[data-nav]");
  var secList = document.querySelectorAll("main section[id]");
  var spyLock = 0;
  function setActive(id){
    pills.forEach(function(p){
      p.classList.toggle("on", p.getAttribute("href") === "#" + id);
    });
  }
  function atBottom(){
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  }
  if(pills.length && secList.length && "IntersectionObserver" in window){
    var vis = {};
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var cap = Math.min(e.rootBounds ? e.rootBounds.height : window.innerHeight,
                           e.target.offsetHeight || 1);
        vis[e.target.id] = e.isIntersecting ? e.intersectionRect.height / cap : 0;
      });
      if(Date.now() < spyLock) return;
      if(atBottom()){ setActive(secList[secList.length - 1].id); return; }
      var best = "", max = 0;
      secList.forEach(function(s){
        var r = vis[s.id] || 0;
        if(r > max){ max = r; best = s.id; }
      });
      if(best) setActive(best);
    }, {threshold: [0, .15, .35, .55, .75, 1]});
    secList.forEach(function(s){ spy.observe(s); });
    pills.forEach(function(p){
      p.addEventListener("click", function(){
        spyLock = Date.now() + 800;
        setActive(p.getAttribute("href").slice(1));
      });
    });
  }

  /* ---- bar glow once scrolled + bottom pin for last pill ---- */
  var bar = document.getElementById("topbar");
  window.addEventListener("scroll", function(){
    if(bar) bar.classList.toggle("scrolled", window.scrollY > 8);
    if(pills.length && atBottom() && Date.now() >= spyLock){
      setActive(secList[secList.length - 1].id);
    }
  }, {passive: true});

  /* ---- stack: filter pills behave like shell flags ---- */
  var stackRows = document.querySelectorAll("#stack .psrow");
  var stackGroups = document.querySelectorAll("#stack .psgroup");
  var fpills = document.querySelectorAll(".fpill");
  var psflag = document.getElementById("psflag");
  var psecho = document.getElementById("psecho");
  var STACK_CATS = ["all", "infra", "ci-cd", "security", "observability", "backend", "frontend", "languages"];

  var stackEl = document.getElementById("stack");
  var filterTimers = [];
  var activeCat = "all";

  function matches(group, cat){ return cat === "all" || group.dataset.cat === cat; }
  function rowsOf(group){ return group.querySelectorAll(".psrow"); }

  /* a click mid-transition cancels pending timers, so land the previous
     filter instantly first — otherwise its half-applied state sticks */
  function commitPending(){
    if(!filterTimers.length) return;
    filterTimers.forEach(clearTimeout);
    filterTimers = [];
    stackGroups.forEach(function(g){
      g.classList.remove("leaving");
      g.hidden = !matches(g, activeCat);
    });
    stackRows.forEach(function(r){
      r.classList.remove("fresh");
      r.style.setProperty("--d", r.dataset.depth);
    });
  }

  /* groups leave, the list closes up, then the surviving rows stream back in */
  function applyStackFilter(cat){
    if(STACK_CATS.indexOf(cat) < 0) return 0;
    var shown = 0;
    stackGroups.forEach(function(g){ if(matches(g, cat)) shown += rowsOf(g).length; });

    fpills.forEach(function(p){ p.classList.toggle("on", p.dataset.cat === cat); });
    if(psflag) psflag.textContent = "--" + cat;
    if(psecho) psecho.textContent = shown + " unit" + (shown === 1 ? "" : "s") + " matched --" + cat;
    if(cat === activeCat) return shown;
    commitPending();
    activeCat = cat;

    var leaving = [], entering = [];
    stackGroups.forEach(function(g){
      if(matches(g, cat)){ if(g.hidden) entering.push(g); }
      else if(!g.hidden) leaving.push(g);
    });

    leaving.forEach(function(g){ g.classList.add("leaving"); });
    entering.forEach(function(g){
      g.classList.add("leaving");
      rowsOf(g).forEach(function(r){
        r.style.setProperty("--d", 0);
        if(!reduce) r.classList.add("fresh");
      });
      g.hidden = false;
    });

    filterTimers.push(setTimeout(function(){
      leaving.forEach(function(g){ g.hidden = true; g.classList.remove("leaving"); });
      entering.forEach(function(g){ g.classList.remove("leaving"); });
      streamIn(cat);
      if(stackEl.getBoundingClientRect().top < 0){
        stackEl.scrollIntoView({behavior: reduce ? "auto" : "smooth"});
      }
    }, reduce ? 0 : 220));

    return shown;
  }

  /* every visible bar refills, so the filter reads as the command re-running */
  function streamIn(cat){
    var i = 0;
    stackGroups.forEach(function(g){
      if(!matches(g, cat)) return;
      rowsOf(g).forEach(function(r){
        var delay = reduce ? 0 : i++ * 35;
        r.style.setProperty("--d", 0);
        filterTimers.push(setTimeout(function(){
          r.classList.remove("fresh");
          r.style.setProperty("--d", r.dataset.depth);
        }, delay + 30));
      });
    });
  }
  fpills.forEach(function(p){
    p.addEventListener("click", function(){ applyStackFilter(p.dataset.cat); });
  });

  function fillDepth(){
    stackRows.forEach(function(r){ r.style.setProperty("--d", r.dataset.depth); });
  }

  if(reduce){ fillDepth(); return; } /* final state already in the markup */

  if(document.getElementById("boot")){
    document.addEventListener("boot:done", start, {once: true});
  } else {
    start();
  }

  function start(){
  document.body.classList.add("anim");

  /* ---- helpers ---- */
  function typeSpans(spans, done){
    var si = 0;
    (function next(){
      if(si >= spans.length){ done(); return; }
      var sp = spans[si], txt = sp.dataset.t, i = 0;
      (function tick(){
        if(i < txt.length){
          sp.textContent = txt.slice(0, ++i);
          setTimeout(tick, 52 + Math.random()*70);
        } else { si++; setTimeout(next, 90); }
      })();
    })();
  }
  function reveal(container, done){
    var lines = container.querySelectorAll(".ln");
    lines.forEach(function(l, i){
      setTimeout(function(){ l.classList.add("in"); }, i*55);
    });
    if(done) setTimeout(done, lines.length*55 + 200);
  }

  /* ---- pipeline gates: "… running" then "✓ pass", stage by stage ---- */
  var gates = document.querySelectorAll(".gate");
  gates.forEach(function(g){ g.textContent = ""; });
  function runGates(){
    var t = 0, steps = [[],[],[],[]];
    gates.forEach(function(g){ steps[+g.dataset.step].push(g); });
    steps.forEach(function(gs){
      gs.forEach(function(g){
        setTimeout(function(){ g.textContent = "… running"; g.className = "gate y"; }, t);
        setTimeout(function(){
          g.textContent = g.dataset.done;
          g.className = "gate done " + (g.dataset.done === "✓ live" ? "p" : "g");
        }, t + 520);
      });
      t += 640;
    });
  }

  /* ---- stack units: "starting" then their real state, row by row ---- */
  stackRows.forEach(function(r){
    var txt = r.querySelector(".state .txt");
    r.dataset.state = txt.textContent;
    txt.textContent = "starting";
    r.classList.add("starting");
  });
  /* each unit settles shortly after its own line has streamed in */
  function runStack(){
    var lines = Array.prototype.slice.call(document.querySelectorAll("#stack .ln"));
    stackRows.forEach(function(r){
      setTimeout(function(){
        r.querySelector(".state .txt").textContent = r.dataset.state;
        r.classList.remove("starting");
        r.classList.add("settled");
        r.style.setProperty("--d", r.dataset.depth);
      }, lines.indexOf(r) * 55 + 420);
    });
  }

  /* ---- timeline: hashes resolve as the graph rail draws down ---- */
  var commits = document.querySelectorAll("#timeline .commit");
  commits.forEach(function(c){ c.querySelector(".hash").textContent = "·······"; });
  function randHash(){
    var h = "";
    while(h.length < 7) h += "0123456789abcdef".charAt(Math.floor(Math.random() * 16));
    return h;
  }
  function runLog(){
    var glog = document.querySelector(".glog");
    var lines = Array.prototype.slice.call(document.querySelectorAll("#timeline .ln"));
    if(glog) setTimeout(function(){ glog.classList.add("drawn"); }, 260);
    commits.forEach(function(c){
      setTimeout(function(){
        var el = c.querySelector(".hash"), spins = 0;
        (function flick(){
          if(spins++ < 6){ el.textContent = randHash(); setTimeout(flick, 55); }
          else { el.textContent = c.dataset.hash; c.classList.add("committed"); }
        })();
      }, lines.indexOf(c) * 55 + 380);
    });
  }

  /* ---- sections: type the command, then stream the output ---- */
  var secs = document.querySelectorAll("section[id]:not(#about)");
  secs.forEach(function(sec){
    sec.querySelectorAll(".sechead .t").forEach(function(sp){
      sp.dataset.t = sp.textContent;
      sp.textContent = "";
    });
  });
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target);
      var sec = e.target;
      typeSpans(sec.querySelectorAll(".sechead .t"), function(){
        if(sec.id === "stack"){
          if(psflag) psflag.textContent = "--" + activeCat;
          runStack();
        }
        if(sec.id === "timeline") runLog();
        reveal(sec, sec.id === "projects" ? runGates : null);
      });
    });
  },{threshold:.12, rootMargin:"0px 0px -8% 0px"});
  secs.forEach(function(s){ io.observe(s); });

  /* ---- hero: type "whoami", then stream the answer ---- */
  var typed = document.getElementById("typed");
  var out = document.getElementById("hero-out");
  var text = "whoami";
  typed.textContent = "";
  var i = 0;
  setTimeout(function tick(){
    if(i < text.length){
      typed.textContent = text.slice(0, ++i);
      setTimeout(tick, 52 + Math.random()*70);
    } else {
      setTimeout(function(){ reveal(out); }, 340);
    }
  }, 520);
  }
})();
