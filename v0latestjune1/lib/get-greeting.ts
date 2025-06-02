export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Good morning"
  } else if (hour < 17) {
    return "Good afternoon"
  } else {
    return "Good evening"
  }
}

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 1 && segments[0] === "dashboard") {
    return "Dashboard"
  }

  if (segments.length >= 2) {
    const pageSegment = segments[segments.length - 1]
    return pageSegment.charAt(0).toUpperCase() + pageSegment.slice(1)
  }

  return "Dashboard"
}
