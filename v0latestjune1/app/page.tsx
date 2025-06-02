import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { FeatureSection } from "@/components/feature-section"
import { PricingPlans } from "@/components/pricing-plans"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-border backdrop-blur-md bg-background/50 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="fey-gradient">Ad</span>
            <span>Hub</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="/" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
              Home
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground hover:bg-secondary">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Animated background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-l from-[#ffb4a0]/10 to-[#b4a0ff]/10 blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/[0.02] blur-[120px]"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/80 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-green-400 mr-3 animate-pulse"></span>
                <span>Instant access to Meta ad accounts</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-none">
                Ad accounts{" "}
                <span className="bg-gradient-to-r from-[#b4a0ff] via-[#d4b4ff] to-[#ffb4a0] bg-clip-text text-transparent">
                  on demand
                </span>
              </h1>
              <p className="mx-auto max-w-[600px] text-white/70 text-xl md:text-2xl leading-relaxed font-light">
                Top up and get immediate access to Meta agency ad accounts.{" "}
                <span className="text-white/90">No human interaction, no chat groups</span>, just seamless access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black px-8 h-14 rounded-xl text-lg font-medium"
                  >
                    Get Started <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 h-14 rounded-xl text-lg font-medium backdrop-blur-sm"
                  >
                    How it works
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-8">
          <div className="container mx-auto px-4 mb-20">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                Designed for{" "}
                <span className="bg-gradient-to-r from-[#b4a0ff] via-[#d4b4ff] to-[#ffb4a0] bg-clip-text text-transparent">
                  marketers
                </span>
              </h2>
              <p className="mx-auto max-w-[700px] text-white/70 text-xl leading-relaxed font-light">
                Everything you need to manage your Meta ad accounts efficiently
              </p>
            </div>
          </div>

          <FeatureSection
            title="Manage Multiple Ad Accounts"
            description="Easily manage all your Meta ad accounts from a single dashboard. Monitor status, performance, and linked campaigns with our intuitive interface."
          />

          <FeatureSection
            title="Seamless Payment Process"
            description="Top up your account balance with our simple three-step payment process. Select your payment method, process the transaction, and receive instant confirmation."
            reversed
          />

          <FeatureSection
            title="Comprehensive Analytics"
            description="Track performance metrics across all your ad accounts with detailed analytics. Visualize trends and make data-driven decisions to optimize your campaigns."
          />

          <FeatureSection
            title="Streamlined Application Process"
            description="Request new ad accounts through our streamlined application process. Submit your application and track its approval status in real-time."
            reversed
          />
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 md:py-28 bg-secondary/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-20">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                How it{" "}
                <span className="bg-gradient-to-r from-[#b4a0ff] via-[#d4b4ff] to-[#ffb4a0] bg-clip-text text-transparent">
                  works
                </span>
              </h2>
              <p className="mx-auto max-w-[700px] text-white/70 text-xl leading-relaxed font-light">
                Get started in minutes with our simple process
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Create an account",
                  description: "Sign up and verify your email to get started",
                },
                {
                  step: "02",
                  title: "Top up your balance",
                  description: "Add funds using your preferred payment method",
                },
                {
                  step: "03",
                  title: "Get instant access",
                  description: "Request ad accounts and get immediate access",
                },
              ].map((step, index) => (
                <div key={index} className="glass-card p-8 rounded-xl relative">
                  <div className="text-4xl font-bold text-white/10 absolute top-6 right-6">{step.step}</div>
                  <h3 className="text-2xl font-bold mb-4 mt-6 fey-gradient">{step.title}</h3>
                  <p className="text-foreground/70">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-20">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                Simple{" "}
                <span className="bg-gradient-to-r from-[#b4a0ff] via-[#d4b4ff] to-[#ffb4a0] bg-clip-text text-transparent">
                  pricing
                </span>
              </h2>
              <p className="mx-auto max-w-[700px] text-white/70 text-xl leading-relaxed font-light">
                Pay only for what you need with our transparent pricing model
              </p>
            </div>

            <PricingPlans />

            <div className="text-center mt-10">
              <Link href="/pricing">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  See detailed pricing information
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="fey-gradient">Ad</span>
            <span>Hub</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              Support
            </Link>
          </div>
          <p className="text-center text-sm text-foreground/60">
            © {new Date().getFullYear()} AdHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
