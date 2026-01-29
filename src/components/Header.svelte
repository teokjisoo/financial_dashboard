<script>
  export let lastUpdated = null;
  export let isLoading = false;
  export let onRefresh = () => {};
  export let onForceRefresh = () => {};
  export let cacheInfo = {};

  function formatTime(date) {
    if (!date) return "-";
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // 캐시 상태 요약
  $: cacheCount = Object.keys(cacheInfo).length;
  $: validCacheCount = Object.values(cacheInfo).filter((c) => c.valid).length;
</script>

<header class="dashboard-header">
  <div class="header-content">
    <div class="title-section">
      <h1 class="main-title">
        <span class="title-icon">💹</span>
        <span class="title-text">금융 대시보드</span>
      </h1>
      <p class="subtitle">실시간 금융 상품 모니터링</p>
    </div>

    <div class="info-section">
      <div class="cache-info" title="캐시 상태">
        <span class="cache-icon">📦</span>
        <span class="cache-text">{validCacheCount}/{cacheCount} 캐시</span>
      </div>

      <div class="update-info">
        <span class="update-label">마지막 업데이트</span>
        <span class="update-time">{formatTime(lastUpdated)}</span>
      </div>

      <div class="button-group">
        <button
          class="refresh-btn"
          on:click={onRefresh}
          disabled={isLoading}
          aria-label="새로고침 (캐시 사용)"
          title="캐시가 유효하면 캐시 데이터 사용"
        >
          <span class="refresh-icon" class:spinning={isLoading}>🔄</span>
          <span class="refresh-text">{isLoading ? "로딩..." : "새로고침"}</span>
        </button>

        <button
          class="force-refresh-btn"
          on:click={onForceRefresh}
          disabled={isLoading}
          aria-label="강제 새로고침"
          title="캐시 무시하고 API 호출"
        >
          <span class="refresh-icon" class:spinning={isLoading}>⚡</span>
          <span class="refresh-text">강제</span>
        </button>
      </div>
    </div>
  </div>
</header>

<style>
  .dashboard-header {
    padding: 2rem 0;
    margin-bottom: 2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .main-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.03em;
  }

  .title-icon {
    font-size: 2.25rem;
    -webkit-text-fill-color: initial;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .subtitle {
    color: #94a3b8;
    font-size: 1rem;
    margin: 0;
    margin-left: 3.25rem;
  }

  .info-section {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .cache-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    color: #10b981;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .cache-icon {
    font-size: 0.9rem;
  }

  .update-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  .update-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .update-time {
    font-size: 0.9rem;
    color: #e2e8f0;
    font-weight: 500;
    font-family: "Monaco", "Consolas", monospace;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
  }

  .refresh-btn,
  .force-refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
  }

  .force-refresh-btn {
    background: rgba(251, 146, 60, 0.15);
    border: 1px solid rgba(251, 146, 60, 0.3);
    color: #fb923c;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.25);
    border-color: rgba(56, 189, 248, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
  }

  .force-refresh-btn:hover:not(:disabled) {
    background: rgba(251, 146, 60, 0.25);
    border-color: rgba(251, 146, 60, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
  }

  .refresh-btn:disabled,
  .force-refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-icon {
    font-size: 1rem;
    transition: transform 0.3s ease;
  }

  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 768px) {
    .dashboard-header {
      padding: 1.5rem 0;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .main-title {
      font-size: 1.5rem;
    }

    .title-icon {
      font-size: 1.75rem;
    }

    .subtitle {
      margin-left: 2.5rem;
      font-size: 0.9rem;
    }

    .info-section {
      width: 100%;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .update-info {
      align-items: flex-start;
    }

    .cache-info {
      order: -1;
    }

    .button-group {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
