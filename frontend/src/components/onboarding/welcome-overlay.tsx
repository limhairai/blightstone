"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { useAuth } from "../../contexts/AuthContext"

interface WelcomeOverlayProps {
  onDismiss: () => void
}

export function WelcomeOverlay({ onDismiss }: WelcomeOverlayProps) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(true)

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.user_metadata?.name?.split(' ')[0] || 
                   user?.email?.split('@')[0] || 
                   'there'

  // Remove auto timeout - only close when user clicks "Got it"

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-40">
      {/* Base overlay to block underlying content */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* SVG-based wave overlay - natural organic shape like Stripe */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 1920 1080" 
        preserveAspectRatio="xMidYMid slice"
        style={{ zIndex: 1 }}
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 0, 0, 0.4)" />
            <stop offset="25%" stopColor="rgba(20, 20, 20, 0.5)" />
            <stop offset="50%" stopColor="rgba(40, 40, 40, 0.6)" />
            <stop offset="75%" stopColor="rgba(60, 60, 60, 0.7)" />
            <stop offset="100%" stopColor="rgba(80, 80, 80, 0.8)" />
          </linearGradient>
          
          <filter id="waveBlur">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          
          <filter id="edgeBlur">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        
        {/* Natural wave shape - back to lower height with soft edges */}
        <path
          d="M 0,1080 
             C 200,980 400,920 600,880
             C 800,840 1000,800 1200,760
             C 1400,720 1600,680 1800,640
             C 1850,630 1900,620 1920,610
             L 1920,1080 
             Z"
          fill="url(#waveGradient)"
          filter="url(#edgeBlur)"
        />
        
        {/* Second wave layer for depth - powder dispersion */}
        <path
          d="M 0,1080 
             C 250,960 450,900 650,860
             C 850,820 1050,780 1250,740
             C 1450,700 1650,660 1850,620
             C 1880,610 1900,600 1920,590
             L 1920,1080 
             Z"
          fill="url(#waveGradient)"
          opacity="0.8"
          filter="url(#waveBlur)"
        />
        
        {/* Third wave layer - most dispersed */}
        <path
          d="M 0,1080 
             C 300,940 500,880 700,840
             C 900,800 1100,760 1300,720
             C 1500,680 1700,640 1900,600
             L 1920,600
             L 1920,1080 
             Z"
          fill="rgba(0, 0, 0, 0.5)"
          opacity="0.9"
          filter="url(#edgeBlur)"
        />
      </svg>
      
      {/* Subtle backdrop blur only in the intense area */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse 400px 300px at calc(100% - 200px) calc(100% - 200px),
              rgba(255, 255, 255, 0.01) 0%,
              transparent 60%
            )
          `,
          backdropFilter: 'blur(0.5px)'
        }}
      />
      
      {/* Welcome content positioned to complement the setup widget */}
      <div className="absolute bottom-16 right-[350px] w-full max-w-sm p-4" style={{ zIndex: 2 }}>
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white">
              Next, choose a plan
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              After you upgrade your plan, you'll be able to start requesting Business Managers and ad accounts.
            </p>
          </div>
          
          <div className="flex justify-start">
            <Button
              onClick={onDismiss}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-md backdrop-blur-sm border border-white/25 shadow-lg transition-all duration-200"
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 