import React from "react"

const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="container max-w-7xl mx-auto px-4 py-8 min-h-screen">
    {children}
  </div>
)

export default PageContainer 