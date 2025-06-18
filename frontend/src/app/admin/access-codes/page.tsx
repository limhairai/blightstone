"use client";

import React from 'react';
import AccessCodeManager from '../../../components/admin/AccessCodeManager';

export default function AccessCodesPage() {
  // For demo mode, we'll use a mock organization ID
  const organizationId = "demo-org-123";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Code Management</h1>
        <p className="text-muted-foreground">
          Generate and manage secure access codes for bot authentication
        </p>
      </div>
      
      <AccessCodeManager organizationId={organizationId} organizationName="Demo Organization" />
    </div>
  );
} 