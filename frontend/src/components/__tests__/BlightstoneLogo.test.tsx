import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { BlightstoneLogo } from '../core/BlightstoneLogo'

describe('BlightstoneLogo', () => {
  it('renders the logo with correct text', () => {
    render(<BlightstoneLogo />)
    
    expect(screen.getByText('Ad')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
  })

  it('applies the correct size classes', () => {
    const { container } = render(<BlightstoneLogo size="lg" />)
    
    expect(container.firstChild).toHaveClass('text-2xl')
  })

  it('applies custom className', () => {
    const { container } = render(<BlightstoneLogo className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('renders with correct brand colors', () => {
    render(<BlightstoneLogo />)
    
    const adText = screen.getByText('Ad')
    const hubText = screen.getByText('Hub')
    
    expect(adText).toHaveClass('text-white')
    expect(hubText).toHaveClass('bg-gradient-to-r', 'from-[#b4a0ff]', 'to-[#ffb4a0]')
  })
}) 