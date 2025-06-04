"use client"

import Image from "next/image";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfessionalFeaturesSection } from "@/components/landing/professional-features-section"
import { FAQSection } from "@/components/landing/faq-section"
import { AccountManagementSection } from "@/components/accounts/account-management-section"
import { InstantFundingSection } from "@/components/wallet/instant-funding-section"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#1A1A1A] text-white relative">
      {/* Global background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/8 to-[#ffb4a0]/8 blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/6 to-[#b4a0ff]/6 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/7 to-[#ffb4a0]/7 blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-0 right-1/3 w-72 h-72 rounded-full bg-gradient-to-l from-[#b4a0ff]/5 to-[#ffb4a0]/5 blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/6 w-48 h-48 rounded-full bg-gradient-to-r from-[#ffb4a0]/4 to-[#b4a0ff]/4 blur-3xl animate-pulse delay-1500"></div>
        <div className="absolute bottom-1/6 right-1/6 w-56 h-56 rounded-full bg-gradient-to-l from-[#d4b4ff]/6 to-[#ffb4a0]/6 blur-3xl animate-pulse delay-2500"></div>
      </div>
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/20 supports-[backdrop-filter]:bg-black/10">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            {/* Using estimated dimensions for Next/Image. Adjust if necessary. */}
            <Image src="/adhub-logo.png" alt="AdHub" width={100} height={28} className="h-7 w-auto" priority />
          </div>
          <nav className="hidden md:flex gap-6">
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
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm text-foreground/80 hover:text-foreground hover:bg-secondary">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* ... background effects ... */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 blur-3xl animate-pulse"></div><div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/10 to-[#b4a0ff]/10 blur-3xl animate-pulse delay-1000"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02] blur-[120px]"></div>
          </div>
          <div className="relative z-10 px-6 py-16 md:py-20 lg:py-24">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/80 mb-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <span className="flex h-2 w-2 rounded-full bg-green-400 mr-3 animate-pulse"></span>
                  <span>Instant access to Meta ad accounts</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
                  Ad accounts <span className="text-gradient">on demand</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto font-light">
                  Instant access. Instant top ups. Scale uninterrupted.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register"><Button size="lg" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-8 py-4 text-lg font-medium rounded-xl">Get Started</Button></Link>
                  <Link href="#features"><Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-medium rounded-xl backdrop-blur-sm">Learn More</Button></Link>
                </div>
              </div>
              <div className="relative max-w-6xl mx-auto mt-16">
                <div className="relative overflow-hidden shadow-2xl rounded-2xl group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 blur-2xl group-hover:from-[#b4a0ff]/30 group-hover:to-[#ffb4a0]/30 transition-all duration-500"></div>
                  <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all duration-300"></div>
                  <div className="hidden lg:block relative z-10">
                    <div className="h-[500px] overflow-hidden rounded-2xl">
                      {/* Using estimated dimensions and layout='responsive'. Adjust if necessary. */}
                      <Image src="/dashboard-wide.png" alt="AdHub Dashboard Interface" width={1920} height={1080} layout="responsive" className="rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
                    </div>
                  </div>
                  <div className="lg:hidden relative z-10">
                    <div className="h-[400px] overflow-hidden rounded-2xl">
                      {/* Using estimated dimensions and layout='responsive'. Adjust if necessary. */}
                      <Image src="/dashboard-compact.png" alt="AdHub Dashboard Interface" width={800} height={600} layout="responsive" className="rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent z-20 rounded-b-2xl"></div>
                </div>
                {/* ... floating elements ... */}
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] rounded-full opacity-20 blur-xl animate-pulse"></div><div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-l from-[#ffb4a0] to-[#b4a0ff] rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div><div className="absolute top-1/2 -left-16 w-16 h-16 bg-gradient-to-r from-[#d4b4ff] to-[#ffb4a0] rounded-full opacity-15 blur-lg animate-pulse delay-500"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 rounded-3xl blur-3xl opacity-60 animate-pulse scale-110 -z-10 group-hover:opacity-80 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-32 md:py-40 lg:py-48 relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/8 to-transparent blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-gradient-to-l from-[#ffb4a0]/8 to-transparent blur-3xl animate-pulse delay-2000"></div>
            <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/7 to-[#ffb4a0]/7 blur-3xl animate-pulse delay-500"></div>
            <div className="absolute bottom-1/3 right-1/3 w-72 h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/6 to-[#b4a0ff]/6 blur-3xl animate-pulse delay-1500"></div>
            <div className="absolute top-1/6 right-1/6 w-48 h-48 rounded-full bg-gradient-to-r from-[#b4a0ff]/5 to-[#ffb4a0]/5 blur-3xl animate-pulse delay-800"></div>
            <div className="absolute bottom-1/6 left-1/6 w-56 h-56 rounded-full bg-gradient-to-l from-[#ffb4a0]/7 to-[#b4a0ff]/7 blur-3xl animate-pulse delay-2200"></div>
          </div>
          <div className="relative z-10">
            <AccountManagementSection />
            <InstantFundingSection />
          </div>
        </section>

        <div className="py-32 md:py-40 lg:py-48">
          <ProfessionalFeaturesSection />
        </div>

        <section className="relative overflow-hidden">
          {/* ... CTA background effects ... */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 blur-3xl"></div>
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/10 to-[#b4a0ff]/10 blur-3xl"></div>
            <div className="absolute top-1/6 right-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#d4b4ff]/8 to-[#ffb4a0]/8 blur-3xl"></div>
            <div className="absolute bottom-1/6 left-1/3 w-72 h-72 rounded-full bg-gradient-to-l from-[#ffb4a0]/7 to-[#b4a0ff]/7 blur-3xl"></div>
            <div className="absolute top-1/4 right-1/3 w-4 h-4 rounded-full bg-[#b4a0ff]/30"></div>
            <div className="absolute bottom-1/3 left-1/4 w-3 h-3 rounded-full bg-[#ffb4a0]/40"></div>
            <div className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-[#d4b4ff]/50"></div>
            <div className="absolute top-1/2 left-1/5 w-3 h-3 rounded-full bg-[#b4a0ff]/35"></div>
            <div className="absolute bottom-1/4 right-1/5 w-2 h-2 rounded-full bg-[#ffb4a0]/45"></div>
          </div>
          <div className="relative z-10 py-24 md:py-32 lg:py-40">
            <div className="max-w-6xl mx-auto px-6 text-center">
              {/* ... CTA content ... */}
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3 text-sm text-white/80 mb-12">
                <span className="flex h-3 w-3 rounded-full bg-green-400 mr-4 animate-pulse"></span>
                <span>Ready to scale your campaigns?</span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-12 leading-tight">Try <span className="text-gradient">AdHub</span> Today</h2>
              <p className="text-xl md:text-2xl text-white/70 mb-16 max-w-4xl mx-auto leading-relaxed">Start with instant access to Meta ad accounts. Scale your campaigns without limits.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-12 py-6 text-lg font-medium rounded-2xl shadow-lg transition-all duration-200 hover:shadow-[0_0_50px_rgba(180,160,255,0.4)] hover:scale-105 flex items-center gap-3 group">
                    Get Started for Free
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-12 py-6 text-lg font-medium rounded-2xl backdrop-blur-sm transition-all duration-200 hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center gap-3 group">
                    Request a Demo
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">2 min</div>
                  <div className="text-white/70">Setup time</div>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-white/70">Support</div>
                </div>
                <div className="space-y-3">
                  <div className="text-2xl font-bold text-white">Instant</div>
                  <div className="text-white/70">Account access</div>
                </div>
              </div>
            </div>
          </div>
          {/* ... bottom glow effect ... */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-[400px]" style={{background: "radial-gradient(ellipse at bottom, rgba(180,160,255,0.15) 0%, rgba(255,180,160,0.1) 25%, rgba(10,10,10,0) 70%)",}}></div>
            <div className="absolute bottom-0 left-0 right-0 h-[300px]" style={{background: "linear-gradient(to top, rgba(180,160,255,0.08) 0%, rgba(255,180,160,0.05) 30%, rgba(10,10,10,0) 100%)", mixBlendMode: "screen", }}></div>
            <div className="absolute bottom-[10%] left-1/4 w-[300px] h-[200px] rounded-full bg-[#b4a0ff]/10 blur-[100px] opacity-60"></div>
            <div className="absolute bottom-[5%] right-1/3 w-[250px] h-[150px] rounded-full bg-[#ffb4a0]/10 blur-[100px] opacity-50"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px", mixBlendMode: "overlay", }}></div>
          </div>
        </section>

        <section className="bg-black py-32 md:py-40 lg:py-48 relative mt-16">
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <FAQSection />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-black">
        {/* ... footer content ... */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              {/* Using estimated dimensions for Next/Image. Adjust if necessary. */}
              <Image src="/adhub-logo.png" alt="AdHub" width={100} height={28} className="h-7 w-auto" />
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Terms</Link>
              <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Privacy</Link>
              <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">Support</Link>
            </div>
            <p className="text-center text-sm text-foreground/60">© {new Date().getFullYear()} AdHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 