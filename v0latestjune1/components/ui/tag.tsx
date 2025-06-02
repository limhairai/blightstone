import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-secondary/50 text-foreground",
        outline: "bg-transparent border-border text-foreground",
        gradient: "bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 text-white border-transparent",
        admin: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-semibold border-transparent",
        member: "bg-[#b4a0ff] text-black font-semibold border-transparent",
        viewer: "bg-gray-700 text-white font-medium border-transparent",
        current: "bg-[#b4a0ff] text-black font-semibold border-transparent",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "default",
    },
  },
)

export interface TagProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tagVariants> {
  icon?: React.ReactNode
}

function Tag({ className, variant, rounded, icon, children, ...props }: TagProps) {
  return (
    <div className={cn(tagVariants({ variant, rounded, className }))} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

export { Tag, tagVariants }
