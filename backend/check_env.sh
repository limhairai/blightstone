#!/bin/bash
echo "🔍 Backend Environment Configuration"
echo "=================================================="
source .env 2>/dev/null || echo "⚠️  No .env file found"
echo "Environment: ${ENVIRONMENT:-unknown}"
echo "Debug Mode: ${DEBUG:-false}"
echo "Supabase URL: ${SUPABASE_URL:-not set}"
