import { AccountManagementPreview } from "@/components/accounts/account-management-preview"

export function AccountManagementSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 mb-40 lg:mb-48">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="max-w-lg">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/80 mb-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-3"></span>
            <span>Account Management</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Manage all your ad accounts <span className="text-gradient">in one place</span>
          </h2>
          <p className="text-xl text-white/70 mb-8 leading-relaxed">
            Monitor performance, track spending, and manage multiple Meta ad accounts from a unified dashboard. Get
            real-time insights into your campaigns and account health.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Real-time account status monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Centralized spending overview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-white/80">Performance analytics at a glance</span>
            </div>
          </div>
        </div>
        <div className="relative max-w-lg ml-auto">
          <AccountManagementPreview />
        </div>
      </div>
    </div>
  )
} 