# System Patterns

## Architecture Overview
The system follows a Single-Page Application (SPA) architecture with a dedicated Node.js backend.
- **Frontend**: Svelte (with Vite) for the user interface.
- **Backend**: Express.js server (`server.js`) acting as an API gateway and cache layer.
- **Data Persistence**: File-based caching (`cache.json`) to store fetched data and minimize API load.

## Key Technical Decisions
### 1. Unified API Gateway
All external financial data requests are routed through the backend (`/api/data/:id`). This allows for:
- **Centralized API Key Management**: API keys are stored securely on the server.
- **Caching**: Reduces API calls and improves response times for users.
- **Rate Limiting**: Handles rate limits from free API tiers (Alpha Vantage, Twelve Data).

### 2. Multi-Tier Data Fetching Strategy
To ensure reliability, the system implements a fallback mechanism for stock data:
- **Primary**: Alpha Vantage / Twelve Data for structured market data.
- **Secondary**: Yahoo Finance (`yahoo-finance2`) as a robust fallback when primary APIs fail or rate limit.
- **Specialized**: Specific APIs for commodities (Gold API) and exchange rates.

### 3. File-Based Caching
- **Implementation**: A simple JSON file (`cache.json`) stores the last successful fetch for each asset.
- **Benefits**: Persistence across server restarts, reduced API usage, and faster client load times.
- **Duration**: Default cache duration is set to 5 minutes for real-time data.

## Component Relationships
- **App.svelte**: Main application container.
- **Components**: Modular UI elements (likely including `Tile`, `Chart`, `Header`).
- **Server**: Handles `/api/data/:id` requests, manages `cache.json`, and coordinates external API calls.
