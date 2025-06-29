#!/usr/bin/env node

/**
 * 🚨 SMART PRODUCTION READINESS AUDIT SCRIPT v2.0
 * 
 * This script intelligently finds REAL production issues by:
 * - Ignoring comments and legitimate code patterns
 * - Focusing on actual problematic code execution
 * - Distinguishing between development fallbacks and hardcoded values
 * - Allowing legitimate error logging
 */

const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Smart audit patterns - only flag REAL issues
const SMART_AUDIT_PATTERNS = {
  'ACTUAL_MOCK_IMPORTS': {
    patterns: [
      'import.*mock.*from',
      'require.*mock',
      'import.*from.*mock-data',
      'from.*\\/mock\\/',
    ],
    severity: 'CRITICAL',
    description: 'Actual mock data imports that will execute in production',
    excludePatterns: ['// import', '/* import', '\\* import']
  },
  
  'HARDCODED_DEMO_VALUES': {
    patterns: [
      'const.*=.*"demo-',
      'let.*=.*"demo-',
      'organizationId.*=.*"demo',
      'userId.*=.*"demo',
      '"demo-org-123"',
      '"demo-user-456"'
    ],
    severity: 'HIGH',
    description: 'Hardcoded demo values in production code',
    excludePatterns: ['// ', '/* ', '\\* ']
  },
  
  'PRODUCTION_CONSOLE_LOGS': {
    patterns: [
      'console\\.log\\(',
      'console\\.debug\\('
    ],
    severity: 'MEDIUM',
    description: 'Console.log statements that should be removed for production',
    excludePatterns: [
      '// console',
      '/* console',
      '\\* console',
      'console\\.error',
      'console\\.warn',
      'if.*development.*console',
      'NODE_ENV.*development.*console'
    ]
  },
  
  'UNSAFE_AUTH_BYPASS': {
    patterns: [
      'bypassAuth.*=.*true',
      'skipAuth.*=.*true',
      'noAuth.*=.*true',
      'authenticated.*=.*true',
      'isAdmin.*=.*true'
    ],
    severity: 'CRITICAL',
    description: 'Authentication bypass code - CRITICAL SECURITY RISK',
    excludePatterns: ['// ', '/* ', '\\* ', 'if.*development']
  },
  
  'HARDCODED_PRODUCTION_URLS': {
    patterns: [
      'http://localhost.*[^)]$',
      'http://127\\.0\\.0\\.1.*[^)]$',
      ':3000[^)]',
      ':8000[^)]'
    ],
    severity: 'HIGH',
    description: 'Hardcoded localhost URLs without environment checks',
    excludePatterns: [
      '// ',
      '/* ',
      '\\* ',
      'fallback',
      'development',
      'IS_DEVELOPMENT',
      'NODE_ENV.*development',
      'process\\.env'
    ]
  },
  
  'ACTUAL_TEST_DATA': {
    patterns: [
      'email.*=.*"test@',
      'email.*=.*"admin@test',
      'password.*=.*"test',
      'apiKey.*=.*"test_'
    ],
    severity: 'HIGH',
    description: 'Hardcoded test credentials in production code',
    excludePatterns: ['// ', '/* ', '\\* ', 'placeholder', 'example']
  },
  
  'FORCED_DEMO_MODE': {
    patterns: [
      'USE_DEMO_DATA.*=.*true',
      'DEMO_MODE.*=.*true',
      'isDemoMode.*=.*true'
    ],
    severity: 'CRITICAL',
    description: 'Demo mode forced to true in production',
    excludePatterns: [
      '// ',
      '/* ',
      '\\* ',
      'process\\.env',
      'NODE_ENV.*development',
      'if.*development'
    ]
  }
}

// Files to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const EXCLUDE_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 
  '__tests__', 'test', 'tests', 'coverage',
  'archive', 'docs', 'scripts'
]
const EXCLUDE_FILES = ['.test.', '.spec.', '.stories.', 'test.', 'spec.', '.d.ts']

class SmartProductionAudit {
  constructor() {
    this.results = {}
    this.totalIssues = 0
    this.criticalIssues = 0
    this.highIssues = 0
    this.mediumIssues = 0
    this.lowIssues = 0
    this.scannedFiles = 0
  }

