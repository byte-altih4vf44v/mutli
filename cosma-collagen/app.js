const CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId: '233915bf-25f6-4119-9362-701fe3212185',
  product: 'Cosma Collagen',
  sku: 'COSMA-COLLAGEN',
  offers: [
    { label: 'باقة البداية — 1 عبوة / 30 حصة', price: 185 },
    { label: 'باقة التوفير — 2 عبوة / 60 حصة', price: 249 },
    { label: 'الباقة الذهبية — 3 عبوات / 90 حصة', price: 290 }
  ]
};

(function initSnapPixel(){
  if (!CONFIG.snapPixelId) return;
  (function(e,t,n){
    if(e.snaptr)return;
    var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
    a.queue=[];
    var r=t.createElement('script');
    r.async=true;
    r.src=n;
    var u=t.getElementsByTagName('script')[0];
    u.parentNode.insertBefore(r,u);
  })(window,document,'https://sc-static.net/scevent.min.js');
  window.snaptr('init', CONFIG.snapPixelId);
  window.snaptr('track', 'PAGE_VIEW', {item_ids:[CONFIG.sku]});
})();

const orderForm = document.getElementById('order-form');
let checkoutTracked = false;

function trackStartCheckout() {
  if (checkoutTracked || !window.snaptr) return;
  const values = new FormData(orderForm);
  const selected = CONFIG.offers[Number(values.get('offer')) - 1];
  if (!selected) return;

  checkoutTracked = true;
  window.snaptr('track', 'START_CHECKOUT', {
    price: selected.price,
    currency: 'SAR',
    item_ids: [CONFIG.sku]
  });
}

orderForm.addEventListener('focusin', trackStartCheckout, {once: true});
orderForm.addEventListener('change', trackStartCheckout, {once: true});

orderForm.addEventListener('submit', async event => {
  event.preventDefault();

  const status = document.getElementById('form-message');
  const button = orderForm.querySelector('.submit');
  status.textContent = '';

  const values = new FormData(orderForm);
  const selected = CONFIG.offers[Number(values.get('offer')) - 1];
  const phone = String(values.get('phone') || '').trim();

  if (phone.replace(/\D/g,'').length < 8) {
    status.textContent = 'تحققي من رقم الهاتف ثم حاولي مرة أخرى.';
    return;
  }

  const transactionId = 'COSMA-' + Date.now() + '-' + Math.random().toString(36).slice(2,10).toUpperCase();

  const payload = {
    transactionId,
    product: CONFIG.product,
    name: String(values.get('name') || '').trim(),
    phone,
    address: String(values.get('address') || '').trim(),
    offerCode: Number(values.get('offer')),
    offer: selected.label,
    price: selected.price,
    country: 'SA',
    sku: CONFIG.sku,
    currency: 'SAR',
    pageUrl: window.location.href,
    source: 'Cosma Collagen Landing Page'
  };
  trackStartCheckout();

  button.disabled = true;
  button.textContent = 'جارٍ إرسال طلبك…';

  try {
    await fetch(CONFIG.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({
        ...payload,
        utm: Object.fromEntries(new URLSearchParams(window.location.search))
      })
    });

    if (window.snaptr && selected) {
      window.snaptr('track', 'PURCHASE', {
        price: selected.price,
        currency: 'SAR',
        transaction_id: transactionId,
        item_ids: [CONFIG.sku]
      });
    }

    orderForm.innerHTML = '<div class="success"><span>✓</span><h2>تم استلام طلبك</h2><p>شكرًا لك. سنتواصل معك لتأكيد بيانات الطلب.</p></div>';
  } catch (error) {
    button.disabled = false;
    button.textContent = 'إرسال الطلب - الدفع عند الاستلام';
    status.textContent = 'تعذر إرسال الطلب الآن. تحققي من اتصال الإنترنت وحاولي مرة أخرى.';
  }
});

const stickyOrderButton = document.querySelector('.sticky-order');
const orderSection = document.getElementById('order');

if (stickyOrderButton && orderSection) {
  let dismissed = false;

  const hideSticky = () => {
    if (dismissed) return;
    dismissed = true;
    stickyOrderButton.classList.add('is-hidden');
  };

  const checkCheckout = () => {
    if (dismissed) return;
    const rect = orderSection.getBoundingClientRect();
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    if (rect.top <= vh * .88) hideSticky();
  };

  stickyOrderButton.addEventListener('click', event => {
    event.preventDefault();
    hideSticky();
    orderSection.scrollIntoView({behavior:'smooth',block:'start'});
  });

  orderSection.addEventListener('focusin', hideSticky);
  orderSection.addEventListener('pointerdown', hideSticky, {passive:true});
  window.addEventListener('scroll', checkCheckout, {passive:true});
  window.addEventListener('resize', checkCheckout, {passive:true});

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', checkCheckout, {passive:true});
    window.visualViewport.addEventListener('scroll', checkCheckout, {passive:true});
  }

  requestAnimationFrame(checkCheckout);
}