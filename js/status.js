(function(){
  var cards = Array.from(document.querySelectorAll("a.proj")).filter(function(card){
    return new URL(card.href).hostname.endsWith(".syamxm.com");
  }).map(function(card){
    var badge = document.createElement("span");
    badge.className = "site-status";
    badge.textContent = "checking…";
    card.querySelector(".head").appendChild(badge);
    return {host: new URL(card.href).hostname, badge: badge};
  });
  var summary = document.querySelector("[data-project-summary]");
  var inflight = false;
  var timer;

  function paint(sites){
    var offline = 0;
    cards.forEach(function(card){
      var site = sites && sites.find(function(site){ return site && site.host === card.host; });
      var live = site && site.state === "live";
      card.badge.dataset.state = live ? "live" : "offline";
      card.badge.textContent = live ? "online" : site ? "offline" : "offline · unverified";
      card.badge.title = site ? "Last check of https://" + card.host + "/: " + site.state : "No reachable status reading for this site";
      if(!live) offline++;
    });
    if(summary) summary.textContent = sites
      ? (offline ? offline + " project sites offline or unverified" : "project sites reachable")
      : "status service unreachable — project availability unverified";
  }

  function poll(){
    if(inflight) return;
    clearTimeout(timer);
    if(document.hidden){ timer = setTimeout(poll, 30000); return; }
    inflight = true;
    fetch("https://status.syamxm.com/api/status", {
      headers: {accept: "application/json"}, cache: "no-store", signal: AbortSignal.timeout(8000)
    }).then(function(response){
      if(response.status !== 200) throw new Error(response.status);
      return response.json();
    }).then(function(data){
      if(!data || !Array.isArray(data.sites)) throw new Error("Invalid status response");
      paint(data.sites);
    }).catch(function(){
      // ponytail: home-hosted status cannot verify independent sites during an outage; move the checker offsite if needed.
      paint(null);
    }).then(function(){ inflight = false; timer = setTimeout(poll, 30000); });
  }

  document.addEventListener("visibilitychange", function(){ if(!document.hidden) poll(); });
  poll();
})();
