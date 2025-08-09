"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Eye } from "lucide-react"
import PersonaBriefPage from "./components/persona-brief-page"

// Define the interface for a Persona entry
interface Persona {
  id: string
  name: string // Persona Type (Naming) - e.g., "Catherine (Mom, 35-50, stressed, sleep-deprived)"
  ageGenderLocation: string // Age, Gender, Location - e.g., "Female - 35/60 - United States"
  dailyStruggles: string // What are their day to day struggles?
  desiredCharacteristics: string // What are some of the characteristics your prospect wants others to see in them?
  desiredSocialStatus: string // What status does your prospect want to achieve in society?
  productHelpAchieveStatus: string // How does our product help them achieve that status or characteristic?
  beliefsToOvercome: string // What are some beliefs our prospect has that we need to overcome?
  failedSolutions: string // What are other solutions that they have tried and failed at and why?
  marketAwareness: string // What is their market awareness?
  marketSophistication: string // What is their market sophistication?
  insecurities: string // What are the personas insecurities?
  mindset: string // What is her mindset?
  deeperPainPoints: string // What are deeper pain points of her?
  hiddenSpecificDesires: string // What are her Hidden/Specific Desires
  objections: string // What are her objections?
  angle: string // New: The specific angle to approach this persona
  dominoStatement: string // New: The key idea that unlocks their skepticism
}

// Define a constant for a new persona's temporary ID
const NEW_PERSONA_ID = "new-persona-temp-id"

export default function PersonaPage() {
  // Mock data for Personas
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: "p1",
      name: "Catherine (Mom, 35-50, stressed, sleep-deprived)",
      ageGenderLocation: "Female - 35/60 - United States",
      dailyStruggles: "Bad Sleeper, Stress, Headache And Migraine",
      desiredCharacteristics: "Caring person, Organized, Health-Conscious, Thoughtful, Reliable",
      desiredSocialStatus:
        "Recognized for her ability to balance family, work, and personal life seamlessly. Known for her commitment to a healthy and sustainable lifestyle. Respected for her involvement in school, local events, or charitable causes. Admired by other moms for her wisdom, organization, and compassion.",
      productHelpAchieveStatus:
        "Restful sleep and reduced stress help her manage family life with ease. Shows her commitment to natural, holistic wellness for her and her family. Increased energy lets her stay active and involved. Balances health and family, inspiring other moms.",
      beliefsToOvercome:
        "Natural remedies take too long to work. Grounding products are complicated to use. I don’t have time for self-care.",
      failedSolutions:
        "Sleep supplements: Left her groggy in the morning. Meditation apps: Hard to stay consistent. Expensive mattresses: Didn’t resolve stress-related sleep issues.",
      marketAwareness: "Problem Aware",
      marketSophistication: "Low to Medium",
      insecurities:
        "Worried about being perceived as a tired, overwhelmed mom. Feels guilty if she’s not prioritizing her family’s health and her own self-care. Insecure about her lack of sleep and visible signs of exhaustion (e.g., dark circles, irritability).",
      mindset:
        "Catherine juggles multiple responsibilities daily—work, home, and family. She’s always “on,” and her to-do list feels endless. She believes that caring for her family comes first, often putting her own well-being last. However, she craves peace of mind and sees solving her sleep and pain issues as a way to become more energized and present for her family.",
      deeperPainPoints:
        "Feeling exhausted and unable to give her best to her family. Waking up feeling more tired than when she went to bed. Emotional frustration from being spread too thin and lacking “me time.” Fear of long-term health issues due to poor sleep and constant body tension.",
      hiddenSpecificDesires:
        "To wake up feeling energized and ready to take on the day. To create a calm and nurturing environment for her family without feeling burned out. To have moments of uninterrupted rest and self-care. To maintain her health so she can stay active for her kids long-term. To look pretty without wrinkles or dark circles.",
      objections:
        "Will this really improve my sleep, or is it just another gimmick? I’m too busy to add another routine or product to my life. Is it safe to use around my children? What if it doesn’t work as promised?",
      angle: "Natural, Holistic Sleep Solution for Busy Moms",
      dominoStatement: "Grounding is a scientifically supported way to improve sleep and reduce stress naturally.",
    },
    {
      id: "p2",
      name: "David (Remote Worker, 28-45, tech-savvy, health-conscious)",
      ageGenderLocation: "Male - 28/45 - United States",
      dailyStruggles: "Fatigue, lack of focus, eye strain from screen time.",
      desiredCharacteristics: "Productive, efficient, healthy, innovative.",
      desiredSocialStatus: "Recognized as a high-performer, early adopter of wellness tech.",
      productHelpAchieveStatus: "Grounding mats boost focus and reduce fatigue, enhancing productivity.",
      beliefsToOvercome: "Skepticism about 'alternative' health, preference for tech solutions.",
      failedSolutions: "More coffee, energy drinks, ergonomic chairs (didn't address root cause).",
      marketAwareness: "Solution Aware",
      marketSophistication: "Medium",
      insecurities: "Worried about burnout, falling behind, not optimizing his health.",
      mindset: "Always seeking an edge, values efficiency and data-driven solutions.",
      deeperPainPoints: "Chronic low energy, mental fog, feeling disconnected from nature.",
      hiddenSpecificDesires:
        "Sustained energy without crashes, mental clarity, feeling more 'connected' to his environment.",
      objections: "Is it scientifically proven? Is it worth the desk space? Will it look good?",
      angle: "Biohacking for Enhanced Productivity and Well-being",
      dominoStatement:
        "Optimizing your environment with grounding technology can significantly boost your daily energy and focus.",
    },
  ])

  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

  const handleUpdatePersona = (updatedPersona: Persona) => {
    if (updatedPersona.id === NEW_PERSONA_ID) {
      const newPersonaWithId = { ...updatedPersona, id: Date.now().toString() }
      setPersonas([...personas, newPersonaWithId])
      setSelectedPersona(null)
    } else {
      setPersonas(personas.map((p) => (p.id === updatedPersona.id ? updatedPersona : p)))
      setSelectedPersona(updatedPersona)
    }
  }

  const handleDeletePersona = (personaId: string) => {
    setPersonas(personas.filter((p) => p.id !== personaId))
    setSelectedPersona(null)
  }

  const handleNewPersonaClick = () => {
    setSelectedPersona({
      id: NEW_PERSONA_ID,
      name: "",
      ageGenderLocation: "",
      dailyStruggles: "",
      desiredCharacteristics: "",
      desiredSocialStatus: "",
      productHelpAchieveStatus: "",
      beliefsToOvercome: "",
      failedSolutions: "",
      marketAwareness: "",
      marketSophistication: "",
      insecurities: "",
      mindset: "",
      deeperPainPoints: "",
      hiddenSpecificDesires: "",
      objections: "",
      angle: "", // Initialize new fields
      dominoStatement: "", // Initialize new fields
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleNewPersonaClick} className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          New Persona
        </Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Persona Type (Naming)</TableHead>
              <TableHead>Age, Gender, Location</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personas.map((persona) => (
              <TableRow key={persona.id}>
                <TableCell className="font-medium">{persona.name}</TableCell>
                <TableCell>{persona.ageGenderLocation}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPersona(persona)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Persona Brief Page (Full-screen overlay) */}
      {selectedPersona && (
        <PersonaBriefPage
          persona={selectedPersona}
          onClose={() => setSelectedPersona(null)}
          onUpdatePersona={handleUpdatePersona}
          onDeletePersona={handleDeletePersona}
          NEW_PERSONA_ID={NEW_PERSONA_ID}
        />
      )}
    </div>
  )
}
