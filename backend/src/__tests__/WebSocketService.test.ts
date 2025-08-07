import WebSocket from 'ws';
import { Server } from 'http';
import { WebSocketService } from '../services/WebSocketService';
import { MarketDataService } from '../services/MarketDataService';
import { AuthService } from '../services/AuthService';
import { WebSocketMessage, MarketPrice } from '../types/market';

// Mock dependencies
jest.mock('../services/MarketDataService');
jest.mock('../services/AuthService');

describe('WebSocketService', () => {
  let server: Server;
  let webSocketService: WebSocketService;
  let mockMarketDataService: jest.Mocked<MarketDataService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let wsUrl: string;
  let port: number;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'avatar.png'
  };

  const mockPrices: MarketPrice[] = [
    {
      ticker: 'AAPL',
      price: 175.0,
      timestamp: Date.now(),
      change: 1.5,
      changePercent: 0.86
    },
    {
      ticker: 'TSLA',
      price: 180.0,
      timestamp: Date.now(),
      change: -2.0,
      changePercent: -1.10
    }
  ];

  beforeAll((done) => {
    // Create a real HTTP server for testing
    server = new Server();
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        port = address.port;
        wsUrl = `ws://localhost:${port}`;
      }
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock MarketDataService
    mockMarketDataService = new MarketDataService() as jest.Mocked<MarketDataService>;
    mockMarketDataService.getAllPrices = jest.fn().mockReturnValue(mockPrices);
    mockMarketDataService.on = jest.fn();

    // Mock AuthService
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    
    // Initialize WebSocketService
    webSocketService = new WebSocketService(server, mockMarketDataService, mockAuthService);
  });

  afterEach(() => {
    if (webSocketService) {
      webSocketService.close();
    }
  });

  describe('connection handling', () => {
    it('should reject connection without auth token', (done) => {
      const ws = new WebSocket(wsUrl);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.error).toBe('Authentication required');
      });

      ws.on('close', (code, reason) => {
        expect(code).toBe(1008);
        expect(reason.toString()).toBe('Authentication required');
        done();
      });
    });

    it('should reject connection with invalid token', (done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(null);
      
      const ws = new WebSocket(`${wsUrl}?token=invalid-token`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.error).toBe('Invalid authentication token');
      });

      ws.on('close', (code, reason) => {
        expect(code).toBe(1008);
        expect(reason.toString()).toBe('Invalid authentication token');
        done();
      });
    });

    it('should accept connection with valid token from query params', (done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(mockUser);
      
      const ws = new WebSocket(`${wsUrl}?token=valid-token`);

      ws.on('open', () => {
        expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          expect(message.data).toEqual(mockPrices);
          expect(mockMarketDataService.getAllPrices).toHaveBeenCalled();
          ws.close();
          done();
        }
      });
    });

    it('should extract token from Authorization header', (done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(mockUser);
      
      const ws = new WebSocket(wsUrl, {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
          ws.close();
          done();
        }
      });
    });

    it('should handle authentication error gracefully', (done) => {
      mockAuthService.verifyToken = jest.fn().mockRejectedValue(new Error('Auth failed'));
      
      const ws = new WebSocket(`${wsUrl}?token=error-token`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.error).toBe('Authentication failed');
      });

      ws.on('close', (code, reason) => {
        expect(code).toBe(1008);
        expect(reason.toString()).toBe('Authentication failed');
        done();
      });
    });
  });

  describe('message handling', () => {
    let authenticatedWs: WebSocket;

    beforeEach((done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(mockUser);
      authenticatedWs = new WebSocket(`${wsUrl}?token=valid-token`);
      
      authenticatedWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          done();
        }
      });
    });

    afterEach(() => {
      if (authenticatedWs.readyState === WebSocket.OPEN) {
        authenticatedWs.close();
      }
    });

    it('should handle subscribe message', (done) => {
      const subscribeMessage: WebSocketMessage = {
        type: 'subscribe',
        tickers: ['AAPL', 'TSLA']
      };

      authenticatedWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscriptionSuccess') {
          expect(message.tickers).toEqual(['AAPL', 'TSLA']);
          done();
        }
      });

      authenticatedWs.send(JSON.stringify(subscribeMessage));
    });

    it('should handle unsubscribe message', (done) => {
      const subscribeMessage: WebSocketMessage = {
        type: 'subscribe',
        tickers: ['AAPL', 'TSLA', 'BTC-USD']
      };

      const unsubscribeMessage: WebSocketMessage = {
        type: 'unsubscribe',
        tickers: ['BTC-USD']
      };

      let subscriptionComplete = false;

      authenticatedWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'subscriptionSuccess' && !subscriptionComplete) {
          subscriptionComplete = true;
          authenticatedWs.send(JSON.stringify(unsubscribeMessage));
        } else if (message.type === 'unsubscriptionSuccess') {
          expect(message.tickers).toEqual(['AAPL', 'TSLA']);
          done();
        }
      });

      authenticatedWs.send(JSON.stringify(subscribeMessage));
    });

    it('should handle unknown message type', (done) => {
      const invalidMessage = {
        type: 'unknown',
        data: 'test'
      };

      authenticatedWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.error === 'Unknown message type') {
          done();
        }
      });

      authenticatedWs.send(JSON.stringify(invalidMessage));
    });

    it('should handle invalid JSON message', (done) => {
      authenticatedWs.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.error === 'Invalid message format') {
          done();
        }
      });

      authenticatedWs.send('invalid json');
    });
  });

  describe('price broadcasting', () => {
    let authenticatedWs1: WebSocket;
    let authenticatedWs2: WebSocket;
    let connectionsReady = 0;

    beforeEach((done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(mockUser);
      
      const onReady = () => {
        connectionsReady++;
        if (connectionsReady === 2) {
          done();
        }
      };

      authenticatedWs1 = new WebSocket(`${wsUrl}?token=valid-token-1`);
      authenticatedWs2 = new WebSocket(`${wsUrl}?token=valid-token-2`);

      authenticatedWs1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          onReady();
        }
      });

      authenticatedWs2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          onReady();
        }
      });
    });

    afterEach(() => {
      if (authenticatedWs1?.readyState === WebSocket.OPEN) {
        authenticatedWs1.close();
      }
      if (authenticatedWs2?.readyState === WebSocket.OPEN) {
        authenticatedWs2.close();
      }
      connectionsReady = 0;
    });

    it('should broadcast price updates to all authenticated clients', (done) => {
      const mockPriceUpdate: MarketPrice = {
        ticker: 'AAPL',
        price: 176.0,
        timestamp: Date.now(),
        change: 2.5,
        changePercent: 1.43
      };

      let receivedCount = 0;

      const onPriceUpdate = (data: string) => {
        const message = JSON.parse(data);
        if (message.type === 'priceUpdate') {
          expect(message.data).toEqual(mockPriceUpdate);
          receivedCount++;
          if (receivedCount === 2) {
            done();
          }
        }
      };

      authenticatedWs1.on('message', onPriceUpdate);
      authenticatedWs2.on('message', onPriceUpdate);

      // Simulate price update emission
      const listeners = mockMarketDataService.on.mock.calls;
      const priceUpdateListener = listeners.find(call => call[0] === 'priceUpdate');
      expect(priceUpdateListener).toBeDefined();
      
      if (priceUpdateListener) {
        priceUpdateListener[1](mockPriceUpdate);
      }
    });

    it('should only broadcast to subscribed clients', (done) => {
      const subscribeMessage: WebSocketMessage = {
        type: 'subscribe',
        tickers: ['AAPL']
      };

      const mockPriceUpdate: MarketPrice = {
        ticker: 'TSLA',
        price: 182.0,
        timestamp: Date.now(),
        change: 2.0,
        changePercent: 1.11
      };

      let ws1Subscribed = false;
      let ws1ReceivedTslaUpdate = false;
      let ws2ReceivedTslaUpdate = false;

      authenticatedWs1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'subscriptionSuccess') {
          ws1Subscribed = true;
          // Trigger price update after subscription
          const listeners = mockMarketDataService.on.mock.calls;
          const priceUpdateListener = listeners.find(call => call[0] === 'priceUpdate');
          if (priceUpdateListener) {
            priceUpdateListener[1](mockPriceUpdate);
          }
        } else if (message.type === 'priceUpdate' && message.data.ticker === 'TSLA') {
          ws1ReceivedTslaUpdate = true;
        }
      });

      authenticatedWs2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'priceUpdate' && message.data.ticker === 'TSLA') {
          ws2ReceivedTslaUpdate = true;
        }
      });

      // Subscribe ws1 to only AAPL
      authenticatedWs1.send(JSON.stringify(subscribeMessage));

      // Wait and check results
      setTimeout(() => {
        expect(ws1Subscribed).toBe(true);
        expect(ws1ReceivedTslaUpdate).toBe(false); // Should not receive TSLA updates
        expect(ws2ReceivedTslaUpdate).toBe(true);  // Should receive all updates (no subscription filter)
        done();
      }, 100);
    });
  });

  describe('error handling', () => {
    it('should handle server close gracefully', () => {
      expect(() => webSocketService.close()).not.toThrow();
    });

    it('should clean up client connections on disconnect', (done) => {
      mockAuthService.verifyToken = jest.fn().mockResolvedValue(mockUser);
      
      const ws = new WebSocket(`${wsUrl}?token=valid-token`);

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'initialPrices') {
          // Close connection to test cleanup
          ws.close();
        }
      });

      ws.on('close', () => {
        // Connection should be cleaned up
        // This is more of an integration test to ensure no memory leaks
        setTimeout(done, 50);
      });
    });
  });
}); 