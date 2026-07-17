(function(){
  var ov = document.getElementById("ov");
  var ovimg = document.getElementById("ovimg");
  var ovtitle = document.getElementById("ovtitle");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function open(src, path, alt){
    ovimg.src = src;
    ovimg.alt = alt;
    ovtitle.textContent = path;
    ov.hidden = false;
    document.body.style.overflow = "hidden";
  }
  var BLANK = ovimg.src;
  var closing = false;
  function close(){
    if(closing) return;
    function hide(){
      closing = false;
      ov.classList.remove("closing");
      ov.hidden = true;
      ovimg.src = BLANK;
      document.body.style.overflow = "";
    }
    if(reduce){ hide(); return; }
    closing = true;
    ov.classList.add("closing");
    setTimeout(hide, 300);
  }

  document.querySelectorAll(".shot").forEach(function(btn){
    btn.addEventListener("click", function(){
      var img = btn.querySelector("img");
      var path = btn.querySelector(".shotname").textContent;
      var file = path.split("/").pop();
      var echo = btn.closest(".shots").querySelector(".shotecho");
      echo.textContent = "";
      var p = document.createElement("span");
      p.className = "prompt";
      p.innerHTML = '<span class="tick">~&gt;</span> ';
      var c = document.createElement("span");
      c.className = "cmd";
      c.textContent = "feh " + file;
      var cur = document.createElement("span");
      cur.className = "cursor blink";
      echo.appendChild(p); echo.appendChild(c); echo.appendChild(cur);
      if(reduce){ open(img.src, path, img.alt); return; }
      setTimeout(function(){ open(img.src, path, img.alt); }, 420);
    });
  });

  ov.addEventListener("click", function(e){ if(e.target === ov) close(); });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && !ov.hidden) close();
  });
})();
