const CONFIG={
  scriptUrl:'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId:'233915bf-25f6-4119-9362-701fe3212185',
  sku:'GLUTA-COLLAGEN-DTX',
  product:'Gluta Collagen DTX+ Mixed Berry',
  offers:[
    {code:1,label:'باقة البداية — 1 عبوة',price:178},
    {code:2,label:'باقة التوفير — 2 عبوة',price:289},
    {code:3,label:'الباقة الذهبية — 3 عبوات',price:359},
    {code:5,label:'باقة الاستمرارية — 5 عبوات',price:499}
  ]
};

(function initSnap(){
  if(!CONFIG.snapPixelId)return;
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script',r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
  window.snaptr('init',CONFIG.snapPixelId);
  window.snaptr('track','PAGE_VIEW',{item_ids:[CONFIG.sku]});
})();

const form=document.getElementById('order-form');
const sticky=document.querySelector('.sticky-order');
let checkoutTracked=false;

function selectedOffer(){
  const code=Number(new FormData(form).get('offer'));
  return CONFIG.offers.find(o=>o.code===code);
}
function trackCheckout(){
  if(checkoutTracked||!window.snaptr)return;
  const offer=selectedOffer(); if(!offer)return;
  checkoutTracked=true;
  window.snaptr('track','START_CHECKOUT',{price:offer.price,currency:'SAR',item_ids:[CONFIG.sku]});
}
form.addEventListener('focusin',trackCheckout,{once:true});
form.addEventListener('change',trackCheckout,{once:true});

function setSticky(){
  if(!sticky)return;
  const r=form.getBoundingClientRect();
  const interacting=document.activeElement&&form.contains(document.activeElement);
  sticky.classList.toggle('is-hidden',interacting||(r.top<innerHeight*.78&&r.bottom>0));
}
addEventListener('scroll',setSticky,{passive:true});
addEventListener('resize',setSticky,{passive:true});
if(window.visualViewport)window.visualViewport.addEventListener('resize',setSticky);
sticky?.addEventListener('click',()=>sticky.classList.add('is-hidden'));
form.addEventListener('focusin',setSticky);
form.addEventListener('focusout',()=>setTimeout(setSticky,180));
setSticky();

form.addEventListener('submit',async e=>{
  e.preventDefault();
  trackCheckout();
  const btn=form.querySelector('.submit');
  const msg=document.getElementById('form-message');
  const data=new FormData(form);
  const offer=selectedOffer();
  if(!offer)return;

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

  if(!payload.name||!payload.phone||!payload.address){msg.textContent='فضلاً أكملي الاسم ورقم الهاتف والعنوان.';return}

  btn.disabled=true;
  btn.textContent='جاري تسجيل طلبك...';
  msg.textContent='';

  try{
    await fetch(CONFIG.scriptUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    const transactionId='GLUTA-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
    if(window.snaptr)window.snaptr('track','PURCHASE',{price:offer.price,currency:'SAR',transaction_id:transactionId,item_ids:[CONFIG.sku]});
    form.innerHTML='<div class="success"><span>✓</span><h2>تم استلام طلبك</h2><p>شكرًا لك. سنتواصل معك لتأكيد بيانات الطلب قبل الشحن.</p></div>';
    sticky?.classList.add('is-hidden');
  }catch(err){
    msg.textContent='تعذر إرسال الطلب الآن. حاولي مرة أخرى.';
    btn.disabled=false;
    btn.textContent='احجزي باقتك الآن — الدفع عند الاستلام';
  }
});