/**
 * UI State Audit Tool
 * Analyzes components for proper error handling, empty states, loading states, etc.
 */

export interface UIStateAuditResult {
  component: string
  file: string
  states: {
    hasLoadingState: boolean
    hasErrorState: boolean
    hasEmptyState: boolean
    hasValidation: boolean
    hasSuccessState: boolean
    hasSkeletonLoader: boolean
    hasToastMessages: boolean
    hasFormValidation: boolean
  }
  issues: UIStateIssue[]
  score: number // 0-100
}

export interface UIStateIssue {
  type: 'missing' | 'inconsistent' | 'improvement'
  severity: 'low' | 'medium' | 'high' | 'critical'
  state: 'loading' | 'error' | 'empty' | 'validation' | 'success' | 'toast'
  description: string
  suggestion: string
  location?: string
}

// Component patterns to look for
export const UI_STATE_PATTERNS = {
  loading: [
    /loading/i,
    /isLoading/i,
    /setLoading/i,
    /Loader/,
    /Spinner/,
    /skeleton/i,
    /animate-spin/,
    /animate-pulse/
  ],
  error: [
    /error/i,
    /Error/,
    /setError/i,
    /hasError/i,
    /errorMessage/i,
    /catch/,
    /try.*catch/,
    /\.error/,
    /destructive/,
    /alert.*error/i
  ],
  empty: [
    /empty/i,
    /EmptyState/,
    /NoData/,
    /no.*found/i,
    /length.*===.*0/,
    /\.length.*0/,
    /filteredData.*length/,
    /data.*length.*0/
  ],
  validation: [
    /validation/i,
    /validate/i,
    /isValid/i,
    /errors\./,
    /fieldError/i,
    /required/i,
    /invalid/i,
    /form.*error/i
  ],
  success: [
    /success/i,
    /Success/,
    /completed/i,
    /done/i,
    /green.*check/i,
    /checkmark/i,
    /toast.*success/i
  ],
  toast: [
    /toast/i,
    /Toast/,
    /notification/i,
    /showToast/i,
    /useToast/,
    /sonner/
  ]
}

// Critical components that MUST have proper state handling
export const CRITICAL_COMPONENTS = [
  'login', 'register', 'auth',
  'form', 'dialog', 'modal',
  'table', 'list', 'grid',
  'create', 'edit', 'delete',
  'upload', 'download',
  'payment', 'checkout',
  'dashboard', 'settings'
]

// Audit functions
export function auditComponentStates(componentCode: string, fileName: string): UIStateAuditResult {
  const states = analyzeStates(componentCode)
  const issues = findIssues(componentCode, fileName, states)
  const score = calculateScore(states, issues)

  return {
    component: extractComponentName(fileName),
    file: fileName,
    states,
    issues,
    score
  }
}

function analyzeStates(code: string) {
  return {
    hasLoadingState: hasPattern(code, UI_STATE_PATTERNS.loading),
    hasErrorState: hasPattern(code, UI_STATE_PATTERNS.error),
    hasEmptyState: hasPattern(code, UI_STATE_PATTERNS.empty),
    hasValidation: hasPattern(code, UI_STATE_PATTERNS.validation),
    hasSuccessState: hasPattern(code, UI_STATE_PATTERNS.success),
    hasSkeletonLoader: hasPattern(code, [/Skeleton/, /skeleton/]),
    hasToastMessages: hasPattern(code, UI_STATE_PATTERNS.toast),
    hasFormValidation: hasPattern(code, [/validateForm/, /validation\.errors/, /showValidationErrors/])
  }
}

function hasPattern(code: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(code))
}

function findIssues(code: string, fileName: string, states: any): UIStateIssue[] {
  const issues: UIStateIssue[] = []
  const componentName = extractComponentName(fileName)
  const isCritical = CRITICAL_COMPONENTS.some(critical => 
    componentName.toLowerCase().includes(critical)
  )

  // Check for async operations without loading states
  if (hasAsyncOperations(code) && !states.hasLoadingState) {
    issues.push({
      type: 'missing',
      severity: isCritical ? 'high' : 'medium',
      state: 'loading',
      description: 'Component has async operations but no loading state',
      suggestion: 'Add loading state with LoadingState component or skeleton loader'
    })
  }

  // Check for data fetching without error handling
  if (hasDataFetching(code) && !states.hasErrorState) {
    issues.push({
      type: 'missing',
      severity: 'high',
      state: 'error',
      description: 'Component fetches data but has no error handling',
      suggestion: 'Add error state with ErrorState component and try/catch blocks'
    })
  }

  // Check for lists/tables without empty states
  if (hasDataDisplay(code) && !states.hasEmptyState) {
    issues.push({
      type: 'missing',
      severity: 'medium',
      state: 'empty',
      description: 'Component displays data but has no empty state',
      suggestion: 'Add EmptyState component for when no data is available'
    })
  }

  // Check for forms without validation
  if (hasFormElements(code) && !states.hasFormValidation) {
    issues.push({
      type: 'missing',
      severity: isCritical ? 'high' : 'medium',
      state: 'validation',
      description: 'Form component lacks proper validation',
      suggestion: 'Add form validation using validateForm and showValidationErrors'
    })
  }

  // Check for user actions without feedback
  if (hasUserActions(code) && !states.hasToastMessages && !states.hasSuccessState) {
    issues.push({
      type: 'missing',
      severity: 'medium',
      state: 'toast',
      description: 'User actions lack feedback messages',
      suggestion: 'Add toast messages or success states for user feedback'
    })
  }

  return issues
}

