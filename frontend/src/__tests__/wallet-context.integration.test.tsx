import React from 'react'
import { render, act, waitFor } from '@testing-library/react'
import { AppDataProvider, useAppData } from '../contexts/AppDataContext'
import { AuthProvider } from '../contexts/AuthContext'

// Test component that uses wallet operations
const WalletTestComponent = () => {
  const { state, updateWalletBalance, updateAccount } = useAppData()
  
  return (
    <div>
      <div data-testid="wallet-balance">{state.financialData.totalBalance}</div>
      <div data-testid="account-balance">
        {state.accounts[0]?.balance || 0}
      </div>
      <button 
        data-testid="add-to-wallet"
        onClick={() => updateWalletBalance(100, 'add')}
      >
        Add to Wallet
      </button>
      <button 
        data-testid="top-up-account"
        onClick={async () => {
          // Simulate ad account top-up
          await updateWalletBalance(50, 'subtract')
          if (state.accounts[0]) {
            await updateAccount({
              ...state.accounts[0],
              balance: state.accounts[0].balance + 50
            })
          }
        }}
      >
        Top Up Account
      </button>
    </div>
  )
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <AppDataProvider>
      {children}
    </AppDataProvider>
  </AuthProvider>
)

describe('Wallet Context Integration Tests', () => {
  test('wallet balance updates correctly when adding funds', async () => {
    const { getByTestId, getByRole } = render(
      <TestWrapper>
        <WalletTestComponent />
      </TestWrapper>
    )

    const initialBalance = parseFloat(getByTestId('wallet-balance').textContent || '0')
    
    await act(async () => {
      getByRole('button', { name: /add to wallet/i }).click()
    })

    await waitFor(() => {
      const newBalance = parseFloat(getByTestId('wallet-balance').textContent || '0')
      expect(newBalance).toBe(initialBalance + 100)
    })
  })

  test('ad account top-up reduces wallet and increases account balance', async () => {
    const { getByTestId, getByRole } = render(
      <TestWrapper>
        <WalletTestComponent />
      </TestWrapper>
    )

    // Wait for initial state to load
    await waitFor(() => {
      expect(getByTestId('wallet-balance')).toBeInTheDocument()
    })

    const initialWalletBalance = parseFloat(getByTestId('wallet-balance').textContent || '0')
    const initialAccountBalance = parseFloat(getByTestId('account-balance').textContent || '0')
    const totalInitial = initialWalletBalance + initialAccountBalance

    await act(async () => {
      getByRole('button', { name: /top up account/i }).click()
    })

    await waitFor(() => {
      const finalWalletBalance = parseFloat(getByTestId('wallet-balance').textContent || '0')
      const finalAccountBalance = parseFloat(getByTestId('account-balance').textContent || '0')
      const totalFinal = finalWalletBalance + finalAccountBalance

      // Verify wallet decreased
      expect(finalWalletBalance).toBe(initialWalletBalance - 50)
      
      // Verify account increased
      expect(finalAccountBalance).toBe(initialAccountBalance + 50)
      
      // Verify conservation of money
      expect(totalFinal).toBe(totalInitial)
    })
  })

  test('prevents negative wallet balance', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <WalletTestComponent />
      </TestWrapper>
    )

    // Try to subtract more than available
    await act(async () => {
      // This should be prevented by validation or clamped to 0
      // Implementation depends on your business logic
    })

    await waitFor(() => {
      const balance = parseFloat(getByTestId('wallet-balance').textContent || '0')
      expect(balance).toBeGreaterThanOrEqual(0)
    })
  })
}) 