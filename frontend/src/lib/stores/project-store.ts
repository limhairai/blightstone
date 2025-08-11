import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@supabase/ssr'
import { projectsApi, personasApi, competitorsApi, creativesApi } from '@/lib/api'

// Performance optimization: Debounce function for search/filter operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// API client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface TaskLink {
  id: string
  title: string
  url: string
  description?: string
  addedAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed" | "blocked"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: string
  dueDate: string
  createdAt: string
  category: string
  projectId: string
  createdBy?: string
  notes?: string
  attachments?: TaskAttachment[]
  links?: TaskLink[]
}

export interface CustomerAvatar {
  id: string
  name: string
  ageGenderLocation: string
  dailyStruggles: string
  desiredCharacteristics: string
  desiredSocialStatus: string
  productHelpAchieveStatus: string
  beliefsToOvercome: string
  failedSolutions: string
  marketAwareness: string
  marketSophistication: string
  insecurities: string
  mindset: string
  deeperPainPoints: string
  hiddenSpecificDesires: string
  objections: string
  angle: string
  dominoStatement: string
  notes?: string
  projectId: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface Competitor {
  id: string
  name: string
  websiteUrl?: string
  adLibraryLink?: string
  market?: string
  offerUrl?: string
  trafficVolume?: string
  level: "poor" | "medium" | "high"
  notes?: string
  projectId: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreativeTracker {
  id: string
  batch: string
  status: "draft" | "in-review" | "live" | "paused" | "completed"
  launchDate?: string
  adConcept?: string
  testHypothesis?: string
  adType?: string
  adVariable?: string
  desire?: string
  benefit?: string
  objections?: string
  persona?: string
  hookPattern?: string
  results?: string
  winningAdLink?: string
  briefLink?: string
  driveLink?: string
  notes?: string
  projectId: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreativeIntelligence {
  id: string
  projectId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Basic Creative Info
  title: string
  platform: "facebook" // Facebook only for Phase 1
  
  // Creative Assets (direct upload)
  imageUrl?: string // Uploaded image URL
  videoUrl?: string // Uploaded video URL
  creativeType: "image" | "video" | "carousel"
  
  // Creative Content
  headline?: string
  primaryCopy?: string // Main ad copy
  hook?: string // Opening hook/first line
  callToAction?: string
  
  // Creative Intelligence - The Core Value
  concept?: string // The core concept/idea
  angle?: string // Psychological angle (pain, aspiration, fear, etc.)
  hookPattern?: string // Type of hook (problem/solution, curiosity, social proof, etc.)
  visualStyle?: string // Visual approach (lifestyle, product demo, before/after, UGC, etc.)
  targetEmotion?: string // What emotion does it trigger?
  
  // Creative Categories for Organization
  creativeCategory: "hook_library" | "winning_angles" | "concept_gold" | "script_templates" | "headline_formulas" | "visual_patterns"
  
  // Performance Context (optional, team discretion)
  performanceNotes?: string // Why this worked, context
  
  // Systematic Thinking
  psychologyTrigger?: string // What psychological principle does this use?
  scalabilityNotes?: string // How can this concept be scaled/varied?
  remixPotential?: string // How can this be combined with other concepts?
  
  // Metadata
  tags?: string[] // Flexible tagging system
  isTemplate: boolean // Is this a reusable template?
  templateVariables?: string // What parts can be customized?
  
  // Status
  status: "active" | "archived" | "template"
}

export interface Project {
  id: string
  name: string
  description?: string
  status: "active" | "paused" | "completed"
  userId?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  // Computed fields (not stored in DB)
  tasksCount?: number
  completedTasks?: number
  lastActivity?: string
}

interface ProjectStore {
  currentProjectId: string | null
  projects: Project[]
  tasks: Task[]
  customerAvatars: CustomerAvatar[]
  competitors: Competitor[]
  creativeTrackers: CreativeTracker[]
  creativeIntelligence: CreativeIntelligence[]
  
  setCurrentProjectId: (id: string | null) => void
  getCurrentProject: () => Project | null
  addProject: (project: Project) => void
  removeProject: (projectId: string) => void
  loadProjects: () => Promise<void>
  getProjectWithDynamicCounts: (projectId: string) => Project | null
  
  // Task methods
  getTasksForProject: (projectId: string) => Task[]
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  
  // Customer Avatar methods
  getAvatarsForProject: (projectId: string) => CustomerAvatar[]
  addAvatar: (avatar: CustomerAvatar) => void
  
  // Competitor methods
  getCompetitorsForProject: (projectId: string) => Competitor[]
  addCompetitor: (competitor: Competitor) => void
  
  // Creative Tracker methods
  getCreativeTrackersForProject: (projectId: string) => CreativeTracker[]
  addCreativeTracker: (tracker: CreativeTracker) => void
  
  // Creative Intelligence methods
  getCreativeIntelligenceForProject: (projectId: string) => CreativeIntelligence[]
  addCreativeIntelligence: (creative: CreativeIntelligence) => void
}

// Production ready - no mock data, will load from API

// Production ready - tasks loaded from API




export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProjectId: null, // No default project - will load from API
      projects: [],
      tasks: [],
      customerAvatars: [],
      competitors: [],
      creativeTrackers: [],
      creativeIntelligence: [],
      
      setCurrentProjectId: (id: string | null) => {
        set({ currentProjectId: id })
      },
      
      getCurrentProject: () => {
        const { currentProjectId, projects } = get()
        return projects.find(p => p.id === currentProjectId) || null
      },
      
      getProjectWithDynamicCounts: (projectId: string) => {
        const { projects, tasks } = get()
        const project = projects.find(p => p.id === projectId)
        if (!project) return null
        
        const projectTasks = tasks.filter(task => task.projectId === projectId)
        const completedTasks = projectTasks.filter(task => task.status === 'completed').length
        
        return {
          ...project,
          tasksCount: projectTasks.length,
          completedTasks: completedTasks
        }
      },
      
      addProject: (project: Project) => {
        set(state => ({
          projects: [...state.projects, project]
        }))
      },
      
      removeProject: (projectId: string) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          // Clear current project if it was the deleted one
          currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId
        }))
      },
      
      loadProjects: async () => {
        try {
          const projects = await projectsApi.getAll()
          set({ projects })
        } catch (error) {
          console.error('Error loading projects:', error)
        }
      },
      
      // Task methods
      getTasksForProject: (projectId: string) => {
        const { tasks } = get()
        return tasks.filter(task => task.projectId === projectId)
      },
      
      addTask: (task: Task) => {
        set(state => ({
          tasks: [...state.tasks, task]
        }))
      },
      
      updateTask: (taskId: string, updates: Partial<Task>) => {
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        }))
      },
      
      // Customer Avatar methods
      getAvatarsForProject: (projectId: string) => {
        const { customerAvatars } = get()
        return customerAvatars.filter(avatar => avatar.projectId === projectId)
      },
      
      addAvatar: (avatar: CustomerAvatar) => {
        set(state => ({
          customerAvatars: [...state.customerAvatars, avatar]
        }))
      },
      
      // Competitor methods
      getCompetitorsForProject: (projectId: string) => {
        const { competitors } = get()
        return competitors.filter(competitor => competitor.projectId === projectId)
      },
      
      addCompetitor: (competitor: Competitor) => {
        set(state => ({
          competitors: [...state.competitors, competitor]
        }))
      },
      
      // Creative Tracker methods
      getCreativeTrackersForProject: (projectId: string) => {
        const { creativeTrackers } = get()
        return creativeTrackers.filter(tracker => tracker.projectId === projectId)
      },
      
      addCreativeTracker: (tracker: CreativeTracker) => {
        set(state => ({
          creativeTrackers: [...state.creativeTrackers, tracker]
        }))
      },
      
      // Creative Intelligence methods
      getCreativeIntelligenceForProject: (projectId: string) => {
        const { creativeIntelligence } = get()
        return creativeIntelligence.filter(creative => creative.projectId === projectId)
      },
      
      addCreativeIntelligence: (creative: CreativeIntelligence) => {
        set(state => ({
          creativeIntelligence: [...state.creativeIntelligence, creative]
        }))
      }
    }),
    {
      name: 'blightstone-project-store'
    }
  )
)