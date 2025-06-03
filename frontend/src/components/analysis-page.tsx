"use client"

import { useState } from "react"
import { ArrowUpRight } from "lucide-react"

export function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("Economics")

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analysis</h1>
          <p className="text-[#8A8A8D]">Sunday, September 1</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded bg-[#2C2C2E] text-white text-sm">For you</button>
          <button className="px-3 py-1 rounded bg-[#1C1C1E] text-[#8A8A8D] text-sm">Screener</button>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto hide-scrollbar">
        {["Economics", "Markets", "Stocks", "Crypto", "Commodities"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTab === tab ? "bg-[#2C2C2E] text-white" : "bg-[#1C1C1E] text-[#8A8A8D]"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1C1C1E] rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-[#00FF7F] mr-2">The markets are bullish</span>
              <ArrowUpRight className="h-4 w-4 text-[#00FF7F]" />
            </div>
            <button className="text-xs text-[#8A8A8D]">What&apos;s happening</button>
          </div>

          <h2 className="text-xl font-bold mb-4">
            Michigan Consumers Sentiments Rises For First Time In 5 Months: Index Up To 67.9, Marking A 2.3% Increase.
          </h2>

          <p className="text-[#8A8A8D] text-sm">
            The Michigan Consumer Sentiment Index reported a notable upturn, reaching 67.9 in its August assessment.
            This increase of 1.5 points or 2.3% from July signifies the first rise after five months of stagnant
            readings.
          </p>
        </div>

        <div className="bg-[#1C1C1E] rounded-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium">Yield curve</h3>
            <button className="text-xs text-[#8A8A8D]">Fed funds target range</button>
          </div>

          <div className="h-[200px] relative">
            <div className="absolute top-0 right-0 text-xs text-[#8A8A8D]">2%</div>
            <div className="absolute top-1/4 right-0 text-xs text-[#8A8A8D]">1%</div>
            <div className="absolute top-1/2 right-0 text-xs text-[#8A8A8D]">0%</div>
            <div className="absolute top-3/4 right-0 text-xs text-[#8A8A8D]">-1%</div>
            <div className="absolute bottom-0 right-0 text-xs text-[#8A8A8D]">-2%</div>

            <svg className="w-full h-full">
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" />
              <line x1="0" y1="25%" x2="100%" y2="25%" stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" />
              <line x1="0" y1="75%" x2="100%" y2="75%" stroke="rgba(255,255,255,0.1)" strokeDasharray="4,4" />
              <path d="M 0 100 C 50 80, 100 120, 150 100 S 250 60, 300 80" fill="none" stroke="white" strokeWidth="2" />
            </svg>

            <div className="flex justify-between absolute bottom-0 w-full text-[10px] text-[#8A8A8D]">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i}>5Y</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Economic calendar</h2>
          <button className="px-2 py-1 rounded bg-[#2C2C2E] text-xs">Today</button>
        </div>

        <div className="bg-[#1C1C1E] rounded-md p-8 flex flex-col items-center justify-center">
          <p className="text-lg mb-2">No economic events scheduled</p>
          <p className="text-sm text-[#8A8A8D] mb-8">
            To view events on a different day, simply press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-[#2C2C2E] text-xs">0</kbd> to open the date selector.
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="h-12 w-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">G</div>
            <div className="h-12 w-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">C</div>
            <div className="h-12 w-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">O</div>
            <div className="h-12 w-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">🌎</div>
            <div className="h-12 w-12 rounded-full bg-[#2C2C2E] flex items-center justify-center">G</div>
          </div>

          <button className="px-4 py-2 rounded bg-[#2C2C2E] text-sm">Change the day</button>
        </div>
      </div>
    </div>
  )
}
