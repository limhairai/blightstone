"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import CompetitorBriefPage from "./components/competitor-brief-page"

// Define the interface for a Competitor entry
interface Competitor {
  id: string
  name: string
  websiteUrl: string
  adLibraryLink: string
  market: string // e.g., "USA"
  offerUrl: string
  trafficVolume: string // e.g., "100K-500K", "50K"
  level: "Poor" | "Medium" | "High"
}

// Define a constant for a new competitor's temporary ID
const NEW_COMPETITOR_ID = "new-competitor-temp-id"

export default function CompetitorTrackerPage() {
  // Mock data for Competitors
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: "comp1",
      name: "SleepWell Co.",
      websiteUrl: "https://sleepwell.co",
      adLibraryLink: "https://facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=sleepwell",
      market: "USA",
      offerUrl: "https://sleepwell.co/grounding-mats",
      trafficVolume: "50K-100K",
      level: "High",
    },
    {
      id: "comp2",
      name: "EarthConnect",
      websiteUrl: "https://earthconnect.com",
      adLibraryLink: "https://facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=earthconnect",
      market: "USA",
      offerUrl: "https://earthconnect.com/earthing-sheets",
      trafficVolume: "10K-50K",
      level: "Medium",
    },
    {
      id: "comp3",
      name: "Zenith Health",
      websiteUrl: "https://zenithhealth.net",
      adLibraryLink: "https://facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=zenithhealth",
      market: "Canada",
      offerUrl: "https://zenithhealth.net/wellness-products",
      trafficVolume: "5K-10K",
      level: "Poor",
    },
  ])

  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)

  const handleUpdateCompetitor = (updatedCompetitor: Competitor) => {
    if (updatedCompetitor.id === NEW_COMPETITOR_ID) {
      const newCompetitorWithId = { ...updatedCompetitor, id: Date.now().toString() }
      setCompetitors([...competitors, newCompetitorWithId])
      setSelectedCompetitor(null)
    } else {
      setCompetitors(competitors.map((c) => (c.id === updatedCompetitor.id ? updatedCompetitor : c)))
      setSelectedCompetitor(updatedCompetitor)
    }
  }

  const handleDeleteCompetitor = (competitorId: string) => {
    setCompetitors(competitors.filter((c) => c.id !== competitorId))
    setSelectedCompetitor(null)
  }

  const handleNewCompetitorClick = () => {
    setSelectedCompetitor({
      id: NEW_COMPETITOR_ID,
      name: "",
      websiteUrl: "",
      adLibraryLink: "",
      market: "USA",
      offerUrl: "",
      trafficVolume: "",
      level: "Medium", // Default level
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/* Removed the h1 element with the text "Competitor Tracker" */}
        <Button onClick={handleNewCompetitorClick} className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Competitor
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competitor Name</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.map((competitor) => (
              <TableRow key={competitor.id}>
                <TableCell className="font-medium">{competitor.name}</TableCell>
                <TableCell>{competitor.market}</TableCell>
                <TableCell>{competitor.level}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedCompetitor(competitor)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Competitor Brief Page (Full-screen overlay) */}
      {selectedCompetitor && (
        <CompetitorBriefPage
          competitor={selectedCompetitor}
          onClose={() => setSelectedCompetitor(null)}
          onUpdateCompetitor={handleUpdateCompetitor}
          onDeleteCompetitor={handleDeleteCompetitor}
          NEW_COMPETITOR_ID={NEW_COMPETITOR_ID}
        />
      )}
    </div>
  )
}
