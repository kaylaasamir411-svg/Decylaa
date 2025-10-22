// lang-toggle.js
// Simple bilingual toggle: default English. Pages should include elements with data-en and data-ar attributes
(function(){
  function setLang(lang){
    document.documentElement.lang = (lang==='ar')?'ar':'en';
    document.querySelectorAll('[data-en]').forEach(el=>{
      if(lang==='ar') el.style.display='none'; else el.style.display='inline';
    });
    document.querySelectorAll('[data-ar]').forEach(el=>{
      if(lang==='ar') el.style.display='inline'; else el.style.display='none';
    });
    // flip direction
    if(lang==='ar') document.body.dir='rtl'; else document.body.dir='ltr';
    localStorage.setItem('decayla_lang', lang);
    // adjust text alignment for main content
    document.querySelectorAll('.bi-text').forEach(el=> el.style.textAlign = (lang==='ar')? 'right':'left');
  }
  window.DecaylaLang = { setLang };
  document.addEventListener('DOMContentLoaded', ()=>{
    const pref = localStorage.getItem('decayla_lang') || 'en';
    setLang(pref);
    document.querySelectorAll('.lang-switch').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const newLang = (localStorage.getItem('decayla_lang')||'en') === 'en' ? 'ar' : 'en';
        setLang(newLang);
      });
    });
  });
})();