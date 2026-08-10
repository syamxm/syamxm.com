"use strict";
(function () {
  var wraps = document.querySelectorAll("[data-visitors]");
  var counts = document.querySelectorAll("[data-visitors-count]");
  if (!wraps.length) return;

  var HIDE_AFTER_MS = 120000;
  var hideTimer = null;

  function render(count) {
    var show = typeof count === "number" && count > 0;
    wraps.forEach(function (node) { node.hidden = !show; });
    if (!show) return;
    var text = count === 1 ? "1 here now" : count + " here now";
    counts.forEach(function (node) { node.textContent = text; });
  }

  document.addEventListener("metrics", function (event) {
    var visitors = event.detail.data.visitors;
    render(visitors ? visitors.count : null);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () { render(null); }, HIDE_AFTER_MS);
  });
})();
