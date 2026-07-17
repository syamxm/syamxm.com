(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- interactive prompt (always active) ---- */
  var tin = document.getElementById("tin");
  var tout = document.getElementById("tout");
  var CMDS = {
    "help": "help  ls  cat contact.txt  clear  sudo hire syamxm",
    "ls": "BeanThere/  taskflow/  homeserver-dashboard/  student_reminder_system/  cipher-agent/  cipher-forge/  cv-api/",
    "cat contact.txt": "email   ahmadsyamim200@gmail.com\ngithub  github.com/syamxm",
    "sudo hire syamxm": "[sudo] password for recruiter: ********\naccess granted — forwarding to ahmadsyamim200@gmail.com ..."
  };
  function tprint(text, cls){
    text.split("\n").forEach(function(line){
      var d = document.createElement("div");
      d.className = cls;
      d.textContent = line;
      tout.appendChild(d);
    });
  }
  document.getElementById("fp").addEventListener("click", function(){ tin.focus(); });
  tin.addEventListener("keydown", function(e){
    if(e.key !== "Enter") return;
    var c = tin.value.trim();
    tin.value = "";
    if(!c) return;
    if(c === "clear"){ tout.textContent = ""; return; }
    var echo = document.createElement("div");
    var p = document.createElement("span");
    p.className = "prompt";
    p.innerHTML = '<span class="tick">~&gt;</span> ';
    var t = document.createElement("span");
    t.className = "cmd";
    t.textContent = c;
    echo.appendChild(p); echo.appendChild(t);
    tout.appendChild(echo);
    if(CMDS[c]) tprint(CMDS[c], "out");
    else tprint("fish: Unknown command: " + c, "err");
    tin.scrollIntoView({block:"nearest"});
  });

  if(reduce) return; /* final state already in the markup */

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
})();
