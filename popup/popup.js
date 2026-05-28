// =============================================
// FRONTEND DEVELOPER — popup.js
// Responsible for: DOM manipulation, displaying
// prices, highlighting lowest price, UI updates.
// =============================================

document.addEventListener("DOMContentLoaded", () => {
  const productNameEl  = document.getElementById("productName");
  const productMetaEl  = document.getElementById("productMeta");
  const priceListEl    = document.getElementById("priceList");
  const bestDealEl     = document.getElementById("bestDeal");
  const bestDealStore  = document.getElementById("bestDealStore");
  const bestDealPrice  = document.getElementById("bestDealPrice");
  const refreshBtn     = document.getElementById("refreshBtn");

  // Request current tab's product info from content script
  function loadPrices() {
    priceListEl.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <span>Fetching prices...</span>
      </div>`;
    bestDealEl.style.display = "none";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return showError("No active tab found.");

      chrome.tabs.sendMessage(tabs[0].id, { action: "getProductInfo" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          return showError("Could not detect a product on this page.");
        }
        displayProduct(response.productName, response.source);
        fetchAndDisplayPrices(response.productName);
      });
    });
  }

  // Display the detected product name
  function displayProduct(name, source) {
    productNameEl.textContent = name || "Unknown Product";
    productMetaEl.textContent = source ? `Source: ${source}` : "Detected from page";
  }

  // Fetch prices from background (which calls the backend/API)
  function fetchAndDisplayPrices(productName) {
    chrome.runtime.sendMessage(
      { action: "fetchPrices", productName },
      (response) => {
        if (chrome.runtime.lastError || !response || !response.prices) {
          return showError("Failed to fetch price data. Check your connection.");
        }
        renderPrices(response.prices);
      }
    );
  }

  // DOM rendering — display each store's price row
  function renderPrices(prices) {
    if (!prices || prices.length === 0) {
      return showError("No price data found for this product.");
    }

    // Algorithm module has already sorted + flagged lowest
    priceListEl.innerHTML = "";

    prices.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "price-row" + (item.isLowest ? " lowest" : "");
      row.style.animationDelay = `${index * 60}ms`;

      const savingsHTML = item.savings
        ? `<span class="savings-badge">Save ${item.savings}</span>`
        : "";

      row.innerHTML = `
        <span class="store-name">${escapeHTML(item.store)}</span>
        <span class="store-price">${escapeHTML(item.price)}${savingsHTML}</span>
      `;
      priceListEl.appendChild(row);
    });

    // Show the best deal banner
    const best = prices.find(p => p.isLowest);
    if (best) {
      bestDealStore.textContent = best.store;
      bestDealPrice.textContent = best.price;
      bestDealEl.style.display = "flex";
    }
  }

  // Show an error state in the price list area
  function showError(msg) {
    priceListEl.innerHTML = `
      <div class="error-state">
        <span>✕</span>
        ${escapeHTML(msg)}
      </div>`;
  }

  // XSS-safe helper
  function escapeHTML(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // Refresh button
  refreshBtn.addEventListener("click", loadPrices);

  // Initial load
  loadPrices();
});
