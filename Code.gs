/* اربطي هذا السكربت بنسخة Google Sheets من ملف Excel المرفق.
   أبقي اسم ورقة البيانات Feuil1 أو حدّثي SHEET_NAME أدناه.
   لا تضعي رابطًا عامًا لجدول الطلبات؛ النشر يكون للسكريبت فقط.
*/
const SPREADSHEET_ID = '1z06hEE83QGVQbKH19_GNf9XB4JP2hOv1nCnBLbG_ooI';
const SHEET_NAME = 'Feuil1';

const HEADERS = [
  'OrderDate', 'country', 'name', 'phone', 'address', 'url', 'sku', 'Product',
  'quantity', 'price', 'currency', 'notes', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_term', 'utm_content', 'national_address', 'national_address'
];

function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents || '{}');
    ['name', 'phone', 'address'].forEach(key => {
      if (!String(order[key] || '').trim()) throw new Error('بيانات طلب ناقصة');
    });
    const packages = {
      1: {label: '1 عبوة — تكفيك شهر', price: 199},
      2: {label: '2 عبوة — تكفيك شهرين', price: 259},
      3: {label: '3 عبوات — تكفيك 3 أشهر', price: 299}
    };
    const selected = packages[Number(order.offerCode)];
    if (!selected) throw new Error('العرض غير صالح');

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.setFrozenRows(1);
    }
    const safe = value => {
      const text = String(value == null ? '' : value).trim();
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };
    const utm = order.utm || {};
    const address = safe(order.address);
    const row = [
      new Date(), safe(order.country || 'SA'), safe(order.name), safe(order.phone), address,
      safe(order.pageUrl), safe(order.sku || 'MULTI-COLLAGEN'), safe(order.product || 'Multi Collagen Peptides'),
      Number(order.offerCode), selected.price, safe(order.currency || 'SAR'), 'الدفع عند الاستلام',
      safe(utm.utm_source), safe(utm.utm_medium), safe(utm.utm_campaign),
      safe(utm.utm_term), safe(utm.utm_content), address, address
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ok: true})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ok: false, error: String(error.message || error)})).setMimeType(ContentService.MimeType.JSON);
  }
}
