import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
const port = 3001;

app.use(cors());

// ============================================
// API Configuration
// ============================================

const ALPHA_VANTAGE_KEYS = [
    'XDZR1HMH826LZ99I',
    'AJV7QIRVPVKCT2H8',
    '496S52T7CZCBZKAG',
    'IUCRTTXQ7LTCWKMC',
    'UWMBU7V18GM8AXZZ',
];

const GOLD_API_KEYS = [
    'goldapi-3nmx6smksirz1i-io',
];

const TWELVE_DATA_API_KEY = '0a71822a44de47a38079836185324d6e';

let alphaVantageKeyIndex = 0;
let goldApiKeyIndex = 0;

function getNextAlphaVantageKey() {
    const key = ALPHA_VANTAGE_KEYS[alphaVantageKeyIndex];
    alphaVantageKeyIndex = (alphaVantageKeyIndex + 1) % ALPHA_VANTAGE_KEYS.length;
    return key;
}

function getNextGoldApiKey() {
    const key = GOLD_API_KEYS[goldApiKeyIndex];
    goldApiKeyIndex = (goldApiKeyIndex + 1) % GOLD_API_KEYS.length;
    return key;
}

// ============================================
// Server-Side Cache
// ============================================

const cache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5분 (실시간 데이터)
const WEEKLY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간 (주봉 데이터)
const CACHE_FILE = 'cache.json';

// Load cache from disk on startup
if (fs.existsSync(CACHE_FILE)) {
    try {
        const fileData = fs.readFileSync(CACHE_FILE, 'utf-8');
        Object.assign(cache, JSON.parse(fileData));
        console.log('Cache loaded from disk.');
    } catch (e) {
        console.error('Failed to load cache file:', e.message);
    }
}

function getFromCache(key, duration = CACHE_DURATION) {
    const item = cache[key];
    if (item && Date.now() - item.timestamp < duration) {
        return item.data;
    }
    return null;
}

function saveToCache(key, data) {
    cache[key] = {
        data,
        timestamp: Date.now()
    };

    // Save to disk
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error('Failed to save cache file:', e.message);
    }
}

// ============================================
// Helper Functions (Fetchers)
// ============================================

// Weekly Candle Fetcher
async function fetchWeeklyCandles(symbol) {
    // Yahoo Finance: interval=1wk, range=2y (약 104개 데이터)
    // symbol 예: SPY, ^KS11, GC=F (금), KRW=X (환율)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1wk&range=2y`;
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) {
            console.log(`No weekly candle result for ${symbol}`);
            return [];
        }

        const timestamp = result.timestamp;
        const indicators = result.indicators?.quote?.[0];

        if (!timestamp || !indicators) return [];

        const { open, high, low, close } = indicators;
        const candles = [];

        for (let i = 0; i < timestamp.length; i++) {
            if (close[i] !== null && close[i] !== undefined) {
                candles.push({
                    date: new Date(timestamp[i] * 1000).toISOString().split('T')[0],
                    open: open[i],
                    high: high[i],
                    low: low[i],
                    close: close[i]
                });
            }
        }
        return candles;
    } catch (e) {
        console.error(`Weekly Candle fetch error for ${symbol}:`, e.message);
    }
    return [];
}

// Chart History Fetcher (Yahoo)
async function fetchChartData(symbol) {
    // Yahoo Finance 직접 호출 (CORS 필요 없음)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
    try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();
        const quotes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        if (quotes && quotes.length > 0) {
            return quotes
                .filter(p => p !== null && p !== undefined)
                .map(p => Number(p.toFixed(2)));
        }
    } catch (e) {
        console.error(`Chart fetch error for ${symbol}:`, e.message);
    }
    return [];
}

