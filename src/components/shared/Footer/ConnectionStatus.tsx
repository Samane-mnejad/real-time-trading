'use client';

import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { memo } from 'react';

interface PerformanceMetrics {
  updateCount: number;
  lastUpdateTime: number;
  reconnectCount: number;
  dataPoints: number;
  isHealthy: boolean;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  onReconnect: () => void;
  performance?: PerformanceMetrics;
}

export const ConnectionStatus = memo(({ isConnected, error, onReconnect }: ConnectionStatusProps) => {
  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <Wifi className="w-4 h-4" />
          <span className="text-sm font-medium">Live Connection</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Connection Error</span>
          <button
            onClick={onReconnect}
            className="ml-2 p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Retry connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
      <WifiOff className="w-4 h-4" />
      <span className="text-sm font-medium">Connecting...</span>
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce"></div>
        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus'; 