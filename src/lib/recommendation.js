// 차트분석 기반 투자 추천 로직 (SMA, MACD, RSI)
// 1단계: 위험 감지 (40주선 이탈) -> Strong Sell
// 2단계: 추세 붕괴 (10주선 이탈 or MACD 데드크로스) -> Sell
// 3단계: 강력 상승 (40주선 위 + (신고가 or 골든크로스) + MACD > 0) -> Strong Buy
// 4단계: 완만 상승 (10주선 위 + 정배열 + RSI < 70) -> Buy
// 5단계: 관망 (Else) -> Hold

export const RECOMMENDATION_LEVELS = {
    strong_buy: {
        id: 'strong_buy',
        label: '강력매수',
        labelEn: 'Strong Buy',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        icon: '🚀'
    },
    buy: {
        id: 'buy',
        label: '매수',
        labelEn: 'Buy',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.15)',
        icon: '📈'
    },
    neutral: {
        id: 'neutral',
        label: '관망',
        labelEn: 'Hold',
        color: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.15)',
        icon: '👀'
    },
    sell: {
        id: 'sell',
        label: '매도',
        labelEn: 'Sell',
        color: '#fb923c',
        bgColor: 'rgba(251, 146, 60, 0.15)',
        icon: '📉'
    },
    strong_sell: {
        id: 'strong_sell',
        label: '매도강추',
        labelEn: 'Strong Sell',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        icon: '🚨'
    }
};

/**
 * 이동평균(SMA) 계산
 */
