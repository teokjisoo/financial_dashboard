import { writable, derived, get } from 'svelte/store';
import { fetchAllProductsSequentially, getCacheStatus, clearCache as apiClearCache, getCacheDuration } from './api.js';
import { getRecommendation } from './recommendation.js';

// 금융 상품 데이터 스토어
export const products = writable([]);
export const isLoading = writable(false);
export const lastUpdated = writable(null);
export const error = writable(null);
export const loadingStatus = writable('');
export const cacheInfo = writable({});

// 상품별 네이버 증권 링크
const PRODUCT_LINKS = {
    usd: 'https://m.stock.naver.com/marketindex/exchange/FX_USDKRW',
    gold: 'https://m.stock.naver.com/marketindex/metals/M04020000',
    sp500: 'https://m.stock.naver.com/worldstock/index/.INX/total',
    kospi: 'https://m.stock.naver.com/domestic/index/KOSPI/total',
    nasdaq: 'https://m.stock.naver.com/worldstock/index/.IXIC/total'
};

// 상품 기본 정보 (캐시가 없을 때 템플릿으로 사용)
const PRODUCT_TEMPLATES = {
    usd: { id: 'usd', name: 'USD/KRW', symbol: 'USDKRW=X', nameKr: '달러', icon: '💵', unit: '원', category: 'currency' },
    gold: { id: 'gold', name: 'Gold', symbol: 'GC=F', nameKr: '금', icon: '🪙', unit: '원/g', category: 'commodity' },
    sp500: { id: 'sp500', name: 'S&P 500', symbol: 'SPY', nameKr: 'S&P 500', icon: '📈', unit: '원', category: 'index' },
    kospi: { id: 'kospi', name: 'KOSPI', symbol: '^KS11', nameKr: 'KOSPI 지수', icon: '📊', unit: 'pt', category: 'index' },
    nasdaq: { id: 'nasdaq', name: 'NASDAQ', symbol: '^IXIC', nameKr: '나스닥 지수', icon: '💻', unit: 'pt', category: 'index' }
};

// 추천 정보가 포함된 상품 목록
export const productsWithRecommendation = derived(products, $products => {
    return $products.map(product => ({
        ...product,
        // 주봉 데이터가 없으면 빈 배열 전달 -> Neutral 반환됨
        recommendation: getRecommendation(product.candles || [], product.price)
    }));
});

// 개별 상품 업데이트 함수
function updateProduct(updatedProduct) {
    products.update(currentProducts => {
        const index = currentProducts.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
            const newProducts = [...currentProducts];
            newProducts[index] = updatedProduct;
            return newProducts;
        }
        return [...currentProducts, updatedProduct];
    });
}

// 캐시 상태 업데이트
function updateCacheInfo() {
    const status = getCacheStatus();
    cacheInfo.set(status);
}

// 캐시에서 마지막 저장된 데이터로 초기화 (mock 사용 안함)
function initializeFromCache() {
    const productIds = ['usd', 'gold', 'sp500', 'kospi', 'nasdaq'];
    const cachedProducts = [];
    const TROY_OZ_TO_GRAM = 31.1035;

    const cache = JSON.parse(localStorage.getItem('financial_dashboard_cache') || '{}');
    const cacheKeys = {
        'usd': 'exchange_USD_KRW',
        'gold': 'gold_XAU_KRW',
        'sp500': 'stock_SPY',
        'kospi': 'kospi_index',
        'nasdaq': 'nasdaq_index'
    };

    for (const id of productIds) {
        const template = PRODUCT_TEMPLATES[id];
        const cached = cache[cacheKeys[id]];

        if (cached && cached.data) {
            // 캐시된 실제 데이터가 있으면 사용
            const data = cached.data;
            let price = null;
            let previousPrice = null;
            let changePercent = null;

            switch (id) {
                case 'usd':
                    price = data.price;
                    changePercent = 0;
                    break;
                case 'gold':
                    price = data.price / TROY_OZ_TO_GRAM;
                    previousPrice = data.previousPrice ? data.previousPrice / TROY_OZ_TO_GRAM : null;
                    changePercent = data.changePercent || 0;
                    break;
                case 'sp500':
                    // 캐시에서 환율 가져오기
                    const usdCache = cache['exchange_USD_KRW'];
                    const exchangeRate = usdCache?.data?.price || 1435;
                    price = data.price * exchangeRate;
                    previousPrice = data.previousClose ? data.previousClose * exchangeRate : null;
                    changePercent = data.changePercent || 0;
                    break;
                case 'kospi':
                case 'nasdaq':
                    price = data.price;
                    previousPrice = data.previousClose;
                    changePercent = data.changePercent || 0;
                    break;
            }

            cachedProducts.push({
                ...template,
                price,
                previousPrice,
                changePercent,
                isLive: false, // 캐시된 데이터
                link: PRODUCT_LINKS[id],
                lastCached: new Date(cached.timestamp)
            });
        } else {
            // 캐시가 없으면 빈 데이터 (값은 null -> "-"로 표시됨)
            cachedProducts.push({
                ...template,
                price: null,
                previousPrice: null,
                changePercent: null,
                isLive: false,
                link: PRODUCT_LINKS[id],
                noData: true // 데이터 없음 표시
            });
        }
    }

    return cachedProducts;
}

// 데이터 로드 함수
export async function loadProducts(forceRefresh = false) {
    isLoading.set(true);
    error.set(null);

    // 캐시된 데이터로 초기화 (처음 로드 시)
    const currentProducts = get(products);
    if (currentProducts.length === 0) {
        products.set(initializeFromCache());
    }

    lastUpdated.set(new Date());
    updateCacheInfo();

    try {
        const cacheDurationMin = Math.round(getCacheDuration() / 60000);

        if (forceRefresh) {
            loadingStatus.set('🔄 강제 새로고침 중... (API 호출)');
        } else {
            loadingStatus.set(`📦 캐시 확인 중... (${cacheDurationMin}분 유효)`);
        }

        await fetchAllProductsSequentially((updatedProduct) => {
            // 링크와 업데이트 시간 추가
            updatedProduct.link = PRODUCT_LINKS[updatedProduct.id];
            updatedProduct.lastUpdated = new Date();
            updateProduct(updatedProduct);
            lastUpdated.set(new Date());
            updateCacheInfo();
            loadingStatus.set(`✅ ${updatedProduct.nameKr} 업데이트 완료`);
        }, forceRefresh);

        loadingStatus.set('✨ 모든 데이터 로드 완료');
        updateCacheInfo();
        setTimeout(() => loadingStatus.set(''), 3000);

    } catch (err) {
        console.error('Failed to load products:', err);
        error.set(err.message);
        loadingStatus.set('⚠️ 데이터 로드 실패');
        setTimeout(() => loadingStatus.set(''), 5000);
    } finally {
        isLoading.set(false);
    }
}

// 캐시 클리어 및 새로고침
export async function clearCacheAndRefresh() {
    apiClearCache();
    updateCacheInfo();
    // 캐시 클리어 후 빈 데이터로 초기화
    products.set(initializeFromCache());
    await loadProducts(true);
}
