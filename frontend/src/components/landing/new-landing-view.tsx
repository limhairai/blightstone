"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "../ui/button"
import { BlightstoneLogo } from "../core/BlightstoneLogo"
import { Menu, X } from "lucide-react"

export function NewLandingView() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <BlightstoneLogo size="md" />
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#why" className="text-white/80 hover:text-white transition-colors font-medium">
                Why Blightstone?
              </Link>
              <Link href="#how-it-works" className="text-white/80 hover:text-white transition-colors font-medium">
                How it works
              </Link>
              <Link href="#testimonials" className="text-white/80 hover:text-white transition-colors font-medium">
                Testimonials
              </Link>
              <Link href="#faq" className="text-white/80 hover:text-white transition-colors font-medium">
                FAQ
              </Link>
              <Button className="bg-white text-black hover:bg-white/90 font-medium">
                Get Started
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <Link href="#why" className="block text-white/80 hover:text-white transition-colors font-medium">
                Why Blightstone?
              </Link>
              <Link href="#how-it-works" className="block text-white/80 hover:text-white transition-colors font-medium">
                How it works
              </Link>
              <Link href="#testimonials" className="block text-white/80 hover:text-white transition-colors font-medium">
                Testimonials
              </Link>
              <Link href="#faq" className="block text-white/80 hover:text-white transition-colors font-medium">
                FAQ
              </Link>
              <Button className="w-full bg-white text-black hover:bg-white/90 font-medium">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Main Heading - DM Sans 82px */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight font-inter">
              Client Management <span className="text-muted-foreground">Simplified</span>
            </h1>
            
            {/* Subheading - Inter Display 18px */}
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed font-inter">
              Blightstone offers a comprehensive CRM solution for managing your clients and business operations. Streamlined workflows. Real-time insights. Scale efficiently.
            </p>

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-8 py-4 text-lg rounded-lg font-inter"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-white/60 mb-8 font-inter">
              They trust us
            </p>
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <span className="text-4xl font-bold mr-2">4,9</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-muted-foreground fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-inter">
              Monitor performance, track spending, and manage multiple Meta ad accounts from a unified dashboard.
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-8 font-inter">
              Agency accounts made simple.
            </h3>
            <p className="text-lg text-white/80 max-w-4xl mx-auto font-inter">
              Self-service account applications, real-time management dashboard, and simplified multi-entity management for scale.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
} 