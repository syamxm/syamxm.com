(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- interactive shell (always active) ---- */
  var tin = document.getElementById("tin");
  var tout = document.getElementById("tout");
  var fp = document.getElementById("fp");
  var BOOT_EPOCH = Date.parse("2026-07-17T04:00:00Z");

  var PROJECTS = {
    "beanthere": "https://beanthere.syamxm.com",
    "taskflow": "https://taskflow.syamxm.com",
    "dashboard": "https://dash.syamxm.com",
    "reminder": "https://github.com/syamxm/student_reminder_system",
    "cipher-agent": "https://cipher-agent.syamxm.com",
    "cipher-forge": "https://cipher-forge.syamxm.com",
    "cv": "https://cv.syamxm.com"
  };

  function pad(n){ return (n < 10 ? "0" : "") + n; }
  function uptime(){
    var s = Math.max(0, Math.floor((Date.now() - BOOT_EPOCH) / 1000));
    var d = Math.floor(s / 86400);
    s -= d * 86400;
    return d + "d " + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60);
  }

  var FORTUNES = [
    "the S in IoT stands for security",
    "there is no cloud, only someone else's computer — mine is in my room",
    "fail-closed beats fail-open. ask the pipeline.",
    "a backup you haven't restored is a rumour",
    "least privilege: because 'sudo everything' is a lifestyle, not a policy",
    "the best time to rotate a secret was before the commit. the second best is now.",
    "127.0.0.1 is where the heart is"
  ];

  var NEOFETCH = [
    "   ▄▄▄▄▄▄▄     visitor@syamxm.com",
    "  █ ~> ▌  █    ------------------",
    "  █       █    os      debian 13 · self-hosted",
    "  █ ▂▂▂▂▂ █    shell   fish",
    "   ▀▀▀▀▀▀▀     net     tailscale + cloudflare tunnel",
    "               ci      6/6 gates · fail-closed",
    "               theme   cachyos violet"
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
    "neofetch", "uptime", "tree", "history", "fortune", "ping", "date", "echo ",
    "clear", "sudo hire syamxm", "cmatrix"];

  function run(c){
    var parts = c.split(/\s+/);
    if(c === "clear"){ tout.textContent = ""; return; }
    echo(c);
    if(c === "help"){
      tprint("help  whoami  ls  tree  open <project>  cat contact.txt  neofetch\nuptime  fortune  ping  date  echo  history  clear  sudo hire syamxm", "out");
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
      tprint(NEOFETCH, "out");
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
    } else if(c === "uptime"){
      tprint("up " + uptime() + " · all systems green", "out");
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
      var pool = /^open\s+/.test(v)
        ? Object.keys(PROJECTS).map(function(k){ return "open " + k; })
        : COMMANDS;
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

  /* ---- footer uptime + waybar clock / sensors ---- */
  var footstat = document.getElementById("footstat");
  var clkT = document.getElementById("clk-t");
  var clkD = document.getElementById("clk-d");
  var temp = document.getElementById("temp");
  var pup = document.getElementById("pup");
  var loadT = Date.now();
  function tick(){
    if(document.hidden) return;
    var d = new Date();
    if(clkT){
      clkT.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
      clkD.textContent = pad(d.getMonth() + 1) + "/" + pad(d.getDate()) + "/" + String(d.getFullYear()).slice(2);
    }
    if(footstat) footstat.textContent = "up " + uptime() + " · 6/6 gates · fail-closed";
    if(pup){
      var m = Math.floor((Date.now() - loadT) / 60000);
      pup.textContent = "up " + (m < 60 ? m + "m" : Math.floor(m / 60) + "h " + (m % 60) + "m");
    }
    if(temp && d.getSeconds() % 5 === 0){
      temp.textContent = (45 + Math.floor(Math.random() * 8)) + " °C";
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ---- workspace pills follow the section in view ---- */
  var pills = document.querySelectorAll(".ws");
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

  if(reduce) return; /* final state already in the markup */

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
