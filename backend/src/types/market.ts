export interface MarketPrice {
  ticker: string;
  price: number;
  timestamp: number;
  change: number;
  changePercent: number;
}

export interface HistoricalPrice extends MarketPrice {
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface TickerSubscription {
  tickers: string[];
}

export type WebSocketMessage = {
  type: 'subscribe' | 'unsubscribe' | 'priceUpdate' | 'initialPrices' | 'subscriptionSuccess' | 'unsubscriptionSuccess';
  tickers?: string[];
  data?: MarketPrice | MarketPrice[];
}

export const SUPPORTED_TICKERS = ['AAPL', 'TSLA', 'BTC-USD'] as const;
export type SupportedTicker = typeof SUPPORTED_TICKERS[number];

export interface ChartDataPoint {
  timestamp: number;
  price: number;
  time: string;
} 