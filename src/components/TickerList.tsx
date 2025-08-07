'use client';

import { MarketPrice } from '../types/market';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { memo, useState, useEffect } from 'react';

interface TickerListProps {
  marketData: Map<string, MarketPrice>;
  selectedTicker: string | null;
  onTickerSelect: (ticker: string) => void;
}

// Individual ticker item component optimized with React.memo
const TickerItem = memo(({ 
  ticker, 
  data, 
  isSelected, 
  onSelect 
}: {
  ticker: string;
  data: MarketPrice;
  isSelected: boolean;
  onSelect: (ticker: string) => void;
}) => {
  const [priceChangeAnimation, setPriceChangeAnimation] = useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = useState(data.price);

  // Animate price changes
  useEffect(() => {
    if (lastPrice !== data.price) {
      setPriceChangeAnimation(data.price > lastPrice ? 'up' : 'down');
      setLastPrice(data.price);
      
      // Reset animation after 1 second
      const timer = setTimeout(() => {
        setPriceChangeAnimation(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [data.price, lastPrice]);

  const formatPrice = (price: number, ticker: string) => {
    if (ticker === 'BTC-USD') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const getTrendIcon = (changePercent: number) => {
    if (changePercent > 0) return TrendingUp;
    if (changePercent < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (changePercent: number) => {
    if (changePercent > 0) return 'text-green-500';
    if (changePercent < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getTickerName = (ticker: string) => {
    switch (ticker) {
      case 'AAPL': return 'Apple Inc.';
      case 'TSLA': return 'Tesla Inc.';
      case 'BTC-USD': return 'Bitcoin';
      default: return ticker;
    }
  };

  const TrendIcon = getTrendIcon(data.changePercent);

  return (
    <div
      className={clsx(
        'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md',
        'hover:scale-[1.02] transform-gpu', // Enhanced hover effect with hardware acceleration
        isSelected 
          ? 'border-blue-500 bg-blue-50 text-deepblue shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={() => onSelect(ticker)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-white">{ticker}</span>
            <TrendIcon 
              className={clsx(
                'w-4 h-4 transition-all duration-300',
                getTrendColor(data.changePercent),
                // Add pulsing animation for active trends
                data.changePercent !== 0 && 'animate-pulse'
              )}
            />
          </div>
          <span className="text-sm text-gray-white">{getTickerName(ticker)}</span>
        </div>
        
        <div className="text-right">
          <div 
            className={clsx(
              'font-bold text-lg text-gray-white transition-all duration-300',
              // Price change animation
              priceChangeAnimation === 'up' && 'text-green-400 scale-110',
              priceChangeAnimation === 'down' && 'text-red-400 scale-110'
            )}
          >
            {formatPrice(data.price, ticker)}
          </div>
          <div className={clsx('text-sm transition-colors duration-300', getTrendColor(data.changePercent))}>
            {formatChange(data.change, data.changePercent)}
          </div>
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-gray-white">
          Last updated: {new Date(data.timestamp).toLocaleTimeString()}
        </div>
        {/* Real-time indicator */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-white">LIVE</span>
        </div>
      </div>
    </div>
  );
});

TickerItem.displayName = 'TickerItem';

export const TickerList = memo(({ marketData, selectedTicker, onTickerSelect }: TickerListProps) => {
  return (
    <div className="shadow-box bg-deepblue-600 rounded-lg p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Market Overview</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white">Real-time</span>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from(marketData.entries()).map(([ticker, data]) => (
          <TickerItem
            key={ticker}
            ticker={ticker}
            data={data}
            isSelected={selectedTicker === ticker}
            onSelect={onTickerSelect}
          />
        ))}
      </div>
    </div>
  );
});

TickerList.displayName = 'TickerList'; 