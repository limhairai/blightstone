import * as React from "react"
import { cn } from "../../lib/utils"

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  'aria-label'?: string
}

export function Modal({ open, onClose, title, children, className, ...props }: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-300 animate-fadeIn",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={props["aria-label"] || title || "Modal"}
      tabIndex={-1}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClose();
        }
      }}
      {...props}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 max-w-lg w-full relative"
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
        onClick={e => e.stopPropagation()}
        role="document"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
        {children}
        <button
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground focus:outline-none"
          onClick={onClose}
          aria-label="Close modal"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  )
} 