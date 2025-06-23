import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * CSP Violation Reporting Endpoint
 * Receives and processes Content Security Policy violation reports
 */

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string
    referrer: string
    'violated-directive': string
    'original-policy': string
    'blocked-uri': string
    'line-number'?: number
    'column-number'?: number
    'source-file'?: string
    'status-code': number
    'script-sample'?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const report: CSPViolationReport = await request.json()
    const violation = report['csp-report']
    
    // Log the violation
    console.error('CSP Violation:', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      scriptSample: violation['script-sample'],
    })
    
    // Send to Sentry for tracking
    Sentry.captureException(new Error('CSP Violation'), {
      tags: {
        type: 'csp-violation',
        directive: violation['violated-directive'],
      },
      extra: {
        documentUri: violation['document-uri'],
        blockedUri: violation['blocked-uri'],
        sourceFile: violation['source-file'],
        lineNumber: violation['line-number'],
        columnNumber: violation['column-number'],
        originalPolicy: violation['original-policy'],
        scriptSample: violation['script-sample'],
      },
      level: 'warning',
    })
    
    // In production, you might want to store these in a database
    // for analysis and monitoring trends
    
    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (error) {
    console.error('Error processing CSP report:', error)
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 