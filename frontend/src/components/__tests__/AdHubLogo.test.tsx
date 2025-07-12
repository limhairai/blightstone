import { render, screen } from '@testing-library/react'
import { AdHubLogo } from '../core/AdHubLogo'

describe('AdHubLogo', () => {
  it('renders the logo with correct text', () => {
    render(<AdHubLogo />)
    
    expect(screen.getByText('Ad')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
  })

  it('applies the correct size classes', () => {
    const { container } = render(<AdHubLogo size="lg" />)
    
    expect(container.firstChild).toHaveClass('text-2xl')
  })

  it('applies custom className', () => {
    const { container } = render(<AdHubLogo className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders with correct brand colors', () => {
    render(<AdHubLogo />)
    
    const adText = screen.getByText('Ad')
    const hubText = screen.getByText('Hub')
    
    expect(adText).toHaveClass('text-white')
    expect(hubText).toHaveClass('bg-gradient-to-r', 'from-[#b4a0ff]', 'to-[#ffb4a0]')
  })
}) 