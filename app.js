/* رابط Google Apps Script المنشور لاستقبال طلبات النموذج. */
const CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxxBGHE4mZ5iDdplvvaFxVhrHoOMETyRoafgk8iG-DGx9vhY27JgFhc3VHFBO22hu4x0w/exec',
  snapPixelId: '233915bf-25f6-4119-9362-701fe3212185',
  product: 'Multi Collagen Peptides',
  offers: [
    { label: '1 عبوة — تكفيك شهر', price: 189 },
    { label: '2 عبوة — تكفيك شهرين', price: 249 },
    { label: '3 عبوات — تكفيك 3 أشهر', price: 290 }
  ]
};

(function initSnapPixel(){
  if (!CONFIG.snapPixelId || CONFIG.snapPixelId === 'YOUR_PIXEL_ID') return;
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
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
  if (!CONFIG.scriptUrl || CONFIG.scriptUrl.includes('PASTE_GOOGLE')) {
    status.textContent = 'يجب ربط نموذج الطلب بـ Google Sheets قبل استقبال الطلبات.';
    return;
  }
  const values = new FormData(orderForm);
  const selected = CONFIG.offers[Number(values.get('offer')) - 1];
  const phone = String(values.get('phone') || '').trim();
  if (phone.replace(/\D/g, '').length < 8) {
    status.textContent = 'تحققي من رقم الهاتف ثم حاولي مرة أخرى.';
    return;
  }
  const transactionId = 'MC-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();

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
    sku: 'MULTI-COLLAGEN',
    currency: 'SAR',
    pageUrl: window.location.href,
    source: 'Landing Page'
  };
  trackStartCheckout();

  button.disabled = true;
  button.textContent = 'جارٍ إرسال طلبك…';
  try {
    await fetch(CONFIG.scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({...payload, utm: Object.fromEntries(new URLSearchParams(window.location.search))})
    });

    if (window.snaptr && selected) {
      window.snaptr('track', 'PURCHASE', {
        price: selected.price,
        currency: 'SAR',
        transaction_id: transactionId,
        item_ids: [CONFIG.sku]
      });
    }

    orderForm.innerHTML = '<div class="success"><span>✓</span><h2>تم استلام طلبك</h2><p>شكرًا لك. سيُستخدم رقم هاتفك للتواصل معك وتأكيد بيانات الطلب.</p></div>';
  } catch (error) {
    button.disabled = false;
    button.textContent = 'إرسال الطلب - الدفع عند الاستلام';
    status.textContent = 'تعذر إرسال الطلب الآن. تحققي من اتصال الإنترنت وحاولي مرة أخرى.';
  }
});

/* زر الوصول السريع إلى الطلب على الهاتف */
const stickyOrderButton = document.querySelector('.sticky-order');
const orderSection = document.getElementById('order');

if (stickyOrderButton && orderSection) {
  let stickyOrderDismissed = false;

  const hideStickyOrder = () => {
    if (stickyOrderDismissed) return;
    stickyOrderDismissed = true;
    stickyOrderButton.classList.add('is-hidden');
  };

  const checkCheckoutPosition = () => {
    if (stickyOrderDismissed) return;
    const rect = orderSection.getBoundingClientRect();
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    if (rect.top <= viewportHeight * 0.88) {
      hideStickyOrder();
    }
  };

  stickyOrderButton.addEventListener('click', event => {
    event.preventDefault();
    hideStickyOrder();
    orderSection.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  orderSection.addEventListener('focusin', hideStickyOrder);
  orderSection.addEventListener('pointerdown', hideStickyOrder, {passive: true});

  window.addEventListener('scroll', checkCheckoutPosition, {passive: true});
  window.addEventListener('resize', checkCheckoutPosition, {passive: true});

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', checkCheckoutPosition, {passive: true});
    window.visualViewport.addEventListener('scroll', checkCheckoutPosition, {passive: true});
  }

  requestAnimationFrame(checkCheckoutPosition);
}
