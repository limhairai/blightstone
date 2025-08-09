"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Building2, ExternalLink, Globe, TrendingUp, Star, DollarSign } from "lucide-react"

interface Competitor {
  id: string
  name: string
  website: string
  market: string
  level: "Poor" | "Medium" | "High"
  pricing: string
  strengths: string[]
  weaknesses: string[]
  positioning: string
  targetAudience: string
  marketShare: string
  notes: string
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: "1",
      name: "Earthing Harmony",
      website: "https://earthingharmony.eu/",
      market: "Worldwide",
      level: "High",
      pricing: "$89-199",
      strengths: [
        "Strong European presence",
        "High-quality materials",
        "Comprehensive product range",
        "Good customer reviews"
      ],
      weaknesses: [
        "Higher price point",
        "Limited US marketing",
        "Slow shipping to some regions"
      ],
      positioning: "Premium wellness brand focused on natural healing",
      targetAudience: "Health-conscious Europeans, wellness enthusiasts",
      marketShare: "15%",
      notes: "Main competitor in European market. Strong brand recognition."
    },
    {
      id: "2",
      name: "Earthing.com",
      website: "https://www.earthing.com/",
      market: "Worldwide", 
      level: "High",
      pricing: "$69-299",
      strengths: [
        "First-mover advantage",
        "Extensive research backing",
        "Wide product variety",
        "Strong SEO presence"
      ],
      weaknesses: [
        "Outdated website design",
        "Complex product selection",
        "Higher pricing"
      ],
      positioning: "Original earthing/grounding company with scientific backing",
      targetAudience: "Health researchers, biohackers, wellness professionals",
      marketShare: "25%",
      notes: "Market leader but showing signs of age. Opportunity to capture modern audience."
    },
    {
      id: "3",
      name: "GroundingWell",
      website: "https://www.groundingwell.com/",
      market: "USA",
      level: "High",
      pricing: "$79-159",
      strengths: [
        "Modern branding",
        "Strong social media presence",
        "Influencer partnerships",
        "Fast shipping"
      ],
      weaknesses: [
        "Limited product range",
        "Newer brand with less trust",
        "Focused mainly on sheets"
      ],
      positioning: "Modern wellness brand for sleep optimization",
      targetAudience: "Millennials, sleep-focused consumers, social media users",
      marketShare: "12%",
      notes: "Growing rapidly through digital marketing. Direct competitor for our target demographic."
    },
    {
      id: "4",
      name: "Sleep Earthed",
      website: "https://www.sleepearthed.co.uk/",
      market: "UK",
      level: "Medium",
      pricing: "$45-89",
      strengths: [
        "Competitive pricing",
        "UK-focused marketing",
        "Simple product line"
      ],
      weaknesses: [
        "Limited market reach",
        "Basic website",
        "Minimal brand recognition"
      ],
      positioning: "Affordable grounding solutions for better sleep",
      targetAudience: "Budget-conscious UK consumers",
      marketShare: "5%",
      notes: "Regional player. Not a major threat but shows market demand for affordable options."
    }
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCompetitor, setNewCompetitor] = useState<Partial<Competitor>>({})

  const getLevelColor = (level: string) => {
    switch (level) {
      case "High": return "bg-red-100 text-red-800 border-red-200"
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Poor": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  const handleCreateCompetitor = () => {
    if (newCompetitor.name && newCompetitor.website) {
      const competitor: Competitor = {
        id: Date.now().toString(),
        name: newCompetitor.name || "",
        website: newCompetitor.website || "",
        market: newCompetitor.market || "",
        level: (newCompetitor.level as Competitor['level']) || "Medium",
        pricing: newCompetitor.pricing || "",
        strengths: [],
        weaknesses: [],
        positioning: newCompetitor.positioning || "",
        targetAudience: newCompetitor.targetAudience || "",
        marketShare: newCompetitor.marketShare || "",
        notes: newCompetitor.notes || ""
      }
      setCompetitors([...competitors, competitor])
      setNewCompetitor({})
      setShowCreateForm(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Competitor Analysis</h1>
          <p className="text-muted-foreground">Track and analyze your competition</p>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Competitor
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Competitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  placeholder="e.g., Earthing Harmony"
                  value={newCompetitor.name || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Website</label>
                <Input
                  placeholder="https://example.com"
                  value={newCompetitor.website || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, website: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Market</label>
                <Input
                  placeholder="e.g., USA, Worldwide"
                  value={newCompetitor.market || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, market: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Competition Level</label>
                <Select onValueChange={(value) => setNewCompetitor({...newCompetitor, level: value as Competitor['level']})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Pricing Range</label>
                <Input
                  placeholder="e.g., $89-199"
                  value={newCompetitor.pricing || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, pricing: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Market Share</label>
                <Input
                  placeholder="e.g., 15%"
                  value={newCompetitor.marketShare || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, marketShare: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Positioning</label>
                <Textarea
                  placeholder="How do they position themselves in the market?"
                  value={newCompetitor.positioning || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, positioning: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <Textarea
                  placeholder="Who are their main customers?"
                  value={newCompetitor.targetAudience || ""}
                  onChange={(e) => setNewCompetitor({...newCompetitor, targetAudience: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Additional observations and insights"
                value={newCompetitor.notes || ""}
                onChange={(e) => setNewCompetitor({...newCompetitor, notes: e.target.value})}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateCompetitor} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Add Competitor
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.length}</div>
            <p className="text-xs text-muted-foreground">Being tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Threat</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.filter(c => c.level === 'High').length}</div>
            <p className="text-xs text-muted-foreground">Major competitors</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Markets</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(competitors.map(c => c.market)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different markets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Market Share</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(competitors.reduce((sum, c) => sum + parseInt(c.marketShare.replace('%', '') || '0'), 0) / competitors.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Market penetration</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{competitor.name}</CardTitle>
                    <Badge className={getLevelColor(competitor.level)}>
                      {competitor.level} Threat
                    </Badge>
                    <Badge variant="outline">{competitor.market}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <a 
                      href={competitor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {competitor.website}
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    {competitor.pricing}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {competitor.marketShare} market share
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Positioning</h4>
                  <p className="text-sm text-muted-foreground">{competitor.positioning}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Target Audience</h4>
                  <p className="text-sm text-muted-foreground">{competitor.targetAudience}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-green-600">Strengths</h4>
                  <ul className="space-y-1">
                    {competitor.strengths.map((strength, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-red-600">Weaknesses</h4>
                  <ul className="space-y-1">
                    {competitor.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {competitor.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {competitor.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}