function calculateSMA(data, period) {
    if (data.length < period) return null;
    const slice = data.slice(data.length - period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

/**
 * 지수이동평균(EMA) 계산
 */
function calculateEMA(data, period) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    let emaArray = [data[0]];
    for (let i = 1; i < data.length; i++) {
        emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
    }
    return emaArray;
}

/**
 * RSI 계산 (14주)
 */
function calculateRSI(data, period = 14) {
    if (data.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = data[i] - data[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // 그 이후 데이터 처리 (Smoothed RSI)
    for (let i = period + 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        const gain = diff >= 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

/**
 * MACD 계산 (12, 26, 9)
 */
function calculateMACD(data) {
    if (data.length < 26) return null;

    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);

    // EMA12와 EMA26의 길이가 다르므로 끝에 맞춰 정렬
    const macdLine = [];
    const minLength = Math.min(ema12.length, ema26.length);
    const offset12 = ema12.length - minLength;
    const offset26 = ema26.length - minLength;

    for (let i = 0; i < minLength; i++) {
        macdLine.push(ema12[i + offset12] - ema26[i + offset26]);
    }

    const signalLine = calculateEMA(macdLine, 9);

    // 최신 값 반환
    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];
    const prevMACD = macdLine[macdLine.length - 2];
    const prevSignal = signalLine[signalLine.length - 2];

    return {
        macd: currentMACD,
        signal: currentSignal,
        hist: currentMACD - currentSignal,
        prevMacd: prevMACD,
        prevSignal: prevSignal
    };
}

/**
 * 종합 투자 추천 계산 (5단계 알고리즘)
 * @param {Array} candles - 주봉 데이터 [{close, ...}, ...]
 * @param {number} currentPrice - 현재가 (실시간)
 * @returns {Object} 추천 등급 정보
 */
export function getRecommendation(candles, currentPrice) {
    if (!candles || candles.length < 50) {
        return RECOMMENDATION_LEVELS.neutral; // 데이터 부족 시 관망
    }

    const closes = candles.map(c => c.close);
    // 마지막 주봉이 아직 확정되지 않았을 수 있으므로, 현재가를 마지막 종가로 업데이트하거나 추가
    // 여기서는 주봉 데이터 자체를 신뢰하고 사용하되, 최신 주봉이 이번주 것을 포함한다고 가정

    const sma10 = calculateSMA(closes, 10);
    const sma40 = calculateSMA(closes, 40);
    const rsi = calculateRSI(closes, 14);
    const macdData = calculateMACD(closes);

    if (!sma10 || !sma40 || !macdData || rsi === null) {
        return RECOMMENDATION_LEVELS.neutral;
    }

    // 전 고점 (최근 20주)
    const recentHigh = Math.max(...closes.slice(closes.length - 20, closes.length - 1));

    // 로직 적용
    const price = currentPrice || closes[closes.length - 1];
    const isMacdDeadCross = macdData.prevMacd > macdData.prevSignal && macdData.macd < macdData.signal;
    const isMacdGoldenCross = macdData.prevMacd < macdData.prevSignal && macdData.macd > macdData.signal;

    console.log(`Analyzed: Price=${price}, SMA10=${sma10.toFixed(2)}, SMA40=${sma40.toFixed(2)}, RSI=${rsi.toFixed(2)}, MACD=${macdData.macd.toFixed(2)}/${macdData.signal.toFixed(2)}`);

    // 1단계: 위험 감지 (생명선 붕괴)
    // 40주선 이탈
    if (price < sma40) {
        return { ...RECOMMENDATION_LEVELS.strong_sell, details: getIndicatorDetails(price, sma10, sma40, macdData, rsi) };
    }

    // 2단계: 단기 추세 붕괴
    // 10주선 이탈 OR MACD 데드크로스
    if (price < sma10 || isMacdDeadCross) {
        return { ...RECOMMENDATION_LEVELS.sell, details: getIndicatorDetails(price, sma10, sma40, macdData, rsi) };
    }

    // 3단계: 강력한 상승 모멘텀
    // (40주선 위) AND (직전고점 돌파 OR (40주선 위에서 골든크로스? - 이건 로직상 40주선 위는 1단계 통과했으니 이미 충족))
    // 여기서는 "40주선 돌파 골든크로스"를 "주가가 40주선을 상향 돌파"한 직후로 해석하거나
    // MACD가 0선 위로 올라왔는가 조건도 포함
    const brokeRecentHigh = price > recentHigh;
    const isMacdAboveZero = macdData.macd > 0;

    // Q3: 주가가 40주선 위에 있고 (1단계 통과했으니 OK)
    // (직전 고점 돌파 OR 40주선 돌파 골든크로스?? -> 주가가 40주를 뚫고 올라옴)
    // + MACD 0선 위
    // * 40주선 돌파 골든크로스: 여기서는 단순하게 현재가가 40주선보다 훨씬 높은 강한 추세 or 막 뚫은 추세로 해석
    if ((brokeRecentHigh) && isMacdAboveZero) {
        return { ...RECOMMENDATION_LEVELS.strong_buy, details: getIndicatorDetails(price, sma10, sma40, macdData, rsi) };
    }

    // 4단계: 완만한 상승 추세
    // 주가가 10주선 위에 있고 정배열(10 > 40) 상태인가?
    // 단, RSI가 70 이상(과열)은 제외
    if (price > sma10 && sma10 > sma40 && rsi < 70) {
        return { ...RECOMMENDATION_LEVELS.buy, details: getIndicatorDetails(price, sma10, sma40, macdData, rsi) };
    }

    // 5단계: 나머지 (관망)
    return { ...RECOMMENDATION_LEVELS.neutral, details: getIndicatorDetails(price, sma10, sma40, macdData, rsi) };
}

function getIndicatorDetails(price, sma10, sma40, macd, rsi) {
    // SMA Status
    let smaStatus = '보통';
    if (price > sma10 && sma10 > sma40) smaStatus = '아주 좋음';
    else if (price > sma40) smaStatus = '좋음';
    else if (price < sma10 && price > sma40) smaStatus = '보통'; // 조정
    else if (price < sma40) smaStatus = '나쁨';
    if (price < sma10 && sma10 < sma40) smaStatus = '아주 나쁨';

    // MACD Status
    let macdStatus = '보통';
    if (macd.macd > macd.signal && macd.macd > 0) macdStatus = '아주 좋음';
    else if (macd.macd > macd.signal) macdStatus = '좋음';
    else if (macd.macd > 0) macdStatus = '보통';
    else if (macd.macd < macd.signal) macdStatus = '나쁨';
    if (macd.macd < macd.signal && macd.macd < 0) macdStatus = '아주 나쁨';

    // RSI Status
    let rsiStatus = '보통';
    if (rsi >= 55 && rsi < 70) rsiStatus = '아주 좋음'; // 강한 상승세
    else if (rsi >= 45 && rsi < 55) rsiStatus = '좋음'; // 안정적
    else if (rsi >= 40 && rsi < 45) rsiStatus = '보통';
    else if (rsi >= 30 && rsi < 40) rsiStatus = '나쁨';
    else if (rsi < 30) rsiStatus = '아주 나쁨'; // 과매도 침체
    if (rsi >= 70) rsiStatus = '좋음 (과열)'; // 과열은 긍정적이나 주의 필요

    return {
        sma: smaStatus,
        macd: macdStatus,
        rsi: rsiStatus,
        values: {
            sma10: sma10.toFixed(0),
            sma40: sma40.toFixed(0),
            rsi: rsi.toFixed(1),
            macd: macd.macd.toFixed(2)
        }
    };
}

export function getRecommendationById(id) {
    return RECOMMENDATION_LEVELS[id] || RECOMMENDATION_LEVELS.neutral;
}
