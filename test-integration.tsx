"use client";

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export function DolphinIntegrationTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Fetch Unassigned Assets
      testResults.push({
        name: 'Fetch Unassigned Assets',
        status: 'pending',
        message: 'Fetching assets from backend...'
      });
      setResults([...testResults]);

      const assetsResponse = await fetch('/api/admin/assets?assigned=false');
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        testResults[0] = {
          name: 'Fetch Unassigned Assets',
          status: 'success',
          message: `Found ${assetsData.assets?.length || 0} unassigned assets`,
          data: assetsData
        };
      } else {
        testResults[0] = {
          name: 'Fetch Unassigned Assets',
          status: 'error',
          message: `Assets API failed: ${assetsResponse.status}`
        };
      }

      // Test 2: Test Dolphin Cloud Sync
      testResults.push({
        name: 'Dolphin Cloud Sync',
        status: 'pending',
        message: 'Testing sync with Dolphin Cloud...'
      });
      setResults([...testResults]);

      const syncResponse = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'discover' })
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        testResults[1] = {
          name: 'Dolphin Cloud Sync',
          status: 'success',
          message: `Sync successful: ${syncData.message || 'OK'}`,
          data: syncData
        };
      } else {
        const errorData = await syncResponse.json();
        testResults[1] = {
          name: 'Dolphin Cloud Sync',
          status: 'error',
          message: errorData.detail || 'Sync failed'
        };
      }

      setResults([...testResults]);
      
      const successCount = testResults.filter(r => r.status === 'success').length;
      const totalCount = testResults.length;
      
      if (successCount === totalCount) {
        toast.success(`All ${totalCount} tests passed! Integration is working.`);
      } else {
        toast.warning(`${successCount}/${totalCount} tests passed. Check failed tests.`);
      }

    } catch (error) {
      toast.error('Test suite failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Dolphin Cloud Integration Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={testing}>
          {testing ? 'Running...' : 'Run Test'}
        </Button>
        
        {results.map((result, index) => (
          <div key={index} className="mt-2 p-2 border rounded">
            <div>{result.name}: {result.message}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 