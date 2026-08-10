"use strict";
(function () {
  var stage = document.getElementById("ascii-logo");
  if (!stage || typeof Ascii3D === "undefined") return;

  var FRAME_MS = 1000 / 30;

  fetch("ascii-art.txt")
    .then(function (res) {
      if (!res.ok) throw new Error("ascii-art.txt " + res.status);
      return res.text();
    })
    .then(function (text) {
      var model = Ascii3D.buildModel(Ascii3D.parseArt(text));
      var start = performance.now();
      var last = -Infinity;
      function tick(now) {
        if (now - last >= FRAME_MS) {
          last = now;
          stage.textContent = Ascii3D.renderFrame(model, (now - start) / 1000);
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })
    .catch(function () {
      stage.hidden = true;
    });
})();
