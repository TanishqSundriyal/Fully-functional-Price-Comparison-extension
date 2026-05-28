// =============================================
// BACKEND / API DEVELOPER — server.js  v2
// CHANGED: RapidAPI → Serper.dev (Google Shopping)
//   • 2500 free searches/month (no card needed)
//   • Returns real prices from Amazon, Flipkart etc.
//   • Much more reliable than RapidAPI free tier
// =============================================

const express = require("express");
const cors    = require("cors");
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// GET YOUR FREE KEY:
//  1. Go to https://serper.dev
//  2. Sign up (no credit card needed)
//  3. Copy your API key from the dashboard
//  4. Run: set SERPER_API_KEY=your_key   (Windows)
//     or:  export SERPER_API_KEY=your_key (Mac/Linux)
// ---------------------------------------------------
const SERPER_API_KEY = process.env.SERPER_API_KEY || "efe64732fd0dc712af3240d9c2fbc71986af4331";

// ---------------------------------------------------
// GET /prices?product=<name>
// ---------------------------------------------------
app.get("/prices", async (req, res) => {
  const { product } = req.query;
  if (!product || !product.trim()) {
    return res.status(400).json({ error: "Missing 'product' query parameter." });
  }

  console.log(`[PriceScope] Searching: "${product}"`);

  try {
    const prices = await fetchFromSerper(product.trim());
    return res.json({
      product,
      prices,
      timestamp: Date.now(),
      source: "google_shopping"
    });
  } catch (err) {
    console.error("[PriceScope] API Error:", err.message);
    return res.json({
      product,
      prices: getMockPrices(),
      timestamp: Date.now(),
      source: "mock"
    });
  }
});

// ---------------------------------------------------
// Serper.dev — Google Shopping API call
// ---------------------------------------------------
async function fetchFromSerper(productName) {
  const response = await fetch("https://google.serper.dev/shopping", {
    method: "POST",
    headers: {
      "X-API-KEY":    SERPER_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q:   productName,
      gl:  "in",   // India
      hl:  "en",
      num: 10
    })
  });

  if (!response.ok) {
    throw new Error(`Serper API responded with status ${response.status}`);
  }

  const data = await response.json();
  return parseSerperResults(data);
}

// ---------------------------------------------------
// Parse Serper Google Shopping response
// ---------------------------------------------------
function parseSerperResults(data) {
  const items = data.shopping || [];

  const results = items
    .filter(item => item.price && item.source)
    .slice(0, 7)
    .map(item => {
      const rawPrice = parseNumericPrice(item.price);
      return {
        store:    cleanStoreName(item.source),
        price:    formatINR(rawPrice, item.price),
        rawPrice: rawPrice,
        title:    (item.title || "").substring(0, 70),
        link:     item.link || "#",
        rating:   item.rating    ? parseFloat(item.rating.toFixed(1))   : null,
        reviews:  item.ratingCount ? item.ratingCount : null,
        thumbnail: item.thumbnailUrl || null
      };
    })
    .filter(item => item.rawPrice > 0);

  return results.length > 0 ? results : getMockPrices();
}

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

// Parse "₹1,299", "$19.99", "Rs. 999" → float
function parseNumericPrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

// Format a number as INR string
function formatINR(num, originalStr) {
  if (!num) return originalStr || "N/A";
  // If price looks like USD (< 500), convert to INR roughly
  const finalNum = num < 500 ? Math.round(num * 83) : num;
  return `₹${finalNum.toLocaleString("en-IN")}`;
}

// Clean store names: "amazon.in" → "Amazon"
function cleanStoreName(name) {
  return name
    .replace(/\.(com|in|co\.in|net|org)/gi, "")
    .replace(/[-_]/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .trim()
    .substring(0, 22);
}

// Mock prices for when API is unavailable
function getMockPrices() {
  const base = Math.floor(Math.random() * 8000) + 2000;
  return [
    { store: "Amazon",          price: `₹${(base + 200).toLocaleString("en-IN")}`,  rawPrice: base + 200,  link: "https://amazon.in",          rating: 4.3, reviews: 1247 },
    { store: "Flipkart",        price: `₹${(base + 500).toLocaleString("en-IN")}`,  rawPrice: base + 500,  link: "https://flipkart.com",        rating: 4.1, reviews: 832  },
    { store: "Croma",           price: `₹${(base + 900).toLocaleString("en-IN")}`,  rawPrice: base + 900,  link: "https://croma.com",           rating: 3.9, reviews: 341  },
    { store: "Reliance Digital",price: `₹${(base + 1200).toLocaleString("en-IN")}`, rawPrice: base + 1200, link: "https://reliancedigital.in",   rating: 4.0, reviews: 456  },
  ];
}

// ---------------------------------------------------
// Health check
// ---------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    service:   "PriceScope v2",
    api:       SERPER_API_KEY !== "YOUR_SERPER_KEY_HERE" ? "serper.dev configured" : "using mock data",
    timestamp: Date.now()
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ PriceScope v2 backend running → http://localhost:${PORT}`);
  console.log(`   API: ${SERPER_API_KEY !== "YOUR_SERPER_KEY_HERE" ? "Serper.dev (Google Shopping)" : "⚠ No key set — using mock data"}`);
  console.log(`   Test: http://localhost:${PORT}/prices?product=iPhone+15\n`);
});

module.exports = app;