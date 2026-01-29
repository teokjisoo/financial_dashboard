// 차트분석 기반 투자 추천 로직
// 현재는 단순 모멘텀(등락률) 기반으로 구현
// 추후 RSI, MACD, 볼린저 밴드 등 기술적 지표 추가 가능

export const RECOMMENDATION_LEVELS = {
    strong_buy: {
        id: 'strong_buy',
        label: '강력추천',
        labelEn: 'Strong Buy',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        icon: '🚀'
    },
    buy: {
        id: 'buy',
        label: '추천',
        labelEn: 'Buy',
        color: '#38bdf8',
        bgColor: 'rgba(56, 189, 248, 0.15)',
        icon: '📈'
    },
    neutral: {
        id: 'neutral',
        label: '보통',
        labelEn: 'Neutral',
        color: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.15)',
        icon: '➡️'
    },
    sell: {
        id: 'sell',
        label: '비추천',
        labelEn: 'Sell',
        color: '#fb923c',
        bgColor: 'rgba(251, 146, 60, 0.15)',
        icon: '📉'
    },
    strong_sell: {
        id: 'strong_sell',
        label: '강력비추천',
        labelEn: 'Strong Sell',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        icon: '⚠️'
    }
};

/**
 * 등락률 기반 투자 추천 계산
 * @param {number} changePercent - 전일대비 등락률 (%)
 * @returns {Object} 추천 등급 정보
 */
export function getRecommendation(changePercent) {
    if (changePercent >= 2) {
        return RECOMMENDATION_LEVELS.strong_buy;
    } else if (changePercent >= 0.5) {
        return RECOMMENDATION_LEVELS.buy;
    } else if (changePercent >= -0.5) {
        return RECOMMENDATION_LEVELS.neutral;
    } else if (changePercent >= -2) {
        return RECOMMENDATION_LEVELS.sell;
    } else {
        return RECOMMENDATION_LEVELS.strong_sell;
    }
}

/**
 * 추천 등급 ID로 추천 정보 가져오기
 * @param {string} id - 추천 등급 ID
 * @returns {Object} 추천 등급 정보
 */
export function getRecommendationById(id) {
    return RECOMMENDATION_LEVELS[id] || RECOMMENDATION_LEVELS.neutral;
}
