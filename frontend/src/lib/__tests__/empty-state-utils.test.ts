import { checkEmptyState, shouldShowSetupElements, shouldShowEmailBanner } from '../empty-state-utils'

describe('Empty State Utils', () => {
  describe('checkEmptyState', () => {
    it('should return correct empty state conditions', () => {
      const result = checkEmptyState(0, 0, 0, false)
      
      expect(result).toEqual({
        noTransactions: true,
        noAccounts: true,
        noBalance: true,
        emailNotVerified: true
      })
    })

    it('should return false for non-empty conditions', () => {
      const result = checkEmptyState(5, 3, 1000, true)
      
      expect(result).toEqual({
        noTransactions: false,
        noAccounts: false,
        noBalance: false,
        emailNotVerified: false
      })
    })
  })

  describe('shouldShowSetupElements', () => {
    it('should return true when all conditions are empty', () => {
      const conditions = {
        noTransactions: true,
        noAccounts: true,
        noBalance: true,
        emailNotVerified: true
      }
      
      expect(shouldShowSetupElements(conditions)).toBe(true)
    })

    it('should return false when any condition is not empty', () => {
      const conditions = {
        noTransactions: false, // Has transactions
        noAccounts: true,
        noBalance: true,
        emailNotVerified: true
      }
      
      expect(shouldShowSetupElements(conditions)).toBe(false)
    })
  })

  describe('shouldShowEmailBanner', () => {
    it('should return true when email is not verified', () => {
      const conditions = {
        noTransactions: true,
        noAccounts: true,
        noBalance: true,
        emailNotVerified: true
      }
      
      expect(shouldShowEmailBanner(conditions)).toBe(true)
    })

    it('should return false when email is verified', () => {
      const conditions = {
        noTransactions: true,
        noAccounts: true,
        noBalance: true,
        emailNotVerified: false
      }
      
      expect(shouldShowEmailBanner(conditions)).toBe(false)
    })
  })
}) 