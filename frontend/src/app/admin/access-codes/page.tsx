"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import React from 'react';
import AccessCodeManager from '../../../components/admin/AccessCodeManager';

export default function AccessCodesPage() {
  // TODO: Get actual organization ID from context/props
  const organizationId = "org-placeholder";

  return (
    <AccessCodeManager organizationId={organizationId} organizationName="Organization" />
  );
} 