// Exchange Rate Fetcher
async function fetchExchangeRate(from, to) {
    // 1. Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${getNextAlphaVantageKey()}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data['Realtime Currency Exchange Rate']) {
            return {
                price: parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']),
                source: 'alphavantage'
            };
        }
    } catch (e) { console.error('Alpha Vantage Exchange Error:', e.message); }

    // 2. Yahoo Fallback
    // Need changePercent for USD
    try {
        const symbol = `${from}${to}=X`;
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
        const res = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const yData = await res.json();
        const meta = yData.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
            const close = meta.chartPreviousClose || meta.previousClose;
            const changePercent = meta.regularMarketChangePercent !== undefined
                ? meta.regularMarketChangePercent
                : (close ? (meta.regularMarketPrice - close) / close * 100 : 0);

            return {
                price: meta.regularMarketPrice,
                changePercent: changePercent,
                source: 'yahoo'
            };
        }
    } catch (e) { console.error('Yahoo Exchange Error:', e.message); }

    return null;
}

// Gold Price Fetcher
async function fetchGoldPrice(usdRate) {
    // 1. GoldAPI
    try {
        const gUrl = 'https://www.goldapi.io/api/XAU/KRW';
        const res = await fetch(gUrl, {
            headers: { 'x-access-token': getNextGoldApiKey(), 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.price) {
            return {
                price: data.price, // KRW/oz
                previousPrice: data.prev_close_price || data.price,
                changePercent: data.chp || 0,
                source: 'goldapi'
            };
        }
    } catch (e) { console.error('GoldAPI Error:', e.message); }

    // 2. Yahoo Fallback (XAUUSD=X)
    if (usdRate) {
        try {
            const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?interval=1d&range=2d`;
            const res = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const yData = await res.json();
            const meta = yData.chart?.result?.[0]?.meta;
            if (meta?.regularMarketPrice) {
                // USD/oz -> KRW/oz
                const priceKrw = meta.regularMarketPrice * usdRate;
                const prevKrw = (meta.chartPreviousClose || meta.previousClose) * usdRate;
                const changePercent = meta.regularMarketChangePercent || 0;

                return {
                    price: priceKrw,
                    previousPrice: prevKrw,
                    changePercent,
                    source: 'yahoo'
                };
            }
        } catch (e) { console.error('Yahoo Gold Error:', e.message); }
    }
    return null;
}

// Stock/Index Fetcher (Alpha/Twelve + Yahoo Fallback)
async function fetchStock(symbol, yahooSymbol) {
    // 1. Alpha Vantage (if symbol provided)
    if (symbol && symbol !== 'KOSPI' && symbol !== 'NASDAQ') {
        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${getNextAlphaVantageKey()}`;
            const res = await fetch(url);
            const data = await res.json();
            const quote = data['Global Quote'];
            if (quote && quote['05. price']) {
                return {
                    price: parseFloat(quote['05. price']),
                    previousClose: parseFloat(quote['08. previous close']),
                    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                    source: 'alphavantage'
                };
            }
        } catch (e) { console.error(`Alpha Stock Error (${symbol}):`, e.message); }
    } else if (symbol === 'KOSPI' || symbol === 'NASDAQ') {
        // Twelve Data
        const targetSym = symbol === 'NASDAQ' ? 'IXIC' : 'KOSPI';
        const url = `https://api.twelvedata.com/quote?symbol=${targetSym}&apikey=${TWELVE_DATA_API_KEY}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.close) {
                return {
                    price: parseFloat(data.close),
                    previousClose: parseFloat(data.previous_close),
                    changePercent: parseFloat(data.percent_change),
                    source: 'twelvedata'
                };
            }
        } catch (e) { console.error(`Twelve Data Error (${symbol}):`, e.message); }
    }

    // 2. Yahoo Fallback
    try {
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`;
        const res = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const yData = await res.json();
        const meta = yData.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
            const current = meta.regularMarketPrice;
            const prev = meta.chartPreviousClose || meta.previousClose;
            const changePercent = meta.regularMarketChangePercent !== undefined
                ? meta.regularMarketChangePercent
                : (prev ? (current - prev) / prev * 100 : 0);
            return {
                price: current,
                previousClose: prev,
                changePercent,
                source: 'yahoo'
            };
        }
    } catch (e) { console.error(`Yahoo Stock Error (${yahooSymbol}):`, e.message); }

    return null;
}

// ============================================
// API Endpoints
// ============================================

const CONVERSION_RATES = {
    oz_to_g: 31.1035
};

app.get('/api/data/:id', async (req, res) => {
    const { id } = req.params;
    const forceRefresh = req.query.force === 'true';
    const cacheKey = `product_${id}`;

    if (!forceRefresh) {
        const cached = getFromCache(cacheKey);
        if (cached) return res.json(cached);
    }

    // Get USD Rate first (needed for Gold & SP500 conversion)
    // Internal cache for USD rate to avoid fetching it multiple times
    let usdRate = 1435; // default fallback
    const cachedUsd = getFromCache('product_usd');
    if (cachedUsd) {
        usdRate = cachedUsd.price;
    } else {
        // If not cached, try to fetch it now if needed
        if (id === 'gold' || id === 'sp500') {
            const liveUsd = await fetchExchangeRate('USD', 'KRW');
            if (liveUsd) {
                usdRate = liveUsd.price;
                // Optionally cache USD here too
                saveToCache('product_usd', { ...liveUsd, history: [] }); // temporary
            }
        }
    }

    let result = null;
    let chartSymbol = '';

    switch (id) {
        case 'usd':
            const usdData = await fetchExchangeRate('USD', 'KRW');
            if (usdData) {
                result = {
                    price: usdData.price,
                    changePercent: usdData.changePercent || 0,
                    source: usdData.source
                };
                chartSymbol = 'USDKRW=X';
            }
            break;

        case 'gold':
            const goldData = await fetchGoldPrice(usdRate);
            if (goldData) {
                result = {
                    price: goldData.price / CONVERSION_RATES.oz_to_g, // KRW/g
                    previousPrice: goldData.previousPrice / CONVERSION_RATES.oz_to_g,
                    changePercent: goldData.changePercent,
                    source: goldData.source
                };
                chartSymbol = 'XAUUSD=X'; // Chart in USD (trend only)
            }
            break;

        case 'sp500':
            const spData = await fetchStock('SPY', 'SPY');
            if (spData) {
                result = {
                    price: spData.price * usdRate, // KRW
                    previousPrice: spData.previousClose * usdRate,
                    changePercent: spData.changePercent,
                    source: spData.source
                };
                chartSymbol = 'SPY';
            }
            break;

        case 'kospi':
            const kospiData = await fetchStock('KOSPI', '^KS11');
            if (kospiData) {
                result = {
                    price: kospiData.price,
                    previousPrice: kospiData.previousClose,
                    changePercent: kospiData.changePercent,
                    source: kospiData.source
                };
                chartSymbol = '^KS11';
            }
            break;

        case 'nasdaq':
            const nasdaqData = await fetchStock('NASDAQ', '^IXIC');
            if (nasdaqData) {
                result = {
                    price: nasdaqData.price,
                    previousPrice: nasdaqData.previousClose,
                    changePercent: nasdaqData.changePercent,
                    source: nasdaqData.source
                };
                chartSymbol = '^IXIC';
            }
            break;
    }

    if (result) {
        // Fetch Chart History
        if (chartSymbol) {
            // Check Chart Cache
            const chartKey = `chart_${chartSymbol}`;
            let history = getFromCache(chartKey);
            if (!history || forceRefresh) {
                history = await fetchChartData(chartSymbol);
                if (history.length) saveToCache(chartKey, history);
            }
            result.history = history || [];
        }

        // Fetch Weekly Candles (Optimized with separate cache)
        if (chartSymbol) {
            const candleKey = `candles_${chartSymbol}`;
            let candles = getFromCache(candleKey, WEEKLY_CACHE_DURATION);

            if (!candles) {
                // If forceRefresh, we still might want to use cached candles if they are fresh enough
                // unless it's explicitly requested. But for now, we only fetch if expired.
                candles = await fetchWeeklyCandles(chartSymbol);
                if (candles.length > 0) {
                    saveToCache(candleKey, candles); // This will save with current timestamp
                }
            }
            result.candles = candles || [];
        }

        saveToCache(cacheKey, result);
        saveToCache(cacheKey, result);
        return res.json(result);
    }

    // Fallback / Error
    res.status(500).json({ error: 'Failed to fetch data' });
});

app.listen(port, () => {
    console.log(`Financial Dashboard Server listening at http://localhost:${port}`);
});
