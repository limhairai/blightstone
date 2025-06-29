#!/usr/bin/env node

/**
 * Performance Testing Script
 * Measures app performance before and after optimizations
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };
  }

  // Measure bundle size
  async measureBundleSize() {
    const buildDir = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildDir)) {
      console.log('⚠️  No build found. Run `npm run build` first.');
      return null;
    }

    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      });
      
      return totalSize;
    };

    const staticDir = path.join(buildDir, 'static');
    const bundleSize = fs.existsSync(staticDir) ? getDirectorySize(staticDir) : 0;
    
    this.results.metrics.bundleSize = {
      bytes: bundleSize,
      mb: (bundleSize / 1024 / 1024).toFixed(2)
    };

    console.log(`📦 Bundle size: ${this.results.metrics.bundleSize.mb} MB`);
    return bundleSize;
  }

  // Measure dependency count
  measureDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    
    this.results.metrics.dependencies = {
      production: depCount,
      development: devDepCount,
      total: depCount + devDepCount
    };

    console.log(`📚 Dependencies: ${depCount} prod + ${devDepCount} dev = ${depCount + devDepCount} total`);
    return this.results.metrics.dependencies;
  }

  // Analyze package.json for heavy dependencies
  analyzeHeavyDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Known heavy dependencies
    const heavyDeps = [
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
      '@sentry/nextjs',
      '@stripe/stripe-js',
      'next-auth'
    ];

    const foundHeavyDeps = heavyDeps.filter(dep => 
      packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
    );

    this.results.metrics.heavyDependencies = foundHeavyDeps;
    
    console.log(`⚖️  Heavy dependencies found: ${foundHeavyDeps.length}`);
    foundHeavyDeps.forEach(dep => console.log(`   - ${dep}`));
    
    return foundHeavyDeps;
  }

  // Check for optimization opportunities
  checkOptimizations() {
    const optimizations = {
      swrConfig: false,
      nextImageOptimization: false,
      bundleSplitting: false,
      treeshaking: false,
      compression: false
    };

    // Check for SWR config
    const swrConfigPath = path.join(process.cwd(), 'src', 'lib', 'swr-config.ts');
    optimizations.swrConfig = fs.existsSync(swrConfigPath);

    // Check Next.js config
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      optimizations.nextImageOptimization = nextConfig.includes('images:');
      optimizations.bundleSplitting = nextConfig.includes('splitChunks');
      optimizations.treeshaking = nextConfig.includes('removeConsole');
      optimizations.compression = nextConfig.includes('swcMinify');
    }

    this.results.metrics.optimizations = optimizations;
    
    console.log('🔧 Optimizations:');
    Object.entries(optimizations).forEach(([key, enabled]) => {
      console.log(`   ${enabled ? '✅' : '❌'} ${key}`);
    });

    return optimizations;
  }

  // Performance recommendations
  generateRecommendations() {
    const recommendations = [];
    
    // Bundle size recommendations
    if (this.results.metrics.bundleSize?.mb > 5) {
      recommendations.push('📦 Bundle size is large (>5MB). Consider code splitting and tree shaking.');
    }

    // Dependency recommendations
    if (this.results.metrics.dependencies?.total > 100) {
      recommendations.push('📚 High dependency count. Review and remove unused packages.');
    }

    // Heavy dependency recommendations
    if (this.results.metrics.heavyDependencies?.length > 5) {
      recommendations.push('⚖️  Many heavy dependencies. Consider lighter alternatives.');
    }

    // Optimization recommendations
    const opts = this.results.metrics.optimizations;
    if (!opts?.swrConfig) {
      recommendations.push('🔧 Implement centralized SWR configuration for better caching.');
    }
    if (!opts?.nextImageOptimization) {
      recommendations.push('🖼️  Enable Next.js image optimization.');
    }
    if (!opts?.bundleSplitting) {
      recommendations.push('📦 Configure webpack bundle splitting.');
    }

    this.results.recommendations = recommendations;
    
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`   ${rec}`));
    
    return recommendations;
  }

  // Save results to file
  saveResults() {
    const resultsPath = path.join(process.cwd(), 'performance-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📊 Results saved to: ${resultsPath}`);
  }

  // Run all tests
  async runAll() {
    console.log('🚀 Running performance analysis...\n');
    
    const startTime = performance.now();
    
    await this.measureBundleSize();
    this.measureDependencies();
    this.analyzeHeavyDependencies();
    this.checkOptimizations();
    this.generateRecommendations();
    
    const endTime = performance.now();
    this.results.metrics.analysisTime = `${(endTime - startTime).toFixed(2)}ms`;
    
    console.log(`\n⏱️  Analysis completed in ${this.results.metrics.analysisTime}`);
    
    this.saveResults();
    
    return this.results;
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runAll().catch(console.error);
}

module.exports = PerformanceTester; 