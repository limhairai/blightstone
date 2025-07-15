"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import { ProfessionalFeaturesSection } from "./professional-features-section"
import { FAQSection } from "./faq-section"
import { AccountManagementSection } from "../accounts/account-management-section"

import { AdHubLogo } from "../core/AdHubLogo"
import { useInView } from 'react-intersection-observer'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function LandingView() {
  const { user, loading } = useAuth()
  const { ref: ctaRef, inView: ctaInView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  })

  const [heroHasLoaded, setHeroHasLoaded] = useState(false)
  const [backgroundEffectsVisible, setBackgroundEffectsVisible] = useState(false)
  const [heroInternalEffectsVisible, setHeroInternalEffectsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setHeroHasLoaded(true)
    const globalEffectsTimer = setTimeout(() => {
      setBackgroundEffectsVisible(true)
    }, 200)
    const heroInternalEffectsTimer = setTimeout(() => {
      setHeroInternalEffectsVisible(true)
    }, 100)

    return () => {
      clearTimeout(globalEffectsTimer)
      clearTimeout(heroInternalEffectsTimer)
    }
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A] text-white relative">
      {/* Global background effects - Optimized for mobile */}
      <div className={`fixed inset-0 z-0 pointer-events-none`}>
        {backgroundEffectsVisible && (
          <>
            {/* Reduced blur effects on mobile for better performance */}
            <div className="absolute top-0 left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/6 to-[#ffb4a0]/6 md:from-[#b4a0ff]/8 md:to-[#ffb4a0]/8 blur-2xl md:blur-3xl animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-56 h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/4 to-[#b4a0ff]/4 md:from-[#ffb4a0]/6 md:to-[#b4a0ff]/6 blur-2xl md:blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/5 to-[#ffb4a0]/5 md:from-[#d4b4ff]/7 md:to-[#ffb4a0]/7 blur-2xl md:blur-3xl animate-pulse delay-2000"></div>
            <div className="absolute bottom-0 right-1/3 w-52 h-52 md:w-72 md:h-72 rounded-full bg-gradient-to-l from-[#b4a0ff]/3 to-[#ffb4a0]/3 md:from-[#b4a0ff]/5 md:to-[#ffb4a0]/5 blur-2xl md:blur-3xl animate-pulse delay-500"></div>
            <div className="absolute top-1/2 left-1/6 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-r from-[#ffb4a0]/3 to-[#b4a0ff]/3 md:from-[#ffb4a0]/4 md:to-[#b4a0ff]/4 blur-xl md:blur-3xl animate-pulse delay-1500"></div>
            <div className="absolute bottom-1/6 right-1/6 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-l from-[#d4b4ff]/4 to-[#ffb4a0]/4 md:from-[#d4b4ff]/6 md:to-[#ffb4a0]/6 blur-xl md:blur-3xl animate-pulse delay-2500"></div>
          </>
        )}
      </div>
      
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center">
            <AdHubLogo size="lg" />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:absolute md:left-1/2 md:transform md:-translate-x-1/2 items-center gap-x-6 lg:gap-x-8">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="#features" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="w-24 h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black hover:scale-105 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] transition-all duration-200">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground/80 hover:text-foreground hover:bg-secondary">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black hover:scale-105 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] transition-all duration-200">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-sm">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <AdHubLogo size="lg" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="flex-1 px-4 py-8 space-y-6">
                <Link 
                  href="/" 
                  className="block text-lg font-medium text-white hover:text-[#b4a0ff] transition-colors py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="#features" 
                  className="block text-lg font-medium text-white hover:text-[#b4a0ff] transition-colors py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#about" 
                  className="block text-lg font-medium text-white hover:text-[#b4a0ff] transition-colors py-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
              </nav>
              
              {/* Mobile Auth Buttons */}
              <div className="p-4 space-y-4 border-t border-white/10">
                {loading ? (
                  <div className="space-y-4">
                    <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                  <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black justify-center py-3">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full text-foreground/80 hover:text-foreground hover:bg-secondary justify-center py-3">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" className="block" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black justify-center py-3">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section 
          className={`relative overflow-hidden opacity-0 transition-opacity duration-1000 ease-out ${heroHasLoaded ? 'opacity-100' : ''}`}
        >
          <div className="absolute inset-0 z-0">
            {heroInternalEffectsVisible && (
              <>
                {/* Mobile-optimized hero effects */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/8 to-[#ffb4a0]/8 md:from-[#b4a0ff]/10 md:to-[#ffb4a0]/10 blur-2xl md:blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/8 to-[#b4a0ff]/8 md:from-[#ffb4a0]/10 md:to-[#b4a0ff]/10 blur-2xl md:blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[800px] md:h-[800px] rounded-full bg-white/[0.01] md:bg-white/[0.02] blur-[60px] md:blur-[120px]"></div>
              </>
            )}
          </div>
          <div className="relative z-10 px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm text-white/80 mb-6 sm:mb-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 sm:mr-3 animate-pulse"></span>
                  <span>Instant access to Meta ad accounts</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 sm:mb-8 leading-tight">
                  Ad accounts <span className="text-gradient">on demand</span>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-8 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                  Instant access. Instant top ups. Scale uninterrupted.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
                  {loading ? (
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <div className="w-full sm:w-32 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                      <div className="w-full sm:w-32 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <>
                      <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl hover:scale-105 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] transition-all duration-200">
                          Dashboard
                        </Button>
                      </Link>
                      <Link href="#features" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl backdrop-blur-sm">
                          Learn More
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/register" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl hover:scale-105 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] transition-all duration-200">
                        Get Started
                        </Button>
                      </Link>
                      <Link href="#features" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl backdrop-blur-sm">
                          Learn More
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div className="relative max-w-6xl mx-auto mt-8 sm:mt-16">
                <div className="relative overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/15 to-[#ffb4a0]/15 md:from-[#b4a0ff]/20 md:to-[#ffb4a0]/20 blur-xl md:blur-2xl group-hover:from-[#b4a0ff]/25 group-hover:to-[#ffb4a0]/25 md:group-hover:from-[#b4a0ff]/30 md:group-hover:to-[#ffb4a0]/30 transition-all duration-500"></div>
                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
                  
                  {heroInternalEffectsVisible && (
                    <>
                      <div className="hidden lg:block relative z-10">
                        <div className="h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden rounded-xl sm:rounded-2xl">
                          <Image src="/dashboard-wide.png" alt="AdHub Dashboard Interface" width={1920} height={1080} style={{ width: '100%', height: 'auto' }} priority className="rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
                        </div>
                      </div>
                      <div className="lg:hidden relative z-10">
                        <div className="h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden rounded-xl sm:rounded-2xl">
                          <Image src="/dashboard-compact.png" alt="AdHub Dashboard Interface" width={800} height={600} style={{ width: '100%', height: 'auto' }} priority className="rounded-xl sm:rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-20 rounded-b-xl sm:rounded-b-2xl"></div>
                </div>
                {heroInternalEffectsVisible && (
                  <>
                    {/* Mobile-optimized decorative elements */}
                    <div className="absolute -top-4 sm:-top-8 -left-4 sm:-left-8 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full opacity-15 sm:opacity-20 blur-lg sm:blur-xl animate-pulse"></div>
                    <div className="absolute -bottom-6 sm:-bottom-12 -right-6 sm:-right-12 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-l from-[#ffb4a0] to-[#b4a0ff] rounded-full opacity-15 sm:opacity-20 blur-lg sm:blur-xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 -left-8 sm:-left-16 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#d4b4ff] to-[#ffb4a0] rounded-full opacity-10 sm:opacity-15 blur-md sm:blur-lg animate-pulse delay-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/8 to-[#ffb4a0]/8 md:from-[#b4a0ff]/10 md:to-[#ffb4a0]/10 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl opacity-50 sm:opacity-60 scale-110 -z-10 group-hover:opacity-70 sm:group-hover:opacity-80 transition-opacity duration-500 animate-pulse"></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section 
          id="features" 
          className="py-20 sm:py-24 md:py-32 lg:py-40 xl:py-48 relative overflow-hidden"
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Mobile-optimized background effects */}
            <div className="absolute top-1/4 left-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/6 to-transparent md:from-[#b4a0ff]/8 md:to-transparent blur-2xl md:blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 right-0 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-l from-[#ffb4a0]/6 to-transparent md:from-[#ffb4a0]/8 md:to-transparent blur-2xl md:blur-3xl animate-pulse delay-2000"></div>
            <div className="absolute top-1/2 left-1/3 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/5 to-[#ffb4a0]/5 md:from-[#d4b4ff]/7 md:to-[#ffb4a0]/7 blur-2xl md:blur-3xl animate-pulse delay-500"></div>
            <div className="absolute bottom-1/3 right-1/3 w-52 h-52 md:w-72 md:h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/4 to-[#b4a0ff]/4 md:from-[#ffb4a0]/6 md:to-[#b4a0ff]/6 blur-2xl md:blur-3xl animate-pulse delay-1500"></div>
            <div className="absolute top-1/6 right-1/6 w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-r from-[#b4a0ff]/3 to-[#ffb4a0]/3 md:from-[#b4a0ff]/5 md:to-[#ffb4a0]/5 blur-xl md:blur-3xl animate-pulse delay-800"></div>
            <div className="absolute bottom-1/6 left-1/6 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-l from-[#ffb4a0]/5 to-[#b4a0ff]/5 md:from-[#ffb4a0]/7 md:to-[#b4a0ff]/7 blur-xl md:blur-3xl animate-pulse delay-2200"></div>
          </div>
          <div className="relative z-10">
            <AccountManagementSection />
            
            {/* Simple Funding Section */}
            <div className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  Instant <span className="text-gradient">funding</span>
                </h2>
                <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                  Add funds to your accounts instantly with secure payment processing. No delays, no complications.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2">Instant Processing</h3>
                    <p className="text-white/60 text-sm">Funds available immediately after payment confirmation</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
                    <p className="text-white/60 text-sm">Bank-grade security with Stripe payment processing</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-2">Multiple Methods</h3>
                    <p className="text-white/60 text-sm">Credit cards, bank transfers, and more payment options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-20 sm:pb-24 md:pb-32 lg:pb-40 xl:pb-48">
          <ProfessionalFeaturesSection />
        </div>

        <section 
          ref={ctaRef}
          className={`relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24 transition-all duration-1000 ease-out transform ${
            ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {ctaInView && (
            <div className="absolute inset-0 overflow-hidden">
              {/* Mobile-optimized CTA background effects */}
              <div className="absolute top-1/3 left-1/4 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/8 to-[#ffb4a0]/8 md:from-[#b4a0ff]/10 md:to-[#ffb4a0]/10 blur-2xl md:blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/4 w-56 h-56 md:w-80 md:h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/8 to-[#b4a0ff]/8 md:from-[#ffb4a0]/10 md:to-[#b4a0ff]/10 blur-2xl md:blur-3xl animate-pulse"></div>
              <div className="absolute top-1/6 right-1/3 w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/6 to-[#ffb4a0]/6 md:from-[#d4b4ff]/8 md:to-[#ffb4a0]/8 blur-2xl md:blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/6 left-1/3 w-52 h-52 md:w-72 md:h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/5 to-[#b4a0ff]/5 md:from-[#ffb4a0]/7 md:to-[#b4a0ff]/7 blur-2xl md:blur-3xl animate-pulse"></div>
              <div className="absolute top-1/4 right-1/3 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#b4a0ff]/25 md:bg-[#b4a0ff]/30"></div>
              <div className="absolute bottom-1/3 left-1/4 w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#ffb4a0]/30 md:bg-[#ffb4a0]/40"></div>
              <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#d4b4ff]/40 md:bg-[#d4b4ff]/50"></div>
              <div className="absolute top-1/2 left-1/5 w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#b4a0ff]/25 md:bg-[#b4a0ff]/35"></div>
              <div className="absolute bottom-1/4 right-1/5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#ffb4a0]/35 md:bg-[#ffb4a0]/45"></div>
            </div>
          )}
          <div className="relative z-10 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 sm:mb-8">
                Ready to <span className="text-gradient">scale</span>?
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                Join thousands of advertisers who trust AdHub for their Meta advertising needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16 max-w-md sm:max-w-none mx-auto">
                {loading ? (
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                    <div className="w-full sm:w-48 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    <div className="w-full sm:w-48 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  </div>
                ) : user ? (
                  <>
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] hover:scale-105 flex items-center justify-center gap-3 group"
                      >
                        Go to Dashboard
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                    <Link href="/contact" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group"
                      >
                        Request a Demo
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl shadow-lg transition-all duration-200 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] hover:scale-105 flex items-center justify-center gap-3 group"
                      >
                        Get Started for Free
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                    <Link href="/contact" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group"
                      >
                        Request a Demo
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="py-12 sm:py-16 md:py-20 lg:py-24">
          <FAQSection />
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#0A0A0A] relative z-10 mt-12 sm:mt-16 md:mt-20 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
              <AdHubLogo size="lg" />
              <p className="mt-3 sm:mt-4 text-white/60 max-w-md text-sm sm:text-base">
                The fastest way to access Meta ad accounts on demand. Scale your advertising without limits.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
              <ul className="mt-3 sm:mt-4 space-y-2">
                <li><Link href="#features" className="text-white/60 hover:text-white transition-colors text-sm">Features</Link></li>
                <li><Link href="#pricing" className="text-white/60 hover:text-white transition-colors text-sm">Pricing</Link></li>
                <li><Link href="#about" className="text-white/60 hover:text-white transition-colors text-sm">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
              <ul className="mt-3 sm:mt-4 space-y-2">
                <li><Link href="/help" className="text-white/60 hover:text-white transition-colors text-sm">Help Center</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white transition-colors text-sm">Contact</Link></li>
                <li><Link href="/terms" className="text-white/60 hover:text-white transition-colors text-sm">Terms</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-white transition-colors text-sm">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
            <p className="text-white/40 text-xs sm:text-sm text-center">
              © 2025 AdHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 