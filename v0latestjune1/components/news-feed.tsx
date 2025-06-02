"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownRight, Filter } from "lucide-react"

interface NewsItem {
  id: string
  company: string
  symbol: string
  time: string
  content: string
  price: string
  change: string
  isPositive: boolean
}

interface NewsFeedProps {
  title: string
  subtitle?: string
  items: NewsItem[]
}

export function NewsFeed({ title, subtitle, items }: NewsFeedProps) {
  const [filter, setFilter] = useState("all")

  return (
    <div className="bg-[#1C1C1E] rounded-md overflow-hidden">
      <div className="flex flex-row items-center justify-between p-4 border-b border-[#2C2C2E]">
        <div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
          {subtitle && <p className="text-sm text-[#8A8A8D]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-sm px-3 py-1 text-[#8A8A8D] hover:text-white">Watchlist</button>
          <button className="text-sm px-3 py-1 text-white">Popular</button>
          <button className="h-8 w-8 flex items-center justify-center text-[#8A8A8D]">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="divide-y divide-[#2C2C2E]">
        {items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-[#2C2C2E] transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[#2C2C2E] text-xs font-medium">
                  {item.symbol.charAt(0)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{item.symbol}</span>
                    <span className="text-xs text-[#8A8A8D]">{item.time}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-mono text-sm text-white">${item.price}</span>
                    <span
                      className={`ml-2 flex items-center text-xs ${
                        item.isPositive ? "text-[#00FF7F]" : "text-[#FF453A]"
                      }`}
                    >
                      {item.isPositive ? (
                        <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-0.5" />
                      )}
                      {item.change}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-white/80">{item.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
