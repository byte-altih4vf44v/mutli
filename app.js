/* رابط Google Apps Script المنشور لاستقبال طلبات النموذج. */
const CONFIG = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbx77kwVZJtKNO7Ymi7Ks2oGUUq-vRj9Kell84ziwAhvAUp34RAcR5g-2kymdWHfdJjcyQ/exec',
  snapPixelId: '233915bf-25f6-4119-9362-701fe3212185',
  product: 'Multi Collagen Peptides',
  offers: [
    { label: '1 عبوة — تكفيك شهر', price: 198 },
    { label: '2 عبوة — تكفيك شهرين', price: 294 },
    { label: '3 عبوات — تكفيك 3 أشهر', price: 376 }
  ]
};

(function initSnapPixel(){
  if (!CONFIG.snapPixelId || CONFIG.snapPixelId === 'YOUR_PIXEL_ID') return;
  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
  window.snaptr('init', CONFIG.snapPixelId);
  window.snaptr('track', 'PAGE_VIEW');
})();

const orderForm = document.getElementById('order-form');
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
  if (window.snaptr && selected) {
    window.snaptr('track', 'START_CHECKOUT', {
      price: selected.price,
      currency: 'SAR',
      item_ids: ['MULTI-COLLAGEN']
    });
  }

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
        item_ids: ['MULTI-COLLAGEN']
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
let stickyOrderDismissed = false;

if (stickyOrderButton && orderSection) {
  stickyOrderButton.addEventListener('click', event => {
    event.preventDefault();
    stickyOrderDismissed = true;
    stickyOrderButton.classList.add('is-hidden');
    orderSection.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  if ('IntersectionObserver' in window) {
    const checkoutObserver = new IntersectionObserver(entries => {
      const checkoutVisible = entries.some(entry => entry.isIntersecting);
      if (stickyOrderDismissed || checkoutVisible) {
        stickyOrderButton.classList.add('is-hidden');
      } else {
        stickyOrderButton.classList.remove('is-hidden');
      }
    }, {threshold: 0.18});

    checkoutObserver.observe(orderSection);
  }
}
