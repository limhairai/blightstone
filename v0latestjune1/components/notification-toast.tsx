"use client"

import { AlertCircle, CheckCircle, Info, X } from "lucide-react"

interface NotificationToastProps {
  type: "success" | "error" | "info" | "warning"
  title: string
  description?: string
  onClose?: () => void
}

export function NotificationToast({ type, title, description, onClose }: NotificationToastProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
  }

  const backgrounds = {
    success: "bg-green-950/30 border-green-900/50",
    error: "bg-red-950/30 border-red-900/50",
    info: "bg-blue-950/30 border-blue-900/50",
    warning: "bg-yellow-950/30 border-yellow-900/50",
  }

  return (
    <div className={`rounded-md border ${backgrounds[type]} p-4 flex gap-3 max-w-md`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{title}</h4>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
