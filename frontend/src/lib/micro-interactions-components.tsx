import { useCallback, useEffect } from 'react'
import { useButtonInteractions, useHoverEffects, MicroInteractions, useScrollAnimation } from './micro-interactions-core'

// Enhanced button component with micro-interactions
export function InteractiveButton({ 
  children, 
  onClick, 
  className = "",
  variant = "default",
  disabled = false,
  ...props 
}: {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  variant?: "default" | "primary" | "secondary" | "destructive"
  disabled?: boolean
  [key: string]: any
}) {
  const { handleMouseDown, handleClick } = useButtonInteractions()
  const { isHovered, hoverProps } = useHoverEffects()
  const interactions = MicroInteractions.getInstance()

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    
    handleClick(event)
    interactions.hapticFeedback('medium')
    onClick?.(event)
  }, [disabled, handleClick, interactions, onClick])

  const baseClasses = "relative overflow-hidden transition-all duration-150 ease-out transform-gpu"
  const variantClasses = {
    default: "bg-secondary hover:bg-muted text-foreground",
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
    secondary: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    destructive: "bg-muted hover:bg-muted/90 text-foreground"
  }

  const hoverScale = isHovered && !disabled ? "scale-105" : "scale-100"
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${hoverScale} ${disabledClasses} ${className}`}
      onClick={handleButtonClick}
      onMouseDown={handleMouseDown}
      disabled={disabled}
      {...hoverProps}
      {...props}
    >
      {children}
    </button>
  )
}

// Smooth loading bar component
export function LoadingBar({ 
  progress, 
  className = "",
        color = "bg-primary" 
}: { 
  progress: number
  className?: string
  color?: string 
}) {
  return (
    <div className={`w-full h-1 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full ${color} transition-all duration-300 ease-out rounded-full`}
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// Animated container for scroll-triggered content
export function AnimatedContainer({ 
  children, 
  className = "",
  animation = "fade-up",
  delay = 0 
}: {
  children: React.ReactNode
  className?: string
  animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right"
  delay?: number
}) {
  const { ref, isVisible } = useScrollAnimation()

  const animations = {
    "fade-up": isVisible 
      ? "opacity-100 translate-y-0" 
      : "opacity-0 translate-y-4",
    "fade-in": isVisible 
      ? "opacity-100" 
      : "opacity-0",
    "slide-left": isVisible 
      ? "opacity-100 translate-x-0" 
      : "opacity-0 translate-x-4",
    "slide-right": isVisible 
      ? "opacity-100 translate-x-0" 
      : "opacity-0 -translate-x-4"
  }

  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ease-out ${animations[animation]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// Global micro-interactions setup
export function MicroInteractionsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add global styles for micro-interactions
    const globalStyles = `
      * {
        -webkit-tap-highlight-color: transparent;
      }
      
      .interactive-element {
        transition: transform 0.1s ease-out;
      }
      
      .interactive-element:active {
        transform: scale(0.98);
      }
      
      .smooth-hover {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .smooth-hover:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    `

    const styleSheet = document.createElement('style')
    styleSheet.textContent = globalStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  return <>{children}</>
} 