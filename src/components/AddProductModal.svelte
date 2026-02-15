<script>
    import { createEventDispatcher } from "svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();
    let symbol = "";

    function handleSubmit() {
        if (symbol.trim()) {
            dispatch("add", symbol.trim());
            symbol = "";
            dispatch("close");
        }
    }

    function handleClose() {
        symbol = "";
        dispatch("close");
    }

    function handleKeyup(e) {
        if (e.key === "Enter") handleSubmit();
        if (e.key === "Escape") handleClose();
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" on:click={handleClose}>
        <div class="modal-content" on:click|stopPropagation>
            <header class="modal-header">
                <h3>종목 추가</h3>
                <button class="close-btn" on:click={handleClose}>&times;</button
                >
            </header>

            <div class="modal-body">
                <label for="symbol-input">종목 심볼 (예: AAPL, TSLA)</label>
                <input
                    id="symbol-input"
                    type="text"
                    bind:value={symbol}
                    placeholder="심볼을 입력하세요"
                    on:keyup={handleKeyup}
                    autoFocus
                />
                <p class="hint">
                    Yahoo Finance 심볼 기준 (예: 005930.KS, BTC-USD)
                </p>
            </div>

            <footer class="modal-footer">
                <button class="cancel-btn" on:click={handleClose}>취소</button>
                <button
                    class="add-btn"
                    on:click={handleSubmit}
                    disabled={!symbol.trim()}>추가</button
                >
            </footer>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: #1e293b;
        width: 90%;
        max-width: 400px;
        border-radius: 16px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #f8fafc;
    }

    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: #fff;
    }

    .modal-body {
        padding: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #cbd5e1;
        font-size: 0.9rem;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 8px;
        color: #fff;
        font-size: 1rem;
        outline: none;
        transition: all 0.2s;
        box-sizing: border-box; /* padding 포함 */
    }

    input:focus {
        border-color: #38bdf8;
        box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }

    .hint {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #64748b;
    }

    .modal-footer {
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    button {
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
    }

    .cancel-btn {
        background: transparent;
        border: 1px solid #475569;
        color: #cbd5e1;
    }

    .cancel-btn:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .add-btn {
        background: #38bdf8;
        border: none;
        color: #0f172a;
        font-weight: 600;
    }

    .add-btn:hover:not(:disabled) {
        background: #0ea5e9;
        transform: translateY(-1px);
    }

    .add-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
