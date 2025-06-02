import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, XCircle, Eye, FileText, User, Calendar, AtSign, LinkIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

export default function RequestDetailsPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch the request details based on the ID
  const requestId = params.id

  // Mock data for demonstration
  const request = {
    id: requestId,
    type: "new_account",
    status: "pending",
    clientName: "Acme Inc.",
    clientEmail: "accounts@acme.com",
    accountName: "Summer Campaign 2025",
    date: "Apr 29, 2025",
    description:
      "We're looking to create a new ad account for our upcoming summer campaign targeting millennials in urban areas. The campaign will focus on our new sustainable product line.",
    landingPage: "https://acme.com/summer-campaign",
    budget: "$10,000.00",
    preferredPlatforms: ["Meta", "Google Ads", "TikTok"],
    screenshots: ["/product-showcase-landing.png", "/mobile-landing-page-cta.png"],
  }

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        )
      case "in_review":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            In Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        )
    }
  }

  return (
    <AppLayout title={`Request ${requestId}`} isAdmin={true}>
      <div className="space-y-8">
        {/* Back button and header */}
        <div className="flex flex-col space-y-4">
          <Link href="/admin" className="flex items-center text-muted-foreground hover:text-foreground w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold flex items-center">
                <FileText className="mr-2 h-6 w-6 text-[#b19cd9]" />
                Request Details
              </h1>
              <div className="flex items-center mt-1">
                <span className="text-muted-foreground">#{requestId}</span>
                <span className="mx-2">•</span>
                {getStatusBadge(request.status)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-border">
                <Eye className="mr-2 h-4 w-4" /> Preview Landing Page
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-300"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Approve
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request details */}
            <Card>
              <CardHeader>
                <CardTitle>Request Information</CardTitle>
                <CardDescription>Details about the account application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Request Type</div>
                    <div className="font-medium">New Ad Account</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Date Submitted</div>
                    <div className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {request.date}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Account Name</div>
                    <div className="font-medium">{request.accountName}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Planned Budget</div>
                    <div className="font-medium">{request.budget}</div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="text-sm">{request.description}</div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-muted-foreground">Preferred Platforms</div>
                    <div className="flex flex-wrap gap-2">
                      {request.preferredPlatforms.map((platform) => (
                        <Badge key={platform} variant="secondary" className="bg-secondary/20">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="text-sm text-muted-foreground">Landing Page URL</div>
                    <div className="font-medium flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a
                        href={request.landingPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#b19cd9] hover:underline"
                      >
                        {request.landingPage}
                      </a>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Landing Page Screenshots</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {request.screenshots.map((screenshot, index) => (
                      <div key={index} className="border border-border rounded-md overflow-hidden">
                        <Image
                          src={screenshot || "/placeholder.svg"}
                          alt={`Landing page screenshot ${index + 1}`}
                          width={600}
                          height={300}
                          className="w-full h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review and Decision */}
            <Card>
              <CardHeader>
                <CardTitle>Review and Decision</CardTitle>
                <CardDescription>Approve or reject this request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reviewNotes" className="text-sm font-medium">
                    Review Notes
                  </label>
                  <Textarea id="reviewNotes" placeholder="Enter your review notes here..." className="min-h-32" />
                </div>

                {/* Ad Account ID assignment for approvals */}
                <div className="space-y-2">
                  <label htmlFor="adAccountId" className="text-sm font-medium">
                    Ad Account ID (for approvals)
                  </label>
                  <Input id="adAccountId" placeholder="Enter ad account ID to assign" />
                  <p className="text-xs text-muted-foreground">
                    This ID will be assigned to the client if you approve this request
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject Request
                </Button>
                <Button className="bg-[#b19cd9] hover:bg-[#9f84ca] text-white">
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve Request
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar - right side */}
          <div className="space-y-6">
            {/* Client information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#1A1A1A] flex items-center justify-center text-lg font-semibold">
                    {request.clientName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{request.clientName}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <AtSign className="h-3.5 w-3.5 mr-1" />
                      {request.clientEmail}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account Type:</span> Premium
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Client Since:</span> Jan 2025
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Active Accounts:</span> 4
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Spend:</span> $12,540.00
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <User className="mr-2 h-4 w-4" /> View Client Profile
                </Button>
              </CardContent>
            </Card>

            {/* Activity log */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-[#b19cd9] pl-4 space-y-1">
                    <div className="text-sm font-medium">Request Submitted</div>
                    <div className="text-xs text-muted-foreground">Apr 29, 2025 at 2:45 PM</div>
                  </div>
                  <div className="border-l-2 border-gray-200 pl-4 space-y-1">
                    <div className="text-sm font-medium">Pending Review</div>
                    <div className="text-xs text-muted-foreground">Waiting for admin action</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
