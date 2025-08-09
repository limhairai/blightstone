import { Building2, Zap, CheckCircle } from "lucide-react"
import { useInView } from 'react-intersection-observer';

export function ProfessionalFeaturesSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section
      ref={ref}
      className={`relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden transition-all duration-1000 ease-out transform ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {/* Background effects - Mobile optimized */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-56 h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-[#b4a0ff]/4 to-[#ffb4a0]/4 md:from-[#b4a0ff]/6 md:to-[#ffb4a0]/6 blur-2xl md:blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/4 to-[#b4a0ff]/4 md:from-[#ffb4a0]/6 md:to-[#b4a0ff]/6 blur-2xl md:blur-3xl animate-pulse delay-1500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
            Agency accounts <span className="text-gradient">made simple</span>
          </h2>
          <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-4xl mx-auto">
            Self-service account applications, real-time management dashboard, and simplified multi-entity management
            for scale.
          </p>
        </div>

        {/* Three Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Self-Service Applications */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 h-64 sm:h-72 md:h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-white/60 text-xs sm:text-sm">Application Status</span>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50 animate-pulse"></div>
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Meta Ad Account #1</span>
                      <span className="text-green-400 text-xs bg-green-400/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-green-400/30">Approved</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Meta Ad Account #2</span>
                      <span className="text-yellow-400 text-xs bg-yellow-400/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-yellow-400/30">Processing</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Meta Ad Account #3</span>
                      <span className="text-blue-400 text-xs bg-blue-400/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-blue-400/30">Submitted</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Self-Service Applications<sup className="text-xs">1</sup></h3>
              <p className="text-white/70 text-sm leading-relaxed">Submit ad account applications directly through our platform without contacting support. Track status in real-time and get instant notifications.</p>
            </div>
          </div>

          {/* Card 2: Real-time Dashboard */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 relative h-64 sm:h-72 md:h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-white/60 text-xs sm:text-sm">Real-time Dashboard</span>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-blue-500/20 px-2 sm:px-3 py-1 rounded-full border border-blue-500/30 backdrop-blur-sm">
                    <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />
                    <span className="text-blue-400 text-xs">Live Dashboard</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2 sm:gap-3">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-white/60 text-xs mb-1">Total Spend</div>
                      <div className="text-white font-semibold text-sm sm:text-base">$24,750</div>
                    </div>
                    <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="text-white/60 text-xs mb-1">Active Accounts</div>
                      <div className="text-white font-semibold text-sm sm:text-base">12</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="text-white/60 text-xs mb-1">Account Balance</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 sm:h-2 flex-1 bg-primary rounded-full shadow-[0_0_10px_rgba(180,160,255,0.3)]"></div>
                      <div className="text-white font-semibold text-xs sm:text-sm">$15,000</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs sm:text-sm">Account Health</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                        <span className="text-green-400 text-xs">All Good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Real-time Dashboard. <span className="text-white/70 font-normal">Monitor everything from one place.</span></h3>
              <p className="text-white/70 text-sm leading-relaxed">Track spending, performance, and account health across all your ad accounts. Get instant insights and manage budgets efficiently.</p>
            </div>
          </div>

          {/* Card 3: Multi-Entity Management */}
          <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#2a2a2a]/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl flex flex-col group hover:shadow-[0_0_50px_rgba(180,160,255,0.1)] hover:border-white/20 transition-all duration-500">
            <div className="bg-[#0a0a0a]/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/5 h-64 sm:h-72 md:h-80 flex flex-col group-hover:border-white/10 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#b4a0ff]/5 to-[#ffb4a0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-white/60 text-xs sm:text-sm">Choose Your Entity</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(180,160,255,0.3)]">
                    <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                  </div>
                </div>
                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <span className="text-blue-400 text-xs font-bold">G</span>
                      </div>
                      <span className="text-white/80 text-xs sm:text-sm">GrowthCo Marketing</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <span className="text-purple-400 text-xs font-bold">V</span>
                      </div>
                      <span className="text-white/80 text-xs sm:text-sm">Velocity Ads LLC</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-[#2a2a2a] to-[#3a3a3a] rounded-lg p-2.5 sm:p-3 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-green-500/20 flex items-center justify-center border border-green-500/30">
                        <span className="text-green-400 text-xs font-bold">S</span>
                      </div>
                      <span className="text-white/80 text-xs sm:text-sm">Scale Media Inc.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Multi Entity. <span className="text-white/70 font-normal">Switch between business entities effortlessly.</span></h3>
              <p className="text-white/70 text-sm leading-relaxed">Manage ad accounts across multiple business entities from one dashboard. Perfect for agencies and businesses with multiple brands.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 