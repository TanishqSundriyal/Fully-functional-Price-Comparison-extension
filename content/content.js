// =============================================
// EXTENSION LOGIC — content.js  v2
// CHANGED:
//   • More selectors for Indian e-commerce sites
//   • Also extracts current page price
//   • Cleaner product name normalization
// =============================================

// Ordered list of CSS selectors — specific sites first, generic last
const PRODUCT_SELECTORS = [
  // Amazon India
  "#productTitle",
  "#title span",
  // Flipkart
  "span.B_NuCI",
  "h1.yhB1nd span",
  // Myntra
  "h1.pdp-title",
  "h1.pdp-name",
  // Nykaa
  "h1.product-title",
  "h1.css-1gc4x7i",
  // Croma
  "h1.pdp-title-container",
  ".pd-title h1",
  // Reliance Digital
  "h1.pdp__title",
  // Snapdeal
  "h1#pdPriceContainer",
  "h1.pdp-e-i-head",
  // Generic schema.org markup
  'h1[itemprop="name"]',
  'span[itemprop="name"]',
  // Open Graph meta (very reliable)
  'meta[property="og:title"]',
  'meta[name="twitter:title"]',
  // Generic H1 fallbacks
  "h1.product_title",
  "h1.entry-title",
  ".product-name h1",
  "h1.product-name",
  "h1"
];

// Price selectors for extracting current page price
const PRICE_SELECTORS = [
  // Amazon
  'span.a-price-whole',
  '#priceblock_ourprice',
  '#priceblock_dealprice',
  '.a-price .a-offscreen',
  // Flipkart
  'div._30jeq3._16Jk6d',
  'div._30jeq3',
  // Generic
  '[itemprop="price"]',
  '.price',
  '#price',
  '.product-price'
];

function detectProductName() {
  for (const selector of PRODUCT_SELECTORS) {
    try {
      const el = document.querySelector(selector);
      if (!el) continue;

      const name = el.tagName === "META"
        ? el.getAttribute("content")
        : (el.innerText || el.textContent || "").trim();

      if (name && name.length > 3 && name.length < 250) {
        return cleanProductName(name);
      }
    } catch (e) { /* skip bad selectors */ }
  }

  // Last resort: page title
  const title = document.title?.split(/[|\-–—]/)[0]?.trim();
  return title && title.length > 3 ? cleanProductName(title) : null;
}

function detectCurrentPrice() {
  for (const selector of PRICE_SELECTORS) {
    try {
      const el = document.querySelector(selector);
      if (!el) continue;
      const val = el.getAttribute("content") || el.innerText || "";
      const cleaned = val.replace(/[^0-9.]/g, "");
      if (cleaned && parseFloat(cleaned) > 0) {
        return val.trim().substring(0, 20);
      }
    } catch (e) { /* skip */ }
  }
  return null;
}

function cleanProductName(name) {
  return name
    .replace(/\s+/g, " ")
    .replace(/buy\s+/i, "")
    .replace(/\s+(online|at best price|in india|lowest price|india|free shipping).*/i, "")
    .replace(/[-|].*$/, "")         // cut after dash or pipe
    .replace(/[^\w\s\-().,'&+]/g, "") // remove weird characters
    .trim()
    .substring(0, 120);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getProductInfo") {
    const productName  = detectProductName();
    const currentPrice = detectCurrentPrice();

    sendResponse({
      productName:  productName || "Unknown Product",
      currentPrice: currentPrice || null,
      source:       window.location.hostname.replace("www.", ""),
      url:          window.location.href
    });
    return true;
  }
});