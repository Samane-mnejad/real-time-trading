import express, { Request, Response } from 'express';
import { MarketDataService } from '../services/MarketDataService';
import { createAuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AuthService } from '../services/AuthService';

const router = express.Router();

export const createMarketRoutes = (marketDataService: MarketDataService, authService: AuthService) => {
  const authMiddleware = createAuthMiddleware(authService);

  // GET /api/tickers - Get list of available tickers (protected)
  router.get('/tickers', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const tickers = marketDataService.getSupportedTickers();
    res.json({ tickers });
  });

  // GET /api/prices - Get current prices for all tickers (protected)
  router.get('/prices', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const prices = marketDataService.getAllPrices();
    res.json({ prices });
  });

  // GET /api/prices/:ticker - Get current price for a specific ticker (protected)
  router.get('/prices/:ticker', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { ticker } = req.params;
    const price = marketDataService.getCurrentPrice(ticker);
    
    if (!price) {
      return res.status(404).json({ error: 'Ticker not found' });
    }
    
    res.json({ price });
  });

  // GET /api/historical/:ticker - Get historical data for a specific ticker (protected)
  router.get('/historical/:ticker', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { ticker } = req.params;
    const historicalData = marketDataService.getHistoricalData(ticker);
    
    if (!historicalData.length) {
      return res.status(404).json({ error: 'Historical data not found' });
    }
    
    res.json({ historicalData });
  });

  return router;
}; 