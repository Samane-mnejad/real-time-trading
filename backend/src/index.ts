import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from 'dotenv';
import { MarketDataService } from './services/MarketDataService';
import { WebSocketService } from './services/WebSocketService';
import { AuthService } from './services/AuthService';
import { createMarketRoutes } from './routes/marketRoutes';
import { createAuthRoutes } from './routes/authRoutes';

config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Initialize services
const marketDataService = new MarketDataService();
const authService = new AuthService();
const webSocketService = new WebSocketService(server, marketDataService, authService);

// Start market data updates
marketDataService.startPriceUpdates();

// Routes
app.use('/api', createMarketRoutes(marketDataService, authService));
app.use('/api/auth', createAuthRoutes(authService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
}); 