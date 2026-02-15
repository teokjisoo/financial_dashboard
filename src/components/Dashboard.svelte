<script>
  import ProductTile from "./ProductTile.svelte";
  import Header from "./Header.svelte";
  import AddProductModal from "./AddProductModal.svelte";
  import {
    productsWithRecommendation,
    isLoading,
    lastUpdated,
    error,
    loadingStatus,
    cacheInfo,
    loadProducts,
    clearCacheAndRefresh,
    addProduct,
  } from "../lib/stores.js";
  import { onMount } from "svelte";

  onMount(() => {
    loadProducts(false); // 캐시 사용하여 로드
  });

  // 새로고침 (API 재호출)
  function handleRefresh() {
    loadProducts(true);
  }

  // 모달 상태 관리
  let isModalOpen = false;

  function openModal() {
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
  }

  function handleAddProduct(event) {
    const symbol = event.detail;
    addProduct(symbol);
  }
</script>

<AddProductModal
  isOpen={isModalOpen}
  on:close={closeModal}
  on:add={handleAddProduct}
/>

<div class="dashboard-container">
  <Header
    lastUpdated={$lastUpdated}
    isLoading={$isLoading}
    cacheInfo={$cacheInfo}
    onRefresh={handleRefresh}
  />

  {#if $loadingStatus}
    <div class="loading-status">
      <span>{$loadingStatus}</span>
    </div>
  {/if}

  {#if $error}
    <div class="error-message">
      <span class="error-icon">⚠️</span>
      <span
        >데이터를 불러오는 중 오류가 발생했습니다. 모의 데이터를 표시합니다.</span
      >
    </div>
  {/if}

  <main class="products-grid">
    {#if $productsWithRecommendation.length === 0}
      {#each [1, 2, 3, 4] as _}
        <div class="skeleton-tile">
          <div class="skeleton-header">
            <div class="skeleton-icon"></div>
            <div class="skeleton-text"></div>
          </div>
          <div class="skeleton-price"></div>
          <div class="skeleton-badge"></div>
        </div>
      {/each}
    {:else}
      {#each $productsWithRecommendation as product (product.id)}
        <ProductTile {product} />
      {/each}

      <!-- 추가하기 타일 -->
      <button class="add-tile-btn" on:click={openModal}>
        <div class="add-icon">+</div>
        <span class="add-text">종목 추가</span>
      </button>
    {/if}
  </main>

  <footer class="dashboard-footer">
    <p>데이터 출처: Alpha Vantage, GoldAPI.io</p>
    <p class="disclaimer">
      ※ 투자 추천은 단순 모멘텀 분석 기반이며, 실제 투자 결정의 참고용으로만
      사용하세요.
    </p>
  </footer>
</div>

<style>
  .dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .loading-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    border-radius: 10px;
    color: #38bdf8;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.3);
    border-radius: 12px;
    color: #fb923c;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .error-icon {
    font-size: 1.25rem;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    flex: 1;
  }

  /* Skeleton Loading */
  .skeleton-tile {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 1.5rem;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  .skeleton-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .skeleton-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .skeleton-text {
    width: 100px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  .skeleton-price {
    width: 150px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .skeleton-badge {
    width: 100px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
  }

  .dashboard-footer {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    color: #64748b;
    font-size: 0.85rem;
  }

  .dashboard-footer p {
    margin: 0.5rem 0;
  }

  .disclaimer {
    font-size: 0.75rem;
    color: #475569;
  }

  .cache-hint {
    font-size: 0.75rem;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    display: inline-block;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    margin-top: 0.5rem;
  }

  /* Responsive Grid */
  @media (max-width: 1200px) {
    .products-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .dashboard-container {
      padding: 0 1rem 1.5rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  /* Add Tile Button Styles */
  .add-tile-btn {
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 200px; /* Approximate height of other tiles */
    color: #94a3b8;
  }

  .add-tile-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(56, 189, 248, 0.5);
    color: #38bdf8;
    transform: translateY(-4px);
  }

  .add-icon {
    font-size: 3rem;
    font-weight: 300;
    line-height: 1;
  }

  .add-text {
    font-size: 1rem;
    font-weight: 500;
  }
</style>
