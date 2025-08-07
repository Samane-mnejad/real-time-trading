'use client';

import { useState, memo, useCallback } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { TickerList } from '../components/TickerList';
import { PriceChart } from '../components/PriceChart';
import { AuthGuard } from '../components/guard/AuthGuard';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_TICKERS } from '../types/market';
import { TrendingUp } from 'lucide-react';
import Footer from '@/components/shared/Footer/Footer';
import Header from '@/components/shared/Header/Header';

// Memoized loading component
const LoadingDisplay = memo(() => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
    </div>
  </div>
));

LoadingDisplay.displayName = 'LoadingDisplay';

// Memoized empty state component
const EmptyChartDisplay = memo(() => (
  <div className="bg-deepblue-600 rounded-lg shadow-lg p-6 h-full">
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-500">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Select a ticker to view chart</p>
        <p className="text-sm">Real-time price data will appear here</p>
      </div>
    </div>
  </div>
));

EmptyChartDisplay.displayName = 'EmptyChartDisplay';

export default function Home() {
  const [selectedTicker, setSelectedTicker] = useState<string>(SUPPORTED_TICKERS[0]);
  const { isAuthenticated } = useAuth();
  const { 
    marketData, 
    isConnected, 
    isLoadingInitial, 
    error, 
    reconnect,
  } = useMarketData({ isAuthenticated });

  const handleTickerSelect = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
  }, []);

  const selectedMarketData = marketData.get(selectedTicker);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-deepblue-700 relative">
        <Header />
        <main className="mx-auto p-4 lg:h-[calc(100vh-118px)] h-full max-lg:pb-[70px]">
          {isLoadingInitial ? (
            <LoadingDisplay />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full bg-deepblue-500 rounded-lg p-2">
              <div className="lg:col-span-1">
                <TickerList
                  marketData={marketData}
                  selectedTicker={selectedTicker}
                  onTickerSelect={handleTickerSelect}
                />
              </div>

              {/* Price Chart */}
              <div className="lg:col-span-2">
                {selectedMarketData ? (
                  <PriceChart
                    ticker={selectedTicker}
                    currentPrice={selectedMarketData}
                  />
                ) : (
                  <EmptyChartDisplay />
                )}
              </div>
            </div>
          )}
        </main>
         <Footer isConnected={isConnected} error={error || ''} reconnect={reconnect} />
       </div>
     </AuthGuard>
   );
 }
