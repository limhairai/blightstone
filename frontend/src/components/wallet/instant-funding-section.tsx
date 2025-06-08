"use client";

import { useInView } from 'react-intersection-observer';

export function InstantFundingSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.10,
  });

  return (
    <div 
      ref={ref}
      className="max-w-7xl mx-auto px-4 sm:px-6 mt-24 sm:mt-32 lg:mt-40 overflow-hidden"
    >
      <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
        <div className={`lg:order-2 max-w-lg lg:max-w-none transition-all duration-1000 ease-out transform delay-300 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm text-white/80 mb-4 sm:mb-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 sm:mr-3"></span>
            <span>Instant Funding</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
            Top up accounts <span className="text-gradient">instantly</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed">
            Never let your campaigns stop running. Add funds to your ad accounts instantly with our streamlined payment
            system. Multiple payment methods supported.
          </p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Instant fund transfers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Multiple payment methods</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Automated low-balance alerts</span>
            </div>
          </div>
        </div>
        <div className={`lg:order-1 relative max-w-lg mx-auto lg:mr-auto lg:ml-0 transition-all duration-1000 ease-out transform ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/20 shadow-2xl group hover:shadow-[0_0_50px_rgba(180,160,255,0.15)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/8 to-[#ffb4a0]/8 md:from-[#b4a0ff]/10 md:to-[#ffb4a0]/10 group-hover:from-[#b4a0ff]/12 group-hover:to-[#ffb4a0]/12 md:group-hover:from-[#b4a0ff]/15 md:group-hover:to-[#ffb4a0]/15 transition-all duration-300"></div>
            <div className="absolute inset-[1px] rounded-xl sm:rounded-2xl border border-white/5"></div>
            <div className="relative z-10 p-4 sm:p-6 bg-[#1a1a1a]/90 backdrop-blur-sm">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Add Funds</h3>
                  <span className="text-xs sm:text-sm text-white/60 bg-white/5 px-2 sm:px-3 py-1 rounded-full border border-white/10">
                    Quick top-up
                  </span>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <span className="text-xs sm:text-sm text-white/70 mb-2 block">Select Account</span>
                    <div className="bg-[#2a2a2a]/80 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-white/10 hover:border-white/20 transition-colors">
                      <span className="text-white text-sm sm:text-base">AdHub-Account-01</span>
                      <span className="text-white/60 text-xs sm:text-sm ml-2">($2,450 remaining)</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-white/70 mb-2 block">Amount</span>
                    <div className="bg-[#2a2a2a]/80 backdrop-blur-sm rounded-lg p-2.5 sm:p-3 border border-white/10 hover:border-white/20 transition-colors">
                      <span className="text-white text-lg sm:text-xl">$5,000</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm">$1,000</button>
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm">$5,000</button>
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm">$10,000</button>
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium py-2.5 sm:py-3 rounded-lg hover:opacity-90 hover:shadow-[0_0_30px_rgba(180,160,255,0.3)] transition-all duration-300 hover:scale-[1.02] text-sm sm:text-base">
                    Add Funds Instantly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 