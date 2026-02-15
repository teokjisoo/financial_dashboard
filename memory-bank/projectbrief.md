# Project Brief: Financial Dashboard

## Overview
A web-based financial dashboard application that provides real-time financial tracking for various assets. The dashboard is built using a modern Svelte frontend and a dedicated Node.js/Express backend for data fetching and processing.

## Core Goals
- **Real-time Monitoring**: Display up-to-date prices for key financial indicators (USD/KRW, Gold, SPI, NASDAQ, KOSPI).
- **Customizable Tracking**: Allow users to add and track custom stock symbols.
- **Visual Analytics**: Provide charts and historical data visualization.
- **Reliability**: Ensure data availability through multiple API fallbacks and caching mechanisms.

## Key Features
- **Dashboard View**: Grid layout of financial tiles displaying current price, change, and key statistics.
- **Data Display**: Interactive charts for historical performance.
- **Asset Coverage**:
  - Currency Exchange (USD/KRW)
  - Commodities (Gold)
  - Major Indices (S&P 500, NASDAQ, KOSPI)
  - Custom user-defined stocks
- **Backend Architecture**:
  - Centralized API handling
  - Caching strategy to minimize API calls and improve performance
  - Multiple data providers (Alpha Vantage, Twelve Data, Gold API, Yahoo Finance)
