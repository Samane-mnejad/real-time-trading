import React from 'react'
import { ConnectionStatus } from './ConnectionStatus'

interface PerformanceMetrics {
  updateCount: number;
  lastUpdateTime: number;
  reconnectCount: number;
  dataPoints: number;
  isHealthy: boolean;
}

interface FooterProps {
  isConnected: boolean;
  error: string;
  reconnect: () => void;
  performance?: PerformanceMetrics;
}

export default function Footer({ isConnected, error, reconnect, performance }: FooterProps) {
  return (
    <div className="flex items-center justify-between gap-4 bg-deepblue-600 absolute bottom-0 w-full p-2 border-t border-deepblue-500">
      <ConnectionStatus 
        isConnected={isConnected}
        error={error}
        onReconnect={reconnect}
        performance={performance}
      />
      
      <div className="text-xs text-gray-400 hidden md:block lg:block hidden">
        Real-time Trading Dashboard v1.0 • Optimized for Performance
      </div>
    </div>
  )
}
