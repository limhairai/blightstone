import React from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface InstantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  instant?: boolean
}

export const InstantButton = React.forwardRef<HTMLButtonElement, InstantButtonProps>(
  ({ children, className, loading, instant = true, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (instant) {
        // Add instant click effect
        const button = e.currentTarget
        button.classList.add('instant-click')
        
        // Remove class after animation
        setTimeout(() => {
          button.classList.remove('instant-click')
        }, 100)
      }
      
      // Call original onClick if provided
      if (props.onClick) {
        props.onClick(e)
      }
    }

    return (
      <Button
        ref={ref}
        className={cn(
          instant && 'instant-click',
          className
        )}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </div>
        ) : (
          children
        )}
      </Button>
    )
  }
)

InstantButton.displayName = 'InstantButton' 