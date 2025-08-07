'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MarketPrice } from '../types/market';
import { useWebSocket } from './useWebSocket';
import { apiRequestJson, ApiError } from '../utils/api';
import { config } from '../utils/config';

interface UseMarketDataProps {
  isAuthenticated: boolean;
}

interface ConnectionStats {
  connected: boolean;
  lastUpdateTime: number;
  updateCount: number;
  reconnectCount: number;
}

export const useMarketData = ({ isAuthenticated }: UseMarketDataProps) => {
  const [marketData, setMarketData] = useState<Map<string, MarketPrice>>(new Map());
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats>({
    connected: false,
    lastUpdateTime: 0,
    updateCount: 0,
    reconnectCount: 0
  });

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    marketData: wsMarketData, 
    error: wsError, 
    subscribe, 
    unsubscribe, 
    reconnect 
  } = useWebSocket({ 
    url: config.getWsUrl(), 
    isAuthenticated 
  });

  // Optimized function to fetch initial market data from API
  const fetchInitialData = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoadingInitial(true);
    setError(null);

    try {
      const data = await apiRequestJson<{ prices: MarketPrice[] }>(config.getApiEndpoint('/api/prices'));
      
      if (data.prices && Array.isArray(data.prices)) {
        const newMarketData = new Map<string, MarketPrice>();
        data.prices.forEach((price: MarketPrice) => {
          newMarketData.set(price.ticker, price);
        });
        setMarketData(newMarketData);
      }
    } catch (err) {
      console.error('Error fetching initial market data:', err);
      if (err instanceof ApiError && err.status === 401) {
        setError('Authentication required - please log in again');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      }
    } finally {
      setIsLoadingInitial(false);
    }
  }, [isAuthenticated]);

  // Effect to handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch initial data when user logs in
      fetchInitialData();
    } else {
      // Clear data when user logs out
      setMarketData(new Map());
      setError(null);
      setIsLoadingInitial(false);
      setConnectionStats({
        connected: false,
        lastUpdateTime: 0,
        updateCount: 0,
        reconnectCount: 0
      });
    }
  }, [isAuthenticated, fetchInitialData]);

  // Optimized effect to update market data from WebSocket with batching
  useEffect(() => {
    if (wsMarketData.size > 0) {
      // Batch updates to prevent excessive re-renders
      const batchUpdate = () => {
        setMarketData(new Map(wsMarketData));
        setConnectionStats(prev => ({
          ...prev,
          connected: wsConnected
        }));
      };

      // Use requestAnimationFrame for optimal batching
      const rafId = requestAnimationFrame(batchUpdate);
      
      return () => {
        cancelAnimationFrame(rafId);
      };
    }
  }, [wsMarketData, wsConnected]);

  // Effect to handle WebSocket connection state
  useEffect(() => {
    setConnectionStats(prev => ({
      ...prev,
      connected: wsConnected
    }));
  }, [wsConnected]);

  // Effect to handle WebSocket errors
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  // Function to refresh data (can be called manually)
  const refreshData = useCallback(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    marketData,
    isConnected: wsConnected,
    isLoadingInitial,
    error,
    subscribe,
    unsubscribe,
    reconnect,
    refreshData,
    connectionStats
  }), [
    marketData,
    wsConnected,
    isLoadingInitial,
    error,
    subscribe,
    unsubscribe,
    reconnect,
    refreshData,
    connectionStats
  ]);

  return returnValue;
}; 