"use strict";
(function () {
  var UPDATES = [
    "live btop panel now reads the home server directly",
    "deploy pipeline runs over tailscale, no public ssh",
    "internship placed — 7 sep 2026 to 5 mar 2027",
    "open to freelance work"
  ];

  var MOTD_MAX_LENGTH = 80;

  var root = document.querySelector("[data-ticker]");
  var windowEl = root && root.querySelector("[data-ticker-window]");
  if (!windowEl) return;

  function buildRun(items, duplicate) {
    var run = document.createElement("div");
    run.className = "ticker-run";
    if (duplicate) run.setAttribute("aria-hidden", "true");

    items.forEach(function (text) {
      var item = document.createElement("span");
      item.className = "ticker-item";
      item.textContent = text;
      run.appendChild(item);

      var sep = document.createElement("span");
      sep.className = "ticker-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "•";
      run.appendChild(sep);
    });

    return run;
  }

  function render(items) {
    var track = document.createElement("div");
    track.className = "ticker-track";
    track.appendChild(buildRun(items, false));
    track.appendChild(buildRun(items, true));

    var chars = items.join("").length + items.length * 3;
    track.style.setProperty("--ticker-duration", Math.max(20, Math.round(chars * 0.34)) + "s");

    windowEl.replaceChildren(track);
  }

  render(UPDATES);

  fetch("/motd.json", { cache: "no-store" })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      var text = data && typeof data.text === "string" ? data.text.trim() : "";
      if (!text || text.length > MOTD_MAX_LENGTH) return;
      render([text].concat(UPDATES));
    })
    .catch(function () {});
})();
