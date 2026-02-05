document.addEventListener('DOMContentLoaded', function(){
  var product = window.spaceinProduct || {};

  var slider = document.querySelector('.spacein-slider');
  var slides = Array.from(document.querySelectorAll('.spacein-slide'));
  var thumbs = Array.from(document.querySelectorAll('.spacein-thumb'));
  var currentIndex = 0;

  function showSlide(index){
    index = Math.max(0, Math.min(index, slides.length-1));
    slides.forEach(function(s,i){
      s.classList.toggle('active', i===index);
    });
    thumbs.forEach(function(t,i){ t.classList.toggle('active', i===index); });
    currentIndex = index;
  }

  if(slides.length) showSlide(0);

  thumbs.forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx = parseInt(this.getAttribute('data-index')) || 0;
      showSlide(idx);
    });
  });

  // Variant selection handling
  var optionSelects = Array.from(document.querySelectorAll('.spacein-option'));
  var variantInput = document.getElementById('spacein-variant-id');
  var priceEl = document.querySelector('[data-price]');

  function getSelectedOptions(){
    return optionSelects.map(function(s){ return s.value; });
  }

  function formatPriceRaw(v){
    if(!v) return '';
    // variant.price might be a string like "19.00" or cents number
    if(typeof v === 'string' && v.indexOf('.')>-1) return v;
    if(typeof v === 'number'){
      if(v>1000) return (v/100).toFixed(2);
      return v.toFixed(2);
    }
    // fallback
    return String(v);
  }

  function findVariantByOptions(opts){
    if(!product.variants) return null;
    for(var i=0;i<product.variants.length;i++){
      var v = product.variants[i];
      var vOptions = v.options || [v.option1, v.option2, v.option3].filter(Boolean);
      var match = true;
      for(var j=0;j<opts.length;j++){
        if((vOptions[j]||'') != (opts[j]||'')) { match=false; break; }
      }
      if(match) return v;
    }
    return null;
  }

  function updateForVariant(variant){
    if(!variant) return;
    if(variantInput) variantInput.value = variant.id;
    if(priceEl) priceEl.textContent = formatPriceRaw(variant.price) || priceEl.textContent;

    // try to find an image linked to this variant
    var vid = variant.id;
    for(var i=0;i<slides.length;i++){
      var slide = slides[i];
      try{
        var variantIds = JSON.parse(slide.getAttribute('data-variant-ids')||'[]');
        if(variantIds && variantIds.indexOf(vid) !== -1){ showSlide(i); return; }
      }catch(e){}
    }
  }

  optionSelects.forEach(function(s){
    s.addEventListener('change', function(){
      var opts = getSelectedOptions();
      var variant = findVariantByOptions(opts);
      if(variant) updateForVariant(variant);
    });
  });

  // Initialize selects to product's first variant values
  if(product.variants && product.variants.length){
    var first = product.variants[0];
    optionSelects.forEach(function(s, idx){
      var val = first.options && first.options[idx] || (first['option'+(idx+1)]||'');
      if(val){ s.value = val; }
    });
    updateForVariant(first);
  }

  // Quantity buttons
  document.querySelectorAll('.qty-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var action = this.getAttribute('data-action');
      var q = document.getElementById('spacein-quantity');
      var val = parseInt(q.value||1);
      if(action === 'decrease') val = Math.max(1, val-1);
      else val = val+1;
      q.value = val;
    });
  });

  // AJAX add to cart
  var form = document.getElementById('spacein-add-to-cart');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData();
      fd.append('id', document.getElementById('spacein-variant-id').value);
      fd.append('quantity', document.getElementById('spacein-quantity').value || 1);
      fetch('/cart/add.js', {method:'POST',body:fd,headers:{'X-Requested-With':'XMLHttpRequest'}})
        .then(function(r){ if(!r.ok) throw r; return r.json(); })
        .then(function(data){
          alert('Added to cart');
        })
        .catch(function(err){
          console.error(err);
          alert('Could not add to cart');
        });
    });
  }

});
