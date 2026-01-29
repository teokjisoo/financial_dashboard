<script>
  export let product;

  // 상품별 네이버 증권 링크
  const PRODUCT_LINKS = {
    usd: "https://m.stock.naver.com/marketindex/exchange/FX_USDKRW",
    gold: "https://m.stock.naver.com/marketindex/metals/M04020000",
    sp500: "https://m.stock.naver.com/worldstock/index/.INX/total",
    kospi: "https://m.stock.naver.com/domestic/index/KOSPI/total",
    nasdaq: "https://m.stock.naver.com/worldstock/index/.IXIC/total",
  };

  // 숫자 포맷팅 (천단위 콤마)
  function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // 가격 포맷팅
  function formatPrice(price, unit) {
    if (price === null || price === undefined) return "-";
    if (price >= 1000000) {
      return formatNumber(price, 0);
    } else if (price >= 100) {
      return formatNumber(price, 2);
    }
    return formatNumber(price, 2);
  }

  // 마지막 업데이트 시간 포맷팅
  function formatLastUpdated(date) {
    if (!date) return "-";
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // 타일 클릭 시 새 탭에서 링크 열기
  function handleClick() {
    const link = product.link || PRODUCT_LINKS[product.id];
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  }

  function getSparklinePoints(data) {
    if (!data || data.length < 2) return "";

    // 유효한 숫자만 필터링
    const validData = data.filter((d) => typeof d === "number" && !isNaN(d));
    if (validData.length < 2) return "";

    const min = Math.min(...validData);
    const max = Math.max(...validData);
    const range = max - min;

    const width = 120;
    const height = 40;
    const padding = 2;

    if (range === 0) return `0,${height / 2} ${width},${height / 2}`;

    return validData
      .map((d, i) => {
        const x = (i / (validData.length - 1)) * width;
        const normalizedY = (d - min) / range;
        // SVG 좌표계: y=0이 위쪽이므로 뒤집어야 함
        const y = height - padding - normalizedY * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }

  // 등락률 표시 (null 체크)
  $: hasChange =
    product.changePercent !== null && product.changePercent !== undefined;
  $: changeClass = hasChange
    ? product.changePercent >= 0
      ? "positive"
      : "negative"
    : "neutral";
  $: changeIcon = hasChange ? (product.changePercent >= 0 ? "▲" : "▼") : "";
  $: changeDisplay = hasChange
    ? `${product.changePercent >= 0 ? "+" : ""}${formatNumber(product.changePercent)}%`
    : "-";

  // 마지막 업데이트 시간
  $: lastUpdatedTime = product.lastUpdated || product.lastCached || null;
</script>

<div
  class="product-tile"
  class:is-live={product.isLive}
  data-category={product.category}
  on:click={handleClick}
  on:keydown={(e) => e.key === "Enter" && handleClick()}
  role="button"
  tabindex="0"
  title="클릭하여 네이버 증권에서 보기"
>
  <header class="tile-header">
    <span class="product-icon">{product.icon}</span>
    <div class="product-info">
      <div class="name-row">
        <h3 class="product-name">{product.name}</h3>
        <span class="update-time" title="마지막 업데이트 시간">
          🕐 {formatLastUpdated(lastUpdatedTime)}
        </span>
      </div>
      <span class="product-name-kr">{product.nameKr}</span>
    </div>
  </header>

  <div class="tile-body">
    <div class="price-section">
      <span class="current-price">
        {#if product.unit === "원" || product.unit === "원/g"}
          ₩{formatPrice(product.price, product.unit)}
        {:else if product.unit === "pt"}
          {formatPrice(product.price, product.unit)}
        {:else if product.unit === "USD"}
          ${formatPrice(product.price, product.unit)}
        {:else}
          {formatPrice(product.price, product.unit)}
        {/if}
      </span>
      <span class="price-unit">{product.unit}</span>
    </div>

    <div class="change-section {changeClass}">
      <span class="change-icon">{changeIcon}</span>
      <span class="change-percent">{changeDisplay}</span>
    </div>

    {#if product.history && product.history.length > 1}
      <div class="chart-container">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none">
          <polyline
            points={getSparklinePoints(product.history)}
            fill="none"
            stroke={product.changePercent >= 0 ? "#ef4444" : "#3b82f6"}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    {/if}
  </div>

  <footer class="tile-footer">
    <div
      class="recommendation-badge"
      style="--badge-color: {product.recommendation.color}; --badge-bg: {product
        .recommendation.bgColor};"
    >
      <span class="badge-icon">{product.recommendation.icon}</span>
      <span class="badge-label">{product.recommendation.label}</span>
    </div>
  </footer>
</div>

<style>
  .product-tile {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .product-tile::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.8),
      rgba(168, 85, 247, 0.8),
      rgba(236, 72, 153, 0.8)
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .product-tile:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.3),
      0 0 40px rgba(56, 189, 248, 0.1);
  }

  .product-tile:hover::before {
    opacity: 1;
  }

  .tile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .product-icon {
    font-size: 2.5rem;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .product-info {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .product-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .update-time {
    font-size: 0.65rem;
    font-weight: 500;
    color: #94a3b8;
    background: rgba(148, 163, 184, 0.1);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }

  .product-name-kr {
    font-size: 0.85rem;
    color: #94a3b8;
    margin-top: 0.2rem;
  }

  .tile-body {
    margin-bottom: 1.5rem;
  }

  .price-section {
    margin-bottom: 0.75rem;
  }

  .current-price {
    font-size: 1.75rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .price-unit {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .change-section {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .change-section.positive {
    background: rgba(0, 212, 170, 0.15);
    color: #00d4aa;
  }

  .change-section.negative {
    background: rgba(255, 71, 87, 0.15);
    color: #ff4757;
  }

  .change-section.neutral {
    background: rgba(100, 116, 139, 0.15);
    color: #94a3b8;
  }

  .change-icon {
    font-size: 0.75rem;
  }

  .tile-footer {
    display: flex;
    justify-content: flex-start;
  }

  .recommendation-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 12px;
    background: var(--badge-bg);
    border: 1px solid var(--badge-color);
    color: var(--badge-color);
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .recommendation-badge:hover {
    transform: scale(1.05);
  }

  .badge-icon {
    font-size: 1rem;
  }

  .chart-container {
    margin-top: 0.8rem;
    width: 100%;
    height: 40px;
    opacity: 0.8;
  }

  .chart-container svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  @media (max-width: 768px) {
    .product-tile {
      padding: 1.25rem;
    }

    .product-icon {
      font-size: 2rem;
    }

    .current-price {
      font-size: 1.5rem;
    }
  }
</style>
