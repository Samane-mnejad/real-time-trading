import WebSocket from 'ws';
import { Server } from 'http';
import { IncomingMessage } from 'http';
import { MarketDataService } from './MarketDataService';
import { AuthService } from './AuthService';
import { WebSocketMessage, MarketPrice } from '../types/market';
import { User } from '../types/auth';
import { parse } from 'url';

interface AuthenticatedWebSocket extends WebSocket {
  user?: User;
  isAuthenticated?: boolean;
}

export class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Map<AuthenticatedWebSocket, Set<string>>;

  constructor(server: Server, private marketDataService: MarketDataService, private authService: AuthService) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection attempt');
      
      // Extract token from query parameters or headers
      const token = this.extractToken(request);
      
      if (!token) {
        console.log('WebSocket connection rejected - no auth token');
        ws.send(JSON.stringify({ error: 'Authentication required' }));
        ws.close(1008, 'Authentication required');
        return;
      }

      try {
        // Verify token
        const user = await this.authService.verifyToken(token);
        
        if (!user) {
          console.log('WebSocket connection rejected - invalid token');
          ws.send(JSON.stringify({ error: 'Invalid authentication token' }));
          ws.close(1008, 'Invalid authentication token');
          return;
        }

        // Mark as authenticated
        ws.user = user;
        ws.isAuthenticated = true;
        console.log(`WebSocket connection authenticated for user: ${user.email}`);
        
        this.clients.set(ws, new Set());

        ws.on('message', (message: string) => {
          try {
            const data: WebSocketMessage = JSON.parse(message);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            ws.send(JSON.stringify({ error: 'Invalid message format' }));
          }
        });

        ws.on('close', () => {
          console.log(`Client disconnected: ${user.email}`);
          this.clients.delete(ws);
        });

        // Send initial prices only after authentication
        const initialPrices = this.marketDataService.getAllPrices();
        ws.send(JSON.stringify({ type: 'initialPrices', data: initialPrices }));
        
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        ws.send(JSON.stringify({ error: 'Authentication failed' }));
        ws.close(1008, 'Authentication failed');
      }
    });

    // Listen for price updates from the market data service
    this.marketDataService.on('priceUpdate', (price: MarketPrice) => {
      this.broadcastPrice(price);
    });
  }

  private extractToken(request: IncomingMessage): string | null {
    // Try to get token from query parameters first
    const url = parse(request.url || '', true);
    if (url.query.token) {
      return url.query.token as string;
    }

    // Try to get token from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    return null;
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    // Only allow authenticated clients to interact
    if (!ws.isAuthenticated) {
      ws.send(JSON.stringify({ error: 'Authentication required' }));
      return;
    }

    const subscriptions = this.clients.get(ws)!;

    switch (message.type) {
      case 'subscribe':
        if (message.tickers) {
          message.tickers.forEach(ticker => subscriptions.add(ticker));
          ws.send(JSON.stringify({
            type: 'subscriptionSuccess',
            tickers: Array.from(subscriptions)
          }));
        }
        break;

      case 'unsubscribe':
        if (message.tickers) {
          message.tickers.forEach(ticker => subscriptions.delete(ticker));
          ws.send(JSON.stringify({
            type: 'unsubscriptionSuccess',
            tickers: Array.from(subscriptions)
          }));
        }
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  }

  private broadcastPrice(price: MarketPrice) {
    this.wss.clients.forEach(client => {
      const authClient = client as AuthenticatedWebSocket;
      
      // Only broadcast to authenticated clients
      if (authClient.readyState === WebSocket.OPEN && authClient.isAuthenticated) {
        const subscriptions = this.clients.get(authClient);
        
        // If client has no specific subscriptions or is subscribed to this ticker
        if (!subscriptions?.size || subscriptions.has(price.ticker)) {
          authClient.send(JSON.stringify({
            type: 'priceUpdate',
            data: price
          }));
        }
      }
    });
  }

  public close() {
    this.wss.close();
  }
} 