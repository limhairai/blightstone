"use client"

import { useSuperuser } from "../../contexts/SuperuserContext";
import { Loader } from "../../components/core/Loader";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  Activity,
  ExternalLink,
  ArrowRight,
  Monitor,
  Globe,
  Shield,
  Zap,
  Target,
  BarChart3,
  UserCheck,
  Workflow,
  Eye,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";
import { adminMockData } from "../../lib/mock-data/admin-mock-data";

export default function AdminDashboardPage() {
  const { isSuperuser, loading, error } = useSuperuser();

  if (loading) return <Loader fullScreen />;
  if (error) return <div className="text-red-500 p-4">Error resolving superuser status: {error}</div>;
  if (!isSuperuser) return <div className="text-red-500 p-4">Not authorized to view Admin Dashboard.</div>;

  // Get real data from mock system
  const allClients = adminMockData.getClients();
  const allApplications = adminMockData.getApplications();
  const allTransactions = adminMockData.getTransactions();
  const allBusinesses = adminMockData.getBusinesses();

  // Calculate realistic metrics
  const metrics = useMemo(() => {
    // Client metrics
    const totalClients = allClients.length;
    const activeClients = allClients.filter(c => c.status === 'active').length;
    const totalRevenue = allTransactions
      .filter(t => t.type === 'commission' || t.type === 'fee')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyRevenue = totalRevenue * 0.3; // Approximate monthly

    // Application metrics - separate business and ad account applications
    const businessApplications = allApplications.filter(a => a.type === 'new_business');
    const adAccountApplications = allApplications.filter(a => a.type === 'ad_account');
    const totalApplications = allApplications.length;
    const pendingApplications = allApplications.filter(a => 
      a.stage === 'received' || a.stage === 'document_prep' || a.stage === 'submitted' || a.stage === 'under_review'
    ).length;

    // Business metrics
    const totalBusinesses = allBusinesses.length;
    const activeBusinesses = allBusinesses.filter(b => b.status === 'active').length;

    // Ad account metrics - max 6 per business
    const totalAdAccounts = allBusinesses.reduce((sum, business) => 
      sum + Math.min(business.adAccountCount, 6), 0);

    // Transaction metrics
    const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
    const transactionSuccessRate = allTransactions.length > 0 ? (completedTransactions / allTransactions.length) * 100 : 0;

    return {
      clients: { total: totalClients, active: activeClients },
      revenue: { total: totalRevenue, monthly: monthlyRevenue },
      applications: { 
        total: totalApplications, 
        pending: pendingApplications,
        business: businessApplications.length,
        adAccount: adAccountApplications.length
      },
      businesses: { total: totalBusinesses, active: activeBusinesses },
      adAccounts: { total: totalAdAccounts },
      transactions: { total: allTransactions.length, successRate: transactionSuccessRate }
    };
  }, [allClients, allApplications, allTransactions, allBusinesses]);

  // Recent applications for pipeline
  const recentApplications = allApplications
    .filter(a => a.stage === 'received' || a.stage === 'document_prep' || a.stage === 'submitted' || a.stage === 'under_review')
    .slice(0, 5);

  // Recent activity
  const recentActivity = allApplications
    .filter(a => a.stage === 'approved')
    .slice(0, 4);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Key Metrics - matching your admin panel card style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{metrics.clients.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.clients.active} active
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.revenue.monthly)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(metrics.revenue.total)} total
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Business Applications</p>
                <p className="text-2xl font-bold">{metrics.applications.business}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ad Account Applications</p>
                <p className="text-2xl font-bold">{metrics.applications.adAccount}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Application Pipeline */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Application Pipeline</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Client applications requiring action
                </CardDescription>
              </div>
              <Link href="/admin/applications">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentApplications.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    All applications processed! 🎉
                  </p>
                </div>
              ) : (
                recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{application.businessName}</p>
                        <p className="text-sm text-muted-foreground">
                          {application.type.replace('_', ' ')} • {formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {application.stage.replace('_', ' ')}
                      </Badge>
                      <Link href={`/admin/applications/${application.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Common admin tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/applications" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3">
                  <FileText className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Applications</div>
                    <div className="text-xs text-muted-foreground">Review pending applications</div>
                  </div>
                  {metrics.applications.pending > 0 && (
                    <Badge className="ml-auto bg-red-100 text-red-800 text-xs">
                      {metrics.applications.pending}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link href="/admin/organizations" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3">
                  <Users className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Organizations</div>
                    <div className="text-xs text-muted-foreground">Manage client organizations</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/assets" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3">
                  <Building2 className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Assets</div>
                    <div className="text-xs text-muted-foreground">Business manager assets</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/finances" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3">
                  <DollarSign className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Finances</div>
                    <div className="text-xs text-muted-foreground">Financial transactions</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/analytics" className="block">
                <Button variant="outline" className="w-full justify-start h-auto p-3">
                  <BarChart3 className="h-4 w-4 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Analytics</div>
                    <div className="text-xs text-muted-foreground">Performance metrics</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}