import { Building2, Zap, CheckCircle } from "lucide-react"

export function ProfessionalFeaturesSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects like hero section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-[#b4a0ff]/6 to-[#ffb4a0]/6 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/6 to-[#b4a0ff]/6 blur-3xl animate-pulse delay-1500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Agency accounts <span className="text-gradient">made simple</span>
          </h2>
          <p className="text-white/70 text-xl leading-relaxed max-w-4xl mx-auto">
            Self-service account applications, real-time management dashboard, and simplified multi-entity management
            for scale.
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1: Self-Service Applications */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-2xl p-6 border border-white/5 h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/60 text-sm">Application Status</span>
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center justify-between"><span className="text-white/80 text-sm">Meta Ad Account #1</span><span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full border border-green-400/30">Approved</span></div></div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center justify-between"><span className="text-white/80 text-sm">Meta Ad Account #2</span><span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full border border-yellow-400/30">Processing</span></div></div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center justify-between"><span className="text-white/80 text-sm">Meta Ad Account #3</span><span className="text-blue-400 text-xs bg-blue-400/20 px-2 py-1 rounded-full border border-blue-400/30">Submitted</span></div></div>
                </div>
                <button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium py-2 rounded-lg text-sm mt-4 hover:shadow-[0_0_20px_rgba(180,160,255,0.3)] transition-all duration-300 hover:scale-[1.02]">
                  Apply for More
                </button>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-3">Self-Service Applications<sup className="text-xs">1</sup></h3>
              <p className="text-white/70 text-sm leading-relaxed">Submit ad account applications directly through our platform without contacting support. Track status in real-time and get instant notifications.</p>
            </div>
          </div>

          {/* Card 2: Real-time Dashboard */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-2xl p-6 border border-white/5 relative h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="absolute top-4 right-4"><div className="flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30 backdrop-blur-sm"><Zap className="w-3 h-3 text-blue-400" /><span className="text-blue-400 text-xs">Live Dashboard</span></div></div>
                <div className="flex-1 flex flex-col justify-between mt-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="text-white/60 text-xs mb-1">Total Spend</div><div className="text-white font-semibold">$24,750</div></div>
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="text-white/60 text-xs mb-1">Active Accounts</div><div className="text-white font-semibold">12</div></div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center justify-between mb-2"><span className="text-white/80 text-sm">Campaign Performance</span><span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full">+12.5%</span></div><div className="h-2 bg-[#3a3a3a] rounded-full overflow-hidden"><div className="h-full w-3/4 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full shadow-[0_0_10px_rgba(180,160,255,0.5)]"></div></div></div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center justify-between"><span className="text-white/80 text-sm">Account Health</span><div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /><span className="text-green-400 text-xs">All Good</span></div></div></div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-3">Real-time Dashboard. <span className="text-white/70 font-normal">Monitor everything from one place.</span></h3>
              <p className="text-white/70 text-sm leading-relaxed">Track spending, performance, and account health across all your ad accounts. Get instant insights and manage budgets efficiently.</p>
            </div>
          </div>

          {/* Card 3: Multi-Entity Management */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-2xl p-6 border border-white/5 h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4"><span className="text-white/60 text-sm">Choose Your Entity</span><div className="w-6 h-6 rounded bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] flex items-center justify-center shadow-[0_0_15px_rgba(180,160,255,0.3)]"><Building2 className="w-3 h-3 text-black" /></div></div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/10 hover:border-white/20 transition-colors"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center border border-blue-500/30"><span className="text-blue-400 text-xs font-bold">G</span></div><span className="text-white/80 text-sm">GrowthCo Marketing</span></div></div>
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/30"><span className="text-purple-400 text-xs font-bold">V</span></div><span className="text-white/80 text-sm">Velocity Ads LLC</span></div></div>
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"><div className="flex items-center gap-3"><div className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center border border-green-500/30"><span className="text-green-400 text-xs font-bold">S</span></div><span className="text-white/80 text-sm">Scale Media Inc.</span></div></div>
                  </div>
                  <div className="bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                    <div className="text-xs text-white/60 mb-1">Welcome to AdHub, Sarah!</div>
                    <div className="text-sm text-white/80">Manage seamlessly across entities.</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-white mb-3">Multi Entity. <span className="text-white/70 font-normal">Switch between business entities effortlessly.</span></h3>
              <p className="text-white/70 text-sm leading-relaxed">Manage ad accounts across multiple business entities from one dashboard. Perfect for agencies and businesses with multiple brands.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 