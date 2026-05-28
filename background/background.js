// =============================================
// EXTENSION LOGIC + ALGORITHM — background.js v2
// CHANGED:
//   • Added chrome.storage.local caching (15 min TTL)
//   • Prices now carry rating, reviews, link data
//   • Algorithm handles rawPrice from Serper API
//   • Cache is cleared when user clicks Re-scan
// =============================================

const BACKEND_URL = "http://localhost:3000/prices";
const CACHE_TTL   = 15 * 60 * 1000; // 15 minutes in ms

// ---------------------------------------------------
// Message router
// ---------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "fetchPrices") {
    const { productName, forceRefresh } = message;

    if (!productName || productName === "Unknown Product") {
      sendResponse({ prices: [], fromCache: false });
      return true;
    }

    // Build a safe cache key from product name
    const cacheKey = "ps_" + productName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60);

    // Skip cache if user manually refreshed
    if (forceRefresh) {
      chrome.storage.local.remove(cacheKey);
    }

    // Check cache first
    chrome.storage.local.get(cacheKey, (result) => {
      const cached = result[cacheKey];
      const isValid = cached && (Date.now() - cached.timestamp < CACHE_TTL);

      if (isValid) {
        console.log(`[PriceScope] Cache hit for "${productName}" (${Math.floor((Date.now() - cached.timestamp) / 60000)}m old)`);
        sendResponse({ prices: cached.prices, fromCache: true, cachedAt: cached.timestamp });
        return;
      }

      // Fetch from backend
      console.log(`[PriceScope] Fetching live prices for "${productName}"`);
      fetch(`${BACKEND_URL}?product=${encodeURIComponent(productName)}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (!data.prices || data.prices.length === 0) throw new Error("Empty response");

          const processed = AlgorithmModule.processAndRank(data.prices);

          // Save to cache
          chrome.storage.local.set({
            [cacheKey]: { prices: processed, timestamp: Date.now() }
          });

          sendResponse({
            prices:    processed,
            fromCache: false,
            isMock:    data.source === "mock"
          });
        })
        .catch(err => {
          console.error("[PriceScope] Fetch failed:", err.message);
          const fallback = AlgorithmModule.processAndRank(getMockPrices());
          sendResponse({ prices: fallback, fromCache: false, isMock: true });
        });
    });

    return true; // Keep message channel open for async
  }
});

// =============================================
// ALGORITHM / DATA HANDLING MODULE
// Responsible for: Min-Heap sort, savings calc,
// ranking, and annotating prices for the UI.
// =============================================
const AlgorithmModule = {

  // Parse any price format to a number
  parsePrice(item) {
    // Prefer pre-parsed rawPrice from backend
    if (item.rawPrice && item.rawPrice > 0) return item.rawPrice;
    if (typeof item.price === "number") return item.price;
    const cleaned = String(item.price).replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || Infinity;
  },

  // ---- Min-Heap (DAA concept) ----
  _heapifyDown(arr, n, i) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && arr[l]._num < arr[smallest]._num) smallest = l;
    if (r < n && arr[r]._num < arr[smallest]._num) smallest = r;
    if (smallest !== i) {
      [arr[i], arr[smallest]] = [arr[smallest], arr[i]];
      this._heapifyDown(arr, n, smallest);
    }
  },

  heapSort(items) {
    const arr = items.map(item => ({ ...item, _num: this.parsePrice(item) }))
                     .filter(item => item._num < Infinity);

    // Build min-heap
    for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
      this._heapifyDown(arr, arr.length, i);
    }

    // Extract in sorted order
    const sorted = [];
    let size = arr.length;
    while (size > 0) {
      sorted.push(arr[0]);
      arr[0] = arr[--size];
      this._heapifyDown(arr, size, 0);
    }
    return sorted;
  },

  // ---- Main pipeline ----
  processAndRank(rawPrices) {
    if (!rawPrices || rawPrices.length === 0) return [];

    const sorted   = this.heapSort(rawPrices);
    const maxPrice = sorted[sorted.length - 1]._num;

    return sorted.map((item, index) => {
      const savings = maxPrice - item._num;
      return {
        store:    item.store,
        price:    item.price,
        rawPrice: item._num,
        isLowest: index === 0,
        savings:  savings > 0 ? `₹${Math.round(savings).toLocaleString("en-IN")}` : null,
        link:     item.link    || null,
        rating:   item.rating  || null,
        reviews:  item.reviews || null,
        rank:     index + 1
      };
    });
  }
};

// Mock fallback
function getMockPrices() {
  const base = Math.floor(Math.random() * 8000) + 2000;
  return [
    { store: "Amazon",           price: `₹${base + 200}`,  rawPrice: base + 200,  link: "https://amazon.in",        rating: 4.3, reviews: 1247 },
    { store: "Flipkart",         price: `₹${base + 500}`,  rawPrice: base + 500,  link: "https://flipkart.com",     rating: 4.1, reviews: 832  },
    { store: "Croma",            price: `₹${base + 900}`,  rawPrice: base + 900,  link: "https://croma.com",        rating: 3.9, reviews: 341  },
    { store: "Reliance Digital", price: `₹${base + 1200}`, rawPrice: base + 1200, link: "https://reliancedigital.in",rating: 4.0, reviews: 456  },
  ];
}