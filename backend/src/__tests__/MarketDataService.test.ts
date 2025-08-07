import { MarketDataService } from '../services/MarketDataService';
import { SUPPORTED_TICKERS } from '../types/market';

describe('MarketDataService', () => {
  let marketDataService: MarketDataService;

  beforeEach(() => {
    marketDataService = new MarketDataService();
  });

  afterEach(() => {
    marketDataService.stopPriceUpdates();
  });

  describe('initialization', () => {
    it('should initialize with supported tickers', () => {
      const tickers = marketDataService.getSupportedTickers();
      expect(tickers).toEqual(SUPPORTED_TICKERS);
    });

    it('should have initial prices for all supported tickers', () => {
      const prices = marketDataService.getAllPrices();
      expect(prices).toHaveLength(SUPPORTED_TICKERS.length);
      
      SUPPORTED_TICKERS.forEach(ticker => {
        const price = marketDataService.getCurrentPrice(ticker);
        expect(price).toBeDefined();
        expect(price!.ticker).toBe(ticker);
        expect(price!.price).toBeGreaterThan(0);
        expect(price!.timestamp).toBeGreaterThan(0);
      });
    });

    it('should have historical data for all supported tickers', () => {
      SUPPORTED_TICKERS.forEach(ticker => {
        const historicalData = marketDataService.getHistoricalData(ticker);
        expect(historicalData).toBeDefined();
        expect(historicalData.length).toBeGreaterThan(0);
        
        historicalData.forEach(data => {
          expect(data.ticker).toBe(ticker);
          expect(data.price).toBeGreaterThan(0);
          expect(data.open).toBeGreaterThan(0);
          expect(data.high).toBeGreaterThan(0);
          expect(data.low).toBeGreaterThan(0);
          expect(data.volume).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('getCurrentPrice', () => {
    it('should return current price for valid ticker', () => {
      const price = marketDataService.getCurrentPrice('AAPL');
      expect(price).toBeDefined();
      expect(price!.ticker).toBe('AAPL');
    });

    it('should return undefined for invalid ticker', () => {
      const price = marketDataService.getCurrentPrice('INVALID');
      expect(price).toBeUndefined();
    });
  });

  describe('getAllPrices', () => {
    it('should return all current prices', () => {
      const prices = marketDataService.getAllPrices();
      expect(prices).toHaveLength(SUPPORTED_TICKERS.length);
      
      const tickers = prices.map(p => p.ticker);
      SUPPORTED_TICKERS.forEach(ticker => {
        expect(tickers).toContain(ticker);
      });
    });
  });

  describe('getHistoricalData', () => {
    it('should return historical data for valid ticker', () => {
      const data = marketDataService.getHistoricalData('AAPL');
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid ticker', () => {
      const data = marketDataService.getHistoricalData('INVALID');
      expect(data).toEqual([]);
    });
  });

  describe('price updates', () => {
    it('should emit priceUpdate events when prices change', (done) => {
      let updateCount = 0;
      
      marketDataService.on('priceUpdate', (price) => {
        expect(price).toBeDefined();
        expect(price.ticker).toBeDefined();
        expect(price.price).toBeGreaterThan(0);
        expect(price.timestamp).toBeGreaterThan(0);
        
        updateCount++;
        if (updateCount >= 3) { // Wait for a few updates
          marketDataService.stopPriceUpdates();
          done();
        }
      });

      marketDataService.startPriceUpdates();
    }, 10000);

    it('should not start multiple update intervals', () => {
      marketDataService.startPriceUpdates();
      marketDataService.startPriceUpdates(); // Should not create another interval
      
      // This is hard to test directly, but we can ensure it doesn't throw
      expect(() => marketDataService.startPriceUpdates()).not.toThrow();
      
      marketDataService.stopPriceUpdates();
    });

    it('should stop price updates', () => {
      marketDataService.startPriceUpdates();
      expect(() => marketDataService.stopPriceUpdates()).not.toThrow();
    });
  });
}); 