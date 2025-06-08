"use client";

import { AccountManagementPreview } from "@/components/accounts/account-management-preview"
import { useInView } from 'react-intersection-observer';

export function AccountManagementSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  return (
    <div 
      ref={ref}
      className="max-w-7xl mx-auto px-4 sm:px-6 mb-32 sm:mb-40 lg:mb-48 xl:mb-64 overflow-hidden"
    >
      <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center">
        <div className={`max-w-lg lg:max-w-none transition-all duration-1000 ease-out transform ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm text-white/80 mb-4 sm:mb-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 sm:mr-3"></span>
            <span>Account Management</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight">
            Manage all your ad accounts <span className="text-gradient">in one place</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed">
            Monitor performance, track spending, and manage multiple Meta ad accounts from a unified dashboard. Get
            real-time insights into your campaigns and account health.
          </p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Real-time account status monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Centralized spending overview</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
              <span className="text-white/80 text-sm sm:text-base">Performance analytics at a glance</span>
            </div>
          </div>
        </div>
        <div className={`relative max-w-lg mx-auto lg:ml-auto lg:mr-0 transition-all duration-1000 ease-out transform delay-300 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <AccountManagementPreview />
        </div>
      </div>
    </div>
  )
} 