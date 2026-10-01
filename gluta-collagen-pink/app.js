const CONFIG={
  scriptUrl:'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId:'233915bf-25f6-4119-9362-701fe3212185',
  sku:'GLUTA-COLLAGEN-PINK',
  product:'Manee Gluta Collagen Pink',
  offers:[
    {code:1,price:178},
    {code:2,price:289},
    {code:3,price:359},
    {code:5,price:499}
  ]
};

(function(){
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script',r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
  snaptr('init',CONFIG.snapPixelId);
  snaptr('track','PAGE_VIEW',{item_ids:[CONFIG.sku]});
})();

const form=document.getElementById('order-form');
const sticky=document.querySelector('.sticky');
let checkoutTracked=false;

function currentOffer(){
  const code=Number(new FormData(form).get('offer'));
  return CONFIG.offers.find(o=>o.code===code);
}
function trackCheckout(){
  if(checkoutTracked||!window.snaptr)return;
  const o=currentOffer(); if(!o)return;
  checkoutTracked=true;
  snaptr('track','START_CHECKOUT',{price:o.price,currency:'SAR',item_ids:[CONFIG.sku]});
}
form.addEventListener('focusin',trackCheckout,{once:true});
form.addEventListener('change',trackCheckout,{once:true});

function stickyState(){
  if(!sticky)return;
  const r=form.getBoundingClientRect();
  const active=document.activeElement&&form.contains(document.activeElement);
  sticky.classList.toggle('is-hidden',active||(r.top<innerHeight*.8&&r.bottom>0));
}
addEventListener('scroll',stickyState,{passive:true});
addEventListener('resize',stickyState,{passive:true});
form.addEventListener('focusin',stickyState);
form.addEventListener('focusout',()=>setTimeout(stickyState,150));
sticky?.addEventListener('click',()=>sticky.classList.add('is-hidden'));
stickyState();

form.addEventListener('submit',async e=>{
  e.preventDefault();
  trackCheckout();
  const data=new FormData(form);
  const offer=currentOffer();
  const msg=document.getElementById('form-message');
  const btn=form.querySelector('.submit');

  const payload={
    country:'SA',
    name:String(data.get('name')||'').trim(),
    phone:String(data.get('phone')||'').trim(),
    address:String(data.get('address')||'').trim(),
    pageUrl:location.href,
    sku:CONFIG.sku,
    product:CONFIG.product,
    offerCode:offer.code,
    currency:'SAR',
    utm:Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].map(k=>[k,new URLSearchParams(location.search).get(k)||'']))
  };

  if(!payload.name||!payload.phone||!payload.address){
    msg.textContent='فضلاً أكملي الاسم ورقم الهاتف والعنوان.';
    return;
  }

  btn.disabled=true;
  btn.textContent='جاري تسجيل طلبك...';
  msg.textContent='';

  try{
    await fetch(CONFIG.scriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const tx='GCP-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
    if(window.snaptr)snaptr('track','PURCHASE',{price:offer.price,currency:'SAR',transaction_id:tx,item_ids:[CONFIG.sku]});
    form.innerHTML='<div style="text-align:center;padding:34px 12px"><div style="width:54px;height:54px;margin:auto;border-radius:50%;display:grid;place-items:center;background:#e8f5ec;color:#2f7649;font-size:24px;font-weight:800">✓</div><h2>تم استلام طلبك</h2><p style="color:#7b6972;font-size:12px">سنتواصل معك لتأكيد رقم الهاتف والعنوان قبل تجهيز الشحنة.</p></div>';
    sticky?.classList.add('is-hidden');
  }catch(err){
    btn.disabled=false;
    btn.textContent='احجزي باقتك الآن — الدفع عند الاستلام';
    msg.textContent='تعذر إرسال الطلب الآن. حاولي مرة أخرى.';
  }
});