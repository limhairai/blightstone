"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Target, Search, ShoppingCart, Zap } from "lucide-react"

interface AwarenessStage {
  stage: string
  icon: any
  mindset: string
  painPoints: string[]
  desires: string[]
  objections: string[]
  approach: string[]
  color: string
}

const awarenessStages: AwarenessStage[] = [
  {
    stage: "Completely Unaware",
    icon: Brain,
    mindset: "Life feels off, but I don't know why.",
    painPoints: [
      "Fatigue without explanation",
      "Constant bad sleep and low in energy"
    ],
    desires: [
      "A natural way to feel better",
      "Better sleep or relief without medication"
    ],
    objections: [
      "Skepticism toward \"alternative\" solutions",
      "Unfamiliarity with grounding"
    ],
    approach: [
      "Educate with simple content on how modern living impacts the body",
      "Use relatable messaging: \"Feeling drained? It could be your environment.\""
    ],
    color: "bg-muted text-foreground"
  },
  {
    stage: "Problem Aware", 
    icon: Target,
    mindset: "I have sleep issues, pain, or stress, and I need a solution.",
    painPoints: [
      "Struggling to fall asleep or waking up tired",
      "Chronic back or muscle pain affecting daily life"
    ],
    desires: [
      "A solution that works consistently",
      "Something non-invasive and easy to use"
    ],
    objections: [
      "Hesitation about whether grounding is effective",
      "Fear of trying something new"
    ],
    approach: [
      "Share compelling success stories and testimonials",
      "Offer simple explanations: \"Grounding connects you to Earth's natural energy for healing and balance.\""
    ],
    color: "bg-accent/10 text-foreground border-accent/20"
  },
  {
    stage: "Solution Aware",
    icon: Search, 
    mindset: "I know grounding could help, but I'm not sure how or what product to choose.",
    painPoints: [
      "Confusion about the right grounding product",
      "Fear of wasting money on ineffective solutions"
    ],
    desires: [
      "A product that's proven to work", 
      "Clear instructions and ease of use"
    ],
    objections: [
      "What's different about this product compared to others?",
      "Is it worth the investment?"
    ],
    approach: [
      "Highlight the unique benefits of Grounding Sheets, such as carbon fiber material for maximum conductivity",
      "Provide simple demonstrations and comparison charts"
    ],
    color: "bg-accent/20 text-foreground border-accent/30"
  },
  {
    stage: "Product Aware",
    icon: ShoppingCart,
    mindset: "I think I want this product, but I need reassurance before buying.",
    painPoints: [
      "Worry about product quality or fit",
      "Concern about durability and maintenance"
    ],
    desires: [
      "Trust in the product's effectiveness",
      "Confidence in the company's support"
    ],
    objections: [
      "Will this really work for me?",
      "What if I'm not satisfied?"
    ],
    approach: [
      "Offer guarantees, like a money-back policy",
      "Emphasize the durability of premium materials and easy cleaning"
    ],
    color: "bg-accent/30 text-foreground border-accent/40"
  },
  {
    stage: "Most Aware",
    icon: Zap,
    mindset: "I know I want this product, and I'm ready to buy.",
    painPoints: [
      "Ensuring fast delivery",
      "Wanting the best value"
    ],
    desires: [
      "A seamless purchase experience",
      "Confidence that their investment will pay off"
    ],
    objections: [
      "Delay in shipping or lack of post-purchase support"
    ],
    approach: [
      "Offer fast and reliable shipping options",
      "Provide excellent post-purchase support and easy returns",
      "Share compelling success stories and testimonials"
    ],
    color: "bg-accent text-accent-foreground"
  }
]

export default function AwarenessStagesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Customer Awareness Stages</h1>
        <p className="text-muted-foreground">
          Understanding where your customers are in their awareness journey helps you create targeted messaging and marketing strategies.
        </p>
      </div>

      <div className="grid gap-6">
        {awarenessStages.map((stage, index) => {
          const Icon = stage.icon
          return (
            <Card key={stage.stage} className={`${stage.color} border transition-all duration-200 hover:shadow-lg`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/10">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{stage.stage}</CardTitle>
                    <p className="text-sm opacity-90 italic">"{stage.mindset}"</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    Stage {index + 1}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide opacity-75">Pain Points</h4>
                    <ul className="space-y-2">
                      {stage.painPoints.map((point, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide opacity-75">Hidden Desires</h4>
                    <ul className="space-y-2">
                      {stage.desires.map((desire, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
                          {desire}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide opacity-75">Objections</h4>
                    <ul className="space-y-2">
                      {stage.objections.map((objection, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
                          {objection}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide opacity-75">How to Address</h4>
                    <ul className="space-y-2">
                      {stage.approach.map((approach, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-current mt-2 flex-shrink-0" />
                          {approach}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-accent" />
            Key Takeaways
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Marketing Strategy Tips:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Start with education for unaware customers</li>
                <li>• Use testimonials for problem-aware prospects</li>
                <li>• Provide comparisons for solution-aware buyers</li>
                <li>• Offer guarantees for product-aware customers</li>
                <li>• Optimize checkout for most-aware buyers</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Content Creation Guide:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Match content depth to awareness level</li>
                <li>• Address specific objections at each stage</li>
                <li>• Use appropriate language complexity</li>
                <li>• Focus on benefits vs features appropriately</li>
                <li>• Create clear next-step CTAs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}