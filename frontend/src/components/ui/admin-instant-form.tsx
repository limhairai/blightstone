import React, { useState, useCallback, useRef } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'
// import { Switch } from './switch' // Component not found
import { cn } from '@/lib/utils'
import { useInstantAdminForm } from '@/lib/admin-performance'

interface AdminInstantFormProps {
  onSubmit: (data: any) => Promise<any>
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  className?: string
  children: React.ReactNode
  initialData?: Record<string, any>
}

export function AdminInstantForm({
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  className,
  children,
  initialData = {}
}: AdminInstantFormProps) {
  const { isSubmitting, submitFormInstantly } = useInstantAdminForm()
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    try {
      await submitFormInstantly(formData, '/api/admin/form')
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission failed:', error)
      setErrors({ submit: 'Form submission failed. Please try again.' })
    }
  }, [formData, submitFormInstantly, onSubmit])

  const updateField = useCallback((name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }, [errors])

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={cn('admin-form-instant space-y-6', className)}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value: formData[child.props.name] || '',
            onChange: (value: any) => updateField(child.props.name, value),
            error: errors[child.props.name],
            ...child.props
          })
        }
        return child
      })}
      
      {errors.submit && (
        <div className="text-sm text-destructive">
          {errors.submit}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="admin-button-instant"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="admin-button-instant"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  )
}

// Form field components with instant feedback
interface FormFieldProps {
  name: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  className?: string
}

export function AdminFormInput({ 
  name, 
  label, 
  placeholder, 
  required, 
  error, 
  className,
  ...props 
}: FormFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className={cn(
          'admin-form-instant',
          error && 'border-destructive focus:ring-destructive'
        )}
        {...props}
      />
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

export function AdminFormTextarea({ 
  name, 
  label, 
  placeholder, 
  required, 
  error, 
  className,
  ...props 
}: FormFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Textarea
        id={name}
        name={name}
        placeholder={placeholder}
        required={required}
        className={cn(
          'admin-form-instant',
          error && 'border-destructive focus:ring-destructive'
        )}
        {...props}
      />
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

interface AdminFormSelectProps extends FormFieldProps {
  options: { value: string; label: string }[]
}

export function AdminFormSelect({ 
  name, 
  label, 
  placeholder, 
  required, 
  error, 
  className,
  options,
  ...props 
}: AdminFormSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select name={name} required={required} {...props}>
        <SelectTrigger className={cn(
          'admin-form-instant',
          error && 'border-destructive focus:ring-destructive'
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}

interface AdminFormCheckboxProps extends FormFieldProps {
  description?: string
}

export function AdminFormCheckbox({ 
  name, 
  label, 
  description, 
  error, 
  className,
  ...props 
}: AdminFormCheckboxProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          name={name}
          className={cn(
            'admin-form-instant',
            error && 'border-destructive'
          )}
          {...props}
        />
        {label && (
          <Label htmlFor={name} className="text-sm font-medium">
            {label}
          </Label>
        )}
      </div>
      {description && (
        <div className="text-sm text-muted-foreground ml-6">
          {description}
        </div>
      )}
      {error && (
        <div className="text-sm text-destructive ml-6">
          {error}
        </div>
      )}
    </div>
  )
}

interface AdminFormSwitchProps extends FormFieldProps {
  description?: string
}

export function AdminFormSwitch({ 
  name, 
  label, 
  description, 
  error, 
  className,
  ...props 
}: AdminFormSwitchProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          {label && (
            <Label htmlFor={name} className="text-sm font-medium">
              {label}
            </Label>
          )}
          {description && (
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {/* <Switch
          id={name}
          name={name}
          className={cn(
            'admin-form-instant',
            error && 'border-destructive'
          )}
          {...props}
        /> */}
      </div>
      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
} 