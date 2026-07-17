(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce || sessionStorage.getItem("booted")) return;
  sessionStorage.setItem("booted", "1");

  var LINES = [
    ["syamxm BIOS v2.4 — POST", ""],
    ["cpu0: online  cpu1: online  cpu2: online  cpu3: online", "ok"],
    ["memtest: 32768M", "ok"],
    ["loading kernel 6.12-syamxm ...", ""],
    ["[    0.000000] Linux version 6.12-syamxm (gcc 14.2.0)", ""],
    ["[    0.041337] fs: mounting /home/syamxm/projects", "ok"],
    ["[    0.113713] net: tailscale0 up — 100.x.y.z", "ok"],
    ["[    0.201102] nginx: config test successful", "ok"],
    ["[    0.334455] pipeline: 6/6 gates green — fail-closed", "ok"],
    ["[    0.412000] fail2ban: watching auth.log", "ok"],
    ["starting session for visitor ...", ""],
    ["motd: welcome. type 'help' at the prompt below.", ""]
  ];

  var boot = document.createElement("div");
  boot.id = "boot";
  boot.setAttribute("aria-hidden", "true");
  var pre = document.createElement("pre");
  boot.appendChild(pre);
  var hint = document.createElement("span");
  hint.id = "boothint";
  hint.textContent = "press any key to skip";
  boot.appendChild(hint);
  document.body.appendChild(boot);
  document.body.classList.add("booting");

  var i = 0, done = false, timer = 0;
  function line(){
    if(i >= LINES.length){ finish(); return; }
    var l = LINES[i++];
    pre.textContent += l[0] + (l[1] ? "  [ " + l[1].toUpperCase() + " ]" : "") + "\n";
    timer = setTimeout(line, i < 4 ? 130 : 90);
  }
  function finish(){
    if(done) return;
    done = true;
    clearTimeout(timer);
    window.removeEventListener("keydown", finish);
    window.removeEventListener("pointerdown", finish);
    boot.classList.add("off");
    document.body.classList.remove("booting");
    document.dispatchEvent(new Event("boot:done"));
    setTimeout(function(){ boot.remove(); }, 500);
  }
  window.addEventListener("keydown", finish);
  window.addEventListener("pointerdown", finish);
  setTimeout(line, 180);
  setTimeout(finish, 3200);
})();
