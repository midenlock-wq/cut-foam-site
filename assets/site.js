
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
  });
  var hamb = document.getElementById('hamb');
  var menu = document.getElementById('menu');
  if(hamb && menu){
    hamb.addEventListener('click', function(){
      if(menu.style.display === 'flex'){ menu.style.display = 'none'; }
      else { menu.style.display = 'flex'; menu.style.gap='12px'; }
    });
  }
  fetch('assets/config.json', {cache:'no-store'})
    .then(r=>r.json())
    .then(cfg=>{
      var grid = document.getElementById('grid');
      if(!grid) return;
      grid.innerHTML = '';
      (cfg.items || []).forEach(function(it){
        var el = document.createElement('div');
        el.className = 'item';
        var img = document.createElement('img');
        img.loading = 'lazy';
        img.src = it.src;
        img.alt = it.alt || 'نمونه کار کات فوم';
        el.appendChild(img);
        if(it.caption){
          var cap = document.createElement('div');
          cap.className = 'cap';
          cap.textContent = it.caption;
          el.appendChild(cap);
        }
        grid.appendChild(el);
      });
    })
    .catch(()=>{});
})();
