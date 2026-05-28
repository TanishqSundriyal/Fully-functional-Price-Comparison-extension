# ◈ PriceScope — Price Comparison Browser Extension

A Chrome Extension that detects the product on any webpage and instantly
compares prices across multiple stores to find you the best deal.

---

## 👥 Team Work Division

### 1. 🎨 Frontend Developer (UI/UX)
**Files:** `popup/popup.html`, `popup/popup.css`, `popup/popup.js`

**Responsibilities:**
- Designed the extension popup interface (dark theme with accent colors)
- Displays all product prices in a ranked list
- Highlights the lowest price with a green border and star marker
- Shows a "Best Deal" banner with the winner store + price
- Handles loading states, error states, and smooth animations
- DOM manipulation using vanilla JavaScript

**Learn:** HTML, CSS, Basic JavaScript (DOM manipulation)

---

### 2. ⚙️ Extension Logic Developer
**Files:** `manifest.json`, `content/content.js`, `background/background.js`

**Responsibilities:**
- Created `manifest.json` (Manifest V3) with all permissions
- `content.js`: scans the active webpage DOM to detect product names
  using CSS selectors for Amazon, Flipkart, Myntra, and generic patterns
- `background.js`: service worker that routes messages between popup,
  content script, and the backend API
- Manages Chrome's message passing API (`chrome.runtime.sendMessage`)
- Handles async communication between all extension components

**Learn:** JavaScript (Intermediate), Chrome Extension APIs, Event handling, Debugging

---

### 3. 🌐 Backend / API Developer
**Files:** `backend/server.js`, `backend/package.json`

**Responsibilities:**
- Created an Express.js REST API server on Node.js
- `GET /prices?product=<name>` endpoint fetches live prices
- Integrates with RapidAPI Real-Time Product Search API
- Normalizes API response into a clean `{ store, price }[]` JSON format
- Includes CORS support so the extension can call the API
- Falls back to mock data if API is unavailable (dev mode)
- Health check endpoint at `GET /health`

**Learn:** REST APIs, JSON handling, Express.js, Basic Hosting

---

### 4. 🧮 Algorithm / Data Handling Developer
**Files:** `algorithm/algorithm.js` *(also embedded in `background/background.js`)*

**Responsibilities:**
- Implemented a full **Min-Heap** class from scratch (DAA concept)
- Uses Min-Heap to sort prices in O(n log n) time
- Finds the lowest price (minimum element) in O(1) after heap build
- Calculates savings: `maxPrice - itemPrice` for each store
- Flags the `isLowest` item for the frontend to highlight
- Bonus: O(n) linear scan `findMinPrice()` for quick minimum lookup
- Bonus: Standard sort fallback `sortByPrice()`

**Learn:** JavaScript Arrays, Sorting Algorithms, Min-Heap (Data Structures)

---

## 📁 Project Structure

```
price-comparison-extension/
│
├── manifest.json                  ← Extension config (Extension Logic Dev)
│
├── popup/
│   ├── popup.html                 ← UI structure (Frontend Dev)
│   ├── popup.css                  ← Styling & animations (Frontend Dev)
│   └── popup.js                   ← DOM logic & rendering (Frontend Dev)
│
├── content/
│   └── content.js                 ← Product name detector (Extension Logic Dev)
│
├── background/
│   └── background.js              ← Message router + Algorithm (Extension Logic + Algorithm Dev)
│
├── algorithm/
│   └── algorithm.js               ← Min-Heap + Price comparison (Algorithm Dev)
│
└── backend/
    ├── server.js                  ← Express API server (Backend Dev)
    └── package.json               ← Node.js dependencies (Backend Dev)
```

---

## 🚀 Setup & Installation

### Step 1: Start the Backend
```bash
cd backend
npm install
# Add your RapidAPI key:
export RAPIDAPI_KEY="your_key_here"
npm start
# Server runs at http://localhost:3000
```

### Step 2: Load the Extension in Chrome
1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load Unpacked"**
4. Select the root `price-comparison-extension/` folder
5. The PriceScope icon appears in your toolbar ✅

### Step 3: Test It
1. Visit any product page (Amazon, Flipkart, etc.)
2. Click the PriceScope extension icon
3. It detects the product and fetches compared prices!

---

## 🔑 RapidAPI Setup (Backend Dev Task)
1. Go to https://rapidapi.com/
2. Search for **"Real-Time Product Search"**
3. Subscribe to the free tier
4. Copy your API key into the `RAPIDAPI_KEY` environment variable

---

## 🧪 Testing Without API (Mock Mode)
If no API key is set, the backend automatically returns mock price data
so the extension UI can still be tested end-to-end.
