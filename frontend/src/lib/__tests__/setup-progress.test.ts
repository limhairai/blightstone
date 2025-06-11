import { 
  getSetupProgress, 
  calculateSetupCompletion, 
  shouldShowOnboarding, 
  getNextStep 
} from '../state-utils'

describe('Setup Progress System', () => {
  describe('getSetupProgress', () => {
    it('should return all incomplete steps for new user', () => {
      const progress = getSetupProgress(false, false, false, false)
      
      expect(progress.emailVerification.completed).toBe(false)
      expect(progress.walletFunding.completed).toBe(false)
      expect(progress.businessSetup.completed).toBe(false)
      expect(progress.adAccountSetup.completed).toBe(false)
    })

    it('should return correct completion status for partially complete user', () => {
      const progress = getSetupProgress(true, true, false, false)
      
      expect(progress.emailVerification.completed).toBe(true)
      expect(progress.walletFunding.completed).toBe(true)
      expect(progress.businessSetup.completed).toBe(false)
      expect(progress.adAccountSetup.completed).toBe(false)
    })

    it('should return all complete steps for fully setup user', () => {
      const progress = getSetupProgress(true, true, true, true)
      
      expect(progress.emailVerification.completed).toBe(true)
      expect(progress.walletFunding.completed).toBe(true)
      expect(progress.businessSetup.completed).toBe(true)
      expect(progress.adAccountSetup.completed).toBe(true)
    })
  })

  describe('calculateSetupCompletion', () => {
    it('should calculate 0% for new user', () => {
      const progress = getSetupProgress(false, false, false, false)
      const completion = calculateSetupCompletion(progress)
      
      expect(completion.percentage).toBe(0)
      expect(completion.completedSteps).toBe(0)
      expect(completion.totalSteps).toBe(4)
      expect(completion.isComplete).toBe(false)
    })

    it('should calculate 50% for half complete user', () => {
      const progress = getSetupProgress(true, true, false, false)
      const completion = calculateSetupCompletion(progress)
      
      expect(completion.percentage).toBe(50)
      expect(completion.completedSteps).toBe(2)
      expect(completion.totalSteps).toBe(4)
      expect(completion.isComplete).toBe(false)
    })

    it('should calculate 100% for fully setup user', () => {
      const progress = getSetupProgress(true, true, true, true)
      const completion = calculateSetupCompletion(progress)
      
      expect(completion.percentage).toBe(100)
      expect(completion.completedSteps).toBe(4)
      expect(completion.totalSteps).toBe(4)
      expect(completion.isComplete).toBe(true)
    })
  })

  describe('shouldShowOnboarding', () => {
    it('should return true for incomplete setup', () => {
      const progress = getSetupProgress(true, false, false, false)
      expect(shouldShowOnboarding(progress)).toBe(true)
    })

    it('should return false for complete setup', () => {
      const progress = getSetupProgress(true, true, true, true)
      expect(shouldShowOnboarding(progress)).toBe(false)
    })
  })

  describe('getNextStep', () => {
    it('should return email verification as first step', () => {
      const progress = getSetupProgress(false, false, false, false)
      const nextStep = getNextStep(progress)
      
      expect(nextStep?.id).toBe('email-verification')
      expect(nextStep?.name).toBe('Email Verification')
    })

    it('should return wallet funding after email verification', () => {
      const progress = getSetupProgress(true, false, false, false)
      const nextStep = getNextStep(progress)
      
      expect(nextStep?.id).toBe('wallet-funding')
      expect(nextStep?.name).toBe('Wallet Funding')
    })

    it('should return null when all steps complete', () => {
      const progress = getSetupProgress(true, true, true, true)
      const nextStep = getNextStep(progress)
      
      expect(nextStep).toBe(null)
    })
  })
}) 