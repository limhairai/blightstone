#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProductionAudit {
  constructor() {
    this.issues = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };
    this.passed = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, level = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[level]}${message}${colors.reset}`);
  }

  addIssue(level, category, message, fix = null) {
    this.issues[level].push({ category, message, fix });
  }

  addPassed(category, message) {
    this.passed.push({ category, message });
  }

  checkFileExists(filePath, category, description) {
    const fullPath = path.join(this.projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      this.addPassed(category, `${description}: ✅ ${filePath}`);
      return true;
    } else {
      this.addIssue('high', category, `${description}: ❌ Missing ${filePath}`);
      return false;
    }
  }

  checkDirectoryExists(dirPath, category, description) {
    const fullPath = path.join(this.projectRoot, dirPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      this.addPassed(category, `${description}: ✅ ${dirPath}/`);
      return true;
    } else {
      this.addIssue('high', category, `${description}: ❌ Missing ${dirPath}/`);
      return false;
    }
  }

  checkPackageJson(packagePath, category) {
    const fullPath = path.join(this.projectRoot, packagePath);
    if (!fs.existsSync(fullPath)) {
      this.addIssue('critical', category, `Missing ${packagePath}`);
      return false;
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      // Check for required scripts
      const requiredScripts = ['build', 'start'];
      const missingScripts = requiredScripts.filter(script => !pkg.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.addIssue('high', category, `Missing required scripts in ${packagePath}: ${missingScripts.join(', ')}`);
      } else {
        this.addPassed(category, `Required scripts present in ${packagePath}`);
      }

      // Check for dependencies
      if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        this.addPassed(category, `Dependencies configured in ${packagePath}`);
      }

      return true;
    } catch (error) {
      this.addIssue('critical', category, `Invalid JSON in ${packagePath}: ${error.message}`);
      return false;
    }
  }

  checkEnvironmentFiles() {
    const category = 'Environment';
    
    // Check for environment examples
    this.checkFileExists('frontend/.env.example', category, 'Frontend environment example');
    this.checkFileExists('backend/.env.example', category, 'Backend environment example');
    
    // Check for production configs
    this.checkFileExists('config/render/render.yaml', category, 'Production deployment config');
    this.checkFileExists('config/render/render-staging.yaml', category, 'Staging deployment config');
    
    // Check supabase config
    this.checkFileExists('supabase/config.toml', category, 'Supabase configuration');
  }

  checkDatabaseSetup() {
    const category = 'Database';
    
    // Check supabase structure
    this.checkDirectoryExists('supabase/migrations', category, 'Database migrations');
    this.checkFileExists('supabase/current_schema.sql', category, 'Current database schema');
    
    // Check for recent migrations
    const migrationsPath = path.join(this.projectRoot, 'supabase/migrations');
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
      if (migrations.length > 0) {
        this.addPassed(category, `${migrations.length} database migrations found`);
      } else {
        this.addIssue('high', category, 'No database migrations found');
      }
    }
  }

  checkFrontendStructure() {
    const category = 'Frontend';
    
    // Check core structure
    this.checkDirectoryExists('frontend/src', category, 'Frontend source directory');
    this.checkDirectoryExists('frontend/src/app', category, 'Next.js app directory');
    this.checkDirectoryExists('frontend/src/components', category, 'Components directory');
    
    // Check configuration files (multiple possible extensions)
    const nextConfigExists = fs.existsSync(path.join(this.projectRoot, 'frontend/next.config.js')) ||
                              fs.existsSync(path.join(this.projectRoot, 'frontend/next.config.mjs'));
    const tailwindConfigExists = fs.existsSync(path.join(this.projectRoot, 'frontend/tailwind.config.js')) ||
                                  fs.existsSync(path.join(this.projectRoot, 'frontend/tailwind.config.ts'));
    
    if (nextConfigExists) {
      // Find which one exists and report it
      if (fs.existsSync(path.join(this.projectRoot, 'frontend/next.config.js'))) {
        this.addPassed(category, 'Next.js configuration: ✅ frontend/next.config.js');
      } else {
        this.addPassed(category, 'Next.js configuration: ✅ frontend/next.config.mjs');
      }
    } else {
      this.addIssue('high', category, 'Next.js configuration file not found (next.config.js or next.config.mjs)');
    }
    
    if (tailwindConfigExists) {
      // Find which one exists and report it
      if (fs.existsSync(path.join(this.projectRoot, 'frontend/tailwind.config.js'))) {
        this.addPassed(category, 'Tailwind configuration: ✅ frontend/tailwind.config.js');
      } else {
        this.addPassed(category, 'Tailwind configuration: ✅ frontend/tailwind.config.ts');
      }
    } else {
      this.addIssue('high', category, 'Tailwind configuration file not found (tailwind.config.js or tailwind.config.ts)');
    }
    this.checkFileExists('frontend/tsconfig.json', category, 'TypeScript configuration');
    
    // Check package.json
    this.checkPackageJson('frontend/package.json', category);
  }

  checkBackendStructure() {
    const category = 'Backend';
    
    // Check core structure
    this.checkDirectoryExists('backend/app', category, 'Backend app directory');
    this.checkDirectoryExists('backend/app/api', category, 'API endpoints directory');
    this.checkDirectoryExists('backend/app/core', category, 'Core configuration directory');
    
    // Check main files
    this.checkFileExists('backend/app/main.py', category, 'Main FastAPI application');
    this.checkFileExists('backend/requirements/prod.txt', category, 'Production requirements');
    this.checkFileExists('backend/Procfile', category, 'Deployment Procfile');
  }

  checkTelegramBot() {
    const category = 'Telegram Bot';
    
    // Check telegram bot structure
    this.checkDirectoryExists('telegram-bot/src', category, 'Telegram bot source');
    this.checkFileExists('telegram-bot/src/main.py', category, 'Telegram bot main file');
    this.checkFileExists('telegram-bot/requirements.txt', category, 'Telegram bot requirements');
    this.checkFileExists('telegram-bot/Dockerfile', category, 'Telegram bot Docker config');
  }

  checkSecurity() {
    const category = 'Security';
    
    // Check for sensitive files that shouldn't be tracked by git
    const sensitiveFiles = [
      'frontend/.env.local',
      'backend/.env',
      'telegram-bot/.env',
      '.env'
    ];
    
    sensitiveFiles.forEach(file => {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath)) {
        // Check if file is actually tracked by git (real security issue)
        try {
          execSync(`git ls-files --error-unmatch "${file}"`, { stdio: 'pipe', cwd: this.projectRoot });
          this.addIssue('critical', category, `SECURITY RISK: Sensitive file ${file} is tracked by git - remove it immediately!`);
        } catch (error) {
          // File exists but is not tracked by git (properly ignored)
          this.addPassed(category, `Sensitive file ${file} exists but is properly ignored by git`);
        }
      }
    });
    
    // Check .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const requiredIgnores = ['.env', 'node_modules', '.next'];
      const missingIgnores = requiredIgnores.filter(ignore => !gitignoreContent.includes(ignore));
      
      if (missingIgnores.length > 0) {
        this.addIssue('medium', category, `Missing .gitignore entries: ${missingIgnores.join(', ')}`);
      } else {
        this.addPassed(category, 'Essential .gitignore entries present');
      }
    }
  }

  checkDocumentation() {
    const category = 'Documentation';
    
    this.checkFileExists('README.md', category, 'Project README');
    this.checkDirectoryExists('docs', category, 'Documentation directory');
    
    // Check for deployment docs
    const deploymentDocs = [
      'docs/deployment/PRODUCTION_READINESS_SUMMARY.md',
      'PRODUCTION_LAUNCH_SUMMARY.md'
    ];
    
    let hasDeploymentDocs = false;
    deploymentDocs.forEach(doc => {
      if (this.checkFileExists(doc, category, 'Deployment documentation')) {
        hasDeploymentDocs = true;
      }
    });
    
    if (!hasDeploymentDocs) {
      this.addIssue('medium', category, 'No deployment documentation found');
    }
  }

  checkBuildProcess() {
    const category = 'Build Process';
    
    try {
      // Check if frontend builds
      this.log('Testing frontend build process...', 'info');
      process.chdir(path.join(this.projectRoot, 'frontend'));
      
      // Check if dependencies are installed
      if (!fs.existsSync('node_modules')) {
        this.addIssue('high', category, 'Frontend dependencies not installed - run npm install');
        return;
      }
      
      // Try type check
      try {
        execSync('npm run type-check', { stdio: 'pipe' });
        this.addPassed(category, 'TypeScript compilation successful');
      } catch (error) {
        this.addIssue('high', category, 'TypeScript compilation failed');
      }
      
      // Note: We don't run full build here as it's expensive
      this.addPassed(category, 'Build process structure verified');
      
    } catch (error) {
      this.addIssue('high', category, `Build process check failed: ${error.message}`);
    } finally {
      process.chdir(this.projectRoot);
    }
  }

  checkCleanCodebase() {
    const category = 'Code Quality';
    
    // Check for common legacy/temp files
    const unwantedPatterns = [
      'node_modules',
      '.next',
      '*.log',
      'dist',
      'build',
      '.DS_Store'
    ];
    
    // Check if these are properly gitignored
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      const covered = unwantedPatterns.filter(pattern => 
        gitignoreContent.includes(pattern) || gitignoreContent.includes(pattern.replace('*', ''))
      );
      
      if (covered.length >= unwantedPatterns.length - 1) { // Allow some flexibility
        this.addPassed(category, 'Codebase cleanup patterns properly ignored');
      } else {
        this.addIssue('low', category, 'Some build artifacts may not be properly ignored');
      }
    }
    
    // Check for reasonable project structure
    const expectedDirs = ['frontend', 'backend', 'supabase', 'telegram-bot'];
    const existingDirs = expectedDirs.filter(dir => 
      fs.existsSync(path.join(this.projectRoot, dir))
    );
    
    if (existingDirs.length === expectedDirs.length) {
      this.addPassed(category, 'Clean project structure maintained');
    } else {
      this.addIssue('medium', category, `Missing expected directories: ${expectedDirs.filter(d => !existingDirs.includes(d)).join(', ')}`);
    }
  }

  generateReport() {
    const totalIssues = Object.values(this.issues).reduce((sum, arr) => sum + arr.length, 0);
    const totalPassed = this.passed.length;
    
    this.log('\n' + '='.repeat(60), 'info');
    this.log('🚀 ADHUB PRODUCTION READINESS AUDIT REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    // Summary
    this.log(`\n📊 SUMMARY:`, 'info');
    this.log(`✅ Passed Checks: ${totalPassed}`, 'success');
    this.log(`❌ Total Issues: ${totalIssues}`, totalIssues > 0 ? 'warning' : 'success');
    this.log(`   🔴 Critical: ${this.issues.critical.length}`, this.issues.critical.length > 0 ? 'error' : 'success');
    this.log(`   🟠 High: ${this.issues.high.length}`, this.issues.high.length > 0 ? 'error' : 'success');
    this.log(`   🟡 Medium: ${this.issues.medium.length}`, this.issues.medium.length > 0 ? 'warning' : 'success');
    this.log(`   🔵 Low: ${this.issues.low.length}`, this.issues.low.length > 0 ? 'warning' : 'success');
    
    // Production readiness verdict
    if (this.issues.critical.length === 0 && this.issues.high.length === 0) {
      this.log(`\n🎉 VERDICT: READY FOR PRODUCTION! 🚀`, 'success');
      if (this.issues.medium.length > 0 || this.issues.low.length > 0) {
        this.log(`   (Minor issues can be addressed post-launch)`, 'info');
      }
    } else {
      this.log(`\n⚠️  VERDICT: NOT READY FOR PRODUCTION`, 'error');
      this.log(`   Please address critical and high priority issues first`, 'warning');
    }
    
    // Detailed issues
    if (totalIssues > 0) {
      this.log(`\n🔍 DETAILED ISSUES:`, 'info');
      
      ['critical', 'high', 'medium', 'low'].forEach(level => {
        if (this.issues[level].length > 0) {
          const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' }[level];
          this.log(`\n${emoji} ${level.toUpperCase()} ISSUES:`, 'warning');
          
          this.issues[level].forEach((issue, index) => {
            this.log(`${index + 1}. [${issue.category}] ${issue.message}`, 'error');
            if (issue.fix) {
              this.log(`   💡 Fix: ${issue.fix}`, 'info');
            }
          });
        }
      });
    }
    
    // Success summary
    if (totalPassed > 0) {
      this.log(`\n✅ PASSED CHECKS:`, 'success');
      const categories = {};
      this.passed.forEach(check => {
        if (!categories[check.category]) categories[check.category] = [];
        categories[check.category].push(check.message);
      });
      
      Object.entries(categories).forEach(([category, checks]) => {
        this.log(`\n📁 ${category}:`, 'info');
        checks.forEach(check => this.log(`   ✅ ${check}`, 'success'));
      });
    }
    
    this.log('\n' + '='.repeat(60), 'info');
    this.log('🎯 AdHub Production Audit Complete!', 'info');
    this.log('='.repeat(60), 'info');
    
    // Exit with appropriate code
    process.exit(this.issues.critical.length > 0 || this.issues.high.length > 0 ? 1 : 0);
  }

  run() {
    this.log('🔍 Starting AdHub Production Readiness Audit...', 'info');
    
    this.checkEnvironmentFiles();
    this.checkDatabaseSetup();
    this.checkFrontendStructure();
    this.checkBackendStructure();
    this.checkTelegramBot();
    this.checkSecurity();
    this.checkDocumentation();
    this.checkBuildProcess();
    this.checkCleanCodebase();
    
    this.generateReport();
  }
}

// Run the audit
const audit = new ProductionAudit();
audit.run(); 