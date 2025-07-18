import React from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface AdminInstantButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  action?: string
  onInstantAction?: () => void | Promise<void>
}

export const AdminInstantButton = React.forwardRef<HTMLButtonElement, AdminInstantButtonProps>(
  ({ children, className, loading, action, onInstantAction, ...props }, ref) => {
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      // Add instant click effect
      const button = e.currentTarget
      button.classList.add('admin-button-instant')
      
      // Remove class after animation
      setTimeout(() => {
        button.classList.remove('admin-button-instant')
      }, 100)

      // Show instant feedback if action is provided
      if (action) {
        const feedback = document.createElement('div')
        feedback.className = 'admin-action-feedback'
        feedback.textContent = `${action}...`
        document.body.appendChild(feedback)
        
        // Remove feedback after a short delay
        setTimeout(() => {
          if (document.body.contains(feedback)) {
            document.body.removeChild(feedback)
          }
        }, 1000)
      }
      
      // Call onInstantAction if provided
      if (onInstantAction) {
        try {
          await onInstantAction()
        } catch (error) {
          console.error('Admin action failed:', error)
        }
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
          'admin-button-instant',
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

AdminInstantButton.displayName = 'AdminInstantButton' 