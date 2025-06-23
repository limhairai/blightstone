"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import React from 'react';
import AccessCodeManager from '../../../components/admin/AccessCodeManager';

export default function AccessCodesPage() {
  // For demo mode, we'll use a mock organization ID
  const organizationId = "demo-org-123";

  return (
    <AccessCodeManager organizationId={organizationId} organizationName="Demo Organization" />
  );
} 