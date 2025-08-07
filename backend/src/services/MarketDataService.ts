import { EventEmitter } from 'events';
import { MarketPrice, HistoricalPrice, SUPPORTED_TICKERS } from '../types/market';

export class MarketDataService extends EventEmitter {
  private prices: Map<string, MarketPrice>;
  private historicalData: Map<string, HistoricalPrice[]>;
  private updateInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.prices = new Map();
    this.historicalData = new Map();
    this.updateInterval = null;
    this.initializePrices();
  }

  private initializePrices() {
    const baselinePrices = {
      'AAPL': 175.0,
      'TSLA': 180.0,
      'BTC-USD': 52000.0
    };

    SUPPORTED_TICKERS.forEach(ticker => {
      const basePrice = baselinePrices[ticker as keyof typeof baselinePrices];
      this.prices.set(ticker, {
        ticker,
        price: basePrice,
        timestamp: Date.now(),
        change: 0,
        changePercent: 0
      });

      this.historicalData.set(ticker, this.generateHistoricalData(ticker, basePrice));
    });
  }

  private generateHistoricalData(ticker: string, currentPrice: number): HistoricalPrice[] {
    const data: HistoricalPrice[] = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * dayMs);
      const volatility = ticker === 'BTC-USD' ? 0.05 : 0.02;
      const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
      const price = currentPrice + randomChange;

      data.push({
        ticker,
        timestamp,
        price,
        open: price * (1 - Math.random() * 0.01),
        high: price * (1 + Math.random() * 0.01),
        low: price * (1 - Math.random() * 0.01),
        volume: Math.floor(Math.random() * 1000000),
        change: randomChange,
        changePercent: (randomChange / currentPrice) * 100
      });
    }

    return data;
  }

  private updatePrice(ticker: string) {
    const currentPrice = this.prices.get(ticker)!;
    const volatility = ticker === 'BTC-USD' ? 0.002 : 0.001;
    const change = (Math.random() - 0.5) * volatility * currentPrice.price;
    const newPrice = currentPrice.price + change;

    const updatedPrice: MarketPrice = {
      ticker,
      price: newPrice,
      timestamp: Date.now(),
      change,
      changePercent: (change / currentPrice.price) * 100
    };

    this.prices.set(ticker, updatedPrice);
    this.emit('priceUpdate', updatedPrice);
  }

  public startPriceUpdates() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      SUPPORTED_TICKERS.forEach(ticker => this.updatePrice(ticker));
    }, 1000);
  }

  public stopPriceUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getCurrentPrice(ticker: string): MarketPrice | undefined {
    return this.prices.get(ticker);
  }

  public getAllPrices(): MarketPrice[] {
    return Array.from(this.prices.values());
  }

  public getHistoricalData(ticker: string): HistoricalPrice[] {
    return this.historicalData.get(ticker) || [];
  }

  public getSupportedTickers(): readonly string[] {
    return SUPPORTED_TICKERS;
  }
} 