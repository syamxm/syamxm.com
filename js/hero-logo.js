"use strict";
(function () {
  var stage = document.getElementById("ascii-logo");
  if (!stage || typeof Ascii3D === "undefined") return;

  var FRAME_MS = 1000 / 30;
  var MAX_STEP_MS = 100;

  fetch("ascii-art.txt")
    .then(function (res) {
      if (!res.ok) throw new Error("ascii-art.txt " + res.status);
      return res.text();
    })
    .then(function (text) {
      var model = Ascii3D.buildModel(Ascii3D.parseArt(text));

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        stage.textContent = Ascii3D.renderFrame(model, 0.6);
        return;
      }

      var t = 0;
      var lastNow = null;
      var rafId = 0;
      var onScreen = false;

      function tick(now) {
        rafId = requestAnimationFrame(tick);
        if (lastNow === null) lastNow = now;
        var dt = now - lastNow;
        if (dt < FRAME_MS) return;
        lastNow = now;
        t += Math.min(dt, MAX_STEP_MS);
        stage.textContent = Ascii3D.renderFrame(model, t / 1000);
      }

      function play() {
        if (!rafId) rafId = requestAnimationFrame(tick);
      }

      function pause() {
        cancelAnimationFrame(rafId);
        rafId = 0;
        lastNow = null;
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) pause();
        else if (onScreen) play();
      });

      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && !document.hidden) play();
        else pause();
      }).observe(stage);
    })
    .catch(function () {
      stage.hidden = true;
    });
})();
