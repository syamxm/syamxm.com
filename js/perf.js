(function(){
  var root = document.documentElement;

  if(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4){
    document.body.classList.add("lite-root");
  }

  document.addEventListener("visibilitychange", function(){
    root.classList.toggle("tab-hidden", document.hidden);
  });

  var hero = document.querySelector(".hero");
  if(hero && "IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      root.classList.toggle("hero-off", !entries[0].isIntersecting);
    }).observe(hero);
  }

  var netmap = document.querySelector(".netmap");
  if(netmap && "IntersectionObserver" in window){
    new IntersectionObserver(function(entries){
      root.classList.toggle("netmap-off", !entries[0].isIntersecting);
    }).observe(netmap);
  }
})();
