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

  var NEOFETCH = [
    "   ▄▄▄▄▄▄▄     visitor@syamxm.com",
    "  █ ~> ▌  █    ------------------",
    "  █       █    os      debian 13 · self-hosted",
    "  █ ▂▂▂▂▂ █    shell   fish",
    "   ▀▀▀▀▀▀▀     net     tailscale + cloudflare tunnel",
    "               ci      6/6 gates · fail-closed",
    "               theme   catppuccin mocha"
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

  function run(c){
    var parts = c.split(/\s+/);
    if(c === "clear"){ tout.textContent = ""; return; }
    echo(c);
    if(c === "help"){
      tprint("help  whoami  ls  open <project>  cat contact.txt  neofetch  uptime  clear  sudo hire syamxm", "out");
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
    if(e.key !== "Enter") return;
    var c = tin.value.trim();
    tin.value = "";
    if(c) run(c);
  });
  document.addEventListener("keydown", function(e){
    if(e.key !== "/" || e.target === tin) return;
    if(/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    e.preventDefault();
    fp.scrollIntoView({behavior: reduce ? "auto" : "smooth", block: "center"});
    tin.focus({preventScroll: true});
  });

  /* ---- live uptime in the footer ---- */
  var footstat = document.getElementById("footstat");
  if(footstat){
    setInterval(function(){ footstat.textContent = "up " + uptime() + " · 6/6 gates · fail-closed"; }, 1000);
  }

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
  var secs = document.querySelectorAll("section[id]");
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
