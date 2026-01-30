// ============================================
// Client API - Calls Local Node.js Server
// ============================================

const SERVER_URL = 'http://localhost:3001/api/data';

// ============================================
// Helpers
// ============================================

export function convertToKRW(usdPrice, exchangeRate) {
  return usdPrice * exchangeRate;
}

const TROY_OZ_TO_GRAM = 31.1035;
export function convertOzToGram(pricePerOz) {
  return pricePerOz / TROY_OZ_TO_GRAM;
}

// ============================================
// MOCK_DATA (Template & Fallback)
// ============================================

export const MOCK_DATA = {
  usd: {
    id: 'usd',
    name: 'USD/KRW',
    symbol: 'USDKRW=X',
    nameKr: '달러',
    icon: '💵',
    price: 1435.20,
    previousPrice: 1428.50,
    changePercent: 0.47,
    unit: '원',
    category: 'currency',
    isLive: false,
    link: 'https://m.stock.naver.com/marketindex/exchange/FX_USDKRW'
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    symbol: 'GC=F',
    nameKr: '금',
    icon: '🪙',
    price: 125160,
    previousPrice: 123638,
    changePercent: 1.23,
    unit: '원/g',
    category: 'commodity',
    isLive: false,
    link: 'https://m.stock.naver.com/marketindex/metals/M04020000'
  },
  sp500: {
    id: 'sp500',
    name: 'S&P 500',
    symbol: 'SPY',
    nameKr: 'S&P 500',
    icon: '📈',
    price: 8672340,
    previousPrice: 8715200,
    changePercent: -0.49,
    unit: '원',
    category: 'index',
    isLive: false,
    link: 'https://m.stock.naver.com/worldstock/index/.INX/total'
  },
  kospi: {
    id: 'kospi',
    name: 'KOSPI',
    symbol: '^KS11',
    nameKr: 'KOSPI 지수',
    icon: '📊',
    price: 2523.45,
    previousPrice: 2508.12,
    changePercent: 0.61,
    unit: 'pt',
    category: 'index',
    isLive: false,
    link: 'https://m.stock.naver.com/domestic/index/KOSPI/total'
  },
  nasdaq: {
    id: 'nasdaq',
    name: 'NASDAQ',
    symbol: '^IXIC',
    nameKr: '나스닥 지수',
    icon: '💻',
    price: 17956.23,
    previousPrice: 17892.45,
    changePercent: 0.36,
    unit: 'pt',
    category: 'index',
    isLive: false,
    link: 'https://m.stock.naver.com/worldstock/index/.IXIC/total'
  }
};

// ============================================
// Fetch Functions
// ============================================

export async function fetchProductData(productId, usdExchangeRate, onUpdate, forceRefresh = false) {
  try {
    const response = await fetch(`${SERVER_URL}/${productId}?force=${forceRefresh}`);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();

    const uiData = mapToUI(productId, data);
    onUpdate(uiData);

    // Return price for compatibility (though server handles parallel fetching better)
    if (productId === 'usd') return data.price;
  } catch (error) {
    console.warn(`Failed to fetch ${productId} from server:`, error);
    // Optional: Fallback to mock data on error?
    // onUpdate({ ...MOCK_DATA[productId], isLive: false });
  }
  return null;
}

function mapToUI(id, data) {
  const template = MOCK_DATA[id];
  return {
    ...template,
    price: data.price,
    previousPrice: data.previousPrice,
    changePercent: data.changePercent,
    source: data.source || 'server',
    history: data.history || [],
    candles: data.candles || [],
    isLive: true,
    lastUpdated: new Date().toISOString() // Or use server timestamp if provided
  };
}

// 기존에는 순차 호출이었지만, 서버 캐싱 덕분에 병렬 호출로 변경
export async function fetchAllProductsSequentially(onUpdate, forceRefresh = false) {
  const ids = ['usd', 'gold', 'sp500', 'kospi', 'nasdaq'];

  // 병렬 실행
  await Promise.all(ids.map(id => fetchProductData(id, 0, onUpdate, forceRefresh)));
}

// ============================================
// Stub functions for compatibility
// ============================================

export function getCacheStatus() {
  return {};
}

export function clearCache() {
  // Server handles clearing via forceRefresh
}

export function getCacheDuration() {
  return 5 * 60 * 1000;
}
