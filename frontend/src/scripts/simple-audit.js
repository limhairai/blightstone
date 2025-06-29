#!/usr/bin/env node

/**
 * Simple UI State Audit Script
 * Checks components for proper error handling, empty states, etc.
 */

const fs = require('fs')
const path = require('path')

// Components to audit
const COMPONENTS_TO_AUDIT = [
  'src/components/auth/login-view.tsx',
  'src/components/auth/register-view.tsx',
  'src/components/businesses/create-business-dialog.tsx',
  'src/components/businesses/client-businesses-table.tsx',
  'src/components/dashboard/create-ad-account-dialog.tsx',
  'src/components/dashboard/accounts-table.tsx',
  'src/components/wallet/top-up-wallet.tsx',
  'src/components/settings/account-settings.tsx',
  'src/components/admin/approval-dialog.tsx'
]

// Patterns to check for
const PATTERNS = {
  loading: [/loading/i, /isLoading/i, /setLoading/i, /Loader/, /skeleton/i, /animate-spin/],
  error: [/error/i, /Error/, /setError/i, /catch/, /try.*catch/, /destructive/],
  empty: [/empty/i, /EmptyState/, /NoData/, /no.*found/i, /length.*===.*0/, /\.length.*0/],
  validation: [/validation/i, /validate/i, /isValid/i, /errors\./, /required/i],
  success: [/success/i, /Success/, /completed/i, /toast.*success/i],
  toast: [/toast/i, /Toast/, /useToast/, /sonner/]
}

function hasPattern(code, patterns) {
  return patterns.some(pattern => pattern.test(code))
}

function auditComponent(componentPath) {
  try {
    const fullPath = path.join(process.cwd(), componentPath)
    if (!fs.existsSync(fullPath)) {
      return { error: 'File not found' }
    }
    
    const code = fs.readFileSync(fullPath, 'utf-8')
    const componentName = path.basename(componentPath, '.tsx')
    
    const states = {
      hasLoadingState: hasPattern(code, PATTERNS.loading),
      hasErrorState: hasPattern(code, PATTERNS.error),
      hasEmptyState: hasPattern(code, PATTERNS.empty),
      hasValidation: hasPattern(code, PATTERNS.validation),
      hasSuccessState: hasPattern(code, PATTERNS.success),
      hasToast: hasPattern(code, PATTERNS.toast)
    }
    
    const issues = []
    
    // Check for async operations without loading states
    if (/async|await|\.then\(|Promise|fetch\(|api\./i.test(code) && !states.hasLoadingState) {
      issues.push('Missing loading state for async operations')
    }
    
    // Check for data fetching without error handling
    if (/fetch\(|axios|api\.|getData|fetchData/i.test(code) && !states.hasErrorState) {
      issues.push('Missing error handling for data fetching')
    }
    
    // Check for data display without empty states
    if (/\.map\(|Table|List|Grid|data\.|items\./i.test(code) && !states.hasEmptyState) {
      issues.push('Missing empty state for data display')
    }
    
    // Check for forms without validation
    if (/form|Form|input|Input|onSubmit|handleSubmit/i.test(code) && !states.hasValidation) {
      issues.push('Missing form validation')
    }
    
    // Calculate score
    const stateCount = Object.values(states).filter(Boolean).length
    const totalStates = Object.keys(states).length
    const score = Math.round((stateCount / totalStates) * 100 - (issues.length * 10))
    
    return {
      component: componentName,
      file: componentPath,
      states,
      issues,
      score: Math.max(0, score)
    }
  } catch (error) {
    return { error: error.message }
  }
}

function runAudit() {
  console.log('🔍 Starting UI State Audit...\n')
  
  const results = []
  
  for (const componentPath of COMPONENTS_TO_AUDIT) {
    const result = auditComponent(componentPath)
    
    if (result.error) {
      console.log(`❌ Error auditing ${componentPath}: ${result.error}`)
      continue
    }
    
    results.push(result)
    
    const status = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'
    console.log(`${status} ${result.component}: ${result.score}/100 (${result.issues.length} issues)`)
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   • ${issue}`)
      })
    }
  }
  
  // Summary
  if (results.length > 0) {
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
    
    console.log(`\n📈 Summary:`)
    console.log(`   Components Audited: ${results.length}`)
    console.log(`   Average Score: ${avgScore.toFixed(1)}/100`)
    console.log(`   Total Issues: ${totalIssues}`)
    
    if (avgScore < 70) {
      console.log(`\n⚠️  Your UI state handling needs improvement!`)
      console.log(`   Focus on adding proper error handling, loading states, and empty states.`)
    } else if (avgScore < 85) {
      console.log(`\n👍 Good job! Some improvements needed for production readiness.`)
    } else {
      console.log(`\n🎉 Excellent! Your components have robust UI state handling.`)
    }
    
    // Generate report
    let report = `# UI State Audit Report\n\n`
    report += `## Summary\n`
    report += `- **Components Audited**: ${results.length}\n`
    report += `- **Average Score**: ${avgScore.toFixed(1)}/100\n`
    report += `- **Total Issues**: ${totalIssues}\n\n`
    
    report += `## Component Scores\n`
    results.sort((a, b) => a.score - b.score).forEach(result => {
      const status = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'
      report += `${status} **${result.component}**: ${result.score}/100\n`
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          report += `   - ${issue}\n`
        })
      }
      report += `\n`
    })
    
    fs.writeFileSync('UI_STATE_AUDIT_REPORT.md', report)
    console.log(`\n📊 Full report saved to: UI_STATE_AUDIT_REPORT.md`)
  }
}

// Run the audit
runAudit() 