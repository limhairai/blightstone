#!/usr/bin/env node

/**
 * UI State Audit Script
 * Run this to audit your components for proper error handling, empty states, etc.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { auditComponentStates, generateAuditReport, type UIStateAuditResult } from '../lib/ui-state-audit'

// Key components to audit
const COMPONENTS_TO_AUDIT = [
  'src/components/auth/login-view.tsx',
  'src/components/auth/register-view.tsx',
  'src/components/businesses/create-business-dialog.tsx',
  'src/components/businesses/client-businesses-table.tsx',
  'src/components/dashboard/create-ad-account-dialog.tsx',
  'src/components/dashboard/accounts-table.tsx',
  'src/components/wallet/top-up-wallet.tsx',
  'src/components/settings/account-settings.tsx',
  'src/components/admin/approval-dialog.tsx',
  'src/app/dashboard/applications/page.tsx',
  'src/app/dashboard/businesses/page.tsx',
  'src/app/dashboard/accounts/page.tsx'
]

async function runAudit() {
  console.log('🔍 Starting UI State Audit...\n')
  
  const results: UIStateAuditResult[] = []
  
  for (const componentPath of COMPONENTS_TO_AUDIT) {
    try {
      const fullPath = join(process.cwd(), componentPath)
      const code = readFileSync(fullPath, 'utf-8')
      const result = auditComponentStates(code, componentPath)
      results.push(result)
      
      const status = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌'
      console.log(`${status} ${result.component}: ${result.score}/100 (${result.issues.length} issues)`)
      
      // Show critical issues immediately
      const critical = result.issues.filter(i => i.severity === 'critical')
      if (critical.length > 0) {
        console.log(`   🚨 CRITICAL: ${critical.map(i => i.description).join(', ')}`)
      }
      
    } catch (error) {
      console.log(`❌ Error auditing ${componentPath}: ${error}`)
    }
  }
  
  // Generate full report
  const report = generateAuditReport(results)
  const reportPath = join(process.cwd(), 'UI_STATE_AUDIT_REPORT.md')
  writeFileSync(reportPath, report)
  
  console.log(`\n📊 Audit complete! Report saved to: ${reportPath}`)
  
  // Summary
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const criticalCount = results.flatMap(r => r.issues).filter(i => i.severity === 'critical').length
  const highCount = results.flatMap(r => r.issues).filter(i => i.severity === 'high').length
  
  console.log(`\n📈 Summary:`)
  console.log(`   Average Score: ${avgScore.toFixed(1)}/100`)
  console.log(`   Critical Issues: ${criticalCount}`)
  console.log(`   High Priority Issues: ${highCount}`)
  
  if (avgScore < 70) {
    console.log(`\n⚠️  Your UI state handling needs improvement!`)
    console.log(`   Focus on adding proper error handling, loading states, and empty states.`)
  } else if (avgScore < 85) {
    console.log(`\n👍 Good job! Some improvements needed for production readiness.`)
  } else {
    console.log(`\n🎉 Excellent! Your components have robust UI state handling.`)
  }
}

// Quick check function for individual files
export function quickCheck(componentPath: string) {
  try {
    const code = readFileSync(componentPath, 'utf-8')
    const result = auditComponentStates(code, componentPath)
    
    console.log(`\n🔍 Quick Check: ${result.component}`)
    console.log(`Score: ${result.score}/100`)
    console.log(`Issues: ${result.issues.length}`)
    
    if (result.issues.length > 0) {
      console.log(`\nIssues:`)
      result.issues.forEach(issue => {
        const emoji = issue.severity === 'critical' ? '🚨' : 
                     issue.severity === 'high' ? '⚠️' : 
                     issue.severity === 'medium' ? '💡' : 'ℹ️'
        console.log(`  ${emoji} ${issue.description}`)
        console.log(`     Solution: ${issue.suggestion}`)
      })
    }
    
    return result
  } catch (error) {
    console.error(`Error checking ${componentPath}:`, error)
    return null
  }
}

// Run if called directly
if (require.main === module) {
  runAudit().catch(console.error)
} 