function hasAsyncOperations(code: string): boolean {
  return /async|await|\.then\(|Promise|fetch\(|api\./i.test(code)
}

function hasDataFetching(code: string): boolean {
  return /fetch\(|axios|api\.|useQuery|useMutation|getData|fetchData/i.test(code)
}

function hasDataDisplay(code: string): boolean {
  return /\.map\(|Table|List|Grid|data\.|items\.|results\./i.test(code)
}

function hasFormElements(code: string): boolean {
  return /form|Form|input|Input|textarea|select|Select|onSubmit|handleSubmit/i.test(code)
}

function hasUserActions(code: string): boolean {
  return /onClick|onSubmit|onSave|onCreate|onUpdate|onDelete|handleSave|handleCreate/i.test(code)
}

function calculateScore(states: any, issues: UIStateIssue[]): number {
  let score = 100

  // Deduct points for missing states
  const stateCount = Object.values(states).filter(Boolean).length
  const totalStates = Object.keys(states).length
  const stateScore = (stateCount / totalStates) * 50

  // Deduct points for issues
  const issueDeductions = issues.reduce((total, issue) => {
    switch (issue.severity) {
      case 'critical': return total + 30
      case 'high': return total + 20
      case 'medium': return total + 10
      case 'low': return total + 5
      default: return total
    }
  }, 0)

  score = Math.max(0, stateScore + 50 - issueDeductions)
  return Math.round(score)
}

function extractComponentName(fileName: string): string {
  return fileName.split('/').pop()?.replace(/\.(tsx|ts|jsx|js)$/, '') || 'Unknown'
}

// Audit report generator
export function generateAuditReport(results: UIStateAuditResult[]): string {
  const totalComponents = results.length
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / totalComponents
  const criticalIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'critical').length
  const highIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'high').length

  let report = `# UI State Audit Report\n\n`
  report += `## Summary\n`
  report += `- **Total Components Audited**: ${totalComponents}\n`
  report += `- **Average Score**: ${avgScore.toFixed(1)}/100\n`
  report += `- **Critical Issues**: ${criticalIssues}\n`
  report += `- **High Priority Issues**: ${highIssues}\n\n`

  // Top issues
  const allIssues = results.flatMap(r => r.issues.map(i => ({ ...i, component: r.component })))
  const issuesByType = allIssues.reduce((acc, issue) => {
    acc[issue.state] = (acc[issue.state] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  report += `## Most Common Issues\n`
  Object.entries(issuesByType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([state, count]) => {
      report += `- **${state}**: ${count} components\n`
    })

  report += `\n## Component Scores\n`
  results
    .sort((a, b) => a.score - b.score)
    .forEach(result => {
      const status = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'
      report += `${status} **${result.component}**: ${result.score}/100 (${result.issues.length} issues)\n`
    })

  report += `\n## Recommendations\n`
  if (criticalIssues > 0) {
    report += `### 🚨 Critical (Fix Immediately)\n`
    results.forEach(result => {
      const critical = result.issues.filter(i => i.severity === 'critical')
      if (critical.length > 0) {
        report += `**${result.component}**:\n`
        critical.forEach(issue => {
          report += `- ${issue.description}\n`
          report += `  *Solution*: ${issue.suggestion}\n`
        })
      }
    })
  }

  if (highIssues > 0) {
    report += `### ⚠️ High Priority\n`
    results.forEach(result => {
      const high = result.issues.filter(i => i.severity === 'high')
      if (high.length > 0) {
        report += `**${result.component}**:\n`
        high.forEach(issue => {
          report += `- ${issue.description}\n`
          report += `  *Solution*: ${issue.suggestion}\n`
        })
      }
    })
  }

  return report
}

// Quick audit for specific patterns
export const QUICK_CHECKS = {
  missingLoadingStates: (code: string) => 
    hasAsyncOperations(code) && !hasPattern(code, UI_STATE_PATTERNS.loading),
  
  missingErrorHandling: (code: string) => 
    hasDataFetching(code) && !hasPattern(code, UI_STATE_PATTERNS.error),
  
  missingEmptyStates: (code: string) => 
    hasDataDisplay(code) && !hasPattern(code, UI_STATE_PATTERNS.empty),
  
  missingFormValidation: (code: string) => 
    hasFormElements(code) && !hasPattern(code, UI_STATE_PATTERNS.validation),
  
  missingUserFeedback: (code: string) => 
    hasUserActions(code) && !hasPattern(code, UI_STATE_PATTERNS.toast)
} 