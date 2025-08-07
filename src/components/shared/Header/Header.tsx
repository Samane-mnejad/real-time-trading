import React from 'react'
import { BarChart3 } from 'lucide-react'
import { UserMenu } from './UserMenu'

export default function Header() {
  return (
     <header className="shadow-sm border-b border-white/15">
          <div className="mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-xl font-bold text-white">Real-Time Trading Dashboard</h1>
                  <p className="text-sm text-white">Live market data and analytics</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <UserMenu />
              </div>
            </div>
          </div>
     </header>
  )
}
