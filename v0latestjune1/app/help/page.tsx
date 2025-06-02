import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, Mail, MessageSquare, FileText, HelpCircle } from "lucide-react"

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        <h1 className="text-2xl font-bold">Help & Support</h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            className="pl-12 h-12 bg-secondary/50 border-border text-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border hover:bg-secondary/10 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-secondary/20 p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="mb-2">Documentation</CardTitle>
              <p className="text-sm text-muted-foreground">Browse our comprehensive guides and documentation</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:bg-secondary/10 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-secondary/20 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="mb-2">Live Chat</CardTitle>
              <p className="text-sm text-muted-foreground">Chat with our support team in real-time</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:bg-secondary/10 transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="bg-secondary/20 p-4 rounded-full mb-4">
                <Mail className="h-8 w-8 text-blue-400" />
              </div>
              <CardTitle className="mb-2">Email Support</CardTitle>
              <p className="text-sm text-muted-foreground">Send us an email and we'll get back to you</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input placeholder="Subject" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Describe your issue in detail..."
                className="min-h-[150px] bg-secondary/50 border-border"
              />
            </div>
            <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black">
              Submit Ticket
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                question: "How do I request a new ad account?",
                answer:
                  "You can request a new ad account by clicking the 'Request New Account' button on the Accounts page. Fill out the required information and submit your request.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept credit cards, debit cards, and bank transfers. You can add a new payment method in the Billing section of your account settings.",
              },
              {
                question: "How long does account approval take?",
                answer:
                  "Account approval typically takes 24-48 hours. You'll receive an email notification once your account has been approved.",
              },
            ].map((faq, index) => (
              <Card key={index} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