  // Get all files to scan
  getAllFiles(dir = 'src', allFiles = []) {
    if (!fs.existsSync(dir)) return allFiles
    
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        if (!EXCLUDE_DIRS.some(excludeDir => file === excludeDir || file.includes(excludeDir))) {
          this.getAllFiles(fullPath, allFiles)
        }
      } else {
        const ext = path.extname(file)
        const shouldInclude = SCAN_EXTENSIONS.includes(ext) && 
                            !EXCLUDE_FILES.some(excludeFile => file.includes(excludeFile))
        
        if (shouldInclude) {
          allFiles.push(fullPath)
        }
      }
    }
    
    return allFiles
  }

  // Check if a line should be excluded based on exclude patterns
  shouldExcludeLine(line, excludePatterns) {
    if (!excludePatterns) return false
    
    return excludePatterns.some(excludePattern => {
      const regex = new RegExp(excludePattern, 'i')
      return regex.test(line)
    })
  }

  // Scan a single file for patterns
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      const fileResults = {}
      
      for (const [category, config] of Object.entries(SMART_AUDIT_PATTERNS)) {
        fileResults[category] = []
        
        for (const pattern of config.patterns) {
          const regex = new RegExp(pattern, 'gi')
          
          lines.forEach((line, index) => {
            const matches = line.match(regex)
            if (matches) {
              // Check if this line should be excluded
              if (!this.shouldExcludeLine(line, config.excludePatterns)) {
                fileResults[category].push({
                  line: index + 1,
                  content: line.trim(),
                  matches: matches,
                  severity: config.severity
                })
              }
            }
          })
        }
      }
      
      return fileResults
    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message)
      return {}
    }
  }

  // Run the audit
  async runAudit() {
    console.log(`${colors.cyan}🔍 Smart Production Readiness Audit v2.0${colors.reset}`)
    console.log('Scanning for REAL production issues...\n')
    
    const files = this.getAllFiles()
    console.log(`Found ${files.length} files to scan\n`)
    
    let processedFiles = 0
    
    for (const filePath of files) {
      const fileResults = this.scanFile(filePath)
      let hasIssues = false
      
      for (const [category, issues] of Object.entries(fileResults)) {
        if (issues.length > 0) {
          if (!this.results[filePath]) {
            this.results[filePath] = {}
          }
          this.results[filePath][category] = issues
          hasIssues = true
          
          // Count issues by severity
          issues.forEach(issue => {
            this.totalIssues++
            switch (issue.severity) {
              case 'CRITICAL': this.criticalIssues++; break
              case 'HIGH': this.highIssues++; break
              case 'MEDIUM': this.mediumIssues++; break
              case 'LOW': this.lowIssues++; break
            }
          })
        }
      }
      
      processedFiles++
      if (processedFiles % 50 === 0) {
        console.log(`Scanned ${processedFiles}/${files.length} files...`)
      }
    }
    
    this.scannedFiles = processedFiles
    console.log(`\nScanned ${this.scannedFiles} files total\n`)
  }

  // Generate summary
  generateSummary() {
    console.log(`${colors.bright}📊 SMART AUDIT RESULTS${colors.reset}\n`)
    
    console.log('SUMMARY:')
    console.log(`Critical Issues: ${this.getSeverityColor('CRITICAL')}${this.criticalIssues}${colors.reset}`)
    console.log(`High Issues: ${this.getSeverityColor('HIGH')}${this.highIssues}${colors.reset}`)
    console.log(`Medium Issues: ${this.getSeverityColor('MEDIUM')}${this.mediumIssues}${colors.reset}`)
    console.log(`Low Issues: ${this.getSeverityColor('LOW')}${this.lowIssues}${colors.reset}`)
    console.log(`Total Issues: ${colors.bright}${this.totalIssues}${colors.reset}\n`)
    
    // Production readiness assessment
    if (this.criticalIssues > 0) {
      console.log(`${colors.red}🚨 PRODUCTION STATUS: BLOCKED${colors.reset}`)
      console.log('Critical issues found - DO NOT DEPLOY to production!\n')
    } else if (this.highIssues > 0) {
      console.log(`${colors.yellow}⚠️  PRODUCTION STATUS: CAUTION${colors.reset}`)
      console.log('High priority issues found - strongly recommend fixing before production\n')
    } else if (this.mediumIssues > 0) {
      console.log(`${colors.blue}ℹ️  PRODUCTION STATUS: REVIEW${colors.reset}`)
      console.log('Medium priority issues found - review before production\n')
    } else {
      console.log(`${colors.green}✅ PRODUCTION STATUS: READY${colors.reset}`)
      console.log('No critical issues found - safe for production deployment!\n')
    }
  }

  // Get color for severity
  getSeverityColor(severity) {
    switch (severity) {
      case 'CRITICAL': return colors.red
      case 'HIGH': return colors.yellow
      case 'MEDIUM': return colors.blue
      case 'LOW': return colors.cyan
      default: return colors.reset
    }
  }

  // Generate detailed report
  generateDetailedReport() {
    if (this.totalIssues === 0) {
      console.log(`${colors.green}🎉 No production issues found! Your app is ready for deployment.${colors.reset}`)
      return
    }

    console.log(`${colors.bright}DETAILED BREAKDOWN:${colors.reset}\n`)
    
    // Group by category
    const categoryStats = {}
    
    for (const [filePath, categories] of Object.entries(this.results)) {
      for (const [category, issues] of Object.entries(categories)) {
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, files: new Set() }
        }
        categoryStats[category].count += issues.length
        categoryStats[category].files.add(filePath)
      }
    }
    
    // Print category summary
    for (const [category, stats] of Object.entries(categoryStats)) {
      const config = SMART_AUDIT_PATTERNS[category]
      console.log(`${config.description}`)
      console.log(`Found: ${this.getSeverityColor(config.severity)}${stats.count} issues${colors.reset} in ${stats.files.size} files\n`)
    }
    
    // Print top files with issues
    const fileIssueCount = {}
    for (const [filePath, categories] of Object.entries(this.results)) {
      let totalFileIssues = 0
      for (const issues of Object.values(categories)) {
        totalFileIssues += issues.length
      }
      fileIssueCount[filePath] = totalFileIssues
    }
    
    const topFiles = Object.entries(fileIssueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
    
    if (topFiles.length > 0) {
      console.log('FILES WITH MOST ISSUES:')
      topFiles.forEach(([filePath, count]) => {
        console.log(`  ${count} issues: ${filePath}`)
      })
      console.log()
    }
  }

  // Save detailed report to file
  saveDetailedReport() {
    const reportPath = path.join(process.cwd(), 'SMART_PRODUCTION_AUDIT.md')
    let report = '# 🚨 Smart Production Readiness Audit Report\n\n'
    
    report += `Generated: ${new Date().toISOString()}\n\n`
    
    report += '## Summary\n\n'
    report += '| Severity | Count |\n'
    report += '|----------|-------|\n'
    report += `| Critical | ${this.criticalIssues} |\n`
    report += `| High | ${this.highIssues} |\n`
    report += `| Medium | ${this.mediumIssues} |\n`
    report += `| Low | ${this.lowIssues} |\n`
    report += `| **Total** | **${this.totalIssues}** |\n\n`
    
    if (this.totalIssues === 0) {
      report += '## ✅ Production Status: READY\n\n'
      report += 'No production issues found! Your app is ready for deployment.\n'
    } else {
      // Add detailed issues
      for (const [filePath, categories] of Object.entries(this.results)) {
        report += `### ${filePath}\n\n`
        
        for (const [category, issues] of Object.entries(categories)) {
          const config = SMART_AUDIT_PATTERNS[category]
          report += `#### ${category} (${config.severity})\n`
          report += `${config.description}\n\n`
          
          issues.forEach(issue => {
            report += `- Line ${issue.line}: \`${issue.content}\`\n`
          })
          report += '\n'
        }
      }
    }
    
    fs.writeFileSync(reportPath, report)
    console.log(`📄 Detailed report saved to: ${reportPath}`)
  }
}

// Main execution
async function main() {
  const audit = new SmartProductionAudit()
  
  try {
    await audit.runAudit()
    audit.generateSummary()
    audit.generateDetailedReport()
    audit.saveDetailedReport()
    
    // Exit with appropriate code
    if (audit.criticalIssues > 0) {
      process.exit(1) // Block deployment
    } else if (audit.highIssues > 0) {
      process.exit(2) // Warning
    } else {
      process.exit(0) // Success
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Audit failed:${colors.reset}`, error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = SmartProductionAudit 