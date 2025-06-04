export function InstantFundingSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 mt-40">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="lg:order-2 max-w-lg">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/80 mb-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-3"></span>
            <span>Instant Funding</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Top up accounts <span className="text-gradient">instantly</span>
          </h2>
          <p className="text-xl text-white/70 mb-8 leading-relaxed">
            Never let your campaigns stop running. Add funds to your ad accounts instantly with our streamlined payment
            system. Multiple payment methods supported.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Instant fund transfers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Multiple payment methods</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Automated low-balance alerts</span>
            </div>
          </div>
        </div>
        <div className="lg:order-1 relative max-w-lg">
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl group hover:shadow-[0_0_50px_rgba(180,160,255,0.15)] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 group-hover:from-[#b4a0ff]/15 group-hover:to-[#ffb4a0]/15 transition-all duration-300"></div>
            <div className="absolute inset-[1px] rounded-2xl border border-white/5"></div>
            <div className="relative z-10 p-6 bg-[#1a1a1a]/90 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Add Funds</h3>
                  <span className="text-sm text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    Quick top-up
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-white/70 mb-2 block">Select Account</span>
                    <div className="bg-[#2a2a2a]/80 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"><span className="text-white">AdHub-Account-01</span><span className="text-white/60 text-sm ml-2">($2,450 remaining)</span></div>
                  </div>
                  <div>
                    <span className="text-sm text-white/70 mb-2 block">Amount</span>
                    <div className="bg-[#2a2a2a]/80 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"><span className="text-white text-xl">$5,000</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-sm transition-all duration-200 backdrop-blur-sm">$1,000</button>
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-sm transition-all duration-200 backdrop-blur-sm">$5,000</button>
                    <button className="bg-[#2a2a2a]/80 hover:bg-[#3a3a3a]/80 border border-white/5 hover:border-white/10 rounded-lg p-2 text-white/80 text-sm transition-all duration-200 backdrop-blur-sm">$10,000</button>
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium py-3 rounded-lg hover:opacity-90 hover:shadow-[0_0_30px_rgba(180,160,255,0.3)] transition-all duration-300 hover:scale-[1.02]">Add Funds Instantly</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 