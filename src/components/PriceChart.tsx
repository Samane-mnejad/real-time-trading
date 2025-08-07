'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MarketPrice, ChartDataPoint, HistoricalPrice } from '../types/market';
import { apiRequestJson, ApiError } from '../utils/api';
import { config } from '../utils/config';
import { TrendingUp, TrendingDown, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface PriceChartProps {
  ticker: string;
  currentPrice: MarketPrice;
}

// Custom tooltip component for better performance
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = memo(({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const price = data.value;
    const formatPrice = (price: number) => {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
    };

    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
        <p className="text-gray-200 text-sm font-medium">{label}</p>
        <p className="text-white text-lg font-bold">{formatPrice(price)}</p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Main component with memo optimization
export const PriceChart = memo(({ ticker, currentPrice }: PriceChartProps) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLimit, setDataLimit] = useState(100); // Configurable data limit
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState(currentPrice.price);

  useEffect(() => {
    if (lastPrice !== currentPrice.price) {
      setPriceAnimation(currentPrice.price > lastPrice ? 'up' : 'down');
      setLastPrice(currentPrice.price);
      
      const timer = setTimeout(() => {
        setPriceAnimation(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPrice.price, lastPrice]);

  const processChartData = useCallback((historical: HistoricalPrice[], current: MarketPrice, limit: number) => {
    const historicalPoints = historical.map(item => ({
      timestamp: item.timestamp,
      price: item.price,
      time: new Date(item.timestamp).toLocaleDateString() + ' ' + new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    const currentPoint: ChartDataPoint = {
      timestamp: current.timestamp,
      price: current.price,
      time: new Date(current.timestamp).toLocaleDateString() + ' ' + new Date(current.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Combine and deduplicate data
    const combined = [...historicalPoints, currentPoint].reduce((acc, item) => {
      const existing = acc.find(p => Math.abs(p.timestamp - item.timestamp) < 30000); // Within 30 seconds
      if (!existing) {
        acc.push(item);
      } else if (item.timestamp > existing.timestamp) {
        Object.assign(existing, item);
      }
      return acc;
    }, [] as ChartDataPoint[]);

    // Sort by timestamp and apply data limit with virtualization concept
    const sorted = combined
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit); // Keep last N points for performance

    return sorted;
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const result = await apiRequestJson<{ historicalData: HistoricalPrice[] }>(
          config.getApiEndpoint(`/api/historical/${ticker}`)
        );
        setHistoricalData(result.historicalData);
        setError(null);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        if (err instanceof ApiError && err.status === 401) {
          setError('Authentication required - please log in again');
        } else {
          setError('Failed to load historical data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [ticker]);

  const processedChartData = useMemo(() => {
    return processChartData(historicalData, currentPrice, dataLimit);
  }, [historicalData, currentPrice, dataLimit, processChartData]);

  useEffect(() => {
    setChartData(processedChartData);
  }, [processedChartData]);

  const formatPrice = useCallback((price: number) => {
    if (ticker === 'BTC-USD') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Dynamic precision based on price range
    const prices = chartData.map(d => d.price);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const range = maxPrice - minPrice;
      const avgPrice = (minPrice + maxPrice) / 2;
      
      if (range < avgPrice * 0.01) {
        return `$${price.toFixed(3)}`;
      }
    }
    
    return `$${price.toFixed(2)}`;
  }, [ticker, chartData]);

  const formatChange = useCallback((change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  }, []);

  const getTrendColor = useCallback((changePercent: number) => {
    if (changePercent > 0) return 'text-green-500';
    if (changePercent < 0) return 'text-red-500';
    return 'text-gray-500';
  }, []);

  const getLineColor = useCallback((changePercent: number) => {
    if (changePercent > 0) return '#10b981'; // green-500
    if (changePercent < 0) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  }, []);

  const getTickerName = useCallback((ticker: string) => {
    switch (ticker) {
      case 'AAPL': return 'Apple Inc.';
      case 'TSLA': return 'Tesla Inc.';
      case 'BTC-USD': return 'Bitcoin';
      default: return ticker;
    }
  }, []);

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['dataMin', 'dataMax'];
    
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    const avgPrice = (minPrice + maxPrice) / 2;
    const minRangePercent = 0.02; // Minimum 2% range
    
    if (priceRange < avgPrice * minRangePercent) {
      const artificialRange = avgPrice * minRangePercent;
      const padding = artificialRange * 0.1;
      return [
        avgPrice - artificialRange / 2 - padding,
        avgPrice + artificialRange / 2 + padding
      ];
    }
    
    const padding = priceRange * 0.1;
    return [
      Math.max(0, minPrice - padding),
      maxPrice + padding
    ];
  }, [chartData]);

  const handleDataLimitChange = useCallback((newLimit: number) => {
    setDataLimit(newLimit);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-2 text-gray-500">
            <Activity className="w-5 h-5 animate-pulse" />
            <span>Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-500 text-center">
            <p className="font-semibold">Error loading chart</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(
      'shadow-box bg-deepblue-600 rounded-lg p-6 transition-all duration-300',
      isFullscreen && 'fixed inset-4 z-50 max-w-none max-h-none border border-white/15'
    )}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-white">{ticker}</h2>
            <p className="text-gray-white">{getTickerName(ticker)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div 
              className={clsx(
                'text-2xl font-bold text-gray-white transition-all duration-300',
                priceAnimation === 'up' && 'text-green-400 scale-110',
                priceAnimation === 'down' && 'text-red-400 scale-110'
              )}
            >
              {formatPrice(currentPrice.price)}
            </div>
            <div className={clsx('text-sm flex items-center gap-1', getTrendColor(currentPrice.changePercent))}>
              {currentPrice.changePercent >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {formatChange(currentPrice.change, currentPrice.changePercent)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Data Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-white">Data points:</span>
            <select
              value={dataLimit}
              onChange={(e) => handleDataLimitChange(Number(e.target.value))}
              className="bg-deepblue-500 text-white rounded px-2 py-1 text-sm border border-gray-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-white hover:text-white transition-colors rounded"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className={clsx('transition-all duration-300', isFullscreen ? 'h-[calc(100vh-300px)]' : 'h-98')}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                return value.split(' ')[1] || value;
              }}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => {
                const prices = chartData.map(d => d.price);
                if (prices.length > 0) {
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);
                  const range = maxPrice - minPrice;
                  const avgPrice = (minPrice + maxPrice) / 2;
                  
                  if (range < avgPrice * 0.01) {
                    return `$${value.toFixed(3)}`;
                  }
                }
                return `$${value.toFixed(2)}`;
              }}
              domain={yAxisDomain}
              type="number"
            />
            
            <ReferenceLine 
              y={currentPrice.price} 
              stroke={getLineColor(currentPrice.changePercent)} 
              strokeDasharray="5 5" 
              strokeOpacity={0.7}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={getLineColor(currentPrice.changePercent)}
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: getLineColor(currentPrice.changePercent),
                strokeWidth: 2,
                stroke: '#ffffff'
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-white text-center">
        Real-time price updates • Last updated: {new Date(currentPrice.timestamp).toLocaleTimeString()}
        {dataLimit > 100 && (
          <span className="ml-2 text-yellow-400">• High-density mode</span>
        )}
      </div>
    </div>
  );
});

PriceChart.displayName = 'PriceChart'; 