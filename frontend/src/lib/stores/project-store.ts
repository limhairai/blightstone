import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@supabase/ssr'
import { projectsApi, personasApi, competitorsApi, creativesApi, topAdsApi } from '@/lib/api'

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

export interface TopAd {
  id: string
  projectId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Basic Ad Info
  adTitle: string
  platform: "facebook" | "instagram" | "google" | "tiktok" | "youtube" | "linkedin" | "twitter" | "other"
  campaignName?: string
  adSetName?: string
  
  // Performance Metrics
  spend?: number
  revenue?: number
  roas?: number // Return on Ad Spend
  ctr?: number // Click Through Rate (%)
  cpm?: number // Cost Per Mille
  conversionRate?: number // Conversion Rate (%)
  costPerConversion?: number
  impressions?: number
  clicks?: number
  conversions?: number
  
  // Time Period
  performanceStartDate?: string
  performanceEndDate?: string
  
  // Creative Details
  adCopy?: string
  headline?: string
  callToAction?: string
  creativeUrl?: string // Link to image/video
  landingPageUrl?: string
  
  // Strategy & Analysis
  angle?: string // The hook/angle used
  targetAudience?: string
  placement?: string // Feed, Stories, etc.
  objective?: string // Awareness, Conversion, etc.
  
  // Insights
  notes?: string
  whyItWorked?: string
  keyInsights?: string
  
  // Status
  status: "active" | "paused" | "archived"
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
  topAds: TopAd[]
  
  setCurrentProjectId: (id: string | null) => void
  getCurrentProject: () => Project | null
  addProject: (project: Project) => void
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
  
  // Top Ads methods
  getTopAdsForProject: (projectId: string) => TopAd[]
  addTopAd: (topAd: TopAd) => void
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
      topAds: [],
      
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
      
      // Top Ads methods
      getTopAdsForProject: (projectId: string) => {
        const { topAds } = get()
        return topAds.filter(topAd => topAd.projectId === projectId)
      },
      
      addTopAd: (topAd: TopAd) => {
        set(state => ({
          topAds: [...state.topAds, topAd]
        }))
      }
    }),
    {
      name: 'blightstone-project-store'
    }
  )
)