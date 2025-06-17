"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Shield,
  Target,
  Users,
  CreditCard,
  Monitor,
  AlertTriangle,
  Info,
  ArrowRight,
  Building2,
  Workflow,
  Eye,
  Send,
  Link as LinkIcon,
  DollarSign
} from "lucide-react";
import Link from "next/link";

export default function WorkflowGuidePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Workflow className="h-8 w-8 text-[#c4b5fd]" />
            Admin Workflow Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Step-by-step instructions for managing client applications and account provisioning
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>Jump to specific workflow sections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="#application-review" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Application Review
              </Button>
            </a>
            <a href="#account-provisioning" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Account Provisioning
              </Button>
            </a>
            <a href="#infrastructure-setup" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Monitor className="h-4 w-4 mr-2" />
                Infrastructure Setup
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Application Review Workflow */}
      <Card id="application-review">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            1. Application Review Workflow
          </CardTitle>
          <CardDescription>
            How to review and approve client business applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Review New Applications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Check the Applications page for new submissions requiring review.
                </p>
                <div className="flex gap-2">
                  <Link href="/admin/applications">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Applications
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Check Landing Page</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visit the client's website to verify it's legitimate and doesn't promote anything illegal.
                </p>
                <Alert className="mb-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>What to look for:</strong> Professional website, clear business purpose, no illegal content, contact information present.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Make Decision</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Approve or reject the application based on your review.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Reject Application
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Assign Profile Set & Business Manager</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Before submitting to provider, assign a Profile Set and Business Manager from inventory.
                </p>
                <Alert className="mb-3 border-purple-200 bg-purple-50">
                  <Info className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Required:</strong> Each client needs 1 BM from a Profile Set (3 FB profiles: 1 main + 2 backups). Max 20 BMs per Profile Set.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Link href="/admin/assets">
                    <Button size="sm" variant="outline">
                      <Building2 className="h-4 w-4 mr-2" />
                      View Assets
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Submit to Provider
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Provisioning Workflow */}
      <Card id="account-provisioning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-green-600" />
            2. Account Provisioning Workflow
          </CardTitle>
          <CardDescription>
            Complete workflow from provider submission to client delivery via Dolphin Cloud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Receive Accounts from Provider</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Typically takes 1-3 business days. Mark accounts as received in the admin panel.
                </p>
                <Badge variant="secondary" className="mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  1-3 Business Days
                </Badge>
                <Alert className="mb-3 border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Important:</strong> Account provider only processes applications Monday-Friday. Weekend submissions will be processed on Monday.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Connect Business Manager to Dolphin Cloud</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Ensure the assigned BM is properly connected to Dolphin Cloud for monitoring and management.
                </p>
                <div className="space-y-2">
                  <a 
                    href="https://cloud.dolphin.tech" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Open Dolphin Cloud
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> BM must be connected to Dolphin Cloud before adding ad accounts. This enables monitoring and invite link generation.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Add Ad Accounts to Business Manager</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use Dolphin Cloud to add the received ad accounts to the client's assigned business manager.
                </p>
                <Alert className="mb-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Steps in Dolphin Cloud:</strong> Navigate to Business Managers → Select client BM → Add Ad Accounts → Enter account IDs from provider
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Generate & Send Business Manager Invite</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Generate an invite link via Dolphin Cloud and send it to the client to complete the setup.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Generate Invite Link
                  </Button>
                  <Link href="/admin/applications">
                    <Button size="sm" variant="outline">
                      <Building2 className="h-4 w-4 mr-2" />
                      Manage in Applications
                    </Button>
                  </Link>
                </div>
                <Alert className="mt-3 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Final Step:</strong> Once invite is sent and client accepts, mark application as completed.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Send Invite to Client</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Email the business manager invite link to the client with setup instructions.
                </p>
                <Button size="sm" variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Client Email
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure Setup Workflow */}
      <Card id="infrastructure-setup">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-6 w-6 text-purple-600" />
            3. Infrastructure Setup & Monitoring
          </CardTitle>
          <CardDescription>
            How to set up and monitor the underlying infrastructure (for advanced operations)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">1</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Set Up Facebook Profiles (Manual)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create and manage Facebook profiles in Dolphin Anty browser for anti-detection.
                </p>
                <div className="space-y-2">
                  <a 
                    href="https://anty.dolphin-software.online" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Open Dolphin Anty
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Best Practice:</strong> Maintain 3 Facebook profiles per Business Manager for redundancy.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Purchase Business Managers</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Buy business managers from suppliers and add them to Facebook profiles.
                </p>
                <Alert className="mb-3 border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Manual Process:</strong> This requires human coordination with BM suppliers.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Connect to Dolphin Cloud</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  "Hook up" the Facebook profiles and business managers to Dolphin Cloud for monitoring.
                </p>
                <div className="flex gap-2">
                  <a 
                    href="https://cloud.dolphin.tech" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline">
                      <Globe className="h-4 w-4 mr-2" />
                      Open Dolphin Cloud
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                  <Link href="/admin/infrastructure">
                    <Button size="sm" variant="outline">
                      <Monitor className="h-4 w-4 mr-2" />
                      Monitor Infrastructure
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Monitor Health & Status</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Regularly check the infrastructure dashboard for account health and issues.
                </p>
                <Link href="/admin/infrastructure">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Monitor className="h-4 w-4 mr-2" />
                    View Infrastructure Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-yellow-600" />
            4. Ongoing Client Management
          </CardTitle>
          <CardDescription>
            Managing client relationships and account top-ups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Client Top-ups</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  When clients add funds, ensure their ad accounts are topped up (minus our fee).
                </p>
                <Link href="/admin/finances">
                  <Button size="sm" variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Finances
                  </Button>
                </Link>
              </div>
              
              <div className="p-4 border border-border rounded-lg">
                <h3 className="font-semibold mb-2">Account Monitoring</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Monitor client ad accounts for bans, restrictions, or performance issues.
                </p>
                <Link href="/admin/infrastructure">
                  <Button size="sm" variant="outline">
                    <Monitor className="h-4 w-4 mr-2" />
                    Monitor Accounts
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            Emergency Procedures
          </CardTitle>
          <CardDescription>
            What to do when things go wrong
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Account Banned:</strong> Immediately check Dolphin Cloud for replacement accounts. Contact client within 2 hours with update.
              </AlertDescription>
            </Alert>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Business Manager Restricted:</strong> Use backup profiles to regain access. If unsuccessful, provision new BM.
              </AlertDescription>
            </Alert>
            
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Client Complaint:</strong> Escalate to senior admin immediately. Document all communication in client notes.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 