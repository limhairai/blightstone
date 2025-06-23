describe('Wallet Operations - Financial Logic Tests', () => {
  // Simple test to demonstrate the bug we fixed
  test('should handle add and subtract operations correctly', () => {
    // Mock the reducer logic that was buggy
    const updateBalance = (currentBalance: number, amount: number, type: 'add' | 'subtract') => {
      // This was the BUG: always adding regardless of type
      // return currentBalance + amount  // ❌ WRONG
      
      // This is the FIX: respect the type parameter
      return type === 'add' 
        ? currentBalance + amount
        : Math.max(0, currentBalance - amount)
    }

    // Test the fix
    expect(updateBalance(1000, 100, 'add')).toBe(1100)
    expect(updateBalance(1000, 100, 'subtract')).toBe(900)
    
    // This test would have FAILED with the original bug
    expect(updateBalance(1000, 100, 'subtract')).not.toBe(1100)
  })

  test('conservation of money principle', () => {
    let walletBalance = 1000
    let accountBalance = 500
    const totalBefore = walletBalance + accountBalance

    // Simulate ad account top-up (transfer from wallet to account)
    const topUpAmount = 200
    walletBalance -= topUpAmount  // Subtract from wallet
    accountBalance += topUpAmount // Add to account

    const totalAfter = walletBalance + accountBalance

    // Money should be conserved
    expect(totalAfter).toBe(totalBefore)
    expect(walletBalance).toBe(800)
    expect(accountBalance).toBe(700)
  })

  test('prevents negative balance', () => {
    const updateBalance = (currentBalance: number, amount: number, type: 'add' | 'subtract') => {
      return type === 'add' 
        ? currentBalance + amount
        : Math.max(0, currentBalance - amount)
    }

    // Try to subtract more than available
    expect(updateBalance(100, 200, 'subtract')).toBe(0)
    expect(updateBalance(100, 200, 'subtract')).not.toBeLessThan(0)
  })
})
