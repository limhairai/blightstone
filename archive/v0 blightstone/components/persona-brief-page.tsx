"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  X,
  Edit,
  List,
  Search,
  ChevronRight,
  Settings,
  Trash2,
  Heart,
  Shield,
  Brain,
  Eye,
  MessageSquare,
  Lightbulb,
} from "lucide-react"

// Define the interface for a Persona entry (re-used from persona-page.tsx)
interface Persona {
  id: string
  name: string // Persona Type (Naming)
  ageGenderLocation: string // Age, Gender, Location
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

interface PersonaBriefPageProps {
  persona: Persona | null
  onClose: () => void
  onUpdatePersona: (updatedPersona: Persona) => void
  onDeletePersona: (personaId: string) => void
  NEW_PERSONA_ID: string // Constant for new persona temp ID
}

export default function PersonaBriefPage({
  persona,
  onClose,
  onUpdatePersona,
  onDeletePersona,
  NEW_PERSONA_ID,
}: PersonaBriefPageProps) {
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState("overview") // For left navigation

  const isNewPersona = persona?.id === NEW_PERSONA_ID

  useEffect(() => {
    if (persona) {
      setEditingPersona(persona)
      setIsEditMode(isNewPersona) // If it's a new persona, start in edit mode
    }
  }, [persona, isNewPersona])

  if (!persona) {
    return null // Should not happen if opened correctly
  }

  const handleSave = () => {
    if (editingPersona) {
      const personaToSave = isNewPersona ? { ...editingPersona, id: Date.now().toString() } : editingPersona
      onUpdatePersona(personaToSave)
      onClose() // Close the brief after saving
    }
  }

  const handleDiscard = () => {
    if (isNewPersona) {
      onClose() // If new persona, just close without saving
    } else {
      setEditingPersona(persona) // Revert to original persona data
      setIsEditMode(false)
    }
  }

  const handleDelete = () => {
    if (!isNewPersona && persona.id) {
      onDeletePersona(persona.id)
    }
    onClose() // Close the brief after deletion or if it was a new persona
  }

  const navItems = [
    { id: "overview", label: "Overview", icon: List },
    { id: "core-strategy", label: "Core Strategy", icon: Lightbulb }, // New section
    { id: "struggles-desires", label: "Struggles & Desires", icon: Heart },
    { id: "beliefs-solutions", label: "Beliefs & Solutions", icon: Shield },
    { id: "mindset-insecurities", label: "Mindset & Insecurities", icon: Brain },
    { id: "market-awareness", label: "Market Awareness", icon: Eye },
    { id: "objections", label: "Objections", icon: MessageSquare },
  ]

  const renderSectionContent = (sectionId: string) => {
    const renderField = (label: string, value: string, fieldName: keyof Persona, rows = 3, isInput = false) => (
      <div className="bg-muted/30 rounded-lg p-4 min-h-[80px] space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
        {isEditMode ? (
          isInput ? (
            <Input
              value={(editingPersona?.[fieldName] as string) || ""}
              onChange={(e) => setEditingPersona({ ...editingPersona!, [fieldName]: e.target.value })}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          ) : (
            <Textarea
              value={(editingPersona?.[fieldName] as string) || ""}
              onChange={(e) => setEditingPersona({ ...editingPersona!, [fieldName]: e.target.value })}
              rows={rows}
              className="resize-y"
              placeholder={`Enter ${label.toLowerCase()}`}
            />
          )
        ) : (
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {value || `No ${label.toLowerCase()} provided.`}
          </p>
        )}
      </div>
    )

    switch (sectionId) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* Persona Name */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Persona Type (Naming)</h2>
              {isEditMode ? (
                <Input
                  value={editingPersona?.name || ""}
                  onChange={(e) => setEditingPersona({ ...editingPersona!, name: e.target.value })}
                  className="text-xl font-bold"
                  placeholder="e.g., Catherine (Mom, 35-50, stressed)"
                />
              ) : (
                <h3 className="text-xl font-bold">{persona.name || "Untitled Persona"}</h3>
              )}
            </div>

            {/* Core Demographics */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Demographics</h2>
              {renderField("Age, Gender, Location", persona.ageGenderLocation, "ageGenderLocation", 2, true)}
            </div>

            {/* Desired Characteristics */}
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Desired Characteristics</h2>
              {renderField("What they want others to see", persona.desiredCharacteristics, "desiredCharacteristics", 4)}
              {renderField("Desired Social Status", persona.desiredSocialStatus, "desiredSocialStatus", 4)}
              {renderField(
                "How our product helps achieve status/characteristic",
                persona.productHelpAchieveStatus,
                "productHelpAchieveStatus",
                4,
              )}
            </div>
          </div>
        )
      case "core-strategy": // New section for Angle and Domino Statement
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Angle</h2>
              {renderField("Specific Angle", persona.angle, "angle", 3)}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Domino Statement / Big Idea</h2>
              {renderField("Key Idea to Overcome Skepticism", persona.dominoStatement, "dominoStatement", 6)}
            </div>
          </div>
        )
      case "struggles-desires":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Struggles</h2>
              {renderField("Day-to-Day Struggles", persona.dailyStruggles, "dailyStruggles", 4)}
              {renderField("Deeper Pain Points", persona.deeperPainPoints, "deeperPainPoints", 6)}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Desires</h2>
              {renderField("Hidden/Specific Desires", persona.hiddenSpecificDesires, "hiddenSpecificDesires", 6)}
            </div>
          </div>
        )
      case "beliefs-solutions":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Beliefs to Overcome</h2>
              {renderField("Beliefs to Overcome", persona.beliefsToOvercome, "beliefsToOvercome", 4)}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Failed Solutions</h2>
              {renderField("Other solutions tried and failed (and why)", persona.failedSolutions, "failedSolutions", 6)}
            </div>
          </div>
        )
      case "mindset-insecurities":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Mindset</h2>
              {renderField("Mindset", persona.mindset, "mindset", 6)}
            </div>
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Insecurities</h2>
              {renderField("Insecurities", persona.insecurities, "insecurities", 4)}
            </div>
          </div>
        )
      case "market-awareness":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Market Awareness & Sophistication</h2>
              {renderField("Market Awareness", persona.marketAwareness, "marketAwareness", 3, true)}
              {renderField("Market Sophistication", persona.marketSophistication, "marketSophistication", 3, true)}
            </div>
          </div>
        )
      case "objections":
        return (
          <div className="space-y-4">
            <div className="bg-card p-5 rounded-lg shadow-sm border border-border">
              <h2 className="text-lg font-semibold mb-3">Objections</h2>
              {renderField("Objections", persona.objections, "objections", 6)}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      {/* Left Navigation Panel */}
      <div className="w-64 bg-card border-r border-border flex flex-col py-4 px-3">
        <div className="flex items-center justify-between px-2 mb-4">
          <h2 className="text-lg font-semibold">Persona Sections</h2>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search sections..." className="pl-9" />
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-10 ${
                  activeSection === item.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            )
          })}
        </nav>
        <Separator className="my-4" />
        <Button variant="ghost" className="w-full justify-start h-10 text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center px-6 justify-between bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Personas</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{isNewPersona ? "New Persona" : persona.name || "Untitled Persona"}</span>
          </div>
          <div className="flex items-center gap-3">
            {!isNewPersona && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className={isEditMode ? "bg-accent text-accent-foreground" : ""}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full ml-2">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{renderSectionContent(activeSection)}</div>

        {/* Footer */}
        <div className="h-16 border-t border-border flex items-center px-6 justify-end gap-3 bg-card">
          <p className="text-xs text-muted-foreground mr-auto">Persona management powered by Blightstone.</p>
          {isEditMode && (
            <>
              <Button variant="outline" onClick={handleDiscard}>
                {isNewPersona ? "Cancel" : "Discard changes"}
              </Button>
              <Button onClick={handleSave} className="bg-black hover:bg-black/90 text-white">
                {isNewPersona ? "Create Persona" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
