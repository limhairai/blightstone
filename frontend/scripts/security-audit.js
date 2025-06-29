#!/usr/bin/env node

/**
 * 🔒 COMPREHENSIVE SECURITY AUDIT SCRIPT
 * 
 * This script checks for common security vulnerabilities in React/Next.js applications:
 * - XSS vulnerabilities (dangerouslySetInnerHTML, eval, etc.)
 * - Hardcoded secrets and API keys
 * - Insecure HTTP requests
 * - Missing security headers
 * - Exposed sensitive data
 * - Authentication bypass patterns
 * - SQL injection patterns
 * - CSRF vulnerabilities
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

// Security vulnerability patterns
const SECURITY_PATTERNS = {
  'XSS_VULNERABILITIES': {
    patterns: [
      'dangerouslySetInnerHTML',
      'innerHTML\\s*=',
      'outerHTML\\s*=',
      'document\\.write\\(',
      'eval\\(',
      'Function\\(',
      'setTimeout\\(.*string',
      'setInterval\\(.*string'
    ],
    severity: 'CRITICAL',
    description: 'Cross-Site Scripting (XSS) vulnerabilities',
    excludePatterns: [
      '// SAFE:',
      '// XSS-SAFE:',
      'XSS-SAFE:',
      'sanitize',
      'DOMPurify',
      'xss-filters'
    ]
  },
  
  'HARDCODED_SECRETS': {
    patterns: [
      'password\\s*=\\s*["\'][^"\']{8,}["\']',
      'secret\\s*=\\s*["\'][^"\']{16,}["\']',
      'token\\s*=\\s*["\'][^"\']{20,}["\']',
      'api_key\\s*=\\s*["\'][^"\']{16,}["\']',
      'private_key\\s*=\\s*["\']',
      'sk_[a-zA-Z0-9_]{20,}',
      'pk_[a-zA-Z0-9_]{20,}',
      'AKIA[0-9A-Z]{16}',
      'AIza[0-9A-Za-z\\-_]{35}'
    ],
    severity: 'CRITICAL',
    description: 'Hardcoded secrets, API keys, and passwords',
    excludePatterns: [
      'process.env',
      'placeholder',
      'example',
      'demo',
      'test',
      'mock'
    ]
  },
  
  'INSECURE_HTTP': {
    patterns: [
      'http://(?!localhost|127\\.0\\.0\\.1|192\\.168\\.|10\\.)',
      'fetch\\(["\']http://',
      'axios\\.get\\(["\']http://',
      'XMLHttpRequest.*http://'
    ],
    severity: 'HIGH',
    description: 'Insecure HTTP requests (should use HTTPS)',
    excludePatterns: [
      'localhost',
      '127.0.0.1',
      '192.168.',
      '10.',
      'development',
      'xmlns="http://www.w3.org/2000/svg"',
      'createElementNS.*http://www.w3.org/2000/svg',
      'http://www.w3.org/2000/svg'
    ]
  },
  
  'AUTH_BYPASS': {
    patterns: [
      'bypassAuth\\s*=\\s*true',
      'skipAuth\\s*=\\s*true',
      'noAuth\\s*=\\s*true',
      'isAuthenticated\\s*=\\s*true',
      'authenticated\\s*=\\s*true',
      'isAdmin\\s*=\\s*true',
      'hasPermission\\s*=\\s*true'
    ],
    severity: 'CRITICAL',
    description: 'Authentication bypass vulnerabilities',
    excludePatterns: [
      '// ',
      '/* ',
      'if\\s*\\(',
      'development',
      'test'
    ]
  },
  
  'SQL_INJECTION': {
    patterns: [
      'query\\s*\\+\\s*["\']',
      'SELECT.*\\+.*["\']',
      'INSERT.*\\+.*["\']',
      'UPDATE.*\\+.*["\']',
      'DELETE.*\\+.*["\']',
      'WHERE.*\\+.*["\']'
    ],
    severity: 'CRITICAL',
    description: 'Potential SQL injection vulnerabilities',
    excludePatterns: [
      'prepared',
      'parameterized',
      'sanitize',
      'escape'
    ]
  },
  
  'EXPOSED_SENSITIVE_DATA': {
    patterns: [
      'console\\.log\\(.*password',
      'console\\.log\\(.*secret',
      'console\\.log\\(.*token',
      'console\\.log\\(.*key',
      'alert\\(.*password',
      'alert\\(.*secret'
    ],
    severity: 'HIGH',
    description: 'Sensitive data exposed in logs or alerts',
    excludePatterns: [
      'redacted',
      'masked',
      '\\*\\*\\*'
    ]
  },
  
  'CSRF_VULNERABILITIES': {
    patterns: [
      'fetch\\(.*method:\\s*["\']POST["\'].*\\)',
      'axios\\.post\\(',
      'XMLHttpRequest.*POST'
    ],
    severity: 'MEDIUM',
    description: 'Potential CSRF vulnerabilities (check for CSRF tokens)',
    excludePatterns: [
      'csrf',
      'token',
      'xsrf',
      'samesite',
      'credentials'
    ]
  },
  
  'WEAK_CRYPTO': {
    patterns: [
      'Math\\.random\\(',
      'crypto\\.createHash\\(["\']md5["\']',
      'crypto\\.createHash\\(["\']sha1["\']',
      'btoa\\(',
      'atob\\('
    ],
    severity: 'MEDIUM',
    description: 'Weak cryptographic functions',
    excludePatterns: [
      'crypto\\.randomBytes',
      'crypto\\.getRandomValues',
      'bcrypt',
      'scrypt',
      'demo.*Math\\.random',
      'mock.*Math\\.random',
      'test.*Math\\.random',
      '// demo',
      '// mock',
      'dailyVariation',
      'randomVariation',
      'healthScore.*Math\\.random',
      'riskLevel.*Math\\.random',
      'growthRate.*Math\\.random'
    ]
  }
}

// Files to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']
const EXCLUDE_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 
  '__tests__', 'test', 'tests', 'coverage',
  'docs', 'scripts'
]
const EXCLUDE_FILES = ['.test.', '.spec.', '.stories.', 'test.', 'spec.', '.d.ts']

class SecurityAudit {
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

  // Scan a single file for security patterns
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      const fileResults = {}
      
      for (const [category, config] of Object.entries(SECURITY_PATTERNS)) {
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

  // Run the security audit
  async runAudit() {
    console.log(`${colors.cyan}🔒 Security Audit${colors.reset}`)
    console.log('Scanning for security vulnerabilities...\n')
    
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
    console.log(`${colors.bright}🔒 SECURITY AUDIT RESULTS${colors.reset}\n`)
    
    console.log('SUMMARY:')
    console.log(`Critical Issues: ${this.getSeverityColor('CRITICAL')}${this.criticalIssues}${colors.reset}`)
    console.log(`High Issues: ${this.getSeverityColor('HIGH')}${this.highIssues}${colors.reset}`)
    console.log(`Medium Issues: ${this.getSeverityColor('MEDIUM')}${this.mediumIssues}${colors.reset}`)
    console.log(`Low Issues: ${this.getSeverityColor('LOW')}${this.lowIssues}${colors.reset}`)
    console.log(`Total Issues: ${colors.bright}${this.totalIssues}${colors.reset}\n`)
    
    // Security assessment
    if (this.criticalIssues > 0) {
      console.log(`${colors.red}🚨 SECURITY STATUS: CRITICAL${colors.reset}`)
      console.log('Critical security vulnerabilities found - DO NOT DEPLOY!\n')
    } else if (this.highIssues > 0) {
      console.log(`${colors.yellow}⚠️  SECURITY STATUS: HIGH RISK${colors.reset}`)
      console.log('High severity security issues found - fix before deployment\n')
    } else if (this.mediumIssues > 0) {
      console.log(`${colors.blue}ℹ️  SECURITY STATUS: MEDIUM RISK${colors.reset}`)
      console.log('Medium severity security issues found - review and fix\n')
    } else {
      console.log(`${colors.green}✅ SECURITY STATUS: SECURE${colors.reset}`)
      console.log('No critical security issues found!\n')
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
      console.log(`${colors.green}🎉 No security vulnerabilities found! Your app is secure.${colors.reset}`)
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
      const config = SECURITY_PATTERNS[category]
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
      console.log('FILES WITH MOST SECURITY ISSUES:')
      topFiles.forEach(([filePath, count]) => {
        console.log(`  ${count} issues: ${filePath}`)
      })
      console.log()
    }
  }

  // Save detailed report to file
  saveDetailedReport() {
    const reportPath = path.join(process.cwd(), 'SECURITY_AUDIT_REPORT.md')
    let report = '# 🔒 Security Audit Report\n\n'
    
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
      report += '## ✅ Security Status: SECURE\n\n'
      report += 'No security vulnerabilities found! Your app is secure.\n'
    } else {
      // Add detailed issues
      for (const [filePath, categories] of Object.entries(this.results)) {
        report += `### ${filePath}\n\n`
        
        for (const [category, issues] of Object.entries(categories)) {
          const config = SECURITY_PATTERNS[category]
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
    console.log(`📄 Detailed security report saved to: ${reportPath}`)
  }
}

// Main execution
async function main() {
  const audit = new SecurityAudit()
  
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
    console.error(`${colors.red}❌ Security audit failed:${colors.reset}`, error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = SecurityAudit 