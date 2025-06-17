"use client"

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, Workflow, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { adminMockData } from '../../../lib/mock-data/admin-mock-data';

export default function WorkflowPage() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Get real application data
  const allApplications = adminMockData.getApplications();

  // Group applications by stage
  const applicationsByStage = useMemo(() => {
    const stages = ['received', 'document_prep', 'submitted', 'under_review', 'approved', 'rejected'];
    
    return stages.reduce((acc, stage) => {
      acc[stage] = allApplications.filter(app => app.stage === stage);
      return acc;
    }, {} as Record<string, any[]>);
  }, [allApplications]);

  // Calculate stage statistics
  const stageStats = useMemo(() => {
    return Object.entries(applicationsByStage).map(([stage, applications]) => ({
      stage,
      count: applications.length,
      percentage: (applications.length / allApplications.length) * 100
    }));
  }, [applicationsByStage, allApplications.length]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "received":
        return "bg-gray-100 text-gray-800";
      case "document_prep":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-purple-100 text-purple-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "received":
        return <FileText className="h-4 w-4" />;
      case "document_prep":
        return <Clock className="h-4 w-4" />;
      case "submitted":
        return <FileText className="h-4 w-4" />;
      case "under_review":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatStageName = (stage: string) => {
    return stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stage Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stageStats.map(({ stage, count, percentage }) => (
          <Card 
            key={stage} 
            className={`border-border cursor-pointer transition-all hover:shadow-md ${
              selectedStage === stage ? 'ring-2 ring-[#c4b5fd]' : ''
            }`}
            onClick={() => setSelectedStage(selectedStage === stage ? null : stage)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStageIcon(stage)}
                  <span className="text-sm font-medium">{formatStageName(stage)}</span>
                </div>
              </div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Details */}
      {selectedStage && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStageIcon(selectedStage)}
              {formatStageName(selectedStage)} Applications
              <Badge className={getStageColor(selectedStage)}>
                {applicationsByStage[selectedStage].length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applicationsByStage[selectedStage].slice(0, 10).map((application) => (
                <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{application.clientName}</div>
                      <div className="text-sm text-muted-foreground">{application.businessName}</div>
                      <Badge variant="outline" className="text-xs">
                        {application.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Created: {formatDate(application.createdAt)} • 
                      Updated: {formatDate(application.lastUpdated)} • 
                      Provider: {application.provider}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${
                      application.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      application.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      application.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {application.priority}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
              
              {applicationsByStage[selectedStage].length > 10 && (
                <div className="text-center py-4">
                  <Button variant="outline">
                    View All {applicationsByStage[selectedStage].length} Applications
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Processing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Applications</span>
                <span className="font-medium">{allApplications.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Completed</span>
                <span className="font-medium text-green-600">
                  {applicationsByStage.approved?.length + applicationsByStage.rejected?.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In Progress</span>
                <span className="font-medium text-yellow-600">
                  {applicationsByStage.received?.length + 
                   applicationsByStage.document_prep?.length + 
                   applicationsByStage.submitted?.length + 
                   applicationsByStage.under_review?.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Success Rate</span>
                <span className="font-medium">
                  {((applicationsByStage.approved?.length || 0) / 
                    ((applicationsByStage.approved?.length || 0) + (applicationsByStage.rejected?.length || 0)) * 100
                  ).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Processing Time Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                // Calculate time-based priority buckets
                const now = new Date();
                const timeRanges = [
                  { label: 'Overdue (7+ days)', min: 7, color: 'text-red-600' },
                  { label: 'Urgent (4-6 days)', min: 4, max: 6, color: 'text-orange-600' },
                  { label: 'High (2-3 days)', min: 2, max: 3, color: 'text-yellow-600' },
                  { label: 'Normal (0-1 days)', min: 0, max: 1, color: 'text-green-600' }
                ];

                return timeRanges.map(range => {
                  const count = allApplications.filter(app => {
                    if (app.stage === 'approved' || app.stage === 'rejected') return false;
                    
                    const daysSinceCreated = Math.floor(
                      (now.getTime() - new Date(app.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    
                    if (range.max !== undefined) {
                      return daysSinceCreated >= range.min && daysSinceCreated <= range.max;
                    } else {
                      return daysSinceCreated >= range.min;
                    }
                  }).length;

                  const percentage = allApplications.length > 0 ? (count / allApplications.length) * 100 : 0;

                  return (
                    <div key={range.label} className="flex justify-between">
                      <span className="text-sm">{range.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${range.color}`}>{count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 