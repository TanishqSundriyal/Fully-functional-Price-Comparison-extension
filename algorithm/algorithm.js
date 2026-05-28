// =============================================
// ALGORITHM / DATA HANDLING DEVELOPER — algorithm.js
// Responsible for: Comparing product prices,
// finding the lowest price using sorting and
// Min-Heap data structure (DAA concepts).
// =============================================

/**
 * ─────────────────────────────────────────────────────
 * MIN-HEAP CLASS
 * A Min-Heap always keeps the smallest element at root.
 * Useful for efficiently finding the minimum price.
 * Time Complexity: Insert O(log n), Extract-Min O(log n)
 * ─────────────────────────────────────────────────────
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  // Return index of parent / children
  parent(i)  { return Math.floor((i - 1) / 2); }
  left(i)    { return 2 * i + 1; }
  right(i)   { return 2 * i + 2; }

  // Swap two elements in the heap
  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  // Insert a new price item
  insert(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  // Bubble up to maintain min-heap property
  _bubbleUp(i) {
    while (i > 0) {
      const p = this.parent(i);
      if (this.heap[p].numericPrice > this.heap[i].numericPrice) {
        this.swap(p, i);
        i = p;
      } else break;
    }
  }

  // Extract the minimum element (lowest price)
  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);
    return min;
  }

  // Heapify downward to restore min-heap
  _heapifyDown(i) {
    let smallest = i;
    const l = this.left(i);
    const r = this.right(i);
    const n = this.heap.length;

    if (l < n && this.heap[l].numericPrice < this.heap[smallest].numericPrice)
      smallest = l;
    if (r < n && this.heap[r].numericPrice < this.heap[smallest].numericPrice)
      smallest = r;

    if (smallest !== i) {
      this.swap(i, smallest);
      this._heapifyDown(smallest);
    }
  }

  // Peek at minimum without extracting
  peekMin() {
    return this.heap[0] || null;
  }

  get size() { return this.heap.length; }
}


/**
 * ─────────────────────────────────────────────────────
 * PRICE COMPARISON ENGINE
 * Uses Min-Heap + sorting to rank all prices and
 * identify the best deal with savings calculation.
 * ─────────────────────────────────────────────────────
 */
const PriceAlgorithm = {

  /**
   * Parse a price string like "₹1,299" or "$19.99" to float.
   */
  parsePrice(priceStr) {
    if (typeof priceStr === "number") return priceStr;
    const cleaned = String(priceStr).replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || Infinity;
  },

  /**
   * Extract currency symbol from price string.
   */
  getCurrencySymbol(priceStr) {
    const match = String(priceStr).match(/^[^0-9]+/);
    return match ? match[0].trim() : "₹";
  },

  /**
   * MAIN FUNCTION: processAndRank
   * ─────────────────────────────
   * Input:  raw array of { store: string, price: string }
   * Output: sorted array with isLowest flag + savings info
   *
   * Algorithm Steps:
   *  1. Parse all prices to numeric values
   *  2. Insert into Min-Heap → O(n log n)
   *  3. Extract all in sorted order → O(n log n)
   *  4. Find max price for savings calculation → O(1)
   *  5. Annotate each item with metadata
   */
  processAndRank(rawPrices) {
    if (!rawPrices || rawPrices.length === 0) return [];

    // Step 1: Attach numeric price values
    const items = rawPrices.map(item => ({
      store:        item.store,
      price:        item.price,
      numericPrice: this.parsePrice(item.price),
      currency:     this.getCurrencySymbol(item.price)
    }));

    // Step 2 & 3: Build Min-Heap and extract in sorted order
    const heap = new MinHeap();
    for (const item of items) {
      heap.insert(item);
    }

    const sorted = [];
    while (heap.size > 0) {
      sorted.push(heap.extractMin());
    }

    // Step 4: Max price is now the last element (after sorted ascending)
    const maxPrice = sorted[sorted.length - 1].numericPrice;
    const minPrice = sorted[0].numericPrice;

    // Step 5: Annotate
    return sorted.map((item, index) => {
      const savings = maxPrice - item.numericPrice;
      return {
        store:    item.store,
        price:    item.price,
        isLowest: index === 0,
        savings:  savings > 0 && index !== sorted.length - 1
                    ? `${item.currency}${savings.toFixed(0)}`
                    : null,
        rank:     index + 1
      };
    });
  },

  /**
   * BONUS: Find minimum price without sorting — pure O(n) Min scan.
   * Useful when you only need the best deal, not a full ranking.
   */
  findMinPrice(rawPrices) {
    if (!rawPrices || rawPrices.length === 0) return null;
    return rawPrices.reduce((min, item) => {
      return this.parsePrice(item.price) < this.parsePrice(min.price) ? item : min;
    });
  },

  /**
   * BONUS: Comparison using standard JS sort (alternative approach).
   * Time complexity: O(n log n), simpler but less educational.
   */
  sortByPrice(rawPrices) {
    return [...rawPrices].sort(
      (a, b) => this.parsePrice(a.price) - this.parsePrice(b.price)
    );
  }
};


// Export for Node.js (backend use) or browser (extension use)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { PriceAlgorithm, MinHeap };
} else {
  window.PriceAlgorithm = PriceAlgorithm;
  window.MinHeap = MinHeap;
}
