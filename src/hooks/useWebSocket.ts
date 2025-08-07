'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MarketPrice, WebSocketMessage } from '../types/market';

interface UseWebSocketProps {
  url: string;
  isAuthenticated: boolean;
}

export const useWebSocket = ({ url, isAuthenticated }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [marketData, setMarketData] = useState<Map<string, MarketPrice>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!isAuthenticated) {
      console.log('WebSocket connection skipped - user not authenticated');
      return;
    }

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Get auth token and include it in the WebSocket URL
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('WebSocket connection skipped - no auth token found');
        setError('Authentication token not found');
        return;
      }

      const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'initialPrices':
              if (Array.isArray(message.data)) {
                const newMarketData = new Map<string, MarketPrice>();
                message.data.forEach((price: MarketPrice) => {
                  newMarketData.set(price.ticker, price);
                });
                setMarketData(newMarketData);
              }
              break;
              
            case 'priceUpdate':
              if (message.data && !Array.isArray(message.data)) {
                const priceData = message.data as MarketPrice;
                setMarketData(prev => {
                  const newMap = new Map(prev);
                  newMap.set(priceData.ticker, priceData);
                  return newMap;
                });
              }
              break;
              
            default:
              console.log('Received message:', message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Handle authentication errors
        if (event.code === 1008) {
          console.log('WebSocket closed due to authentication error');
          setError('Authentication failed - please log in again');
          return;
        }
        
        // Only attempt to reconnect if user is still authenticated
        if (isAuthenticated && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (!isAuthenticated) {
          console.log('Reconnection skipped - user not authenticated');
        } else {
          setError('Failed to connect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [url, isAuthenticated]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  const subscribe = useCallback((tickers: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'subscribe',
        tickers
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const unsubscribe = useCallback((tickers: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'unsubscribe',
        tickers
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Effect to handle connection based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      // Clear data and disconnect when user logs out
      disconnect();
      setMarketData(new Map());
      setError(null);
    }
    
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected,
    marketData,
    error,
    subscribe,
    unsubscribe,
    reconnect: connect
  };
}; 