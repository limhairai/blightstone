import Link from "next/link"

interface LogoProps {
  className?: string
  size?: "small" | "default" | "large"
  linkWrapper?: boolean
  href?: string
}

export function Logo({ className = "", size = "default", linkWrapper = true, href = "/dashboard" }: LogoProps) {
  const sizeClasses = {
    small: "text-xl",
    default: "text-2xl",
    large: "text-3xl",
  }

  const logoContent = (
    <span className="font-bold tracking-tight font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      <span className="text-white">Ad</span>
      <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-orange-200 bg-clip-text text-transparent ml-1">Hub</span>
    </span>
  )

  if (linkWrapper) {
    return (
      <Link href={href} className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>
        {logoContent}
      </Link>
    )
  }

  return <div className={`font-bold tracking-tight ${sizeClasses[size]} ${className}`} style={{ fontFamily: 'Inter, sans-serif' }}>{logoContent}</div>
} 