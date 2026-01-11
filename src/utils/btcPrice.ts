// Real-time BTC price fetching using Binance WebSocket (best for real-time)
// Fast, efficient, no polling needed, updates instantly

let ws: WebSocket | null = null;
let subscribers: Set<(price: number) => void> = new Set();
let currentPrice: number | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;

/**
 * Subscribe to real-time BTC price updates
 * Uses Binance WebSocket for instant updates
 * @param callback Function to call when price updates
 * @returns Unsubscribe function
 */
export function subscribeToBTCPrice(
  callback: (price: number) => void
): () => void {
  subscribers.add(callback);

  // Connect WebSocket if not already connected
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    if (!isConnecting) {
      connectWebSocket();
    }
  }

  // If we already have a price, send it immediately
  if (currentPrice !== null) {
    callback(currentPrice);
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
    // Close WebSocket if no subscribers
    if (subscribers.size === 0 && ws) {
      ws.close();
      ws = null;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    }
  };
}

/**
 * Connect to Binance WebSocket for real-time BTC price
 */
function connectWebSocket() {
  if (isConnecting || (ws && ws.readyState === WebSocket.OPEN)) {
    return;
  }

  // Clean up existing connection
  if (ws) {
    try {
      ws.close();
    } catch (e) {
      // Ignore
    }
    ws = null;
  }

  isConnecting = true;

  try {
    // Binance WebSocket for BTC/USDT ticker - updates in real-time
    ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@ticker");

    ws.onopen = () => {
      isConnecting = false;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Binance ticker provides 'c' (last price) as a string
        const price = parseFloat(data.c);

        if (!isNaN(price) && price > 0) {
          currentPrice = price;
          // Notify all subscribers instantly
          subscribers.forEach((callback) => {
            try {
              callback(price);
            } catch (err) {
              // Silent error
            }
          });
        }
      } catch (err) {
        // Silent error
      }
    };

    ws.onerror = () => {
      isConnecting = false;
    };

    ws.onclose = (event) => {
      isConnecting = false;
      ws = null;

      // Auto-reconnect if there are subscribers
      if (subscribers.size > 0 && event.code !== 1000) {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(() => {
          if (subscribers.size > 0 && !ws) {
            connectWebSocket();
          }
        }, 3000);
      }
    };
  } catch (err) {
    isConnecting = false;
    ws = null;
    // Retry connection after delay
    if (subscribers.size > 0) {
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }
}

/**
 * Get current BTC price (synchronous, returns last known price)
 */
export function getCurrentBTCPrice(): number | null {
  return currentPrice;
}
