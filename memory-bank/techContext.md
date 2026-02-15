# Technology Context

## Core Technologies
### Frontend
- **Framework**: Svelte
- **Build Tool**: Vite
- **Styling**: Likely custom CSS / CSS variables (refer to `app.css`).

### Backend
- **Framework**: Node.js, Express
- **Middleware**: `cors` for handling cross-origin requests.

### Data
- **Persistence**: File-based JSON caching (`cache.json`).
- **External APIs**:
  - Alpha Vantage
  - Twelve Data
  - Gold API
  - Yahoo Finance (`yahoo-finance2`)

## Development Setup
- **Dependencies**: Managed via `package.json`.
- **Scripts**:
  - `dev`: Concurrent execution of `node server.js` and `vite` for development.
  - `build`: Vite build command for production.

## Technical Constraints
- **API Rate Limits**: External APIs used (Alpha Vantage, Twelve Data) have strict rate limits on free tiers. The caching strategy is critical to mitigate this.
- **Node.js**: The backend requires Node.js runtime.
- **CORS**: Cross-origin requests must be properly configured in Express to allow the Svelte app to fetch data.
