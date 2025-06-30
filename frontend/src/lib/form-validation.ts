// Form validation utilities and error handling
import { toast } from "sonner"

// Validation error type
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Common validation functions
export const validators = {
  required: (value: string | undefined | null, fieldName: string): ValidationError | null => {
    if (!value || value.trim() === '') {
      return { field: fieldName, message: `${fieldName} is required` }
    }
    return null
  },

  email: (value: string, fieldName: string = 'Email'): ValidationError | null => {
    if (!value) return null // Use required validator for empty check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: 'Please enter a valid email address' }
    }
    return null
  },

  password: (value: string, fieldName: string = 'Password'): ValidationError | null => {
    if (!value) return null // Use required validator for empty check
    if (value.length < 8) {
      return { field: fieldName, message: 'Password must be at least 8 characters long' }
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
      return { field: fieldName, message: 'Password must contain at least one letter and one number' }
    }
    return null
  },

  passwordMatch: (password: string, confirmPassword: string): ValidationError | null => {
    if (!password || !confirmPassword) return null // Use required validator for empty check
    if (password !== confirmPassword) {
      return { field: 'confirmPassword', message: 'Passwords do not match' }
    }
    return null
  },

  url: (value: string, fieldName: string = 'URL'): ValidationError | null => {
    if (!value) return null // Optional field
    const urlPatterns = [
      /^https?:\/\/.+\..+/, // Full URL with protocol
      /^www\..+\..+/, // www.domain.com
      /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, // domain.com
    ]
    
    if (!urlPatterns.some(pattern => pattern.test(value))) {
      return { field: fieldName, message: 'Please enter a valid URL (e.g., example.com, www.example.com, or https://example.com)' }
    }
    return null
  },

  minLength: (value: string, minLength: number, fieldName: string): ValidationError | null => {
    if (!value) return null // Use required validator for empty check
    if (value.trim().length < minLength) {
      return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters long` }
    }
    return null
  },

  maxLength: (value: string, maxLength: number, fieldName: string): ValidationError | null => {
    if (!value) return null
    if (value.trim().length > maxLength) {
      return { field: fieldName, message: `${fieldName} must be no more than ${maxLength} characters long` }
    }
    return null
  },

  businessManagerId: (value: string): ValidationError | null => {
    if (!value) return null // Use required validator for empty check
    // Facebook Business Manager IDs are typically numeric
    if (!/^\d+$/.test(value)) {
      return { field: 'businessManagerId', message: 'Business Manager ID must be numeric' }
    }
    if (value.length < 10 || value.length > 20) {
      return { field: 'businessManagerId', message: 'Business Manager ID must be between 10-20 digits' }
    }
    return null
  },

  select: (value: string | undefined | null, fieldName: string): ValidationError | null => {
    if (!value || value === '') {
      return { field: fieldName, message: `Please select a ${fieldName.toLowerCase()}` }
    }
    return null
  }
}

// Validation runner
export function validateForm(validations: (() => ValidationError | null)[]): ValidationResult {
  const errors: ValidationError[] = []
  
  validations.forEach(validation => {
    const error = validation()
    if (error) {
      errors.push(error)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Toast error display
export function showValidationErrors(errors: ValidationError[]) {
  if (errors.length === 0) return

  // Group errors by field for better display
  const errorsByField = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = []
    }
    acc[error.field].push(error.message)
    return acc
  }, {} as Record<string, string[]>)

  // Show first error as toast
  const firstError = errors[0]
  toast.error(firstError.message)

  // If multiple errors, show count
  if (errors.length > 1) {
    setTimeout(() => {
      toast.error(`${errors.length - 1} more validation error${errors.length > 2 ? 's' : ''}`, {
        description: "Please check all required fields"
      })
    }, 1000)
  }
}

// Success toast
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description
  })
}

// Business form validation
export function validateBusinessForm(formData: {
  name: string
  industry: string
  website?: string
  description?: string
}): ValidationResult {
  return validateForm([
    () => validators.required(formData.name, 'Business name'),
    () => validators.minLength(formData.name, 2, 'Business name'),
    () => validators.maxLength(formData.name, 100, 'Business name'),
    () => validators.select(formData.industry, 'Industry'),
    () => formData.website ? validators.url(formData.website, 'Website') : null,
    () => formData.description ? validators.maxLength(formData.description, 1000, 'Description') : null,
  ])
}

// Account application form validation
export function validateAccountApplicationForm(formData: {
  businessManagerId: string
  timezone: string
  accounts: Array<{
    name: string
    landingPageUrl: string
    facebookPageUrl: string
  }>
}): ValidationResult {
  const validations = [
    () => validators.required(formData.businessManagerId, 'Business Manager ID'),
    () => validators.businessManagerId(formData.businessManagerId),
    () => validators.select(formData.timezone, 'Timezone'),
  ]

  // Validate each account
  formData.accounts.forEach((account, index) => {
    const accountNum = index + 1
    validations.push(
      () => validators.required(account.name, `Account ${accountNum} name`),
      () => validators.minLength(account.name, 2, `Account ${accountNum} name`),
      () => validators.maxLength(account.name, 100, `Account ${accountNum} name`),
      () => validators.required(account.landingPageUrl, `Account ${accountNum} landing page URL`),
      () => validators.url(account.landingPageUrl, `Account ${accountNum} landing page URL`),
      () => validators.required(account.facebookPageUrl, `Account ${accountNum} Facebook page URL`),
      () => validators.url(account.facebookPageUrl, `Account ${accountNum} Facebook page URL`),
    )
  })

  return validateForm(validations)
}

// Login form validation
export function validateLoginForm(formData: {
  email: string
  password: string
}): ValidationResult {
  return validateForm([
    () => validators.required(formData.email, 'Email'),
    () => validators.email(formData.email),
    () => validators.required(formData.password, 'Password'),
  ])
}

// Registration form validation
export function validateRegistrationForm(formData: {
  name: string
  email: string
  password: string
  confirmPassword: string
  terms: boolean
}): ValidationResult {
  return validateForm([
    () => validators.required(formData.name, 'Name'),
    () => validators.minLength(formData.name, 2, 'Name'),
    () => validators.maxLength(formData.name, 50, 'Name'),
    () => validators.required(formData.email, 'Email'),
    () => validators.email(formData.email),
    () => validators.required(formData.password, 'Password'),
    () => validators.password(formData.password),
    () => validators.required(formData.confirmPassword, 'Confirm password'),
    () => validators.passwordMatch(formData.password, formData.confirmPassword),
    () => !formData.terms ? { field: 'terms', message: 'You must accept the terms and conditions' } : null,
  ])
}

// Ad account creation form validation
export function validateAdAccountForm(formData: {
  business: string,
  timezone: string,
}): ValidationResult {
  return validateForm([
    () => validators.select(formData.business, 'Business'),
    () => validators.select(formData.timezone, 'Timezone'),
  ])
}

// Business manager application form validation
export function validateBusinessManagerApplicationForm(formData: {
  website: string
}): ValidationResult {
  return validateForm([
    () => validators.required(formData.website, 'Website'),
    () => validators.url(formData.website, 'Website'),
  ])
}

// Transaction form validation
export function validateTransactionForm(formData: {
  // ... existing code ...
}) {
  // ... existing code ...
} 